"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import type { PublicVisual, VisualMotion } from "@/lib/site-visual-types";
import styles from "./EditorialVisuals.module.css";

const boardCopy = {
  en: { eyebrow: "NovaVision atlas", title: "Trade, seen from every angle.", label: "A visual board of global trade" },
  fa: { eyebrow: "اطلس نوواویژن", title: "تجارت، از هر زاویه.", label: "تابلوی تصویری تجارت جهانی" },
  ar: { eyebrow: "أطلس نوفافيژن", title: "التجارة، من كل زاوية.", label: "لوحة بصرية للتجارة العالمية" },
};

function ambientAnimation(motionName: VisualMotion, reducedMotion: boolean | null) {
  if (reducedMotion || motionName === "static" || motionName === "reveal") return undefined;
  if (motionName === "float") return { y: [0, -9, 0], rotate: [0, 0.35, 0] };
  if (motionName === "drift") return { x: [0, 7, -4, 0], scale: [1.025, 1.045, 1.03, 1.025] };
  return { scale: [1.01, 1.055, 1.01] };
}

function MediaFrame({
  visual,
  className = "",
  priority = false,
  sizes,
}: {
  visual: PublicVisual;
  className?: string;
  priority?: boolean;
  sizes: string;
}) {
  const reducedMotion = useReducedMotion();
  const ambient = ambientAnimation(visual.motion, reducedMotion);

  return (
    <motion.figure
      className={`${styles.frame} ${className}`}
      initial={reducedMotion ? false : { opacity: 1, y: 34, clipPath: "inset(9% 0 9% 0 round 24px)" }}
      whileInView={reducedMotion ? undefined : { opacity: 1, y: 0, clipPath: "inset(0% 0 0% 0 round 24px)" }}
      viewport={{ once: true, amount: 0.22 }}
      transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className={styles.media}
        animate={ambient}
        transition={ambient ? { duration: visual.motion === "zoom" ? 12 : 9, repeat: Infinity, ease: "easeInOut" } : undefined}
      >
        <Image
          src={visual.imageUrl}
          alt={visual.alt}
          fill
          priority={priority}
          sizes={sizes}
          className={styles.image}
        />
      </motion.div>
      <span className={styles.frameLine} aria-hidden="true" />
      {visual.caption ? <figcaption>{visual.caption}</figcaption> : null}
    </motion.figure>
  );
}

export function HomeVisualBoard({ items, lang }: { items: PublicVisual[]; lang: "en" | "fa" | "ar" }) {
  if (!items.length) return null;
  const copy = boardCopy[lang] || boardCopy.en;

  return (
    <section className={styles.boardSection} aria-label={copy.label}>
      <div className="container">
        <div className={styles.boardHeading}>
          <span>{copy.eyebrow}</span>
          <h2>{copy.title}</h2>
          <i aria-hidden="true" />
        </div>
        <div className={styles.boardGrid}>
          {items.map((visual, index) => (
            <MediaFrame
              key={visual.id}
              visual={visual}
              className={styles[`boardItem${(index % 5) + 1}`]}
              priority={index === 0}
              sizes={index === 0 ? "(max-width: 760px) 100vw, 65vw" : "(max-width: 760px) 100vw, 38vw"}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export function FeatureVisual({ visual, className = "", priority = false }: { visual?: PublicVisual; className?: string; priority?: boolean }) {
  if (!visual) return null;
  return <MediaFrame visual={visual} className={`${styles.featureFrame} ${className}`} priority={priority} sizes="(max-width: 900px) 100vw, 48vw" />;
}
