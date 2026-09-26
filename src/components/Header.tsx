"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import styles from "./Header.module.css";
import ThemeToggle from "./ThemeToggle";
import Button from "./Button";

type HeaderDictionary = {
  novanTrade: string;
  home: string;
  about: string;
  blog?: string;
  contact: string;
  startInquiry: string;
};

const fallbackBlogLabels: Record<string, string> = {
  fa: "وبلاگ",
  ar: "المدونة",
  en: "Insights",
};

export default function Header({ lang, dict }: { lang: string; dict: HeaderDictionary }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 24);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const currentPathWithoutLang = pathname.replace(`/${lang}`, "");
    window.location.assign(`/${event.target.value}${currentPathWithoutLang}`);
  };

  const navigation = [
    { href: `/${lang}`, label: dict.home },
    { href: `/${lang}/about`, label: dict.about },
    { href: `/${lang}/blog`, label: dict.blog || fallbackBlogLabels[lang] || fallbackBlogLabels.en },
    { href: `/${lang}/contact`, label: dict.contact },
  ];

  const isActive = (href: string) =>
    href === `/${lang}` ? pathname === href : pathname.startsWith(href);

  return (
    <header className={`${styles.header} ${isScrolled ? styles.scrolled : ""}`}>
      <div className={`container ${styles.nav}`}>
        <Link href={`/${lang}`} className={styles.logo} onClick={() => setIsMenuOpen(false)}>
          <span className={styles.logoMark} aria-hidden="true">
            <span />
          </span>
          <span>{dict.novanTrade}</span>
        </Link>

        <nav id="site-navigation" className={`${styles.links} ${isMenuOpen ? styles.open : ""}`}>
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.link} ${isActive(item.href) ? styles.active : ""}`}
              aria-current={isActive(item.href) ? "page" : undefined}
              onClick={() => setIsMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.actions}>
          <select
            value={lang}
            onChange={handleLanguageChange}
            className={styles.langSelect}
            aria-label="Select language"
          >
            <option value="en">EN</option>
            <option value="fa">FA</option>
            <option value="ar">AR</option>
          </select>

          <ThemeToggle />

          <div className={styles.headerBtnWrapper}>
            <Button href={`/${lang}/contact`} variant="primary">
              {dict.startInquiry}
              <ArrowUpRight aria-hidden="true" />
            </Button>
          </div>

          <button
            className={`${styles.mobileMenuBtn} ${isMenuOpen ? styles.menuOpen : ""}`}
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-label="Toggle menu"
            aria-controls="site-navigation"
            aria-expanded={isMenuOpen}
          >
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  );
}
