import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FadeIn from "@/components/FadeIn";
import ContactForm from "./ContactForm";
import styles from "./page.module.css";
import { Metadata } from "next";
import { getDictionary, Locale } from "@/dictionaries";

export const metadata: Metadata = {
  title: "Contact Us | NovaVison",
  description: "Get in touch with NovaVison for business inquiries.",
};

export default async function Contact(props: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await props.params;
  const dict = await getDictionary(lang);

  return (
    <>
      <Header lang={lang} dict={dict.common} />
      <main className={styles.main}>
        {/* Hero */}
        <section className={styles.hero}>
          <div className="container">
            <FadeIn delay={0}>
              <h1 className={styles.heroTitle}>{dict.contact.heroTitle}</h1>
            </FadeIn>
            <FadeIn delay={0.2}>
              <p className={styles.heroSubtitle}>{dict.contact.heroSubtitle}</p>
            </FadeIn>
          </div>
        </section>

        {/* Contact Content */}
        <section className="section">
          <div className="container">
            <div className={styles.grid}>
              {/* Contact Info */}
              <FadeIn direction="right">
                <div>
                  <h2 className="section-title" style={{ textAlign: "start" }}>
                    {dict.contact.infoTitle}
                  </h2>
                  <div className={styles.infoBlock}>
                    <h3>{dict.contact.headOffice}</h3>
                    <p>{dict.contact.headOfficeDesc}</p>
                  </div>
                  <div className={styles.infoBlock}>
                    <h3>{dict.contact.phone}</h3>
                    <p dir="ltr" style={{ textAlign: "start" }}>{dict.contact.phoneDesc}</p>
                  </div>
                  <div className={styles.infoBlock}>
                    <h3>{dict.contact.email}</h3>
                    <p dir="ltr" style={{ textAlign: "start" }}>{dict.contact.emailGen}</p>
                    <p dir="ltr" style={{ textAlign: "start" }}>{dict.contact.emailBiz}</p>
                  </div>
                  <div className={styles.infoBlock}>
                    <h3>{dict.contact.hours}</h3>
                    <p>{dict.contact.hoursDays}</p>
                    <p>{dict.contact.hoursWeekend}</p>
                  </div>
                </div>
              </FadeIn>

              {/* Inquiry Form */}
              <FadeIn direction="left" delay={0.2}>
                <ContactForm dict={dict.contact} />
              </FadeIn>
            </div>
          </div>
        </section>
      </main>
      <Footer dict={dict.common} lang={lang} />
    </>
  );
}
