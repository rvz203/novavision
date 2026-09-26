import { requirePermission } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { getMailerConfig } from "@/lib/mailer";
import EmailsManager from "./EmailsManager";

export const metadata = {
  title: "مدیریت ایمیل و پیام‌ها | پنل مدیریت NovaVison",
};

export default async function EmailsPage() {
  const actor = await requirePermission("emails.manage");

  // Fetch emails from DB
  const emails = await prisma.emailMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const mailerConfig = getMailerConfig();

  return (
    <EmailsManager
      currentUserId={actor.id}
      currentUserName={actor.name}
      currentUserRole={actor.role}
      smtpConfig={{
        host: mailerConfig.host,
        port: mailerConfig.port,
        user: mailerConfig.user,
        from: mailerConfig.from,
        secure: mailerConfig.secure,
      }}
      emails={emails.map((e) => ({
        id: e.id,
        direction: e.direction,
        sender: e.sender,
        senderName: e.senderName,
        recipient: e.recipient,
        subject: e.subject,
        content: e.content,
        htmlContent: e.htmlContent,
        status: e.status,
        tag: e.tag,
        inquiryType: e.inquiryType,
        replyToId: e.replyToId,
        threadId: e.threadId,
        hasReplied: e.hasReplied,
        attachments: e.attachments as any,
        isRead: e.isRead,
        isStarred: e.isStarred,
        isArchived: e.isArchived,
        errorMessage: e.errorMessage,
        createdAt: e.createdAt.toISOString(),
      }))}
    />
  );
}
