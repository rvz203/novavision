import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Card from "@/components/Card";
import Button from "@/components/Button";
import FadeIn from "@/components/FadeIn";
import { FeatureVisual } from "@/components/EditorialVisuals";
import styles from "./page.module.css";
import { Metadata } from "next";
import { getDictionary, Locale } from "@/dictionaries";
import { getSiteVisuals } from "@/lib/site-visuals";

export const metadata: Metadata = {
  title: "About Us | NovaVison",
  description: "Learn about NovaVison's mission, vision, and core values.",
};

export default async function About(props: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await props.params;
  const [dict, featureVisuals] = await Promise.all([
    getDictionary(lang),
    getSiteVisuals("about.feature", lang),
  ]);

  return (
    <>
      <Header lang={lang} dict={dict.common} />
      <main className={styles.main}>
        {/* Hero */}
        <section className={styles.hero}>
          <div className={`container ${styles.heroGrid}`}>
            <div className={styles.heroContent}>
              <FadeIn delay={0}>
                <h1 className={styles.heroTitle}>{dict.about.heroTitle}</h1>
              </FadeIn>
              <FadeIn delay={0.2}>
                <p className={styles.heroSubtitle}>{dict.about.heroSubtitle}</p>
              </FadeIn>
            </div>
            <FeatureVisual visual={featureVisuals[0]} className={styles.aboutVisual} priority />
          </div>
        </section>

        {/* Story & Mission */}
        <section className={`section ${styles.sectionLight}`}>
          <div className="container">
            <div className={styles.contentWrapper}>
              <FadeIn>
                <h2 className="section-title">{dict.about.whoWeAre}</h2>
                <p className="mb-md text-center">{dict.about.whoWeAreDesc}</p>
              </FadeIn>
              
              <div className={styles.grid}>
                <FadeIn delay={0.1} fullWidth>
                  <Card title={dict.about.missionTitle}>
                    {dict.about.missionDesc}
                  </Card>
                </FadeIn>
                <FadeIn delay={0.2} fullWidth>
                  <Card title={dict.about.visionTitle}>
                    {dict.about.visionDesc}
                  </Card>
                </FadeIn>
              </div>
            </div>
          </div>
        </section>

        {/* Core Values */}
        <section className={`section ${styles.sectionDark}`}>
          <div className="container">
            <FadeIn>
              <h2 className="section-title">{dict.about.valuesTitle}</h2>
            </FadeIn>
            <div className={styles.valuesGrid}>
              <FadeIn delay={0.1} fullWidth>
                <Card title={dict.about.values.trust.title}>
                  {dict.about.values.trust.desc}
                </Card>
              </FadeIn>
              <FadeIn delay={0.2} fullWidth>
                <Card title={dict.about.values.transparency.title}>
                  {dict.about.values.transparency.desc}
                </Card>
              </FadeIn>
              <FadeIn delay={0.3} fullWidth>
                <Card title={dict.about.values.quality.title}>
                  {dict.about.values.quality.desc}
                </Card>
              </FadeIn>
              <FadeIn delay={0.4} fullWidth>
                <Card title={dict.about.values.responsibility.title}>
                  {dict.about.values.responsibility.desc}
                </Card>
              </FadeIn>
              <FadeIn delay={0.5} fullWidth>
                <Card title={dict.about.values.professionalism.title}>
                  {dict.about.values.professionalism.desc}
                </Card>
              </FadeIn>
              <FadeIn delay={0.6} fullWidth>
                <Card title={dict.about.values.partnership.title}>
                  {dict.about.values.partnership.desc}
                </Card>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* Careers CTA */}
        <section className={`section ${styles.sectionLight}`}>
          <div className="container text-center">
            <div className={styles.contentWrapper}>
              <FadeIn>
                <h2 className="section-title">{dict.about.careersTitle}</h2>
                <p className="section-subtitle">{dict.about.careersDesc}</p>
                <Button href={`/${lang}/contact`} variant="primary">
                  {dict.about.submitResume}
                </Button>
              </FadeIn>
            </div>
          </div>
        </section>
      </main>
      <Footer dict={dict.common} lang={lang} />
    </>
  );
}
