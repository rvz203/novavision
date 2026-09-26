"use server";

import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/admin-auth";
import { recordActivity } from "@/lib/activity";
import {
  sendLiaraEmail,
  verifySmtpConnection,
  getMailerConfig,
  generateBrandedEmailHtml,
  type EmailAttachment,
  type SendEmailPayload,
} from "@/lib/mailer";
import { revalidatePath } from "next/cache";

export async function previewEmailAction(payload: {
  subject: string;
  content: string;
  htmlContent?: string;
  isHtmlTemplate?: boolean;
  senderName?: string;
  isRtl?: boolean;
}) {
  await requirePermission("emails.manage");

  if (payload.htmlContent && !payload.isHtmlTemplate) {
    return { html: payload.htmlContent };
  }

  const generatedHtml = generateBrandedEmailHtml({
    subject: payload.subject || "پیش‌نمایش ایمیل NovaVison",
    bodyContent: payload.content || "متن پیام در این بخش نمایش داده خواهد شد.",
    senderName: payload.senderName || "NovaVison Trade",
    isRtl: payload.isRtl ?? true,
  });

  return { html: generatedHtml };
}

export async function sendAdminEmailAction(payload: SendEmailPayload) {
  const actor = await requirePermission("emails.manage");

  const recipient = payload.recipient.trim().toLowerCase();
  const subject = payload.subject.trim();
  const content = payload.content.trim();
  const tag = payload.tag?.trim() || (payload.replyToId ? "admin-reply" : "admin-direct");
  const senderName = payload.senderName?.trim() || "NovaVison";

  if (!recipient || !/^\S+@\S+\.\S+$/.test(recipient)) {
    throw new Error("نشانی ایمیل گیرنده معتبر نیست.");
  }
  if (!subject) {
    throw new Error("موضوع ایمیل نمی‌تواند خالی باشد.");
  }
  if (!content) {
    throw new Error("متن پیام نمی‌تواند خالی باشد.");
  }

  const config = getMailerConfig();

  // Generate final HTML if requested or provided
  let finalHtml = payload.htmlContent;
  if (payload.isHtmlTemplate || (!finalHtml && content)) {
    finalHtml = generateBrandedEmailHtml({
      subject,
      bodyContent: finalHtml || content,
      senderName,
      isRtl: true,
    });
  }

  // Filter valid attachments
  const cleanAttachments: EmailAttachment[] = (payload.attachments || []).filter(
    (att) => att.filename && (att.content || att.path),
  );

  // Metadata for DB JSON storage (excluding large base64 contents to keep DB light)
  const dbAttachmentsMeta = cleanAttachments.map((att) => ({
    filename: att.filename,
    size: att.size || (att.content ? Math.round((att.content.length * 3) / 4) : 0),
    contentType: att.contentType || "application/octet-stream",
  }));

  let emailRecord;
  try {
    // Send email through Liara SMTP
    await sendLiaraEmail({
      to: recipient,
      subject,
      text: content,
      html: finalHtml,
      from: config.from,
      fromName: senderName,
      tag,
      attachments: cleanAttachments,
    });

    // Save record to DB as sent
    emailRecord = await prisma.emailMessage.create({
      data: {
        direction: "outbound",
        sender: config.from,
        senderName: `${senderName} (${actor.name})`,
        recipient,
        subject,
        content,
        htmlContent: finalHtml,
        status: "sent",
        tag,
        replyToId: payload.replyToId || null,
        threadId: payload.replyToId || null,
        attachments: dbAttachmentsMeta.length > 0 ? (dbAttachmentsMeta as any) : undefined,
        isRead: true,
      },
    });

    // If this is a reply to an existing message, mark parent as replied
    if (payload.replyToId) {
      try {
        await prisma.emailMessage.update({
          where: { id: payload.replyToId },
          data: { hasReplied: true },
        });
      } catch (e) {
        console.warn("Could not update parent email hasReplied status:", e);
      }
    }

    await recordActivity({
      actor,
      action: "email.send",
      entityType: "email",
      entityId: emailRecord.id,
      scope: `emails.outbound`,
      description: payload.replyToId
        ? `پاسخ به ایمیل «${recipient}» با موضوع «${subject}» ارسال شد.`
        : `ایمیل به «${recipient}» با موضوع «${subject}» ارسال شد.`,
      metadata: { recipient, tag, replyToId: payload.replyToId, attachmentsCount: cleanAttachments.length },
    });

    revalidatePath("/admin/dashboard/emails");
    return { success: true, id: emailRecord.id, message: "ایمیل با موفقیت ارسال شد." };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    // Save failed attempt to DB for auditing
    await prisma.emailMessage.create({
      data: {
        direction: "outbound",
        sender: config.from,
        senderName: `${senderName} (${actor.name})`,
        recipient,
        subject,
        content,
        htmlContent: finalHtml,
        status: "failed",
        tag,
        replyToId: payload.replyToId || null,
        threadId: payload.replyToId || null,
        attachments: dbAttachmentsMeta.length > 0 ? (dbAttachmentsMeta as any) : undefined,
        isRead: true,
        errorMessage: errorMsg,
      },
    });

    revalidatePath("/admin/dashboard/emails");
    throw new Error(`ارسال ایمیل ناموفق بود: ${errorMsg}`);
  }
}

export async function testSmtpConnectionAction(targetEmail?: string) {
  const actor = await requirePermission("emails.manage");
  const config = getMailerConfig();

  // Test verify connection
  const verification = await verifySmtpConnection();
  if (!verification.success) {
    throw new Error(verification.message);
  }

  // If a target email is provided, send a live test message
  if (targetEmail && /^\S+@\S+\.\S+$/.test(targetEmail.trim())) {
    const cleanTarget = targetEmail.trim();
    const testSubject = `[تست اتصال SMTP] پیام آزمایشی سیستم NovaVison`;
    const testContent = `با سلام،\n\nاین یک پیام آزمایشی جهت تایید صحت تنظیمات ایمیل‌سرور لیارا (SMTP) در وب‌سایت NovaVison است.\n\nزمان ارسال: ${new Date().toLocaleString("fa-IR")}\nکاربر درخواست‌کننده: ${actor.name} (${actor.email})\nمیزبان: ${config.host}:${config.port}\n\nباتشکر،\nتیم پشتیبانی فنی NovaVison`;

    const brandedHtml = generateBrandedEmailHtml({
      subject: testSubject,
      bodyContent: testContent,
      senderName: "NovaVison SMTP Tester",
      isRtl: true,
    });

    await sendLiaraEmail({
      to: cleanTarget,
      subject: testSubject,
      text: testContent,
      html: brandedHtml,
      from: config.from,
      fromName: "NovaVison SMTP Tester",
      tag: "smtp-test",
    });

    await prisma.emailMessage.create({
      data: {
        direction: "outbound",
        sender: config.from,
        senderName: `SMTP Test (${actor.name})`,
        recipient: cleanTarget,
        subject: testSubject,
        content: testContent,
        htmlContent: brandedHtml,
        status: "sent",
        tag: "smtp-test",
        isRead: true,
      },
    });

    await recordActivity({
      actor,
      action: "email.test",
      entityType: "smtp",
      scope: "emails.diagnostics",
      description: `ایمیل تستی به «${cleanTarget}» ارسال شد.`,
      metadata: { target: cleanTarget },
    });

    revalidatePath("/admin/dashboard/emails");
    return { success: true, message: `اتصال برقرار شد و ایمیل تستی با موفقیت به ${cleanTarget} ارسال گردید.` };
  }

  return { success: true, message: verification.message };
}

export async function markEmailReadAction(id: string, isRead: boolean) {
  await requirePermission("emails.manage");
  await prisma.emailMessage.update({
    where: { id },
    data: { isRead },
  });
  revalidatePath("/admin/dashboard/emails");
}

export async function toggleStarEmailAction(id: string) {
  await requirePermission("emails.manage");
  const email = await prisma.emailMessage.findUnique({ where: { id } });
  if (!email) throw new Error("پیام پیدا نشد.");

  await prisma.emailMessage.update({
    where: { id },
    data: { isStarred: !email.isStarred },
  });
  revalidatePath("/admin/dashboard/emails");
}

export async function deleteEmailAction(id: string) {
  const actor = await requirePermission("emails.manage");
  const email = await prisma.emailMessage.findUnique({ where: { id } });
  if (!email) throw new Error("پیام پیدا نشد.");

  await prisma.emailMessage.delete({ where: { id } });

  await recordActivity({
    actor,
    action: "email.delete",
    entityType: "email",
    entityId: id,
    scope: `emails.${email.direction}`,
    description: `پیام «${email.subject}» (${email.direction === "inbound" ? "دریافتی" : "ارسالی"}) را حذف کرد.`,
  });

  revalidatePath("/admin/dashboard/emails");
}

/**
 * Public Server Action for visitors submitting the contact form
 */
export async function submitContactInquiryAction(formData: FormData) {
  const fullName = String(formData.get("fullName") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const inquiryType = String(formData.get("inquiryType") || "general").trim();
  const message = String(formData.get("message") || "").trim();

  if (!fullName || fullName.length < 2) {
    return { success: false, error: "لطفاً نام و نام خانوادگی خود را کامل وارد کنید." };
  }
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return { success: false, error: "لطفاً یک آدرس ایمیل معتبر وارد کنید." };
  }
  if (!message || message.length < 5) {
    return { success: false, error: "متن پیام باید حداقل ۵ نویسه باشد." };
  }

  const subject = `[استعلام سایت] ${inquiryType.toUpperCase()} - ${fullName}`;
  const config = getMailerConfig();

  // 1. Save inbound message to database inbox
  const record = await prisma.emailMessage.create({
    data: {
      direction: "inbound",
      sender: email,
      senderName: fullName,
      recipient: config.from,
      subject,
      content: message,
      inquiryType,
      tag: "contact-form",
      status: "received",
      isRead: false,
    },
  });

  // 2. Try sending email notification to the site administrator
  try {
    const notificationHtml = `
      <div style="font-family: Tahoma, Arial, sans-serif; direction: rtl; text-align: right; padding: 20px; background: #f9fbfd; border: 1px solid #dfe7ed; border-radius: 12px; color: #0b2943;">
        <h2 style="color: #008b78; margin-top: 0;">پیام جدید از فرم تماس با ما</h2>
        <p><strong>نام فرستنده:</strong> ${fullName}</p>
        <p><strong>ایمیل فرستنده:</strong> <a href="mailto:${email}">${email}</a></p>
        <p><strong>نوع استعلام:</strong> ${inquiryType}</p>
        <hr style="border: 0; border-top: 1px solid #dfe7ed; margin: 16px 0;"/>
        <p><strong>متن پیام:</strong></p>
        <div style="background: #ffffff; padding: 15px; border-radius: 8px; border: 1px solid #e1e8ed; line-height: 1.6; white-space: pre-wrap;">${message}</div>
        <br/>
        <p style="font-size: 12px; color: #6f8292;">این پیام از طریق فرم تماس وب‌سایت NovaVison ارسال و در پنل مدیریت ثبت شده است.</p>
      </div>
    `;

    await sendLiaraEmail({
      to: config.from,
      replyTo: email,
      subject,
      text: `پیام جدید از: ${fullName} (${email})\nموضوع: ${inquiryType}\n\nپیام:\n${message}`,
      html: notificationHtml,
      tag: "contact-notification",
    });
  } catch (err) {
    console.error("Failed to forward contact email via SMTP:", err);
  }

  revalidatePath("/admin/dashboard/emails");
  return { success: true, message: "پیام شما با موفقیت دریافت و ثبت گردید. کارشناسان ما به زودی با شما تماس خواهند گرفت." };
}

/**
 * Register an Inbound Email / Customer Reply manually or from external client
 */
export async function createInboundEmailAction(payload: {
  sender: string;
  senderName?: string;
  recipient?: string;
  subject: string;
  content: string;
  htmlContent?: string;
  inquiryType?: string;
  tag?: string;
  replyToId?: string;
  attachments?: EmailAttachment[];
}) {
  const actor = await requirePermission("emails.manage");

  if (!payload.sender || !payload.subject || !payload.content) {
    throw new Error("ایمیل فرستنده، موضوع و متن پیام الزامی است.");
  }

  const config = getMailerConfig();

  // Find thread if replying to an existing email
  let threadId: string | undefined = undefined;
  if (payload.replyToId) {
    const parent = await prisma.emailMessage.findUnique({ where: { id: payload.replyToId } });
    if (parent) {
      threadId = parent.threadId || parent.id;
    }
  }

  const message = await prisma.emailMessage.create({
    data: {
      direction: "inbound",
      sender: payload.sender.trim(),
      senderName: payload.senderName?.trim() || null,
      recipient: payload.recipient?.trim() || config.from,
      subject: payload.subject.trim(),
      content: payload.content.trim(),
      htmlContent: payload.htmlContent || null,
      inquiryType: payload.inquiryType || "general",
      tag: payload.tag || "customer-reply",
      status: "received",
      replyToId: payload.replyToId || undefined,
      threadId,
      attachments: payload.attachments && payload.attachments.length > 0 ? (payload.attachments as any) : undefined,
      isRead: false,
      isStarred: false,
    },
  });

  if (payload.replyToId) {
    await prisma.emailMessage.update({
      where: { id: payload.replyToId },
      data: { hasReplied: true },
    }).catch(() => null);
  }

  await recordActivity({
    actor,
    action: "email.receive",
    entityType: "email",
    entityId: message.id,
    description: `پاسخ دریافتی جدید از «${payload.sender}» با موضوع «${payload.subject}» ثبت شد.`,
    metadata: { sender: payload.sender, subject: payload.subject, replyToId: payload.replyToId },
  });

  revalidatePath("/admin/dashboard/emails");
  return { success: true, message: "ایمیل دریافتی با موفقیت در اینباکس ثبت گردید.", emailId: message.id };
}
