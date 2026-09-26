import "server-only";
import nodemailer from "nodemailer";

export type EmailAttachment = {
  filename: string;
  content?: string; // base64 string or raw string
  path?: string; // file path or URL
  contentType?: string;
  size?: number;
};

export type SendEmailOptions = {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
  tag?: string;
  attachments?: EmailAttachment[];
};

export type SendEmailPayload = {
  recipient: string;
  subject: string;
  content: string;
  htmlContent?: string;
  isHtmlTemplate?: boolean;
  tag?: string;
  senderName?: string;
  replyToId?: string;
  attachments?: EmailAttachment[];
};

export function getMailerConfig() {
  const host = process.env.MAIL_HOST || "smtp.c1.liara.email";
  const port = Number(process.env.MAIL_PORT) || 465;
  const user = process.env.MAIL_USER || "focused_austin_vrmp42";
  const pass = process.env.MAIL_PASSWORD || "f981f832-4310-47d4-90b0-27c7005ee670";
  const from = process.env.MAIL_FROM || "info@novavisiontrade.com";
  const secure = port === 465 || process.env.MAIL_SECURE === "true";

  return {
    host,
    port,
    secure,
    user,
    pass,
    from,
  };
}

export function createMailerTransporter() {
  const config = getMailerConfig();

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    connectionTimeout: 12000,
    greetingTimeout: 12000,
    socketTimeout: 20000,
  });
}

export async function verifySmtpConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const transporter = createMailerTransporter();
    await transporter.verify();
    return { success: true, message: "اتصال به سرویس ایمیل لیارا (SMTP) با موفقیت برقرار شد." };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, message: `خطا در اتصال به سرور SMTP: ${message}` };
  }
}

/**
 * Generates a luxury, responsive, RTL/LTR compatible HTML template for NovaVison emails
 */
export function generateBrandedEmailHtml({
  subject,
  bodyContent,
  senderName = "NovaVison Trade",
  isRtl = true,
}: {
  subject: string;
  bodyContent: string;
  senderName?: string;
  isRtl?: boolean;
}) {
  // Convert plain text newlines to formatted paragraphs if not already rich HTML
  const isRawHtml = /<[a-z][\s\S]*>/i.test(bodyContent);
  const formattedBody = isRawHtml
    ? bodyContent
    : bodyContent
        .split("\n\n")
        .map((paragraph) => `<p style="margin: 0 0 16px; line-height: 1.85; color: #203548; font-size: 15px;">${paragraph.replace(/\n/g, "<br/>")}</p>`)
        .join("");

  const direction = isRtl ? "rtl" : "ltr";
  const textAlign = isRtl ? "right" : "left";

  return `
<!DOCTYPE html>
<html lang="${isRtl ? "fa" : "en"}" dir="${direction}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f2f5f8; font-family: Tahoma, 'Segoe UI', Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    .email-container { max-width: 640px; margin: 30px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 35px rgba(8,43,70,0.08); border: 1px solid #dfe7ed; }
    .email-header { background: linear-gradient(135deg, #072d50 0%, #008b78 100%); padding: 32px 36px; text-align: center; color: #ffffff; }
    .email-brand-mark { display: inline-block; width: 44px; height: 44px; line-height: 44px; border-radius: 12px; background: rgba(255,255,255,0.2); font-size: 22px; font-weight: bold; margin-bottom: 12px; color: #ffffff; }
    .email-header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
    .email-body { padding: 36px; direction: ${direction}; text-align: ${textAlign}; }
    .email-body h2 { color: #072d50; margin: 0 0 18px; font-size: 19px; }
    .email-body p { margin: 0 0 16px; line-height: 1.85; color: #203548; font-size: 15px; }
    .email-footer { background-color: #f7fafc; padding: 24px 36px; border-top: 1px solid #edf2f7; text-align: center; font-size: 13px; color: #718096; direction: ${direction}; }
    .email-footer a { color: #008b78; text-decoration: none; font-weight: bold; }
    .divider { height: 1px; background-color: #edf2f7; margin: 24px 0; border: 0; }
  </style>
</head>
<body>
  <div style="background-color: #f2f5f8; padding: 20px 10px;">
    <div class="email-container">
      <div class="email-header">
        <div class="email-brand-mark">N</div>
        <h1>NovaVison</h1>
        <p style="margin: 6px 0 0; opacity: 0.85; font-size: 13px;">International Sourcing & Trade Solutions</p>
      </div>

      <div class="email-body">
        ${formattedBody}
      </div>

      <div class="email-footer">
        <p style="margin: 0 0 8px;"><strong>${senderName}</strong></p>
        <p style="margin: 0 0 12px;">شرکت بازرگانی بین‌المللی NovaVison | مدیریت زنجیره تامین و تجارت خارجی</p>
        <p style="margin: 0;">
          <a href="https://novavisiontrade.com" target="_blank">وب‌سایت رسمی: novavisiontrade.com</a> &bull; 
          <a href="mailto:info@novavisiontrade.com">info@novavisiontrade.com</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export async function sendLiaraEmail(options: SendEmailOptions) {
  const config = getMailerConfig();
  const transporter = createMailerTransporter();

  const fromAddress = options.from || config.from;
  const fromDisplay = options.fromName ? `"${options.fromName}" <${fromAddress}>` : fromAddress;

  // Process attachments if any
  const attachments = options.attachments?.map((att) => {
    if (att.content) {
      return {
        filename: att.filename,
        content: Buffer.from(att.content, "base64"),
        contentType: att.contentType,
      };
    }
    if (att.path) {
      return {
        filename: att.filename,
        path: att.path,
        contentType: att.contentType,
      };
    }
    return {
      filename: att.filename,
    };
  });

  const mailOptions: nodemailer.SendMailOptions = {
    from: fromDisplay,
    to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
    subject: options.subject,
    text: options.text,
    html: options.html || (options.text ? generateBrandedEmailHtml({ subject: options.subject, bodyContent: options.text, senderName: options.fromName }) : undefined),
    replyTo: options.replyTo,
    headers: {
      ...(options.tag ? { "x-liara-tag": options.tag } : { "x-liara-tag": "general" }),
    },
    attachments,
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
}
