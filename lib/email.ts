function buildEmailHtml(name: string, resetLink: string) {
  return `
  <div style="font-family: Arial, sans-serif; background: #f8fafc; padding: 24px;">
    <div style="max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden;">
      <div style="background: #0f172a; padding: 22px 24px;">
        <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700;">WorkNest HRMS</h1>
      </div>
      <div style="padding: 26px 24px;">
        <p style="font-size: 16px; color: #111827; margin: 0 0 12px;">Hi ${name},</p>
        <p style="font-size: 15px; color: #334155; line-height: 1.6; margin: 0 0 18px;">
          Welcome to WorkNest. Your account has been created successfully. Please set your password to activate your HR admin dashboard.
        </p>
        <a href="${resetLink}" style="display: inline-block; background: #0284c7; color: #ffffff; text-decoration: none; font-weight: 600; padding: 12px 18px; border-radius: 10px; margin-bottom: 16px;">
          Set Your Password
        </a>
        <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 8px;">
          If the button does not work, copy and paste this URL into your browser:
        </p>
        <p style="font-size: 13px; word-break: break-all; color: #0369a1; margin: 0 0 14px;">
          ${resetLink}
        </p>
        <p style="font-size: 13px; color: #64748b; margin: 0;">
          This link expires in 24 hours. If you did not request this, please ignore this email.
        </p>
      </div>
    </div>
  </div>
  `;
}

export async function sendPasswordResetEmail(to: string, name: string, token: string): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const resetLink = `${appUrl}/set-password?token=${token}`;

  // Temporarily disabled SMTP delivery.
  // Keep the HTML template ready for re-enabling once the client's SMTP details are available.
  // if (
  //   !process.env.EMAIL_HOST ||
  //   !process.env.EMAIL_PORT ||
  //   !process.env.EMAIL_USER ||
  //   !process.env.EMAIL_PASS ||
  //   !process.env.EMAIL_FROM
  // ) {
  //   console.info(`[MOCK_EMAIL] ${to} ${resetLink}`);
  //   return;
  // }
  //
  // await transporter.sendMail({
  //   from: process.env.EMAIL_FROM,
  //   to,
  //   subject: "Set your WorkNest password",
  //   html: buildEmailHtml(name, resetLink),
  // });

  console.info(`[RESET_LINK] ${to} ${resetLink}`);
}

export function buildResetEmailPreview(name: string, token: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const resetLink = `${appUrl}/set-password?token=${token}`;
  return buildEmailHtml(name, resetLink);
}
