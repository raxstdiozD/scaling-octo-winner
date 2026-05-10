import { resend } from './resend';

const SENDER_PAYMENT = '"Lumora" <payments@lumoraai.online>';
const SENDER_NOREPLY = '"Lumora" <noreply@lumoraai.online>';
const SENDER_WELCOME = '"Lumora" <welcome@lumoraai.online>';

const PREMIUM_DARK_THEME = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lumora Notification</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap');
        
        body {
            margin: 0;
            padding: 0;
            background-color: #050505;
            font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #ffffff;
            -webkit-font-smoothing: antialiased;
        }
        .wrapper {
            width: 100%;
            table-layout: fixed;
            background-color: #050505;
            padding-bottom: 60px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #0a0a0a;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 24px;
            overflow: hidden;
            margin-top: 40px;
        }
        .header {
            padding: 40px 0;
            text-align: center;
            background: radial-gradient(circle at top, rgba(124, 58, 237, 0.15) 0%, transparent 70%);
        }
        .logo {
            font-size: 28px;
            font-weight: 800;
            letter-spacing: -0.5px;
            color: #ffffff;
            text-decoration: none;
            text-transform: uppercase;
        }
        .logo-dot {
            color: #7c3aed;
        }
        .content {
            padding: 0 40px 40px;
        }
        .hero-section {
            text-align: center;
            margin-bottom: 32px;
        }
        .status-badge {
            display: inline-block;
            padding: 6px 16px;
            background: rgba(124, 58, 237, 0.1);
            border: 1px solid rgba(124, 58, 237, 0.2);
            color: #a78bfa;
            border-radius: 100px;
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 0.5px;
            margin-bottom: 24px;
        }
        h1 {
            font-size: 32px;
            font-weight: 800;
            line-height: 1.2;
            margin: 0 0 16px;
            background: linear-gradient(to right, #ffffff, #a78bfa);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        p {
            color: #94a3b8;
            font-size: 16px;
            line-height: 1.6;
            margin: 0 0 24px;
        }
        .info-card {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 32px;
        }
        .info-grid {
            display: table;
            width: 100%;
        }
        .info-row {
            display: table-row;
        }
        .info-cell {
            display: table-cell;
            padding: 8px 0;
        }
        .info-label {
            font-size: 13px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
        }
        .info-value {
            font-size: 15px;
            color: #f8fafc;
            text-align: right;
            font-weight: 500;
        }
        .benefit-item {
            display: flex;
            align-items: center;
            margin-bottom: 12px;
            color: #cbd5e1;
            font-size: 14px;
        }
        .benefit-icon {
            color: #7c3aed;
            margin-right: 12px;
            font-size: 18px;
        }
        .cta-button {
            display: block;
            background: #ffffff;
            color: #000000;
            text-align: center;
            padding: 16px 32px;
            border-radius: 12px;
            text-decoration: none;
            font-weight: 700;
            font-size: 16px;
            margin-top: 8px;
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
        }
        .footer {
            text-align: center;
            padding: 40px 0;
            color: #475569;
            font-size: 13px;
        }
        .footer-links {
            margin-bottom: 16px;
        }
        .footer-link {
            color: #64748b;
            text-decoration: none;
            margin: 0 10px;
        }
        .accent-text {
            color: #7c3aed;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <div class="logo">Lumora<span class="logo-dot">.</span></div>
            </div>
            <div class="content">
                ${content}
            </div>
        </div>
        <div class="footer">
            <div class="footer-links">
                <a href="https://lumoraai.online" class="footer-link">Website</a>
                <a href="https://lumoraai.online/dashboard" class="footer-link">Dashboard</a>
                <a href="https://lumoraai.online/support" class="footer-link">Support</a>
            </div>
            <p>&copy; 2026 Lumora AI</p>
        </div>
    </div>
</body>
</html>
`;

export async function sendProWelcomeEmail(email: string, details: {
  invoiceId: string;
  amount: string;
  date: string;
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: SENDER_PAYMENT,
      to: email,
      subject: 'Welcome to Lumora Pro! 🎉 Your subscription is active',
      html: PREMIUM_DARK_THEME(`
        <div class="hero-section">
            <div class="status-badge">MEMBERSHIP ACTIVATED</div>
            <h1>The wait is over.<br>Welcome to <span class="accent-text">Pro.</span></h1>
            <p>Thank you for choosing Lumora. Your subscription is now active, and you've unlocked our most powerful AI engine and studio-grade features.</p>
        </div>
        
        <div class="info-card">
            <div class="info-grid">
                <div class="info-row">
                    <div class="info-cell info-label">Plan</div>
                    <div class="info-cell info-value">Lumora Pro ($6.99/mo)</div>
                </div>
                <div class="info-row">
                    <div class="info-cell info-label">Invoice ID</div>
                    <div class="info-cell info-value">${details.invoiceId}</div>
                </div>
                <div class="info-row">
                    <div class="info-cell info-label">Amount Paid</div>
                    <div class="info-cell info-value">${details.amount}</div>
                </div>
                <div class="info-row">
                    <div class="info-cell info-label">Next Billing</div>
                    <div class="info-cell info-value">${details.date}</div>
                </div>
            </div>
        </div>

        <div style="margin-bottom: 32px;">
            <p style="font-weight: 600; color: #ffffff; margin-bottom: 16px;">Key benefits unlocked:</p>
            <div class="benefit-item">
                <span class="benefit-icon">✦</span> 1,000 Daily Premium Credits
            </div>
            <div class="benefit-item">
                <span class="benefit-icon">✦</span> Ultra-fast Generation Speed
            </div>
            <div class="benefit-item">
                <span class="benefit-icon">✦</span> Access to GPT-4o & Claude 3.5 Sonnet
            </div>
            <div class="benefit-item">
                <span class="benefit-icon">✦</span> Commercial Usage License
            </div>
        </div>
        
        <a href="https://lumoraai.online/dashboard" class="cta-button">Go to Dashboard</a>
      `),
    });

    if (error) {
      console.error('Resend error:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Email failed:', error);
    return false;
  }
}

export async function sendPaymentFailedEmail(email: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: SENDER_PAYMENT,
      to: email,
      subject: 'Lumora - Payment Failed',
      html: PREMIUM_DARK_THEME(`
        <div class="hero-section">
            <div class="status-badge" style="background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.2); color: #f87171;">PAYMENT ERROR</div>
            <h1>Transaction <span class="accent-text" style="color: #f87171;">Unsuccessful.</span></h1>
            <p>Don't worry, no amount was charged from your account. We encountered an issue while processing your payment.</p>
        </div>
        
        <div class="info-card" style="text-align: center;">
            <p style="margin-bottom: 0; font-size: 14px;">This usually happens due to incorrect card details or bank restrictions. Please try again with a different payment method.</p>
        </div>
        
        <a href="https://lumoraai.online/pricing" class="cta-button" style="background: #ffffff;">Retry Payment</a>
      `),
    });

    if (error) {
      console.error('Resend error:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Email failed:', error);
    return false;
  }
}

export async function sendCreditsPurchasedEmail(email: string, details: {
  credits: number;
  amount: string;
  invoiceId: string;
}) {
  try {
    await resend.emails.send({
      from: SENDER_PAYMENT,
      to: email,
      subject: 'Credits Refueled ⚡',
      html: PREMIUM_DARK_THEME(`
        <div class="hero-section">
            <div class="status-badge">CREDITS ADDED</div>
            <h1>Power <span class="accent-text" style="color: #00e5ff;">Refueled.</span></h1>
            <p>Your permanent reserve has been topped up. These credits never expire and will be used whenever your daily allowance runs out.</p>
        </div>
        
        <div class="info-card">
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="font-size: 48px; font-weight: 800; color: #00e5ff;">${details.credits}</div>
                <div style="font-size: 12px; color: #64748b; letter-spacing: 2px; font-weight: 600;">PERMANENT CREDITS</div>
            </div>
            <div class="info-grid">
                <div class="info-row">
                    <div class="info-cell info-label">Invoice ID</div>
                    <div class="info-cell info-value">${details.invoiceId}</div>
                </div>
                <div class="info-row">
                    <div class="info-cell info-label">Amount Paid</div>
                    <div class="info-cell info-value">${details.amount}</div>
                </div>
            </div>
        </div>
        
        <a href="https://lumoraai.online/dashboard" class="cta-button">Resume Creation</a>
      `),
    });
    return true;
  } catch (error) {
    console.error('Email failed:', error);
    return false;
  }
}

export async function sendAuthOTP(email: string, otp: string) {
  try {
    await resend.emails.send({
      from: SENDER_NOREPLY,
      to: email,
      subject: 'Verification Code',
      html: PREMIUM_DARK_THEME(`
        <div class="hero-section">
            <h1>Verify <span class="accent-text">Your Identity.</span></h1>
            <p>Enter the code below to complete your registration. This code will expire in 10 minutes.</p>
        </div>
        
        <div style="margin: 40px 0; text-align: center;">
            <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.1); padding: 30px; border-radius: 24px; display: inline-block;">
                <div style="font-size: 48px; font-weight: 800; letter-spacing: 8px; color: #ffffff; font-family: 'Courier New', Courier, monospace;">${otp}</div>
            </div>
        </div>

        <p style="font-size: 13px; text-align: center; color: #64748b;">If you didn't request this, you can safely ignore this email.</p>
      `),
    });
    return true;
  } catch (error) {
    console.error('Email failed:', error);
    return false;
  }
}

export async function sendWelcomeEmail(email: string) {
  try {
    await resend.emails.send({
      from: SENDER_WELCOME,
      to: email,
      subject: 'Welcome to Lumora! Let\'s build the future 🚀',
      html: PREMIUM_DARK_THEME(`
        <div class="hero-section">
            <div class="status-badge">WELCOME TO THE STUDIO</div>
            <h1>Your Creative Journey <span class="accent-text">Starts Here.</span></h1>
            <p>We're thrilled to have you on board. Lumora is designed to be your ultimate creative companion. Here are a few things you can do right now:</p>
        </div>
        
        <div style="margin-bottom: 32px;">
            <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 20px; margin-bottom: 16px;">
                <h3 style="color: #ffffff; margin-top: 0; font-size: 16px;">✨ Generate Stunning AI Art</h3>
                <p style="font-size: 14px; margin-bottom: 0;">Use our Image Generator to turn your words into high-resolution visuals.</p>
            </div>
            <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 20px; margin-bottom: 16px;">
                <h3 style="color: #ffffff; margin-top: 0; font-size: 16px;">🎬 Advanced Video Tools</h3>
                <p style="font-size: 14px; margin-bottom: 0;">Enhance, trim, or generate subtitles for your videos with studio-grade precision.</p>
            </div>
            <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 20px;">
                <h3 style="color: #ffffff; margin-top: 0; font-size: 16px;">🤖 Chat with Genius Models</h3>
                <p style="font-size: 14px; margin-bottom: 0;">Access GPT-4o and Claude 3.5 Sonnet to solve complex problems.</p>
            </div>
        </div>

        <div class="info-card" style="border-color: rgba(124, 58, 237, 0.3); background: rgba(124, 58, 237, 0.05);">
            <h3 style="color: #a78bfa; margin-top: 0;">Unlock Elite Power</h3>
            <p style="color: #cbd5e1; font-size: 14px;">Want unlimited access and 1,000 daily credits? Upgrade to Lumora Pro for just $6.99/mo and join the top 1% of creators.</p>
            <a href="https://lumoraai.online/pricing" style="color: #a78bfa; font-weight: bold; text-decoration: none; font-size: 14px;">View Pro Benefits →</a>
        </div>
        
        <a href="https://lumoraai.online/dashboard" class="cta-button">Launch Your Dashboard</a>
      `),
    });
    return true;
  } catch (error) {
    console.error('Email failed:', error);
    return false;
  }
}
export async function sendResetPasswordEmail(email: string, token: string) {
  try {
    const resetLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://lumoraai.online'}/auth/reset-password?token=${token}&email=${email}`;
    
    await resend.emails.send({
      from: SENDER_NOREPLY,
      to: email,
      subject: 'Reset Your Password',
      html: PREMIUM_DARK_THEME(`
        <div class="hero-section">
            <div class="status-badge" style="background: rgba(245, 158, 11, 0.1); border-color: rgba(245, 158, 11, 0.2); color: #f59e0b;">SECURITY ALERT</div>
            <h1>Password <span class="accent-text" style="color: #f59e0b;">Recovery.</span></h1>
            <p>We received a request to reset your Lumora password. If this was you, click the button below to choose a new one.</p>
        </div>
        
        <div style="text-align: center; margin: 40px 0;">
            <a href="${resetLink}" class="cta-button" style="background: #f59e0b; color: #000000; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>

        <div class="info-card" style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); padding: 20px; border-radius: 16px;">
            <p style="font-size: 13px; margin-bottom: 0; color: #64748b;">This link will expire in 10 minutes. If you didn't request this, you can safely ignore this email and your password will remain unchanged.</p>
        </div>
      `),
    });
    return true;
  } catch (error) {
    console.error('Email failed:', error);
    return false;
  }
}
