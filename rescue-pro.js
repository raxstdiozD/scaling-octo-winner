const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');

// Load env variables manually if needed, or assume they are in process.env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const prisma = new PrismaClient();

async function rescuePro(email) {
  console.log(`🚀 Attempting to rescue Pro status for: ${email}`);

  try {
    // 1. Update local Prisma
    const prismaUser = await prisma.user.update({
      where: { email },
      data: {
        plan: 'pro',
        credits: 1500,
        aiGenerationsLimit: 1000
      }
    });
    console.log("✅ Local Prisma DB updated.");

    // 2. Update Supabase
    // Note: This uses the Anon key. If RLS is strict, this might fail unless run as a client or with service key.
    // However, we'll try to upsert by email.
    const { data, error } = await supabase
      .from('User')
      .upsert({
        email: email,
        plan: 'pro',
        planType: 'pro',
        plan_type: 'pro',
        daily_credits: 1500,
        ai_generations_limit: 1000,
        updated_at: new Date().toISOString()
      }, { onConflict: 'email' });

    if (error) {
      console.error("❌ Supabase update failed:", error.message);
      console.log("Tip: If this failed, try logging out and back in on the website, or ensure RLS allows updates.");
    } else {
      console.log("✅ Supabase DB updated.");
      console.log("🎉 Success! Please refresh your browser.");
    }

  } catch (err) {
    console.error("❌ Error during rescue:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

const email = process.argv[2];
if (!email) {
  console.log("Usage: node rescue-pro.js your-email@example.com");
  process.exit(1);
}

rescuePro(email);
