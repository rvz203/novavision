import { ArrowUpRight } from "lucide-react";
import type { DictionaryContent } from "@/dictionaries";
import FadeIn from "@/components/FadeIn";
import styles from "./GroupCompanies.module.css";

export default function GroupCompanies({ content }: { content: DictionaryContent["home"]["companies"] }) {
  let companyUrl = "https://novira.novavisiontrade.com";
  try {
    const configured = new URL(content.noviraUrl);
    if (configured.protocol === "https:") companyUrl = configured.href;
  } catch { /* Retain the company domain for invalid admin input. */ }

  return (
    <section id="companies" className={styles.section} aria-labelledby="companies-title">
      <div className={`container ${styles.layout}`}>
        <FadeIn fullWidth>
          <div className={styles.intro}>
            <span className={styles.eyebrow}>{content.eyebrow}</span>
            <h2 id="companies-title">{content.title}</h2>
            <p>{content.subtitle}</p>
          </div>
        </FadeIn>
        <FadeIn delay={0.12} fullWidth>
          <a href={companyUrl} className={styles.company} target="_blank" rel="noopener noreferrer">
            <div className={styles.companyTop}><span className={styles.affiliation}>{content.groupLabel}</span><ArrowUpRight aria-hidden="true" /></div>
            <div className={styles.wordmark}><span className={styles.symbol} aria-hidden="true">N<i /></span><h3>{content.noviraName}</h3></div>
            <p>{content.noviraDescription}</p>
            <div className={styles.companyBottom}><span>{content.visitLabel}</span><small dir="ltr">{new URL(companyUrl).hostname}</small></div>
          </a>
        </FadeIn>
      </div>
    </section>
  );
}
