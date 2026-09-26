"use client";

import { createAdminUser, updateAdminUser } from "@/app/actions/users";
import { AdminRole, PERMISSION_LABELS, PERMISSIONS, ROLE_PRESETS } from "@/lib/permissions";
import { Check, KeyRound, LoaderCircle, Pencil, Plus, ShieldCheck, UserCheck, UserX, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  active: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

const EMPTY = { name: "", email: "", password: "", role: "editor" as AdminRole, permissions: [...ROLE_PRESETS.editor.permissions] as string[], active: true };

export default function UsersManager({ users, currentUserId, currentUserRole }: { users: UserRow[]; currentUserId: string; currentUserRole: string }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();
  const selected = useMemo(() => users.find((user) => user.id === selectedId), [selectedId, users]);

  function startCreate() {
    setSelectedId(null); setForm(EMPTY); setError(""); setSuccess("");
  }
  function startEdit(user: UserRow) {
    setSelectedId(user.id);
    setForm({ name: user.name, email: user.email, password: "", role: user.role as AdminRole, permissions: [...user.permissions], active: user.active });
    setError(""); setSuccess("");
  }
  function chooseRole(role: AdminRole) {
    setForm((current) => ({ ...current, role, permissions: [...ROLE_PRESETS[role].permissions] }));
  }
  function togglePermission(permission: string) {
    setForm((current) => ({ ...current, permissions: current.permissions.includes(permission) ? current.permissions.filter((item) => item !== permission) : [...current.permissions, permission] }));
  }
  function submit(event: React.FormEvent) {
    event.preventDefault(); setError(""); setSuccess("");
    startTransition(async () => {
      try {
        if (selectedId) await updateAdminUser(selectedId, form);
        else await createAdminUser(form);
        setSuccess(selectedId ? "تغییرات دسترسی ذخیره شد." : "کاربر جدید با موفقیت ایجاد شد.");
        if (!selectedId) setForm(EMPTY);
        router.refresh();
      } catch (caught) { setError(caught instanceof Error ? caught.message : "ذخیره کاربر انجام نشد."); }
    });
  }

  return (
    <div className="users-page">
      <header className="admin-page-header">
        <div><p className="page-context">امنیت و همکاری تیمی</p><h1>کاربران و دسترسی‌ها</h1><p>برای هر عضو حساب مستقل بسازید و دقیقاً مشخص کنید چه کارهایی اجازه دارد انجام دهد.</p></div>
        <button type="button" className="admin-button compact" onClick={startCreate}><Plus size={18} /> کاربر جدید</button>
      </header>

      <div className="users-workspace">
        <section className="users-list-card">
          <div className="users-list-heading"><div><ShieldCheck size={19} /><strong>{users.length.toLocaleString("fa-IR")} کاربر</strong></div><span>هر تغییر در تاریخچه فعالیت ثبت می‌شود</span></div>
          <div className="users-list">
            {users.map((user) => (
              <button type="button" key={user.id} className={`user-row-card ${selectedId === user.id ? "selected" : ""}`} onClick={() => startEdit(user)}>
                <span className={`user-avatar ${user.active ? "" : "inactive"}`}>{user.name.slice(0, 1)}</span>
                <span className="user-row-copy"><strong>{user.name}{user.id === currentUserId ? <small> شما</small> : null}</strong><small>{user.email}</small></span>
                <span className="user-role-badge">{ROLE_PRESETS[user.role as AdminRole]?.label ?? user.role}</span>
                <span className={`user-state ${user.active ? "active" : "inactive"}`}>{user.active ? <UserCheck size={15} /> : <UserX size={15} />}{user.active ? "فعال" : "غیرفعال"}</span>
                <Pencil size={16} className="user-edit-icon" />
              </button>
            ))}
          </div>
        </section>

        <form className="user-editor-card" onSubmit={submit}>
          <div className="user-editor-heading"><div><KeyRound size={19} /><span><strong>{selected ? `ویرایش ${selected.name}` : "ساخت حساب جدید"}</strong><small>{selected ? "نقش، دسترسی و وضعیت حساب را تنظیم کنید" : "مشخصات ورود و سطح دسترسی را وارد کنید"}</small></span></div>{selected ? <button type="button" className="table-icon-button" onClick={startCreate}><X size={17} /></button> : null}</div>

          <div className="user-form-grid">
            <label className="form-field"><span>نام و نام خانوادگی</span><input className="admin-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
            <label className="form-field"><span>ایمیل ورود</span><input className="admin-input" dir="ltr" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>
            <label className="form-field user-password-field"><span>{selected ? "رمز عبور جدید (اختیاری)" : "رمز عبور"}</span><input className="admin-input" dir="ltr" type="password" autoComplete="new-password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!selected} placeholder="حداقل ۸ نویسه" /></label>
          </div>

          <div className="user-form-section"><div className="user-form-section-title"><strong>نقش پیشنهادی</strong><span>با انتخاب نقش، دسترسی‌های مناسب به‌صورت خودکار تنظیم می‌شوند.</span></div><div className="role-choice-grid">
            {(Object.keys(ROLE_PRESETS) as AdminRole[]).filter((role) => role !== "owner" || currentUserRole === "owner").map((role) => <button type="button" key={role} className={`role-choice ${form.role === role ? "active" : ""}`} onClick={() => chooseRole(role)}><span>{form.role === role ? <Check size={15} /> : null}</span><strong>{ROLE_PRESETS[role].label}</strong><small>{ROLE_PRESETS[role].description}</small></button>)}
          </div></div>

          <div className="user-form-section"><div className="user-form-section-title"><strong>دسترسی‌های دقیق</strong><span>می‌توانید دسترسی‌های نقش انتخاب‌شده را شخصی‌سازی کنید.</span></div><div className="permission-grid">
            {PERMISSIONS.map((permission) => <label key={permission} className="permission-check"><input type="checkbox" checked={form.permissions.includes(permission)} onChange={() => togglePermission(permission)} /><span><Check size={13} /></span><strong>{PERMISSION_LABELS[permission]}</strong></label>)}
          </div></div>

          <label className="account-active-check"><input type="checkbox" checked={form.active} disabled={selectedId === currentUserId} onChange={(e) => setForm({ ...form, active: e.target.checked })} /><span className="toggle-control" /><span><strong>حساب فعال باشد</strong><small>کاربر غیرفعال نمی‌تواند وارد پنل شود.</small></span></label>
          {error ? <div className="editor-error" role="alert">{error}</div> : null}
          {success ? <div className="editor-success"><Check size={16} />{success}</div> : null}
          <button className="admin-button user-save-button" type="submit" disabled={isPending}>{isPending ? <LoaderCircle className="spin" size={18} /> : <ShieldCheck size={18} />}{selected ? "ذخیره تغییرات دسترسی" : "ایجاد حساب کاربری"}</button>
        </form>
      </div>
    </div>
  );
}
