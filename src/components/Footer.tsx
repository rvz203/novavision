import Link from "next/link";
import { BriefcaseBusiness, Globe2, Mail } from "lucide-react";
import styles from "./Footer.module.css";
import BrandLogo from "./BrandLogo";

type FooterDictionary = {
  novanTrade: string;
  about: string;
  blog?: string;
  contact: string;
  privacyPolicy: string;
  termsOfService: string;
  allRightsReserved: string;
};

export default function Footer({ dict, lang }: { dict: FooterDictionary; lang: string }) {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.brandColumn}>
          <Link href={`/${lang}`} className={styles.brand}>
            <BrandLogo className={styles.logoImage}>
              <span className={styles.brandMark} aria-hidden="true" />
              {dict.novanTrade}
            </BrandLogo>
          </Link>
          <p className={styles.desc}>International sourcing &amp; logistics.</p>
          <div className={styles.socials} aria-label="NovaVison links">
            <Link href={`/${lang}`} aria-label="NovaVison home"><Globe2 /></Link>
            <a href="mailto:info@novavison.com" aria-label="Email NovaVison"><Mail /></a>
            <a href="#" aria-label="NovaVison professional profile"><BriefcaseBusiness /></a>
          </div>
        </div>

        <div className={styles.linkColumn}>
          <h4 className={styles.linksTitle}>Company</h4>
          <div className={styles.links}>
            <Link href={`/${lang}/about`} className={styles.link}>{dict.about}</Link>
            <Link href={`/${lang}/blog`} className={styles.link}>{dict.blog || "Insights"}</Link>
            <Link href={`/${lang}/contact`} className={styles.link}>{dict.contact}</Link>
          </div>
        </div>

        <div className={styles.linkColumn}>
          <h4 className={styles.linksTitle}>Legal</h4>
          <div className={styles.links}>
            <Link href="#" className={styles.link}>{dict.privacyPolicy}</Link>
            <Link href="#" className={styles.link}>{dict.termsOfService}</Link>
          </div>
        </div>
      </div>

      <div className={`container ${styles.bottom}`}>
        <p className={styles.copyright}>
          &copy; {new Date().getFullYear()} {dict.novanTrade}. {dict.allRightsReserved}
        </p>
        <span className={styles.status}><i /> Connected to opportunity</span>
      </div>
    </footer>
  );
}
