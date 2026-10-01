"use client";

import { login } from "@/app/actions/auth";
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useState, useTransition } from "react";
import BrandLogo from "@/components/BrandLogo";

export default function AdminLogin() {
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailReady, setEmailReady] = useState(false);
  const [passwordReady, setPasswordReady] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      try { await login(formData); }
      catch (caught) { setError(caught instanceof Error ? caught.message : "ورود انجام نشد."); }
    });
  }

  return (
    <main className="admin-login-screen">
      <section className="login-visual" aria-hidden="true">
        <div className="login-brand"><BrandLogo className="admin-brand-logo"><span className="brand-mark">N</span></BrandLogo><span>NovaVison</span></div>
        <div className="login-copy"><h1>محتوای بهتر،<br />همکاری شفاف‌تر.</h1><p>فضای یکپارچه مدیریت وب‌سایت، وبلاگ چندزبانه و تیم NovaVison</p></div>
        <div className="login-pattern" />
      </section>
      <section className="login-form-wrap">
        <div className="admin-card">
          <div className="login-icon"><LockKeyhole size={24} /></div>
          <h2>ورود به پنل مدیریت</h2>
          <p>با حساب شخصی خود وارد شوید تا فعالیت‌ها با نام شما ثبت شوند.</p>
          <form onSubmit={handleSubmit} className="admin-form" autoComplete="off">
            <label className="field-label" htmlFor="email">ایمیل</label>
            <div className="password-field"><input id="email" type="email" name="adminEmail" placeholder="name@example.com" className="admin-input" dir="ltr" autoComplete="off" readOnly={!emailReady} onFocus={() => setEmailReady(true)} required /><Mail size={18} className="login-field-icon" /></div>
            <label className="field-label" htmlFor="password">رمز عبور</label>
            <div className="password-field">
              <input id="password" type={showPassword ? "text" : "password"} name="adminPassword" placeholder="رمز عبور" className="admin-input" autoComplete="new-password" readOnly={!passwordReady} onFocus={() => setPasswordReady(true)} required />
              <button className="icon-button password-toggle" type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "پنهان کردن رمز" : "نمایش رمز"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
            {error ? <p className="admin-error" role="alert">{error}</p> : null}
            <button type="submit" className="admin-button" disabled={isPending}><span>{isPending ? "در حال ورود…" : "ورود به مدیریت"}</span><ArrowLeft size={18} /></button>
          </form>
        </div>
      </section>
    </main>
  );
}
