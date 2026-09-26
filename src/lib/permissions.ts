export const PERMISSIONS = [
  "blog.write",
  "blog.publish",
  "blog.delete",
  "pages.write",
  "media.write",
  "emails.manage",
  "users.manage",
  "activity.read",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const PERMISSION_LABELS: Record<Permission, string> = {
  "blog.write": "ایجاد و ویرایش نوشته‌ها",
  "blog.publish": "انتشار نوشته‌ها",
  "blog.delete": "حذف نوشته‌ها",
  "pages.write": "ویرایش محتوای صفحات",
  "media.write": "بارگذاری رسانه",
  "emails.manage": "مدیریت ایمیل‌ها و پیام‌های ورودی",
  "users.manage": "مدیریت کاربران و دسترسی‌ها",
  "activity.read": "مشاهده تاریخچه فعالیت‌ها",
};

export const ROLE_PRESETS = {
  owner: {
    label: "مالک",
    description: "دسترسی کامل به تمام بخش‌ها",
    permissions: [...PERMISSIONS],
  },
  admin: {
    label: "مدیر",
    description: "مدیریت محتوا، کاربران، ایمیل‌ها و گزارش فعالیت",
    permissions: [...PERMISSIONS],
  },
  editor: {
    label: "ویراستار",
    description: "نوشتن، انتشار و مدیریت رسانه",
    permissions: ["blog.write", "blog.publish", "media.write", "emails.manage", "activity.read"],
  },
  translator: {
    label: "مترجم",
    description: "ویرایش ترجمه‌ها و محتوای صفحات بدون انتشار",
    permissions: ["blog.write", "pages.write", "media.write"],
  },
  viewer: {
    label: "مشاهده‌گر",
    description: "فقط مشاهده پنل و نوشته‌ها",
    permissions: [],
  },
} as const;

export type AdminRole = keyof typeof ROLE_PRESETS;

export function normalizePermissions(values: string[]) {
  return Array.from(new Set(values)).filter((value): value is Permission =>
    PERMISSIONS.includes(value as Permission),
  );
}

export function canAccess(permissions: string[], permission: Permission, role?: string) {
  return role === "owner" || permissions.includes(permission);
}
