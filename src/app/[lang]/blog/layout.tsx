import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { getDictionary, Locale } from "@/dictionaries";

export default async function BlogLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);

  return (
    <>
      <Header lang={lang} dict={dict.common} />
      {children}
      <Footer dict={dict.common} lang={lang} />
    </>
  );
}
