import Link from "next/link";
import styles from "./Button.module.css";
import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  fullWidth?: boolean;
  href?: string;
}

export default function Button({
  children,
  variant = "primary",
  fullWidth = false,
  href,
  className,
  ...props
}: ButtonProps) {
  const baseClasses = `${styles.button} ${styles[variant]} ${
    fullWidth ? styles.fullWidth : ""
  } ${className || ""}`;

  if (href) {
    return (
      <Link href={href} className={baseClasses}>
        {children}
      </Link>
    );
  }

  return (
    <button className={baseClasses} {...props}>
      {children}
    </button>
  );
}
