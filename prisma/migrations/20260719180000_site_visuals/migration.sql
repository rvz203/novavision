CREATE TABLE "SiteVisual" (
    "id" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL DEFAULT '',
    "altEn" TEXT NOT NULL DEFAULT '',
    "altFa" TEXT NOT NULL DEFAULT '',
    "altAr" TEXT NOT NULL DEFAULT '',
    "captionEn" TEXT NOT NULL DEFAULT '',
    "captionFa" TEXT NOT NULL DEFAULT '',
    "captionAr" TEXT NOT NULL DEFAULT '',
    "motion" TEXT NOT NULL DEFAULT 'reveal',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteVisual_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SiteVisual_section_active_sortOrder_idx" ON "SiteVisual"("section", "active", "sortOrder");

INSERT INTO "SiteVisual" (
    "id", "section", "imageUrl", "altEn", "altFa", "altAr",
    "captionEn", "captionFa", "captionAr", "motion", "sortOrder", "source"
) VALUES
    ('f74da9e9-0e02-4b77-9ee4-2718180c4591', 'home.board', '/images/novavision/trade-port-v2.webp', 'Container port glowing at blue hour', 'بندر کانتینری در ساعت آبی', 'ميناء حاويات متوهج في الساعة الزرقاء', 'Global gateways', 'دروازه‌های جهانی', 'بوابات عالمية', 'drift', 0, 'Higgsfield'),
    ('3e38ad95-7716-432d-8d77-a0a284153339', 'home.board', '/images/novavision/cargo-ship-v2.webp', 'Cargo vessel crossing calm open water', 'کشتی باری در آب‌های آرام', 'سفينة شحن تعبر المياه الهادئة', 'Trade in motion', 'تجارت در حرکت', 'التجارة في حركة', 'float', 1, 'Higgsfield'),
    ('efb5ade8-eedb-4aad-886e-1408ef3575ee', 'home.board', '/images/novavision/container-geometry.webp', 'Geometric stacks of shipping containers and cranes', 'چیدمان هندسی کانتینرها و جرثقیل‌ها', 'تكوين هندسي للحاويات والرافعات', 'Built for scale', 'ساخته‌شده برای مقیاس', 'مصمم للتوسع', 'reveal', 2, 'Higgsfield'),
    ('b833dbbb-b636-455c-a889-1d04f99360f2', 'home.board', '/images/novavision/ocean-data-network.webp', 'Luminous global trade data network', 'شبکه درخشان داده‌های تجارت جهانی', 'شبكة مضيئة لبيانات التجارة العالمية', 'Connected intelligence', 'هوشمندی متصل', 'ذكاء متصل', 'zoom', 3, 'Higgsfield'),
    ('b7901008-f859-4ee3-9ad9-ec48520b4ed3', 'home.board', '/images/novavision/container-geometry-v2.webp', 'Blue cargo container under a crane shadow', 'کانتینر آبی زیر سایه جرثقیل', 'حاوية زرقاء تحت ظل رافعة', 'Precision in every layer', 'دقت در هر لایه', 'الدقة في كل طبقة', 'float', 4, 'Higgsfield'),
    ('3b8a7d8f-09a8-4b99-9b28-c75f6d23f92a', 'about.feature', '/images/novavision/about-harbor-v2.webp', 'Modern conference room overlooking a working harbor', 'اتاق جلسه مدرن با نمای بندر فعال', 'غرفة اجتماعات حديثة تطل على ميناء نشط', 'A wider view of every decision', 'نگاهی گسترده‌تر به هر تصمیم', 'رؤية أوسع لكل قرار', 'drift', 0, 'Higgsfield'),
    ('7c5d829e-ea44-4fa0-a1d2-274ce8059b27', 'insights.hero', '/images/novavision/insights-network-v2.webp', 'Glowing world map connected by trade routes', 'نقشه درخشان جهان با مسیرهای تجاری متصل', 'خريطة عالمية مضيئة تربطها مسارات التجارة', 'Signals across moving markets', 'سیگنال‌ها در بازارهای پویا', 'إشارات عبر الأسواق المتحركة', 'zoom', 0, 'Higgsfield');
