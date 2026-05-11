"use server";

import { createClient } from "@/utils/supabase/server";
import { resend } from "@/lib/resend";
import { sendAuthOTP, sendWelcomeEmail, sendResetPasswordEmail } from "@/lib/emails";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/utils/supabase/admin";
import { v4 as uuidv4 } from 'uuid';

export async function resendOtpAction(email: string) {
  const emailLower = email.toLowerCase();
  
  // 1. Generate new OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 10 * 60 * 1000);

  // 2. Update Database
  await prisma.verificationToken.deleteMany({
    where: { identifier: emailLower }
  });

  await prisma.verificationToken.create({
    data: {
      identifier: emailLower,
      token: otp,
      expires
    }
  });

  // 3. Send via Resend
  await sendAuthOTP(emailLower, otp);

  return { success: true };
}

export async function signUpAction(formData: FormData) {
  const email = (formData.get("email") as string).toLowerCase();
  const password = formData.get("password") as string;
  const supabase = await createClient();

  // 1. Exhaustive check if user already exists across ANY provider
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    console.log(`[Auth] Checking existing user: ${email}. Service Key present: ${!!serviceKey}`);
    
    if (serviceKey) {
      const supabaseAdmin = createAdminClient();
      let allUsers: any[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        console.log(`[Auth] Fetching page ${page}...`);
        const { data, error: listError } = await supabaseAdmin.auth.admin.listUsers({
          page,
          perPage: 1000
        });

        if (listError) {
          console.error('[Auth] listUsers error:', listError.message);
          hasMore = false;
        } else if (!data?.users || data.users.length === 0) {
          console.log('[Auth] No more users found.');
          hasMore = false;
        } else {
          console.log(`[Auth] Fetched ${data.users.length} users on page ${page}.`);
          allUsers = [...allUsers, ...data.users];
          page++;
          if (data.users.length < 1000) hasMore = false;
        }
      }

      console.log(`[Auth] Total users checked: ${allUsers.length}`);
      const existingUser = allUsers.find(u => u.email?.toLowerCase() === email.toLowerCase());
      if (existingUser) {
        console.log(`[Auth] FOUND EXISTING USER: ${existingUser.id}. Blocking sign-up.`);
        return { error: "This email is already registered. Please sign in instead." };
      } else {
        console.log(`[Auth] No existing user found for ${email} among ${allUsers.length} records.`);
      }
    }
  } catch (adminError) {
    console.error('[Auth] Exhaustive admin check crashed:', adminError);
  }

  // 2. Proceed with Supabase Sign Up
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("already registered") || msg.includes("already exists")) {
      return { error: "This email is already registered. Try signing in instead." };
    }
    return { error: error.message };
  }

  // 2. Generate OTP and store in Database (Session-independent)
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Delete any existing tokens for this email
  await prisma.verificationToken.deleteMany({
    where: { identifier: email }
  });

  // Create new token
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token: otp,
      expires
    }
  });

  // 3. Send via Resend
  await sendAuthOTP(email, otp);

  return { success: true, email, step: "verify" };
}

export async function verifyOtpAction(email: string, otp: string) {
  const emailLower = email.trim().toLowerCase();
  const otpClean = otp.trim();
  
  console.log(`[Auth] Verifying code ${otpClean} for ${emailLower}`);

  // 1. Check the database for the token
  const verificationToken = await prisma.verificationToken.findFirst({
    where: {
      identifier: emailLower,
      token: otpClean
    }
  });

  if (!verificationToken) {
    console.error(`[Auth] No token found for ${emailLower} with code ${otpClean}`);
    return { error: "Invalid verification code. Please check your email again." };
  }

  if (verificationToken.expires < new Date()) {
    return { error: "Code has expired. Please sign up again." };
  }

  // 2. Verification successful - Cleanup
  await prisma.verificationToken.delete({
    where: { token: otp }
  });

  // 3. Confirm the user in Supabase Auth (Crucial for allowing login)
  try {
    const supabaseAdmin = createAdminClient();
    
    // We need the user's ID. Let's find them by email.
    const { data, error: findError } = await supabaseAdmin.auth.admin.listUsers();

    if (!findError && data?.users) {
      const existingUser = data.users.find(u => u.email?.toLowerCase() === emailLower);
      if (existingUser) {
        const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
          email_confirm: true,
          user_metadata: { verified_via_custom_otp: true },
          // Force confirmation timestamp for immediate effect
          email_confirmed_at: new Date().toISOString()
        });

        if (confirmError) {
          console.error(`[Auth] Failed to confirm user ${existingUser.id}:`, confirmError);
        } else {
          console.log(`[Auth] User ${existingUser.id} (${emailLower}) confirmed successfully.`);
        }
      }
    }
  } catch (adminError) {
    console.error('[Auth] Supabase Admin operation failed. Make sure SUPABASE_SERVICE_ROLE_KEY is set.');
  }

  // 4. Initialize user in Database with credits
  try {
    const supabaseAdmin = createAdminClient();
    
    // Upsert in Prisma
    await prisma.user.upsert({
      where: { email: emailLower },
      update: {},
      create: {
        email: emailLower,
        dailyCredits: 50,
        plan: 'free'
      }
    });

    // Upsert in Supabase User table
    await supabaseAdmin.from('User').upsert({
      email: emailLower,
      daily_credits: 50,
      plan: 'free'
    }, { onConflict: 'email' });

    // 5. Send Welcome Email (Async)
    sendWelcomeEmail(emailLower).catch(err => console.error('Welcome email failed:', err));
  } catch (err) {
    console.error('[Auth] Failed to initialize user credits:', err);
  }
  
  return { success: true };
}

export async function signInAction(formData: FormData) {
  const email = (formData.get("email") as string).toLowerCase();
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error(`[Auth] Sign in failed for ${email}:`, error.message);
    
    if (error.message.toLowerCase().includes("invalid login credentials")) {
      return { error: "Incorrect password. If you originally signed up with Google/GitHub, please use those instead." };
    }
    
    if (error.message.toLowerCase().includes("email not confirmed")) {
      return { error: "Email not verified. Please check your inbox or try signing up again to get a new code." };
    }
    
    return { error: error.message };
  }

  return { success: true };
}

export async function forgotPasswordAction(email: string) {
  const emailLower = email.toLowerCase().trim();
  
  // 1. Verify user exists first (Exhaustive)
  try {
    const supabaseAdmin = createAdminClient();
    let userExists = false;
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const { data } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
      if (!data?.users || data.users.length === 0) {
        hasMore = false;
      } else {
        if (data.users.some(u => u.email?.toLowerCase() === emailLower)) {
          userExists = true;
          hasMore = false;
        }
        if (data.users.length < 1000) hasMore = false;
        page++;
      }
    }

    if (!userExists) {
      return { error: "No account found with this email address." };
    }
  } catch (err) {
    console.error('Forgot password check failed:', err);
  }

  // 2. Generate Reset Token
  const token = uuidv4();
  const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await prisma.verificationToken.deleteMany({ where: { identifier: emailLower } });
  await prisma.verificationToken.create({
    data: { identifier: emailLower, token, expires }
  });

  // 3. Send Email
  await sendResetPasswordEmail(emailLower, token);

  return { success: true };
}

export async function updatePasswordAction(email: string, token: string, password: string) {
  const emailLower = email.toLowerCase().trim();
  
  // 1. Verify Token
  const verificationToken = await prisma.verificationToken.findFirst({
    where: { identifier: emailLower, token }
  });

  if (!verificationToken || verificationToken.expires < new Date()) {
    return { error: "Reset link has expired or is invalid. Please request a new one." };
  }

  // 2. Update Password in Supabase (Admin)
  try {
    const supabaseAdmin = createAdminClient();
    let user: any = null;
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const { data } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
      if (!data?.users || data.users.length === 0) {
        hasMore = false;
      } else {
        user = data.users.find(u => u.email?.toLowerCase() === emailLower);
        if (user) {
          hasMore = false;
        } else {
          if (data.users.length < 1000) hasMore = false;
          page++;
        }
      }
    }

    if (!user) return { error: "User not found." };

    const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: password,
      email_confirm: true // Just in case
    });

    if (error) return { error: error.message };

    // 3. Cleanup Token
    await prisma.verificationToken.delete({ where: { token } });

    return { success: true };
  } catch (err) {
    return { error: "Failed to update password. Please try again." };
  }
}
