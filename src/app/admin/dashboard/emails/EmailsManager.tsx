"use client";

import {
  createInboundEmailAction,
  deleteEmailAction,
  markEmailReadAction,
  sendAdminEmailAction,
  testSmtpConnectionAction,
  toggleStarEmailAction,
} from "@/app/actions/emails";
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Code,
  Copy,
  Download,
  Eye,
  File,
  FileText,
  Filter,
  Globe,
  Inbox,
  LayoutTemplate,
  LoaderCircle,
  Mail,
  MailCheck,
  Paperclip,
  Plus,
  RefreshCw,
  Reply,
  Search,
  Send,
  Server,
  Sparkles,
  Star,
  Trash2,
  User,
  X,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";

export type EmailAttachmentItem = {
  filename: string;
  url?: string;
  size?: number;
  contentType?: string;
  content?: string; // base64
};

export type EmailItem = {
  id: string;
  direction: string;
  sender: string;
  senderName: string | null;
  recipient: string;
  subject: string;
  content: string;
  htmlContent: string | null;
  status: string;
  tag: string | null;
  inquiryType: string | null;
  replyToId?: string | null;
  threadId?: string | null;
  hasReplied?: boolean;
  attachments?: EmailAttachmentItem[] | null;
  isRead: boolean;
  isStarred: boolean;
  isArchived: boolean;
  errorMessage: string | null;
  createdAt: string;
};

export type SmtpConfigInfo = {
  host: string;
  port: number;
  user: string;
  from: string;
  secure: boolean;
};

const TEMPLATES = [
  {
    id: "inquiry_reply",
    title: "پاسخ به استعلام تجاری / بازرگانی",
    subject: "پاسخ به استعلام بازرگانی شما - شرکت بین‌المللی NovaVison",
    tag: "inquiry-reply",
    body: `با سلام و احترام،\n\nاز تماس و ابراز علاقه شما به خدمات بازرگانی بین‌المللی NovaVison سپاسگزاریم.\n\nاستعلام ارسالی شما توسط تیم کارشناسان تامین و بازرگانی ما بررسی شد. جهت ارائه دقیق‌ترین پیشنهاد و برآورد زمان‌بندی و هزینه‌ها، خواهشمند است در صورت وجود مشخصات فنی تکمیلی یا آنالیز مد نظر، آن را برای ما ارسال فرمایید.\n\nکارشناس ما جهت هماهنگی بیشتر به زودی با شما تماس خواهد گرفت.\n\nبا تجدید احترام،\nتیم پشتیبانی و بازرگانی NovaVison\nوب‌سایت: https://novavisiontrade.com`,
  },
  {
    id: "catalog_send",
    title: "ارسال کاتالوگ و معرفی خدمات",
    subject: "کاتالوگ خدمات و توانمندی‌های بازرگانی NovaVison",
    tag: "marketing",
    body: `با سلام،\n\nاحتراماً کاتالوگ و شرح خدمات گروه بازرگانی بین‌المللی NovaVison در حوزه سورسینگ کالا، مدیریت زنجیره تامین، حمل‌ونقل بین‌المللی و خدمات واردات/صادرات خدمتتان ارائه می‌گردد.\n\nما آماده همکاری و ارائه راهکارهای بهینه برای پروژه‌های بازرگانی شما در منطقه و بازارهای جهانی هستیم.\n\nبا احترام،\nدپارتمان ارتباطات تجاری NovaVison`,
  },
  {
    id: "meeting_invitation",
    title: "دعوت به جلسه هماهنگی آنلاین/حضوری",
    subject: "هماهنگی جلسه مشاوره بازرگانی - NovaVison",
    tag: "commercial-meeting",
    body: `با سلام و درود،\n\nپیرو پیام قبلی شما، خوشحال خواهیم شد جهت بررسی تفصیلی نیازمندی‌ها و بررسی فرصت‌های همکاری مشترک، جلسه‌ای حضوری یا آنلاین ترتیب دهیم.\n\nلطفاً زمان‌های مناسب مد نظر خود را برای این هفته اعلام فرمایید تا هماهنگی نهایی انجام شود.\n\nبا آرزوی موفقیت،\nمدیریت روابط تجاری NovaVison`,
  },
];

const INQUIRY_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  sourcing: { label: "سورسینگ و تامین", color: "#008b78" },
  import: { label: "واردات کالا", color: "#0284c7" },
  export: { label: "صادرات کالا", color: "#059669" },
  logistics: { label: "حمل‌ونقل و ترانزیت", color: "#d97706" },
  consultation: { label: "مشاوره بازرگانی", color: "#7c3aed" },
  partnership: { label: "همکاری تجاری", color: "#db2777" },
  career: { label: "همکاری شغلی", color: "#4b5563" },
  general: { label: "پیام عمومی", color: "#64748b" },
};

function formatFileSize(bytes?: number) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function buildClientPreviewHtml(subject: string, content: string, senderName: string, isCustomHtml: boolean) {
  if (isCustomHtml && /<[a-z][\s\S]*>/i.test(content)) {
    return content;
  }

  const formatted = content
    ? content
        .split("\n\n")
        .map((p) => `<p style="margin: 0 0 16px; line-height: 1.85; color: #203548; font-size: 15px;">${p.replace(/\n/g, "<br/>")}</p>`)
        .join("")
    : '<p style="color: #8fa0af; font-style: italic;">متن پیام در اینجا نمایش داده می‌شود...</p>';

  return `
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; padding: 0; background-color: #f2f5f8; font-family: Tahoma, 'Segoe UI', Arial, sans-serif; }
    .email-container { max-width: 620px; margin: 20px auto; background-color: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 30px rgba(8,43,70,0.08); border: 1px solid #dfe7ed; }
    .email-header { background: linear-gradient(135deg, #072d50 0%, #008b78 100%); padding: 28px 32px; text-align: center; color: #ffffff; }
    .email-brand-mark { display: inline-block; width: 42px; height: 42px; line-height: 42px; border-radius: 10px; background: rgba(255,255,255,0.2); font-size: 20px; font-weight: bold; margin-bottom: 10px; color: #ffffff; }
    .email-header h1 { margin: 0; font-size: 20px; font-weight: 700; }
    .email-header p { margin: 4px 0 0; opacity: 0.85; font-size: 12px; }
    .email-body { padding: 32px; direction: rtl; text-align: right; }
    .email-footer { background-color: #f7fafc; padding: 20px 32px; border-top: 1px solid #edf2f7; text-align: center; font-size: 12px; color: #718096; }
    .email-footer a { color: #008b78; text-decoration: none; font-weight: bold; }
  </style>
</head>
<body>
  <div style="padding: 15px 10px;">
    <div class="email-container">
      <div class="email-header">
        <div class="email-brand-mark">N</div>
        <h1>NovaVison</h1>
        <p>International Sourcing & Trade Solutions</p>
      </div>
      <div class="email-body">
        ${formatted}
      </div>
      <div class="email-footer">
        <p style="margin: 0 0 6px;"><strong>${senderName || "NovaVison Trade"}</strong></p>
        <p style="margin: 0 0 10px;">شرکت بازرگانی بین‌المللی NovaVison</p>
        <p style="margin: 0;">
          <a href="https://novavisiontrade.com" target="_blank">novavisiontrade.com</a> &bull; 
          <a href="mailto:info@novavisiontrade.com">info@novavisiontrade.com</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export default function EmailsManager({
  emails,
  smtpConfig,
  currentUserName,
}: {
  emails: EmailItem[];
  smtpConfig: SmtpConfigInfo;
  currentUserId: string;
  currentUserName: string;
  currentUserRole: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const quickReplyFileInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<"inbox" | "sent" | "compose" | "smtp">("inbox");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [activeMessage, setActiveMessage] = useState<EmailItem | null>(null);

  // Message Detail View Mode: "text" | "html"
  const [detailViewMode, setDetailViewMode] = useState<"text" | "html">("text");

  // Compose State
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeContent, setComposeContent] = useState("");
  const [composeTag, setComposeTag] = useState("general");
  const [composeSenderName, setComposeSenderName] = useState("NovaVison Trade");
  const [composeReplyToId, setComposeReplyToId] = useState<string | null>(null);
  const [composeFormat, setComposeFormat] = useState<"branded" | "custom_html">("branded");
  const [composeTab, setComposeTab] = useState<"edit" | "preview">("edit");
  const [composeAttachments, setComposeAttachments] = useState<EmailAttachmentItem[]>([]);

  // Inline Quick Reply State inside Message Detail
  const [quickReplyText, setQuickReplyText] = useState("");
  const [quickReplyAttachments, setQuickReplyAttachments] = useState<EmailAttachmentItem[]>([]);
  const [quickReplyPending, setQuickReplyPending] = useState(false);

  // SMTP Test State
  const [testTargetEmail, setTestTargetEmail] = useState("");
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Status banners
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Filtered lists
  const inboxList = useMemo(() => {
    return emails.filter((e) => e.direction === "inbound");
  }, [emails]);

  const sentList = useMemo(() => {
    return emails.filter((e) => e.direction === "outbound");
  }, [emails]);

  const unreadCount = useMemo(() => {
    return inboxList.filter((e) => !e.isRead).length;
  }, [inboxList]);

  const currentDisplayList = useMemo(() => {
    const base = tab === "inbox" ? inboxList : sentList;
    return base.filter((item) => {
      // Search
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        item.subject.toLowerCase().includes(q) ||
        item.sender.toLowerCase().includes(q) ||
        (item.senderName && item.senderName.toLowerCase().includes(q)) ||
        item.recipient.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q);

      if (!matchSearch) return false;

      // Category filters
      if (filterType === "unread") return !item.isRead;
      if (filterType === "starred") return item.isStarred;
      if (filterType === "replied") return item.hasReplied;
      if (filterType === "failed") return item.status === "failed";
      if (filterType !== "all" && item.inquiryType !== filterType) return false;

      return true;
    });
  }, [tab, inboxList, sentList, search, filterType]);

  // Find all replies in conversation thread for activeMessage
  const activeMessageReplies = useMemo(() => {
    if (!activeMessage) return [];
    return emails.filter(
      (e) =>
        e.replyToId === activeMessage.id ||
        (e.threadId && e.threadId === activeMessage.id && e.direction === "outbound"),
    );
  }, [activeMessage, emails]);

  // Reply Helper (opens full Compose tab)
  function handleReply(item: EmailItem) {
    const replyAddress = item.direction === "inbound" ? item.sender : item.recipient;
    setComposeTo(replyAddress);
    setComposeSubject(item.subject.startsWith("پاسخ:") ? item.subject : `پاسخ: ${item.subject}`);
    setComposeContent(
      `\n\n---------------------------\nدر تاریخ ${new Date(item.createdAt).toLocaleString("fa-IR")}، ${
        item.senderName || item.sender
      } نوشت:\n> ${item.content.replace(/\n/g, "\n> ")}`,
    );
    setComposeTag(item.tag || "inquiry-reply");
    setComposeReplyToId(item.id);
    setComposeAttachments([]);
    setTab("compose");
    setActiveMessage(null);
  }

  // Quick template selection
  function applyTemplate(tplId: string) {
    const tpl = TEMPLATES.find((t) => t.id === tplId);
    if (!tpl) return;
    setComposeSubject(tpl.subject);
    setComposeContent(tpl.body);
    setComposeTag(tpl.tag);
  }

  // Attachment file picker handlers
  function handleAttachmentFiles(files: FileList | null, isQuickReply = false) {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      if (file.size > 12 * 1024 * 1024) {
        setFeedback({ type: "error", message: `فایل «${file.name}» بیش از ۱۲ مگابایت است.` });
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        const newAtt: EmailAttachmentItem = {
          filename: file.name,
          content: base64,
          size: file.size,
          contentType: file.type || "application/octet-stream",
        };
        if (isQuickReply) {
          setQuickReplyAttachments((prev) => [...prev, newAtt]);
        } else {
          setComposeAttachments((prev) => [...prev, newAtt]);
        }
      };
      reader.readAsDataURL(file);
    });
  }

  // Toggle Read Status
  function handleToggleRead(item: EmailItem, event?: React.MouseEvent) {
    event?.stopPropagation();
    startTransition(async () => {
      try {
        await markEmailReadAction(item.id, !item.isRead);
        router.refresh();
      } catch (err: unknown) {
        setFeedback({ type: "error", message: err instanceof Error ? err.message : "خطا در تغییر وضعیت" });
      }
    });
  }

  // Toggle Star
  function handleToggleStar(item: EmailItem, event?: React.MouseEvent) {
    event?.stopPropagation();
    startTransition(async () => {
      try {
        await toggleStarEmailAction(item.id);
        router.refresh();
      } catch (err: unknown) {
        setFeedback({ type: "error", message: err instanceof Error ? err.message : "خطا در ثبت نشان" });
      }
    });
  }

  // Delete Email
  function handleDelete(id: string, event?: React.MouseEvent) {
    event?.stopPropagation();
    if (!confirm("آیا از حذف این پیام اطمینان دارید؟")) return;
    startTransition(async () => {
      try {
        await deleteEmailAction(id);
        if (activeMessage?.id === id) setActiveMessage(null);
        setFeedback({ type: "success", message: "پیام با موفقیت حذف شد." });
        router.refresh();
      } catch (err: unknown) {
        setFeedback({ type: "error", message: err instanceof Error ? err.message : "خطا در حذف پیام" });
      }
    });
  }

  // Open Message Detail
  function openMessage(item: EmailItem) {
    setActiveMessage(item);
    setDetailViewMode(item.htmlContent ? "html" : "text");
    setQuickReplyText("");
    setQuickReplyAttachments([]);

    if (!item.isRead && item.direction === "inbound") {
      startTransition(async () => {
        try {
          await markEmailReadAction(item.id, true);
          router.refresh();
        } catch {
          // ignore
        }
      });
    }
  }

  // Send Email Submit (from Compose tab)
  function handleSendSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      try {
        const result = await sendAdminEmailAction({
          recipient: composeTo,
          subject: composeSubject,
          content: composeContent,
          htmlContent: composeFormat === "custom_html" ? composeContent : undefined,
          isHtmlTemplate: composeFormat === "branded",
          tag: composeTag,
          senderName: composeSenderName,
          replyToId: composeReplyToId || undefined,
          attachments: composeAttachments.map((att) => ({
            filename: att.filename,
            content: att.content,
            size: att.size,
            contentType: att.contentType,
          })),
        });
        setFeedback({ type: "success", message: result.message || "ایمیل با موفقیت ارسال گردید." });
        setComposeTo("");
        setComposeSubject("");
        setComposeContent("");
        setComposeAttachments([]);
        setComposeReplyToId(null);
        setTab("sent");
        router.refresh();
      } catch (err: unknown) {
        setFeedback({ type: "error", message: err instanceof Error ? err.message : "ارسال ایمیل ناموفق بود." });
      }
    });
  }

  // Inline Quick Reply Handler
  async function handleQuickReplySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeMessage || !quickReplyText.trim()) return;
    setQuickReplyPending(true);
    try {
      const recipient = activeMessage.direction === "inbound" ? activeMessage.sender : activeMessage.recipient;
      const subject = activeMessage.subject.startsWith("پاسخ:") ? activeMessage.subject : `پاسخ: ${activeMessage.subject}`;

      await sendAdminEmailAction({
        recipient,
        subject,
        content: quickReplyText.trim(),
        isHtmlTemplate: true,
        tag: activeMessage.tag || "inquiry-reply",
        senderName: composeSenderName || "NovaVison Trade",
        replyToId: activeMessage.id,
        attachments: quickReplyAttachments.map((att) => ({
          filename: att.filename,
          content: att.content,
          size: att.size,
          contentType: att.contentType,
        })),
      });

      setFeedback({ type: "success", message: `پاسخ به ${recipient} با موفقیت ارسال گردید.` });
      setQuickReplyText("");
      setQuickReplyAttachments([]);
      router.refresh();
    } catch (err: unknown) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "ارسال پاسخ سریع ناموفق بود." });
    } finally {
      setQuickReplyPending(false);
    }
  }

  // Test SMTP Connection
  function handleRunSmtpTest(e?: React.FormEvent) {
    e?.preventDefault();
    setTestResult(null);
    setFeedback(null);
    startTransition(async () => {
      try {
        const res = await testSmtpConnectionAction(testTargetEmail || undefined);
        setTestResult({ success: true, message: res.message });
        router.refresh();
      } catch (err: unknown) {
        setTestResult({ success: false, message: err instanceof Error ? err.message : "خطای ناشناخته در اتصال SMTP" });
      }
    });
  }

  // Simulate Customer Reply
  function handleSimulateCustomerReply(item: EmailItem) {
    const senderEmail = item.direction === "inbound" ? item.sender : item.recipient;
    const defaultText = window.prompt(
      `متن پاسخ دریافتی از طرف کاربر (${senderEmail}) را بنویسید:`,
      "با تشکر از پیگیری و پاسخ شما، اطلاعات و کاتالوگ دریافتی بررسی شد و مورد تایید است."
    );
    if (!defaultText || !defaultText.trim()) return;

    startTransition(async () => {
      try {
        const senderName = item.direction === "inbound" ? item.senderName || "مشتری" : "مشتری";
        await createInboundEmailAction({
          sender: senderEmail,
          senderName,
          subject: item.subject.startsWith("پاسخ:") ? item.subject : `پاسخ: ${item.subject}`,
          content: defaultText.trim(),
          replyToId: item.id,
          tag: item.tag || "customer-reply",
          inquiryType: item.inquiryType || "general",
        });
        setFeedback({ type: "success", message: `پاسخ دریافتی از ${senderEmail} با موفقیت در اینباکس و تاریخچه گفتگو ثبت شد.` });
        router.refresh();
      } catch (err: unknown) {
        setFeedback({ type: "error", message: err instanceof Error ? err.message : "خطا در ثبت پاسخ دریافتی" });
      }
    });
  }

  return (
    <div className="emails-page">
      {/* Header */}
      <header className="admin-page-header">
        <div>
          <span className="page-kicker">سرویس ایمیل‌سرور لیارا و مرکز ارتباطات</span>
          <h1 className="page-heading">مرکز ایمیل و اینباکس (Email & Inbox)</h1>
          <p className="page-subheading">
            مدیریت استعلام‌ها، فرم‌های تماس، ارسال ایمیل‌های شرکتی با قالب HTML، فایل‌های پیوست و تاریخچه گفتگوها
          </p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="admin-btn primary"
            onClick={() => {
              setTab("compose");
              setComposeReplyToId(null);
              setActiveMessage(null);
            }}
          >
            <Plus size={18} />
            <span>ارسال ایمیل جدید</span>
          </button>
        </div>
      </header>

      {/* Quick Stats Cards */}
      <div className="email-stats-grid">
        <div
          className={`email-stat-card ${unreadCount > 0 ? "highlight" : ""}`}
          onClick={() => {
            setTab("inbox");
            setFilterType("unread");
          }}
        >
          <div className="stat-icon inbox-icon">
            <Inbox size={22} />
          </div>
          <div>
            <span className="stat-title">پیام‌های خوانده‌نشده</span>
            <strong className="stat-value">{unreadCount}</strong>
          </div>
        </div>

        <div
          className="email-stat-card"
          onClick={() => {
            setTab("inbox");
            setFilterType("all");
          }}
        >
          <div className="stat-icon received-icon">
            <ArrowDownLeft size={22} />
          </div>
          <div>
            <span className="stat-title">صندوق ورودی</span>
            <strong className="stat-value">{inboxList.length}</strong>
          </div>
        </div>

        <div
          className="email-stat-card"
          onClick={() => {
            setTab("sent");
            setFilterType("all");
          }}
        >
          <div className="stat-icon sent-icon">
            <ArrowUpRight size={22} />
          </div>
          <div>
            <span className="stat-title">ایمیل‌های ارسالی</span>
            <strong className="stat-value">{sentList.length}</strong>
          </div>
        </div>

        <div className="email-stat-card" onClick={() => setTab("smtp")}>
          <div className="stat-icon server-icon">
            <Server size={22} />
          </div>
          <div>
            <span className="stat-title">سرور SMTP لیارا</span>
            <strong className="stat-value status-online">متصل (پورت {smtpConfig.port})</strong>
          </div>
        </div>
      </div>

      {/* Global Alert Notification */}
      {feedback && (
        <div className={`admin-feedback-banner ${feedback.type}`}>
          {feedback.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
          <button type="button" onClick={() => setFeedback(null)} aria-label="بستن">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="email-tabs-bar">
        <button
          type="button"
          className={`email-tab-btn ${tab === "inbox" ? "active" : ""}`}
          onClick={() => {
            setTab("inbox");
            setActiveMessage(null);
          }}
        >
          <Inbox size={18} />
          <span>صندوق ورودی (Inbox)</span>
          {unreadCount > 0 && <span className="tab-badge">{unreadCount}</span>}
        </button>

        <button
          type="button"
          className={`email-tab-btn ${tab === "sent" ? "active" : ""}`}
          onClick={() => {
            setTab("sent");
            setActiveMessage(null);
          }}
        >
          <Send size={18} />
          <span>ایمیل‌های ارسالی (Sent)</span>
          <span className="tab-badge neutral">{sentList.length}</span>
        </button>

        <button
          type="button"
          className={`email-tab-btn ${tab === "compose" ? "active" : ""}`}
          onClick={() => {
            setTab("compose");
            setActiveMessage(null);
          }}
        >
          <Mail size={18} />
          <span>ارسال ایمیل جدید (Compose)</span>
        </button>

        <button
          type="button"
          className={`email-tab-btn ${tab === "smtp" ? "active" : ""}`}
          onClick={() => {
            setTab("smtp");
            setActiveMessage(null);
          }}
        >
          <Zap size={18} />
          <span>تنظیمات و تست سرور SMTP</span>
        </button>
      </div>

      {/* MAIN CONTENT AREA */}
      {(tab === "inbox" || tab === "sent") && (
        <div className="email-layout-grid">
          {/* Email List Sidebar */}
          <div className="email-list-column">
            {/* Search & Filter Toolbar */}
            <div className="email-toolbar">
              <div className="email-search-wrap">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="جستجو در پیام‌ها، نام، موضوع یا ایمیل..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="email-search-input"
                />
                {search && (
                  <button type="button" className="clear-search" onClick={() => setSearch("")}>
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="email-filter-chips">
                <button
                  type="button"
                  className={`chip ${filterType === "all" ? "active" : ""}`}
                  onClick={() => setFilterType("all")}
                >
                  همه ({tab === "inbox" ? inboxList.length : sentList.length})
                </button>
                {tab === "inbox" && (
                  <button
                    type="button"
                    className={`chip ${filterType === "unread" ? "active" : ""}`}
                    onClick={() => setFilterType("unread")}
                  >
                    خوانده نشده ({unreadCount})
                  </button>
                )}
                {tab === "inbox" && (
                  <button
                    type="button"
                    className={`chip ${filterType === "replied" ? "active" : ""}`}
                    onClick={() => setFilterType("replied")}
                  >
                    پاسخ داده شده
                  </button>
                )}
                <button
                  type="button"
                  className={`chip ${filterType === "starred" ? "active" : ""}`}
                  onClick={() => setFilterType("starred")}
                >
                  ستاره‌دار
                </button>
              </div>
            </div>

            {/* Email Items List */}
            <div className="email-items-container">
              {currentDisplayList.length === 0 ? (
                <div className="email-empty-state">
                  <MailCheck size={40} className="empty-icon" />
                  <h4>هیچ پیامی یافت نشد</h4>
                  <p>در این بخش موردی متناسب با فیلترهای انتخابی موجود نیست.</p>
                </div>
              ) : (
                currentDisplayList.map((item) => {
                  const inquiryBadge = item.inquiryType ? INQUIRY_TYPE_LABELS[item.inquiryType] : null;
                  const isSelected = activeMessage?.id === item.id;
                  const attCount = item.attachments?.length || 0;

                  return (
                    <div
                      key={item.id}
                      className={`email-row-item ${!item.isRead && item.direction === "inbound" ? "unread" : ""} ${
                        isSelected ? "selected" : ""
                      }`}
                      onClick={() => openMessage(item)}
                    >
                      <div className="email-item-leading">
                        <button
                          type="button"
                          className={`star-btn ${item.isStarred ? "starred" : ""}`}
                          onClick={(e) => handleToggleStar(item, e)}
                          title={item.isStarred ? "حذف ستاره" : "افزودن ستاره"}
                        >
                          <Star size={16} fill={item.isStarred ? "currentColor" : "none"} />
                        </button>
                      </div>

                      <div className="email-item-content">
                        <div className="email-item-top">
                          <span className="sender-name">
                            {tab === "inbox" ? item.senderName || item.sender : `به: ${item.recipient}`}
                          </span>
                          <span className="email-date">
                            {new Date(item.createdAt).toLocaleDateString("fa-IR", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        <div className="email-item-subject">
                          <strong>{item.subject}</strong>
                        </div>

                        <div className="email-item-snippet">
                          {item.content.slice(0, 95)}
                          {item.content.length > 95 ? "..." : ""}
                        </div>

                        <div className="email-item-tags">
                          {inquiryBadge && (
                            <span className="inquiry-badge" style={{ backgroundColor: `${inquiryBadge.color}15`, color: inquiryBadge.color, borderColor: `${inquiryBadge.color}35` }}>
                              {inquiryBadge.label}
                            </span>
                          )}
                          {item.hasReplied && (
                            <span className="replied-badge" title="به این پیام پاسخ داده شده است">
                              <Reply size={12} />
                              پاسخ داده شده
                            </span>
                          )}
                          {attCount > 0 && (
                            <span className="attachment-badge" title={`${attCount} فایل پیوست`}>
                              <Paperclip size={12} />
                              {attCount}
                            </span>
                          )}
                          {item.status === "failed" && (
                            <span className="status-badge failed">ناموفق</span>
                          )}
                        </div>
                      </div>

                      <div className="email-item-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="row-action-btn"
                          onClick={(e) => handleToggleRead(item, e)}
                          title={item.isRead ? "علامت به عنوان خوانده نشده" : "علامت به عنوان خوانده شده"}
                        >
                          <Mail size={15} />
                        </button>
                        <button
                          type="button"
                          className="row-action-btn delete"
                          onClick={(e) => handleDelete(item.id, e)}
                          title="حذف پیام"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Email Detail Panel */}
          <div className="email-detail-column">
            {activeMessage ? (
              <div className="email-detail-card">
                {/* Detail Header Toolbar */}
                <div className="detail-toolbar">
                  <div className="detail-toolbar-left">
                    <button
                      type="button"
                      className="admin-btn icon-only"
                      onClick={() => setActiveMessage(null)}
                      title="بستن پیام"
                    >
                      <X size={18} />
                    </button>
                    <button
                      type="button"
                      className={`admin-btn icon-only ${activeMessage.isStarred ? "starred" : ""}`}
                      onClick={() => handleToggleStar(activeMessage)}
                      title="نشان‌دار کردن"
                    >
                      <Star size={18} fill={activeMessage.isStarred ? "currentColor" : "none"} />
                    </button>
                    <button
                      type="button"
                      className="admin-btn icon-only"
                      onClick={() => handleToggleRead(activeMessage)}
                      title="تغییر وضعیت خواندن"
                    >
                      <Mail size={18} />
                    </button>
                  </div>

                  <div className="detail-toolbar-right">
                    {/* Mode toggle: Plain text vs HTML preview */}
                    {activeMessage.htmlContent && (
                      <div className="view-mode-toggle">
                        <button
                          type="button"
                          className={`mode-btn ${detailViewMode === "text" ? "active" : ""}`}
                          onClick={() => setDetailViewMode("text")}
                        >
                          <FileText size={14} />
                          <span>متن ساده</span>
                        </button>
                        <button
                          type="button"
                          className={`mode-btn ${detailViewMode === "html" ? "active" : ""}`}
                          onClick={() => setDetailViewMode("html")}
                        >
                          <Eye size={14} />
                          <span>پیش‌نمایش HTML</span>
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      className="admin-btn secondary"
                      onClick={() => handleReply(activeMessage)}
                    >
                      <Reply size={16} />
                      <span>پاسخ کامل</span>
                    </button>
                    <button
                      type="button"
                      className="admin-btn secondary"
                      title="ثبت یا تست دریافت پاسخ مشتری به این پیام"
                      onClick={() => handleSimulateCustomerReply(activeMessage)}
                    >
                      <ArrowDownLeft size={16} />
                      <span>ثبت پاسخ دریافتی</span>
                    </button>
                    <button
                      type="button"
                      className="admin-btn danger icon-only"
                      onClick={() => handleDelete(activeMessage.id)}
                      title="حذف"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Message Header Info */}
                <div className="detail-meta-header">
                  <div className="detail-subject-line">
                    <h2>{activeMessage.subject}</h2>
                    {activeMessage.hasReplied && (
                      <span className="replied-badge large">
                        <Reply size={14} />
                        پاسخ داده شده
                      </span>
                    )}
                  </div>

                  <div className="detail-parties-grid">
                    <div className="party-avatar">
                      <User size={20} />
                    </div>
                    <div className="party-info">
                      <div className="party-name-row">
                        <strong>{activeMessage.senderName || activeMessage.sender}</strong>
                        <span className="party-email">&lt;{activeMessage.sender}&gt;</span>
                      </div>
                      <div className="party-recipient-row">
                        <span>به: {activeMessage.recipient}</span>
                        <span className="date-time-dot">&bull;</span>
                        <span className="date-time-val">
                          <Clock size={13} />
                          {new Date(activeMessage.createdAt).toLocaleString("fa-IR", {
                            dateStyle: "full",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Metadata Tags */}
                  <div className="detail-tags-row">
                    {activeMessage.inquiryType && (
                      <span className="meta-pill inquiry">
                        نوع استعلام: <strong>{INQUIRY_TYPE_LABELS[activeMessage.inquiryType]?.label || activeMessage.inquiryType}</strong>
                      </span>
                    )}
                    {activeMessage.tag && (
                      <span className="meta-pill tag">
                        برچسب: <code>{activeMessage.tag}</code>
                      </span>
                    )}
                    <span className={`meta-pill status-${activeMessage.status}`}>
                      وضعیت: {activeMessage.status === "sent" ? "ارسال شده" : activeMessage.status === "received" ? "دریافت شده" : "ناموفق"}
                    </span>
                  </div>
                </div>

                {/* Attachments Bar */}
                {activeMessage.attachments && activeMessage.attachments.length > 0 && (
                  <div className="detail-attachments-box">
                    <div className="attachments-title">
                      <Paperclip size={16} />
                      <span>پیوست‌های پیام ({activeMessage.attachments.length}):</span>
                    </div>
                    <div className="attachments-list">
                      {activeMessage.attachments.map((att, idx) => (
                        <div key={idx} className="attachment-chip">
                          <File size={15} />
                          <span className="att-name">{att.filename}</span>
                          <span className="att-size">({formatFileSize(att.size)})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message Body Content */}
                <div className="detail-body-container">
                  {detailViewMode === "html" && activeMessage.htmlContent ? (
                    <div className="html-preview-frame">
                      <iframe
                        srcDoc={activeMessage.htmlContent}
                        title="HTML Email Preview"
                        className="email-iframe"
                        sandbox="allow-same-origin"
                      />
                    </div>
                  ) : (
                    <div className="detail-body-text">{activeMessage.content}</div>
                  )}
                </div>

                {/* CONVERSATION THREAD (Replies sent to this message) */}
                {activeMessageReplies.length > 0 && (
                  <div className="conversation-thread-section">
                    <div className="thread-heading">
                      <Reply size={18} />
                      <h3>تاریخچه پاسخ‌ها و مکاتبات ({activeMessageReplies.length})</h3>
                    </div>

                    <div className="thread-replies-list">
                      {activeMessageReplies.map((reply) => (
                        <div key={reply.id} className="thread-reply-item">
                          <div className="reply-header">
                            <div className="reply-author">
                              <span className="author-badge">پاسخ NovaVison</span>
                              <strong>{reply.senderName || reply.sender}</strong>
                              <span className="reply-recipient">به: {reply.recipient}</span>
                            </div>
                            <span className="reply-date">
                              <Clock size={13} />
                              {new Date(reply.createdAt).toLocaleString("fa-IR", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            </span>
                          </div>

                          <div className="reply-content">
                            {reply.content}
                          </div>

                          {reply.attachments && reply.attachments.length > 0 && (
                            <div className="reply-attachments">
                              {reply.attachments.map((att, aIdx) => (
                                <span key={aIdx} className="mini-attachment-pill">
                                  <Paperclip size={12} />
                                  {att.filename} ({formatFileSize(att.size)})
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* INLINE QUICK REPLY BOX */}
                <div className="quick-reply-card">
                  <div className="quick-reply-header">
                    <div className="quick-reply-title">
                      <Reply size={17} />
                      <h4>ارسال پاسخ سریع به {activeMessage.direction === "inbound" ? activeMessage.senderName || activeMessage.sender : activeMessage.recipient}</h4>
                    </div>
                    <div className="quick-templates">
                      <span className="tpl-hint">قالب‌های آماده:</span>
                      {TEMPLATES.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          className="tpl-quick-btn"
                          onClick={() => setQuickReplyText(t.body)}
                        >
                          {t.title}
                        </button>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={handleQuickReplySubmit} className="quick-reply-form">
                    <textarea
                      rows={4}
                      value={quickReplyText}
                      onChange={(e) => setQuickReplyText(e.target.value)}
                      placeholder="متن پاسخ خود را بنویسید (با قالب شرکتی NovaVison ارسال می‌شود)..."
                      className="quick-reply-textarea"
                      required
                    />

                    {/* Quick Reply Attachments list */}
                    {quickReplyAttachments.length > 0 && (
                      <div className="attached-files-bar">
                        {quickReplyAttachments.map((file, idx) => (
                          <div key={idx} className="file-pill">
                            <Paperclip size={13} />
                            <span>{file.filename}</span>
                            <small>({formatFileSize(file.size)})</small>
                            <button
                              type="button"
                              onClick={() =>
                                setQuickReplyAttachments((prev) => prev.filter((_, i) => i !== idx))
                              }
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="quick-reply-actions">
                      <div>
                        <input
                          type="file"
                          multiple
                          ref={quickReplyFileInputRef}
                          style={{ display: "none" }}
                          onChange={(e) => handleAttachmentFiles(e.target.files, true)}
                        />
                        <button
                          type="button"
                          className="admin-btn secondary small"
                          onClick={() => quickReplyFileInputRef.current?.click()}
                        >
                          <Paperclip size={15} />
                          <span>افزودن فایل پیوست</span>
                        </button>
                      </div>

                      <button
                        type="submit"
                        className="admin-btn primary"
                        disabled={quickReplyPending || !quickReplyText.trim()}
                      >
                        {quickReplyPending ? (
                          <>
                            <LoaderCircle size={16} className="spin" />
                            <span>در حال ارسال...</span>
                          </>
                        ) : (
                          <>
                            <Send size={16} />
                            <span>ارسال پاسخ</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              <div className="email-empty-detail">
                <Mail size={56} className="empty-watermark" />
                <h3>پیامی انتخاب نشده است</h3>
                <p>برای مشاهده متن کامل، پیوست‌ها و پاسخ به مکاتبات، یک پیام را از لیست سمت راست انتخاب کنید.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* COMPOSE TAB */}
      {tab === "compose" && (
        <div className="compose-container-card">
          <div className="compose-header">
            <div>
              <h3>ارسال ایمیل جدید</h3>
              <p>ارسال پیام به شرکا، مشتریان یا استعلام‌های بازرگانی با اتصال مستقیم به سرور SMTP لیارا</p>
            </div>
            <div className="compose-template-dropdown">
              <span className="template-label">قالب‌های آماده:</span>
              <select
                className="admin-select"
                onChange={(e) => {
                  if (e.target.value) applyTemplate(e.target.value);
                }}
                defaultValue=""
              >
                <option value="" disabled>
                  انتخاب الگوی پیام...
                </option>
                {TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Format and Tab Selectors */}
          <div className="compose-mode-bar">
            <div className="format-options">
              <button
                type="button"
                className={`format-btn ${composeFormat === "branded" ? "active" : ""}`}
                onClick={() => setComposeFormat("branded")}
              >
                <LayoutTemplate size={16} />
                <span>قالب لوکس شرکتی NovaVison (HTML Branded)</span>
              </button>
              <button
                type="button"
                className={`format-btn ${composeFormat === "custom_html" ? "active" : ""}`}
                onClick={() => setComposeFormat("custom_html")}
              >
                <Code size={16} />
                <span>کد سفارشی HTML (Custom HTML)</span>
              </button>
            </div>

            <div className="tab-options">
              <button
                type="button"
                className={`compose-tab-pill ${composeTab === "edit" ? "active" : ""}`}
                onClick={() => setComposeTab("edit")}
              >
                <FileText size={15} />
                <span>ویرایش محتوا</span>
              </button>
              <button
                type="button"
                className={`compose-tab-pill ${composeTab === "preview" ? "active" : ""}`}
                onClick={() => setComposeTab("preview")}
              >
                <Eye size={15} />
                <span>پیش‌نمایش زنده ایمیل</span>
              </button>
            </div>
          </div>

          {composeTab === "preview" ? (
            <div className="live-preview-box">
              <div className="preview-meta-summary">
                <div><strong>گیرنده:</strong> {composeTo || "(تعیین نشده)"}</div>
                <div><strong>موضوع:</strong> {composeSubject || "(بدون موضوع)"}</div>
                <div><strong>فرستنده:</strong> {composeSenderName} &lt;{smtpConfig.from}&gt;</div>
                {composeAttachments.length > 0 && (
                  <div><strong>پیوست‌ها:</strong> {composeAttachments.map((a) => a.filename).join(", ")}</div>
                )}
              </div>
              <div className="preview-iframe-wrapper">
                <iframe
                  srcDoc={buildClientPreviewHtml(
                    composeSubject,
                    composeContent,
                    composeSenderName,
                    composeFormat === "custom_html",
                  )}
                  title="Live Preview"
                  className="preview-iframe"
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          ) : (
            <form onSubmit={handleSendSubmit} className="compose-form">
              <div className="compose-grid">
                <div className="compose-field">
                  <label>نشانی گیرنده (To):</label>
                  <input
                    type="email"
                    required
                    placeholder="example@domain.com"
                    value={composeTo}
                    onChange={(e) => setComposeTo(e.target.value)}
                    className="admin-input"
                  />
                </div>

                <div className="compose-field">
                  <label>نام فرستنده نمایشی:</label>
                  <input
                    type="text"
                    required
                    value={composeSenderName}
                    onChange={(e) => setComposeSenderName(e.target.value)}
                    className="admin-input"
                  />
                </div>
              </div>

              <div className="compose-grid">
                <div className="compose-field full">
                  <label>موضوع ایمیل (Subject):</label>
                  <input
                    type="text"
                    required
                    placeholder="موضوع پیام..."
                    value={composeSubject}
                    onChange={(e) => setComposeSubject(e.target.value)}
                    className="admin-input"
                  />
                </div>
              </div>

              <div className="compose-field">
                <label>
                  {composeFormat === "custom_html" ? "کد HTML پیام:" : "متن پیام:"}
                </label>
                <textarea
                  rows={11}
                  required
                  placeholder={
                    composeFormat === "custom_html"
                      ? "<div style='font-family: sans-serif;'><h1>عنوان</h1><p>متن پیام...</p></div>"
                      : "متن پیام خود را در اینجا بنویسید..."
                  }
                  value={composeContent}
                  onChange={(e) => setComposeContent(e.target.value)}
                  className={`admin-textarea ${composeFormat === "custom_html" ? "code-font" : ""}`}
                />
              </div>

              {/* Attachments Section */}
              <div className="compose-attachments-section">
                <div className="attachments-header-row">
                  <label>فایل‌های پیوست (Attachments):</label>
                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={(e) => handleAttachmentFiles(e.target.files, false)}
                  />
                  <button
                    type="button"
                    className="admin-btn secondary small"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip size={15} />
                    <span>افزودن فایل پیوست (تا ۱۲ مگابایت)</span>
                  </button>
                </div>

                {composeAttachments.length > 0 && (
                  <div className="compose-files-chips">
                    {composeAttachments.map((att, idx) => (
                      <div key={idx} className="file-chip">
                        <File size={14} />
                        <span className="file-name">{att.filename}</span>
                        <span className="file-size">({formatFileSize(att.size)})</span>
                        <button
                          type="button"
                          onClick={() => setComposeAttachments((prev) => prev.filter((_, i) => i !== idx))}
                          className="remove-chip-btn"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="compose-footer-actions">
                <div className="tag-picker">
                  <label>برچسب لیارا (x-liara-tag):</label>
                  <input
                    type="text"
                    value={composeTag}
                    onChange={(e) => setComposeTag(e.target.value)}
                    className="admin-input small"
                    placeholder="مثال: sourcing, marketing"
                  />
                </div>

                <div className="action-buttons">
                  <button
                    type="button"
                    className="admin-btn secondary"
                    onClick={() => setComposeTab("preview")}
                  >
                    <Eye size={16} />
                    <span>پیش‌نمایش</span>
                  </button>

                  <button type="submit" className="admin-btn primary" disabled={isPending}>
                    {isPending ? (
                      <>
                        <LoaderCircle size={18} className="spin" />
                        <span>در حال ارسال از طریق سرور لیارا...</span>
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        <span>ارسال ایمیل</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      )}

      {/* SMTP DIAGNOSTICS TAB */}
      {tab === "smtp" && (
        <div className="smtp-diagnostics-container">
          <div className="smtp-card">
            <div className="smtp-card-header">
              <Server size={24} className="server-status-icon" />
              <div>
                <h3>پیکربندی سرور SMTP لیارا</h3>
                <p>اطلاعات اتصال به سرویس ایمیل ابری لیارا برای ارسال مکاتبات و دریافت فرم‌ها</p>
              </div>
            </div>

            <div className="smtp-info-grid">
              <div className="smtp-info-item">
                <span className="info-key">سرور میزبان (Host):</span>
                <span className="info-val"><code>{smtpConfig.host}</code></span>
              </div>
              <div className="smtp-info-item">
                <span className="info-key">پورت اتصال (Port):</span>
                <span className="info-val"><code>{smtpConfig.port}</code> (SSL/TLS امن)</span>
              </div>
              <div className="smtp-info-item">
                <span className="info-key">نام کاربری (Username):</span>
                <span className="info-val"><code>{smtpConfig.user}</code></span>
              </div>
              <div className="smtp-info-item">
                <span className="info-key">نشانی فرستنده پیش‌فرض (From):</span>
                <span className="info-val"><code>{smtpConfig.from}</code></span>
              </div>
            </div>

            <hr className="admin-divider" />

            <div className="smtp-test-section">
              <h4>تست زنده اتصال و ارسال ایمیل</h4>
              <p>برای اطمینان از برقراری ارتباط با پورت ۴۶۵ لیارا و دریافت ایمیل، نشانی خود را وارد کنید:</p>

              <form onSubmit={handleRunSmtpTest} className="smtp-test-form">
                <input
                  type="email"
                  placeholder="ایمیل دریافت‌کننده تست (اختیاری)..."
                  value={testTargetEmail}
                  onChange={(e) => setTestTargetEmail(e.target.value)}
                  className="admin-input"
                />
                <button type="submit" className="admin-btn primary" disabled={isPending}>
                  {isPending ? (
                    <>
                      <LoaderCircle size={18} className="spin" />
                      <span>در حال بررسی...</span>
                    </>
                  ) : (
                    <>
                      <Zap size={18} />
                      <span>اجرای تست اتصال</span>
                    </>
                  )}
                </button>
              </form>

              {testResult && (
                <div className={`smtp-result-box ${testResult.success ? "success" : "error"}`}>
                  {testResult.success ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                  <div>
                    <strong>{testResult.success ? "اتصال موفقیت‌آمیز بود" : "خطا در برقراری اتصال"}</strong>
                    <p>{testResult.message}</p>
                  </div>
                </div>
              )}
            </div>

            <hr className="admin-divider" />

            {/* Inbound Webhook Integration */}
            <div className="smtp-test-section" style={{ background: "#f0fdf9", borderColor: "#a7f3d0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#065f46" }}>
                <Globe size={20} />
                <h4 style={{ margin: 0, color: "#064e3b" }}>دریافت خودکار ایمیل‌ها و پاسخ‌های کاربران (Inbound Webhook)</h4>
              </div>
              <p style={{ color: "#047857" }}>
                برای اینکه وقتی به کاربران ایمیل می‌زنید و آن‌ها در نرم‌افزار ایمیل خود (Gmail، یاهو یا اوت‌لوک) به شما پاسخ می‌دهند، ایمیل پاسخ داده شده فوراً و به طور خودکار به اینباکس و تاریخچه مکالمات اضافه شود، آدرس وبهوک زیر را در بخش <strong>Inbound Webhook</strong> پنل ایمیل سرور لیارا کپی نمایید:
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <code style={{ flex: "1", padding: "10px 14px", background: "#ffffff", border: "1px solid #6ee7b7", borderRadius: "8px", fontSize: "0.82rem", color: "#065f46", direction: "ltr", textAlign: "left" }}>
                  https://novavisiontrade.com/api/emails/inbound
                </code>
                <button
                  type="button"
                  className="admin-btn secondary"
                  style={{ borderColor: "#6ee7b7", color: "#065f46" }}
                  onClick={() => {
                    navigator.clipboard.writeText("https://novavisiontrade.com/api/emails/inbound");
                    setFeedback({ type: "success", message: "نشانی وبهوک دریافت خودکار ایمیل با موفقیت کپی گردید." });
                  }}
                >
                  <Copy size={16} />
                  <span>کپی آدرس وبهوک</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
