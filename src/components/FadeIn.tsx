"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ReactNode } from "react";

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  fullWidth?: boolean;
  className?: string;
}

export default function FadeIn({
  children,
  delay = 0,
  direction = "up",
  fullWidth = false,
  className,
}: FadeInProps) {
  const prefersReducedMotion = useReducedMotion();
  const directions = {
    up: { y: 40, x: 0 },
    down: { y: -40, x: 0 },
    left: { x: 40, y: 0 },
    right: { x: -40, y: 0 },
    none: { x: 0, y: 0 },
  };

  const visibleState = {
    opacity: 1,
    x: 0,
    y: 0,
    filter: "blur(0px)",
  };

  return (
    <motion.div
      data-reveal="true"
      className={className}
      initial={
        prefersReducedMotion
          ? visibleState
          : {
              opacity: 1,
              ...directions[direction],
              filter: "blur(0px)",
            }
      }
      whileInView={visibleState}
      viewport={{ once: true, margin: "-8%" }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.95,
        delay: prefersReducedMotion ? 0 : delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      style={{ width: fullWidth ? "100%" : "auto" }}
    >
      {children}
    </motion.div>
  );
}
