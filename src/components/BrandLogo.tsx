"use client";

import { createContext, ReactNode, useContext } from "react";

const LogoContext = createContext("");

export function BrandingProvider({ logoUrl, children }: { logoUrl: string; children: ReactNode }) {
  return <LogoContext.Provider value={logoUrl}>{children}</LogoContext.Provider>;
}

export default function BrandLogo({ children, className }: { children: ReactNode; className: string }) {
  const logoUrl = useContext(LogoContext);
  if (!logoUrl) return <>{children}</>;
  // User uploads are served directly from persistent storage, without an image cache.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={logoUrl} alt="NovaVison" className={className} />;
}
