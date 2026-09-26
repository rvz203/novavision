import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Inbound Email Webhook API
 * Handles incoming emails forwarded from Liara Email Server, SendGrid, Mailgun, Postmark,
 * or direct webhook integrations when a customer replies to an email.
 */
export async function POST(request: NextRequest) {
  try {
    let body: any = {};
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      body = await request.json();
    } else if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData();
      body = Object.fromEntries(formData.entries());
    } else {
      const text = await request.text();
      try {
        body = JSON.parse(text);
      } catch {
        body = { content: text };
      }
    }

    // Extract fields with multiple naming standard fallbacks
    const sender =
      body.sender ||
      body.from ||
      body.from_email ||
      body.envelope?.from ||
      body["envelope[from]"] ||
      "unknown@sender.com";

    const senderName =
      body.senderName ||
      body.from_name ||
      body.name ||
      (typeof sender === "string" && sender.includes("<") ? sender.replace(/<.*>/, "").trim() : null);

    const cleanSenderEmail =
      typeof sender === "string" && sender.includes("<")
        ? sender.match(/<([^>]+)>/)?.[1] || sender
        : sender;

    const recipient =
      body.recipient ||
      body.to ||
      body.to_email ||
      body.envelope?.to ||
      body["envelope[to]"] ||
      "info@novavisiontrade.com";

    const subject = body.subject || "بدون موضوع (پاسخ دریافتی)";
    const content = body.content || body.text || body.body || body["body-plain"] || body.message || "";
    const htmlContent = body.htmlContent || body.html || body["body-html"] || null;
    const inquiryType = body.inquiryType || "general";
    const tag = body.tag || "inbound-reply";

    // Process attachments if any
    let attachments: any[] = [];
    if (Array.isArray(body.attachments)) {
      attachments = body.attachments;
    } else if (body.attachment_info && typeof body.attachment_info === "object") {
      attachments = Object.values(body.attachment_info);
    }

    // Thread matching: Look for original outgoing/incoming email to link thread
    let replyToId: string | null = null;
    let threadId: string | null = null;

    // 1. Try finding by In-Reply-To header or reference if passed
    if (body.inReplyTo || body.in_reply_to || body.replyToId) {
      const parentId = body.replyToId || body.inReplyTo || body.in_reply_to;
      const original = await prisma.emailMessage.findFirst({
        where: {
          OR: [{ id: parentId }, { subject: { contains: parentId } }],
        },
      });
      if (original) {
        replyToId = original.id;
        threadId = original.threadId || original.id;
      }
    }

    // 2. Try finding by matching cleaned subject
    if (!replyToId && subject) {
      const cleanSubject = subject
        .replace(/^(re|fwd|پاسخ|بازفرست)[\s:]+/gi, "")
        .trim();

      if (cleanSubject.length > 3) {
        const matched = await prisma.emailMessage.findFirst({
          where: {
            OR: [
              { subject: { contains: cleanSubject, mode: "insensitive" } },
              { recipient: { contains: cleanSenderEmail, mode: "insensitive" } },
              { sender: { contains: cleanSenderEmail, mode: "insensitive" } },
            ],
          },
          orderBy: { createdAt: "desc" },
        });

        if (matched) {
          replyToId = matched.id;
          threadId = matched.threadId || matched.id;
        }
      }
    }

    // Create the inbound Email record
    const createdMessage = await prisma.emailMessage.create({
      data: {
        direction: "inbound",
        sender: cleanSenderEmail,
        senderName: senderName || null,
        recipient: typeof recipient === "string" ? recipient : "info@novavisiontrade.com",
        subject,
        content: content.trim() || (htmlContent ? "ایمیل با محتوای گرافیکی HTML دریافت شد." : "پیام بدون متن"),
        htmlContent: htmlContent || null,
        status: "received",
        tag,
        inquiryType,
        replyToId,
        threadId: threadId || undefined,
        attachments: attachments.length > 0 ? (attachments as any) : undefined,
        isRead: false,
        isStarred: false,
      },
    });

    // If this was a reply to an existing email, mark that email as replied
    if (replyToId) {
      await prisma.emailMessage.update({
        where: { id: replyToId },
        data: { hasReplied: true },
      }).catch(() => null);
    }

    return NextResponse.json({
      success: true,
      message: "ایمیل دریافتی با موفقیت در اینباکس ثبت گردید.",
      emailId: createdMessage.id,
      replyToId,
      threadId,
    });
  } catch (error: any) {
    console.error("[INBOUND_EMAIL_ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "خطا در پردازش ایمیل دریافتی",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "online",
    service: "NovaVison Inbound Email Webhook Service",
    endpoint: "https://novavisiontrade.com/api/emails/inbound",
    description: "Accepts HTTP POST webhooks with JSON or Multipart payloads for incoming email deliveries and replies.",
  });
}
