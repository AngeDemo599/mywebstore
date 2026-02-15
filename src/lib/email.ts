import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${token}`;

  await transporter.sendMail({
    from: `"SouqMaker" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Verify your email - SouqMaker",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #1a1a1a; font-size: 20px; margin-bottom: 16px;">Verify your email</h2>
        <p style="color: #555; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
          Thanks for creating a SouqMaker account. Click the button below to verify your email address.
        </p>
        <a href="${verificationUrl}" style="display: inline-block; background: #2563eb; color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500;">
          Verify Email
        </a>
        <p style="color: #999; font-size: 12px; margin-top: 32px; line-height: 1.5;">
          If you didn't create an account, you can safely ignore this email.<br/>
          This link expires in 24 hours.
        </p>
      </div>
    `,
  });
}
