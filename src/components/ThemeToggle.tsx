"use client";

import { useTheme } from "@/components/ThemeProvider";
import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import styles from "./ThemeToggle.module.css";

export default function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  if (!mounted) {
    return <div className={styles.placeholder}></div>;
  }

  const currentTheme = theme === "system" ? systemTheme : theme;

  return (
    <button
      className={styles.toggle}
      onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
      aria-label="Toggle Theme"
    >
      {currentTheme === "dark" ? (
        <Sun className={styles.icon} size={20} />
      ) : (
        <Moon className={styles.icon} size={20} />
      )}
    </button>
  );
}
