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

// Leave Email Templates
function buildLeaveAppliedEmail(
  employeeName: string,
  leaveType: string,
  startDate: string,
  endDate: string,
  totalDays: number,
  approverName: string
) {
  return `
  <div style="font-family: Arial, sans-serif; background: #f8fafc; padding: 24px;">
    <div style="max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden;">
      <div style="background: #0f172a; padding: 22px 24px;">
        <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700;">WorkNest HRMS</h1>
      </div>
      <div style="padding: 26px 24px;">
        <p style="font-size: 16px; color: #111827; margin: 0 0 12px;">Hi ${approverName},</p>
        <p style="font-size: 15px; color: #334155; line-height: 1.6; margin: 0 0 18px;">
          <strong>${employeeName}</strong> has submitted a leave request that requires your approval.
        </p>
        <div style="background: #f8fafc; border-radius: 10px; padding: 18px; margin-bottom: 18px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Leave Type</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${leaveType}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Duration</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${totalDays} day${totalDays !== 1 ? "s" : ""}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 14px;">From</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${startDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 14px;">To</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${endDate}</td>
            </tr>
          </table>
        </div>
        <p style="font-size: 14px; color: #64748b; margin: 0;">
          Please log in to your HR dashboard to review and take action on this request.
        </p>
      </div>
    </div>
  </div>
  `;
}

function buildLeaveApprovedEmail(
  employeeName: string,
  leaveType: string,
  startDate: string,
  endDate: string,
  totalDays: number,
  approverName: string,
  remarks?: string
) {
  return `
  <div style="font-family: Arial, sans-serif; background: #f8fafc; padding: 24px;">
    <div style="max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden;">
      <div style="background: #059669; padding: 22px 24px;">
        <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700;">Leave Approved ✓</h1>
      </div>
      <div style="padding: 26px 24px;">
        <p style="font-size: 16px; color: #111827; margin: 0 0 12px;">Hi ${employeeName},</p>
        <p style="font-size: 15px; color: #334155; line-height: 1.6; margin: 0 0 18px;">
          Great news! Your <strong>${leaveType}</strong> request has been <strong style="color: #059669;">approved</strong> by ${approverName}.
        </p>
        <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px; padding: 18px; margin-bottom: 18px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #047857; font-size: 14px;">Duration</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${totalDays} day${totalDays !== 1 ? "s" : ""}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #047857; font-size: 14px;">From</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${startDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #047857; font-size: 14px;">To</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${endDate}</td>
            </tr>
          </table>
        </div>
        ${remarks ? `<p style="font-size: 14px; color: #334155; line-height: 1.6; margin: 0 0 18px;"><strong>Remarks:</strong> ${remarks}</p>` : ""}
        <p style="font-size: 14px; color: #64748b; margin: 0;">
          Have a great break! Remember to plan your work accordingly before and after your leave.
        </p>
      </div>
    </div>
  </div>
  `;
}

function buildLeaveRejectedEmail(
  employeeName: string,
  leaveType: string,
  startDate: string,
  endDate: string,
  totalDays: number,
  approverName: string,
  remarks?: string
) {
  return `
  <div style="font-family: Arial, sans-serif; background: #f8fafc; padding: 24px;">
    <div style="max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden;">
      <div style="background: #dc2626; padding: 22px 24px;">
        <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700;">Leave Request Declined</h1>
      </div>
      <div style="padding: 26px 24px;">
        <p style="font-size: 16px; color: #111827; margin: 0 0 12px;">Hi ${employeeName},</p>
        <p style="font-size: 15px; color: #334155; line-height: 1.6; margin: 0 0 18px;">
          Your <strong>${leaveType}</strong> request has been <strong style="color: #dc2626;">declined</strong> by ${approverName}.
        </p>
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 18px; margin-bottom: 18px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #991b1b; font-size: 14px;">Duration</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${totalDays} day${totalDays !== 1 ? "s" : ""}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #991b1b; font-size: 14px;">From</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${startDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #991b1b; font-size: 14px;">To</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${endDate}</td>
            </tr>
          </table>
        </div>
        ${remarks ? `<p style="font-size: 14px; color: #334155; line-height: 1.6; margin: 0 0 18px;"><strong>Reason:</strong> ${remarks}</p>` : ""}
        <p style="font-size: 14px; color: #64748b; margin: 0;">
          Please reach out to your manager or HR if you have any questions about this decision.
        </p>
      </div>
    </div>
  </div>
  `;
}

function buildCompOffEarnedEmail(
  employeeName: string,
  workDate: string,
  session: string,
  expiryDate: string
) {
  return `
  <div style="font-family: Arial, sans-serif; background: #f8fafc; padding: 24px;">
    <div style="max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden;">
      <div style="background: #7c3aed; padding: 22px 24px;">
        <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700;">Comp-Off Earned 🎉</h1>
      </div>
      <div style="padding: 26px 24px;">
        <p style="font-size: 16px; color: #111827; margin: 0 0 12px;">Hi ${employeeName},</p>
        <p style="font-size: 15px; color: #334155; line-height: 1.6; margin: 0 0 18px;">
          Thank you for your dedication! You have earned a <strong style="color: #7c3aed;">compensatory day off</strong> for working on ${workDate}.
        </p>
        <div style="background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 10px; padding: 18px; margin-bottom: 18px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6d28d9; font-size: 14px;">Work Date</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${workDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6d28d9; font-size: 14px;">Session</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${session}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6d28d9; font-size: 14px;">Use By</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${expiryDate}</td>
            </tr>
          </table>
        </div>
        <p style="font-size: 14px; color: #64748b; margin: 0;">
          Remember to use your comp-off before it expires. You can apply for leave using your comp-off balance.
        </p>
      </div>
    </div>
  </div>
  `;
}

function buildLeaveCancelledEmail(
  employeeName: string,
  leaveType: string,
  startDate: string,
  endDate: string,
  totalDays: number
) {
  return `
  <div style="font-family: Arial, sans-serif; background: #f8fafc; padding: 24px;">
    <div style="max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden;">
      <div style="background: #f59e0b; padding: 22px 24px;">
        <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700;">Leave Cancelled</h1>
      </div>
      <div style="padding: 26px 24px;">
        <p style="font-size: 16px; color: #111827; margin: 0 0 12px;">Hi ${employeeName},</p>
        <p style="font-size: 15px; color: #334155; line-height: 1.6; margin: 0 0 18px;">
          Your <strong>${leaveType}</strong> request for ${startDate} to ${endDate} has been <strong style="color: #f59e0b;">cancelled</strong>.
        </p>
        <p style="font-size: 14px; color: #64748b; margin: 0;">
          If you did not request this cancellation, please contact HR immediately.
        </p>
      </div>
    </div>
  </div>
  `;
}

export async function sendLeaveAppliedEmail(
  to: string,
  employeeName: string,
  approverEmail: string,
  approverName: string,
  leaveType: string,
  startDate: string,
  endDate: string,
  totalDays: number
): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_FROM) {
    console.info(`[LEAVE_APPLIED_EMAIL] To: ${to}, Approver: ${approverEmail}`);
    return;
  }

  const html = buildLeaveAppliedEmail(employeeName, leaveType, startDate, endDate, totalDays, approverName);
  
  // Implementation would use nodemailer transporter here
  console.info(`[LEAVE_APPLIED_EMAIL] Would send to: ${approverEmail}`);
}

export async function sendLeaveApprovedEmail(
  to: string,
  employeeName: string,
  leaveType: string,
  startDate: string,
  endDate: string,
  totalDays: number,
  approverName: string,
  remarks?: string
): Promise<void> {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_FROM) {
    console.info(`[LEAVE_APPROVED_EMAIL] To: ${to}`);
    return;
  }

  const html = buildLeaveApprovedEmail(employeeName, leaveType, startDate, endDate, totalDays, approverName, remarks);
  
  console.info(`[LEAVE_APPROVED_EMAIL] Would send to: ${to}`);
}

export async function sendLeaveRejectedEmail(
  to: string,
  employeeName: string,
  leaveType: string,
  startDate: string,
  endDate: string,
  totalDays: number,
  approverName: string,
  remarks?: string
): Promise<void> {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_FROM) {
    console.info(`[LEAVE_REJECTED_EMAIL] To: ${to}`);
    return;
  }

  const html = buildLeaveRejectedEmail(employeeName, leaveType, startDate, endDate, totalDays, approverName, remarks);
  
  console.info(`[LEAVE_REJECTED_EMAIL] Would send to: ${to}`);
}

export async function sendCompOffEarnedEmail(
  to: string,
  employeeName: string,
  workDate: string,
  session: string,
  expiryDate: string
): Promise<void> {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_FROM) {
    console.info(`[COMP_OFF_EARNED_EMAIL] To: ${to}`);
    return;
  }

  const html = buildCompOffEarnedEmail(employeeName, workDate, session, expiryDate);
  
  console.info(`[COMP_OFF_EARNED_EMAIL] Would send to: ${to}`);
}

export async function sendLeaveCancelledEmail(
  to: string,
  employeeName: string,
  leaveType: string,
  startDate: string,
  endDate: string,
  totalDays: number
): Promise<void> {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_FROM) {
    console.info(`[LEAVE_CANCELLED_EMAIL] To: ${to}`);
    return;
  }

  const html = buildLeaveCancelledEmail(employeeName, leaveType, startDate, endDate, totalDays);
  
  console.info(`[LEAVE_CANCELLED_EMAIL] Would send to: ${to}`);
}
