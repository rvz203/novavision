"use client";

import { submitContactInquiryAction } from "@/app/actions/emails";
import Button from "@/components/Button";
import { CheckCircle2, AlertCircle, LoaderCircle } from "lucide-react";
import { useState, useTransition } from "react";
import styles from "./page.module.css";

export type ContactDictionary = {
  formTitle: string;
  fullName: string;
  emailAddress: string;
  inquiryType: string;
  selectOption: string;
  optSourcing: string;
  optImport: string;
  optExport: string;
  optLogistics: string;
  optConsultation: string;
  optPartnership: string;
  optCareer: string;
  optGeneral: string;
  message: string;
  submitBtn: string;
};

export default function ContactForm({ dict }: { dict: ContactDictionary }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [inquiryType, setInquiryType] = useState("");
  const [message, setMessage] = useState("");

  const [status, setStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);

    const formData = new FormData();
    formData.append("fullName", fullName);
    formData.append("email", email);
    formData.append("inquiryType", inquiryType);
    formData.append("message", message);

    startTransition(async () => {
      try {
        const result = await submitContactInquiryAction(formData);
        if (result.success) {
          setStatus({ success: true, message: result.message || "پیام شما با موفقیت ثبت شد." });
          setFullName("");
          setEmail("");
          setInquiryType("");
          setMessage("");
        } else {
          setStatus({ success: false, message: result.error || "ثبت پیام با خطا مواجه شد." });
        }
      } catch (err: unknown) {
        setStatus({
          success: false,
          message: err instanceof Error ? err.message : "خطای غیرمنتظره در ارسال پیام",
        });
      }
    });
  }

  return (
    <div className={styles.formWrapper}>
      <h2 className="mb-md">{dict.formTitle}</h2>

      {status && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "14px 16px",
            borderRadius: "10px",
            marginBottom: "18px",
            fontSize: "0.85rem",
            backgroundColor: status.success ? "#eaf7f1" : "#fff2f2",
            color: status.success ? "#0e8557" : "#c23e47",
            border: `1px solid ${status.success ? "#bce4d4" : "#fecaca"}`,
          }}
        >
          {status.success ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span>{status.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.label}>{dict.fullName}</label>
          <input
            type="text"
            className={styles.input}
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={isPending}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>{dict.emailAddress}</label>
          <input
            type="email"
            className={styles.input}
            required
            dir="ltr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isPending}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>{dict.inquiryType}</label>
          <select
            className={styles.select}
            required
            value={inquiryType}
            onChange={(e) => setInquiryType(e.target.value)}
            disabled={isPending}
          >
            <option value="">{dict.selectOption}</option>
            <option value="sourcing">{dict.optSourcing}</option>
            <option value="import">{dict.optImport}</option>
            <option value="export">{dict.optExport}</option>
            <option value="logistics">{dict.optLogistics}</option>
            <option value="consultation">{dict.optConsultation}</option>
            <option value="partnership">{dict.optPartnership}</option>
            <option value="career">{dict.optCareer}</option>
            <option value="general">{dict.optGeneral}</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>{dict.message}</label>
          <textarea
            className={styles.textarea}
            required
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isPending}
          ></textarea>
        </div>

        <Button type="submit" variant="primary" fullWidth disabled={isPending}>
          {isPending ? "در حال ارسال..." : dict.submitBtn}
        </Button>
      </form>
    </div>
  );
}
