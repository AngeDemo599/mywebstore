import { Prisma, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ── Admin user ──
  const hashedPassword = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@mywebstore.com" },
    update: {},
    create: {
      email: "admin@mywebstore.com",
      password: hashedPassword,
      role: "ADMIN",
      plan: "PRO",
    },
  });

  console.log("Admin user created:", admin.email);

  // ── Demo user + store + products ──
  const demoHashedPassword = await bcrypt.hash("Demo123456", 10);

  const demoUser = await prisma.user.upsert({
    where: { email: "demo@souqmaker.com" },
    update: {
      password: demoHashedPassword,
      plan: "PRO",
      planExpiresAt: new Date("2030-12-31T23:59:59.000Z"),
      emailVerified: new Date(),
    },
    create: {
      email: "demo@souqmaker.com",
      password: demoHashedPassword,
      role: "USER",
      plan: "PRO",
      planExpiresAt: new Date("2030-12-31T23:59:59.000Z"),
      emailVerified: new Date(),
    },
  });

  console.log("Demo user created:", demoUser.email);

  // Demo store with SouqFlow preset theme
  const demoStore = await prisma.store.upsert({
    where: { slug: "demo" },
    update: {},
    create: {
      name: "بوتيك الأناقة",
      slug: "demo",
      language: "ar",
      logo: null,
      ownerId: demoUser.id,
      theme: {
        _v: 2,
        preset: "souqflow",
        colors: {
          primary: "#059669",
          secondary: "#84cc16",
          background: "#ffffff",
          text: "#111827",
          textMuted: "#6b7280",
          surface: "#f9fafb",
          border: "#e5e7eb",
          accent: "#10b981",
        },
        buttons: { style: "gradient", radius: "lg", shadow: "md", uppercase: false },
        form: { inputStyle: "default", inputRadius: "lg", summaryStyle: "card" },
        layout: { cardStyle: "glass", imageAspect: "video", coverStyle: "gradient", headerStyle: "centered", productGrid: 3 },
        typography: { font: "cairo", headingWeight: "700", bodySize: "base" },
      },
    },
  });

  console.log("Demo store created:", demoStore.slug);

  // Demo products
  const demoProducts = [
    {
      title: "ساعة ذكية رياضية",
      description: "ساعة ذكية رياضية متعددة الوظائف مع شاشة AMOLED عالية الدقة، مقاومة للماء، مراقبة نبضات القلب والنوم. مثالية للرياضيين والمهتمين بصحتهم.",
      price: 8500,
      category: "إلكترونيات",
      slug: "demo-1",
      shippingFee: null,
      images: [
        "https://picsum.photos/seed/smartwatch1/800/600",
        "https://picsum.photos/seed/smartwatch2/800/600",
        "https://picsum.photos/seed/smartwatch3/800/600",
      ],
      variations: [
        {
          name: "اللون",
          type: "text",
          options: [
            { value: "أسود", priceAdjustment: 0 },
            { value: "فضي", priceAdjustment: 0 },
            { value: "ذهبي", priceAdjustment: 0 },
          ],
        },
      ],
      promotions: [
        { type: "percentage_discount", discountPercent: 10, label: "خصم 10%" },
      ],
    },
    {
      title: "حقيبة ظهر جلدية",
      description: "حقيبة ظهر أنيقة من الجلد الطبيعي الفاخر، مساحة واسعة للكمبيوتر المحمول والأغراض الشخصية. تصميم عملي يناسب العمل والسفر.",
      price: 4200,
      category: "حقائب",
      slug: "demo-2",
      shippingFee: null,
      images: [
        "https://picsum.photos/seed/backpack1/800/600",
        "https://picsum.photos/seed/backpack2/800/600",
        "https://picsum.photos/seed/backpack3/800/600",
      ],
      variations: [
        {
          name: "اللون",
          type: "text",
          options: [
            { value: "بني", priceAdjustment: 0 },
            { value: "أسود", priceAdjustment: 0 },
          ],
        },
      ],
      promotions: null,
    },
    {
      title: "سماعات بلوتوث لاسلكية",
      description: "سماعات بلوتوث لاسلكية بجودة صوت عالية وعزل ضوضاء فعّال. بطارية تدوم حتى 8 ساعات مع علبة شحن محمولة.",
      price: 3800,
      category: "إلكترونيات",
      slug: "demo-3",
      shippingFee: null,
      images: [
        "https://picsum.photos/seed/earbuds1/800/600",
        "https://picsum.photos/seed/earbuds2/800/600",
        "https://picsum.photos/seed/earbuds3/800/600",
      ],
      variations: null,
      promotions: [
        { type: "buy_x_discount", buyQuantity: 2, discountPercent: 5, label: "اشترِ 2 واحصل على خصم 5%" },
      ],
    },
    {
      title: "عطر رجالي فاخر",
      description: "عطر رجالي فاخر بتركيبة فرنسية مميزة، مزيج من العود والمسك. رائحة تدوم طويلاً وتضفي أناقة استثنائية.",
      price: 6500,
      category: "جمال",
      slug: "demo-4",
      shippingFee: null,
      images: [
        "https://picsum.photos/seed/perfume1/800/600",
        "https://picsum.photos/seed/perfume2/800/600",
        "https://picsum.photos/seed/perfume3/800/600",
        "https://picsum.photos/seed/perfume4/800/600",
      ],
      variations: [
        {
          name: "الحجم",
          type: "text",
          options: [
            { value: "50ml", priceAdjustment: 0 },
            { value: "100ml", priceAdjustment: 2500 },
          ],
        },
      ],
      promotions: null,
    },
    {
      title: "كريم مرطب طبيعي",
      description: "كريم مرطب بمكونات طبيعية 100%، غني بزبدة الشيا وزيت الأرغان. يغذي البشرة بعمق ويحميها من الجفاف طوال اليوم.",
      price: 1800,
      category: "جمال",
      slug: "demo-5",
      shippingFee: null,
      images: [
        "https://picsum.photos/seed/cream1/800/600",
        "https://picsum.photos/seed/cream2/800/600",
        "https://picsum.photos/seed/cream3/800/600",
      ],
      variations: null,
      promotions: null,
    },
    {
      title: "نظارات شمسية أنيقة",
      description: "نظارات شمسية بتصميم عصري وعدسات مستقطبة UV400 لحماية كاملة من أشعة الشمس. إطار خفيف ومتين يناسب جميع أشكال الوجه.",
      price: 2900,
      category: "إكسسوارات",
      slug: "demo-6",
      shippingFee: null,
      images: [
        "https://picsum.photos/seed/sunglasses1/800/600",
        "https://picsum.photos/seed/sunglasses2/800/600",
        "https://picsum.photos/seed/sunglasses3/800/600",
      ],
      variations: [
        {
          name: "اللون",
          type: "text",
          options: [
            { value: "أسود", priceAdjustment: 0 },
            { value: "بني سلحفاة", priceAdjustment: 0 },
          ],
        },
      ],
      promotions: null,
    },
    {
      title: "حذاء رياضي",
      description: "حذاء رياضي مريح وخفيف الوزن بتقنية امتصاص الصدمات. نعل مرن مناسب للجري والتمارين اليومية. تصميم أنيق يناسب كل الأوقات.",
      price: 7200,
      category: "أحذية",
      slug: "demo-7",
      shippingFee: null,
      images: [
        "https://picsum.photos/seed/shoes1/800/600",
        "https://picsum.photos/seed/shoes2/800/600",
        "https://picsum.photos/seed/shoes3/800/600",
        "https://picsum.photos/seed/shoes4/800/600",
      ],
      variations: [
        {
          name: "المقاس",
          type: "text",
          options: [
            { value: "40", priceAdjustment: 0 },
            { value: "41", priceAdjustment: 0 },
            { value: "42", priceAdjustment: 0 },
            { value: "43", priceAdjustment: 0 },
            { value: "44", priceAdjustment: 0 },
          ],
        },
      ],
      promotions: null,
    },
    {
      title: "شاحن متنقل 20000mAh",
      description: "شاحن متنقل بسعة 20000mAh مع منفذين USB وشحن سريع. يشحن هاتفك حتى 5 مرات كاملة. مثالي للسفر والتنقل اليومي.",
      price: 4500,
      category: "إلكترونيات",
      slug: "demo-8",
      shippingFee: 500,
      images: [
        "https://picsum.photos/seed/charger1/800/600",
        "https://picsum.photos/seed/charger2/800/600",
        "https://picsum.photos/seed/charger3/800/600",
      ],
      variations: null,
      promotions: null,
    },
  ];

  for (const product of demoProducts) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        title: product.title,
        description: product.description,
        price: product.price,
        category: product.category,
        shippingFee: product.shippingFee,
        images: product.images,
        variations: product.variations ?? Prisma.DbNull,
        promotions: product.promotions ?? Prisma.DbNull,
      },
      create: {
        title: product.title,
        description: product.description,
        price: product.price,
        category: product.category,
        slug: product.slug,
        shippingFee: product.shippingFee,
        images: product.images,
        variations: product.variations ?? Prisma.DbNull,
        promotions: product.promotions ?? Prisma.DbNull,
        storeId: demoStore.id,
      },
    });
  }

  console.log(`Demo products created: ${demoProducts.length} products`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
