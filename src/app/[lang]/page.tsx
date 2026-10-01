import { ArrowDown, ArrowUpRight, Globe2, Network, PackageOpen, Ship } from "lucide-react";
import Button from "@/components/Button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FadeIn from "@/components/FadeIn";
import { HomeVisualBoard } from "@/components/EditorialVisuals";
import GroupCompanies from "@/components/GroupCompanies";
import styles from "./page.module.css";
import { getDictionary, Locale } from "@/dictionaries";
import { getSiteVisuals } from "@/lib/site-visuals";
import { getPageMetadata } from "@/lib/seo";
import { getPageSchema, getServicesSchema } from "@/lib/seo-schema";
import JsonLd from "@/components/JsonLd";

export async function generateMetadata({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params;
  return getPageMetadata(lang, "home");
}

export default async function Home(props: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await props.params;
  const [dict, boardVisuals] = await Promise.all([
    getDictionary(lang),
    getSiteVisuals("home.board", lang),
  ]);

  const capabilities = [
    {
      icon: Globe2,
      title: dict.home.services.sourcing.title,
      description: dict.home.marketAnalysis.desc,
    },
    {
      icon: Ship,
      title: dict.home.services.logistics.title,
      description: dict.home.reliableSourcing.desc,
    },
    {
      icon: Network,
      title: dict.home.qualityAssurance.title,
      description: dict.home.qualityAssurance.desc,
    },
  ];

  const services = [
    { icon: Globe2, ...dict.home.services.sourcing },
    { icon: Ship, ...dict.home.services.import },
    { icon: PackageOpen, ...dict.home.services.export },
    { icon: Network, ...dict.home.services.logistics },
  ];

  const steps = [
    dict.home.steps.assessment,
    dict.home.steps.risk,
    dict.home.steps.supplier,
    dict.home.steps.proposal,
    dict.home.steps.execution,
    dict.home.steps.review,
  ];

  return (
    <>
      <JsonLd data={await getPageSchema(lang, "home")} />
      <JsonLd data={getServicesSchema(lang, dict.home.services)} />
      <Header lang={lang} dict={dict.common} />
      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroAtmosphere} aria-hidden="true">
            <div className={styles.heroImage} />
            <div className={styles.orbitOne} />
            <div className={styles.orbitTwo} />
            <div className={styles.heroGrain} />
          </div>

          <div className={`container ${styles.heroGrid}`}>
            <div className={styles.heroContent}>
              <FadeIn delay={0.08}>
                <h1 className={styles.heroTitle}>{dict.home.heroTitle}</h1>
              </FadeIn>
              <FadeIn delay={0.22}>
                <p className={styles.heroSubtitle}>{dict.home.heroSubtitle}</p>
              </FadeIn>
              <FadeIn delay={0.36}>
                <div className={styles.heroButtons}>
                  <Button href={`/${lang}/contact`} variant="primary">
                    {dict.common.startInquiry}
                    <ArrowUpRight aria-hidden="true" />
                  </Button>
                  <Button href={`/${lang}/about`} variant="secondary" className={styles.heroSecondary}>
                    {dict.common.discoverExpertise}
                    <ArrowUpRight aria-hidden="true" />
                  </Button>
                </div>
              </FadeIn>
            </div>
          </div>

          <a href="#capabilities" className={styles.scrollCue} aria-label="Explore NovaVison services">
            <span />
            <ArrowDown aria-hidden="true" />
          </a>
        </section>

        <section id="capabilities" className={styles.capabilitiesSection}>
          <div className="container">
            <FadeIn>
              <h2 className={styles.capabilitiesTitle}>{dict.home.partnerTitle}</h2>
              <p className={styles.capabilitiesIntro}>{dict.home.partnerSubtitle}</p>
            </FadeIn>

            <div className={styles.capabilitiesGrid}>
              {capabilities.map(({ icon: Icon, title, description }, index) => (
                <FadeIn key={title} delay={0.08 * index} fullWidth>
                  <article className={styles.capability}>
                    <div className={styles.capabilityIcon}>
                      <Icon aria-hidden="true" />
                      <i />
                    </div>
                    <div>
                      <h3>{title}</h3>
                      <p>{description}</p>
                    </div>
                  </article>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        <HomeVisualBoard items={boardVisuals} lang={lang} />

        <section id="services" className={styles.servicesSection}>
          <div className={styles.serviceRibbon} aria-hidden="true" />
          <div className="container">
            <div className={styles.servicesHeader}>
              <FadeIn direction="right">
                <h2>{dict.home.servicesTitle}</h2>
              </FadeIn>
              <FadeIn direction="left" delay={0.12}>
                <p>{dict.home.servicesSubtitle}</p>
              </FadeIn>
            </div>

            <div className={styles.servicesGrid}>
              {services.map(({ icon: Icon, title, desc }, index) => (
                <FadeIn key={title} delay={0.08 * index} fullWidth>
                  <article className={styles.serviceItem}>
                    <span className={styles.serviceNumber}>{String(index + 1).padStart(2, "0")}</span>
                    <div className={styles.serviceIcon}><Icon aria-hidden="true" /></div>
                    <div className={styles.serviceCopy}>
                      <h3>{title}</h3>
                      <p>{desc}</p>
                    </div>
                    <ArrowUpRight className={styles.serviceArrow} aria-hidden="true" />
                  </article>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        <section id="process" className={styles.processSection}>
          <div className="container">
            <FadeIn>
              <h2 className={styles.processTitle}>{dict.home.processTitle}</h2>
            </FadeIn>

            <div className={styles.processRoute}>
              <svg className={styles.routeLine} viewBox="0 0 1200 150" preserveAspectRatio="none" aria-hidden="true">
                <path d="M10 72 C120 18 230 124 350 67 S575 118 700 62 S940 108 1190 66" />
              </svg>
              {steps.map((step, index) => (
                <FadeIn key={step.title} delay={0.08 * index} fullWidth>
                  <article className={styles.processStep}>
                    <span className={styles.processNode} style={{ animationDelay: `${index * 0.28}s` }}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3>{step.title}</h3>
                    <p>{step.desc}</p>
                  </article>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        <GroupCompanies content={dict.home.companies} />

        <section id="conversation" className={styles.ctaSection}>
          <div className={styles.ctaRibbon} aria-hidden="true" />
          <div className={`container ${styles.ctaInner}`}>
            <FadeIn direction="right">
              <div>
                <h2>{dict.home.ctaTitle}</h2>
                <p>{dict.home.ctaSubtitle}</p>
              </div>
            </FadeIn>
            <FadeIn direction="left" delay={0.16}>
              <Button href={`/${lang}/contact`} variant="primary">
                {dict.home.contactBtn}
                <ArrowUpRight aria-hidden="true" />
              </Button>
            </FadeIn>
          </div>
        </section>
      </main>
      <Footer dict={dict.common} lang={lang} />
    </>
  );
}
