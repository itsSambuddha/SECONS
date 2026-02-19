import nodemailer from "nodemailer";

// ============================================================
// Nodemailer Gmail SMTP Singleton
// ============================================================

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
    if (transporter) return transporter;

    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!user || !pass) {
        console.warn("⚠️  SMTP credentials not found. Email sending will fail.");
    }

    transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user, pass },
    });

    return transporter;
}

interface SendMailOptions {
    to: string;
    subject: string;
    html: string;
}

export async function sendMail({ to, subject, html }: SendMailOptions): Promise<void> {
    const t = getTransporter();
    const from = process.env.SMTP_FROM || `SECONS <${process.env.SMTP_USER}>`;

    await t.sendMail({ from, to, subject, html });
}

// Email templates
export function invitationEmailHtml(params: {
    recipientName: string;
    role: string;
    inviteUrl: string;
    senderName: string;
}): string {
    return `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #F8F9FB; padding: 40px 24px;">
      <div style="background: linear-gradient(135deg, #1A3C6E, #2A5494); padding: 32px; border-radius: 16px 16px 0 0; text-align: center;">
        <h1 style="color: white; font-size: 28px; margin: 0; font-weight: 800;">SECONS</h1>
        <p style="color: rgba(255,255,255,0.7); margin: 4px 0 0; font-size: 13px; letter-spacing: 0.1em;">EDBLAZON IN THE PALM OF YOUR HANDS</p>
      </div>
      <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <p style="color: #1A1A2E; font-size: 16px;">Hi <strong>${params.recipientName}</strong>,</p>
        <p style="color: #6B7280; font-size: 15px; line-height: 1.6;">
          You've been invited by <strong>${params.senderName}</strong> to join SECONS as a
          <strong style="color: #E8A020;">${params.role}</strong>.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${params.inviteUrl}" style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #E8A020, #F0B84D); color: #1A1A2E; font-weight: 700; font-size: 16px; border-radius: 99px; text-decoration: none;">
            Accept Invitation
          </a>
        </div>
        <p style="color: #9CA3AF; font-size: 13px;">This invitation expires in 48 hours. If you didn&apos;t expect this, ignore this email.</p>
      </div>
    </div>
  `;
}

export function meetingNotificationHtml(params: {
    title: string;
    date: string;
    time: string;
    location: string;
    agenda?: string;
}): string {
    return `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #F8F9FB; padding: 40px 24px;">
      <div style="background: linear-gradient(135deg, #1A3C6E, #2A5494); padding: 24px; border-radius: 16px 16px 0 0; text-align: center;">
        <h1 style="color: white; font-size: 24px; margin: 0;">📅 Meeting Scheduled</h1>
      </div>
      <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px;">
        <h2 style="color: #1A1A2E; font-size: 20px; margin: 0 0 16px;">${params.title}</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #6B7280; font-size: 14px;">📅 Date</td><td style="padding: 8px 0; font-weight: 600; color: #1A1A2E;">${params.date}</td></tr>
          <tr><td style="padding: 8px 0; color: #6B7280; font-size: 14px;">🕐 Time</td><td style="padding: 8px 0; font-weight: 600; color: #1A1A2E;">${params.time}</td></tr>
          <tr><td style="padding: 8px 0; color: #6B7280; font-size: 14px;">📍 Location</td><td style="padding: 8px 0; font-weight: 600; color: #1A1A2E;">${params.location}</td></tr>
        </table>
        ${params.agenda ? `<div style="margin-top: 16px; padding: 16px; background: #F8F9FB; border-radius: 8px;"><p style="color: #6B7280; font-size: 13px; margin: 0 0 4px;">Agenda</p><p style="color: #1A1A2E; font-size: 14px; margin: 0;">${params.agenda}</p></div>` : ""}
      </div>
    </div>
  `;
}

// ============================================================
// Convenience: Send invitation email
// ============================================================
export async function sendInvitationEmail(
    to: string,
    params: {
        inviteeName: string;
        role: string;
        domain: string;
        inviterName: string;
        acceptUrl: string;
    }
): Promise<void> {
    const html = invitationEmailHtml({
        recipientName: params.inviteeName,
        role: params.role,
        inviteUrl: params.acceptUrl,
        senderName: params.inviterName,
    });
    await sendMail({
        to,
        subject: `You've been invited to SECONS as ${params.role}`,
        html,
    });
}
