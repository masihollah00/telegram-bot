
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Product = {
  id: string | number;
  name: string;
  slug?: string;
  sku?: string;
  image?: string | null;
  public_price?: number | string;
  availability?: string;
  short_description?: string;
  brand?: { name?: string } | null;
  category?: { name?: string } | null;
  minimum_order_quantity?: number;
};

type Category = {
  id: string | number;
  name: string;
  slug: string;
  description?: string;
};

type Brand = {
  id: string | number;
  name: string;
  slug: string;
  logo?: string;
};

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://jalali-cosmetics-api.onrender.com/api/store"
).replace(/\/+$/, "");

function getItems<T>(data: unknown): T[] {
  if (Array.isArray(data)) {
    return data as T[];
  }

  if (
    data &&
    typeof data === "object" &&
    "results" in data &&
    Array.isArray((data as { results: unknown }).results)
  ) {
    return (data as { results: T[] }).results;
  }

  return [];
}

async function requestItems<T>(
  endpoint: string,
  signal: AbortSignal
): Promise<T[]> {
  const response = await fetch(`${API_BASE}/${endpoint}/`, {
    method: "GET",
    cache: "no-store",
    signal,
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `دریافت اطلاعات بخش ${endpoint} ناموفق بود.`
    );
  }

  const data: unknown = await response.json();

  return getItems<T>(data);
}

function mediaUrl(path?: string | null) {
  if (!path) return "";

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  try {
    return new URL(
      path,
      new URL(API_BASE).origin
    ).toString();
  } catch {
    return path;
  }
}

function priceText(value?: number | string) {
  const amount = Number(value || 0);

  if (!Number.isFinite(amount) || amount <= 0) {
    return "استعلام قیمت";
  }

  return (
    new Intl.NumberFormat("fa-IR").format(amount) +
    " تومان"
  );
}

function ProductCard({
  product,
}: {
  product: Product;
}) {
  const identifier = product.slug || product.id;
  const productLink = `/products/${encodeURIComponent(
    String(identifier)
  )}`;

  const image = mediaUrl(product.image);
  const available = product.availability === "in_stock";

  return (
    <article className="product-card">
      <Link
        href={productLink}
        className="product-image"
        aria-label={`مشاهده ${product.name}`}
      >
        {image ? (
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="image-placeholder">
            <span>J</span>
            <small>JALALI COSMETICS</small>
          </div>
        )}

        <span className="image-tag">
          JALALI SELECTION
        </span>
      </Link>

      <div className="product-content">
        <div className="product-meta">
          <span>
            {product.brand?.name || "پخش جلالی"}
          </span>

          <span
            className={
              available ? "stock in" : "stock out"
            }
          >
            {available ? "موجود" : "ناموجود"}
          </span>
        </div>

        <h3>
          <Link href={productLink}>
            {product.name}
          </Link>
        </h3>

        <p className="product-description">
          {product.short_description ||
            "مشاهده مشخصات و اطلاعات محصول"}
        </p>

        <div className="product-bottom">
          <strong>
            {priceText(product.public_price)}
          </strong>

          <span>
            حداقل سفارش:{" "}
            {Number(
              product.minimum_order_quantity || 1
            ).toLocaleString("fa-IR")}
          </span>
        </div>

        <Link
          className="product-link"
          href={productLink}
        >
          مشاهده جزئیات
          <span>←</span>
        </Link>
      </div>
    </article>
  );
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  const [loading, setLoading] = useState(true);

  const [apiError, setApiError] = useState(false);
  const [categoryApiError, setCategoryApiError] =
    useState(false);
  const [brandApiError, setBrandApiError] =
    useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadHome() {
      setLoading(true);

      setApiError(false);
      setCategoryApiError(false);
      setBrandApiError(false);

      const results = await Promise.allSettled([
        requestItems<Product>("featured", controller.signal),
        requestItems<Category>("categories", controller.signal),
        requestItems<Brand>("brands", controller.signal),
      ]);

      if (controller.signal.aborted) {
        return;
      }

      const [featuredResult, categoryResult, brandResult] =
        results;

      if (featuredResult.status === "fulfilled") {
        setProducts(featuredResult.value.slice(0, 8));
      } else {
        setProducts([]);
        setApiError(true);
      }

      if (categoryResult.status === "fulfilled") {
        setCategories(categoryResult.value.slice(0, 8));
      } else {
        setCategories([]);
        setCategoryApiError(true);
      }

      if (brandResult.status === "fulfilled") {
        setBrands(brandResult.value.slice(0, 10));
      } else {
        setBrands([]);
        setBrandApiError(true);
      }

      setLoading(false);
    }

    loadHome().catch(() => {
      if (!controller.signal.aborted) {
        setApiError(true);
        setCategoryApiError(true);
        setBrandApiError(true);
        setProducts([]);
        setCategories([]);
        setBrands([]);
        setLoading(false);
      }
    });

    return () => controller.abort();
  }, []);

  return (
    <main className="home-page" dir="rtl">
      <div className="announcement">
        <span>JALALI COSMETICS</span>
        <span className="announcement-divider">✦</span>
        <span>
          تجربه‌ای حرفه‌ای در تأمین عمده محصولات آرایشی و بهداشتی
        </span>
      </div>

      <header className="site-header">
        <Link href="/" className="brand">
          <span className="brand-symbol">J</span>

          <span className="brand-copy">
            <strong>JALALI COSMETICS</strong>
            <small>BEAUTY. BUSINESS. TRUST.</small>
          </span>
        </Link>

        <nav className="main-nav">
          <Link href="/">صفحه اصلی</Link>
          <Link href="/products">محصولات</Link>
          <Link href="/categories">دسته‌بندی‌ها</Link>
          <Link href="/brands">برندها</Link>
          <Link href="/about">درباره ما</Link>
          <Link href="/contact">تماس با ما</Link>
        </nav>

        <div className="header-actions">
          <Link href="/account" className="account-link">
            حساب کاربری
          </Link>

          <Link href="/partner" className="partner-link">
            همکاری تجاری
            <span>←</span>
          </Link>
        </div>
      </header>

      <section className="hero">
        <div className="hero-background-mark">J</div>

        <div className="hero-content">
          <span className="hero-eyebrow">
            WHOLESALE BEAUTY & PERSONAL CARE
          </span>

          <div className="hero-line" />

          <h1>
            زیبایی،
            <br />
            آغاز یک <em>تجارت ماندگار</em>
          </h1>

          <p>
            پخش جلالی؛ بستری حرفه‌ای برای مشاهده محصولات،
            بررسی اطلاعات کالا و آغاز همکاری تجاری در حوزه
            محصولات آرایشی و بهداشتی.
          </p>

          <div className="hero-actions">
            <Link
              href="/products"
              className="hero-primary"
            >
              مشاهده کاتالوگ محصولات
              <span>←</span>
            </Link>

            <Link
              href="/partner"
              className="hero-secondary"
            >
              درخواست همکاری
            </Link>
          </div>

          <div className="hero-caption">
            <span>01</span>
            <span className="caption-line" />
            <span>JALALI COSMETICS · IRAN</span>
          </div>
        </div>

        <div className="hero-visual">
          <div className="visual-frame">
            <div className="visual-circle circle-one" />
            <div className="visual-circle circle-two" />

            <div className="visual-monogram">
              <span>J</span>
              <small>JALALI</small>
            </div>

            <div className="visual-side-label">
              BEAUTY
              <br />
              BUSINESS
              <br />
              TRUST
            </div>

            <div className="visual-bottom-label">
              EST. JALALI COSMETICS
            </div>
          </div>

          <div className="visual-index">
            JC / 001
          </div>
        </div>

        <div className="hero-bottom">
          <span>PROFESSIONAL WHOLESALE EXPERIENCE</span>
          <span>01 — 04</span>
        </div>
      </section>

      <section className="value-strip">
        <div>
          <span className="value-number">01</span>
          <div>
            <strong>کاتالوگ محصولات</strong>
            <small>مشاهده و بررسی اطلاعات کالاها</small>
          </div>
        </div>

        <div>
          <span className="value-number">02</span>
          <div>
            <strong>همکاری تجاری</strong>
            <small>مسیر اختصاصی مشتریان عمده</small>
          </div>
        </div>

        <div>
          <span className="value-number">03</span>
          <div>
            <strong>اطلاعات شفاف</strong>
            <small>مشخصات و وضعیت محصولات</small>
          </div>
        </div>

        <div>
          <span className="value-number">04</span>
          <div>
            <strong>ارتباط مستقیم</strong>
            <small>دسترسی به بخش پشتیبانی</small>
          </div>
        </div>
      </section>

      <section className="categories-section">
        <div className="section-top">
          <div>
            <span className="section-eyebrow">
              EXPLORE COLLECTIONS
            </span>

            <h2>دسته‌بندی محصولات</h2>

            <p>
              مجموعه محصولات را بر اساس گروه کالایی بررسی کنید.
            </p>
          </div>

          <Link
            href="/categories"
            className="section-link"
          >
            همه دسته‌بندی‌ها
            <span>←</span>
          </Link>
        </div>

        {loading ? (
          <div className="category-loading">
            <span />
            <span />
            <span />
            <span />
          </div>
        ) : categories.length > 0 ? (
          <div className="category-grid">
            {categories.map((category, index) => (
              <Link
                href={`/categories/${encodeURIComponent(
                  category.slug
                )}`}
                className="category-card"
                key={category.id}
              >
                <span className="category-index">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <span className="category-symbol">
                  {[
                    "✧",
                    "◈",
                    "◇",
                    "✦",
                    "❖",
                    "◉",
                    "✳",
                    "⌑",
                  ][index]}
                </span>

                <strong>{category.name}</strong>

                <small>
                  {category.description ||
                    "مشاهده محصولات این دسته"}
                </small>

                <span className="category-arrow">←</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="section-empty">
            <span>✧</span>

            <p>
              {categoryApiError
                ? "دریافت دسته‌بندی‌ها در حال حاضر ممکن نیست. لطفاً بعداً دوباره مراجعه کنید."
                : "دسته‌بندی‌ها پس از ثبت اطلاعات در سامانه اینجا نمایش داده می‌شوند."}
            </p>

            <Link href="/categories">
              مشاهده صفحه دسته‌بندی‌ها
            </Link>
          </div>
        )}
      </section>

      <section className="featured-section">
        <div className="section-top">
          <div>
            <span className="section-eyebrow">
              SELECTED PRODUCTS
            </span>

            <h2>محصولات منتخب</h2>

            <p>
              محصولات منتخب ثبت‌شده در سامانه فروشگاه.
            </p>
          </div>

          <Link
            href="/products"
            className="section-link"
          >
            مشاهده تمام محصولات
            <span>←</span>
          </Link>
        </div>

        {loading ? (
          <div className="products-grid">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                className="product-skeleton"
                key={index}
              >
                <div />
                <span />
                <span />
                <span />
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="products-grid">
            {products.map((product) => (
              <ProductCard
                product={product}
                key={product.id}
              />
            ))}
          </div>
        ) : (
          <div className="section-empty">
            <span>◇</span>

            <p>
              {apiError
                ? "در حال حاضر دریافت اطلاعات محصولات امکان‌پذیر نیست."
                : "هنوز محصول منتخبی در سامانه ثبت نشده است."}
            </p>

            <Link href="/products">
              رفتن به کاتالوگ محصولات
            </Link>
          </div>
        )}
      </section>

      <section className="business-section">
        <div className="business-decoration">JC</div>

        <div className="business-content">
          <span className="section-eyebrow">
            BUSINESS PARTNERSHIP
          </span>

          <h2>
            یک همکاری حرفه‌ای
            <br />
            <em>از یک انتخاب مطمئن آغاز می‌شود.</em>
          </h2>

          <p>
            برای آشنایی با شرایط همکاری عمده و ثبت درخواست
            همکاری تجاری، وارد بخش اختصاصی همکاران شوید.
            بررسی و تأیید درخواست‌ها توسط مدیریت انجام می‌شود.
          </p>

          <Link
            href="/partner"
            className="business-button"
          >
            آشنایی با شرایط همکاری
            <span>←</span>
          </Link>
        </div>

        <div className="business-stamp">
          <span>J</span>
          <small>JALALI COSMETICS</small>
          <small>BUSINESS PARTNERS</small>
        </div>
      </section>

      <section className="brands-section">
        <div className="section-top">
          <div>
            <span className="section-eyebrow">
              OUR BRANDS
            </span>

            <h2>برندهای مجموعه</h2>

            <p>
              برندهای ثبت‌شده در کاتالوگ پخش جلالی.
            </p>
          </div>

          <Link
            href="/brands"
            className="section-link"
          >
            مشاهده همه برندها
            <span>←</span>
          </Link>
        </div>

        {loading ? (
          <div className="brand-loading">
            <span />
            <span />
            <span />
            <span />
          </div>
        ) : brands.length > 0 ? (
          <div className="brands-grid">
            {brands.map((brand) => (
              <Link
                href={`/brands/${encodeURIComponent(
                  brand.slug
                )}`}
                className="brand-card"
                key={brand.id}
              >
                {brand.logo ? (
                  <img
                    src={mediaUrl(brand.logo)}
                    alt={brand.name}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <span className="brand-initial">
                    {brand.name.slice(0, 1)}
                  </span>
                )}

                <strong>{brand.name}</strong>

                <small>مشاهده محصولات برند</small>
              </Link>
            ))}
          </div>
        ) : (
          <div className="brand-empty">
            {brandApiError
              ? "دریافت فهرست برندها در حال حاضر ممکن نیست."
              : "برندهای ثبت‌شده در سامانه در این بخش نمایش داده می‌شوند."}
          </div>
        )}
      </section>

      <section className="contact-banner">
        <div>
          <span className="section-eyebrow">
            LET'S CONNECT
          </span>

          <h2>برای شروع همکاری آماده‌اید؟</h2>

          <p>
            برای دریافت اطلاعات بیشتر و ارتباط با مجموعه،
            از مسیرهای ارتباطی فروشگاه استفاده کنید.
          </p>
        </div>

        <div className="contact-actions">
          <Link href="/contact">
            ارتباط با مجموعه ←
          </Link>

          <Link href="/faq">
            سؤالات متداول
          </Link>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-main">
          <div className="footer-brand">
            <Link href="/" className="brand">
              <span className="brand-symbol">J</span>

              <span className="brand-copy">
                <strong>JALALI COSMETICS</strong>
                <small>BEAUTY. BUSINESS. TRUST.</small>
              </span>
            </Link>

            <p>
              پخش جلالی؛ تجربه‌ای حرفه‌ای در معرفی و تأمین
              محصولات آرایشی و بهداشتی.
            </p>
          </div>

          <div className="footer-column">
            <strong>دسترسی سریع</strong>
            <Link href="/products">محصولات</Link>
            <Link href="/categories">دسته‌بندی‌ها</Link>
            <Link href="/brands">برندها</Link>
            <Link href="/about">درباره ما</Link>
          </div>

          <div className="footer-column">
            <strong>خدمات مشتریان</strong>
            <Link href="/partner">همکاری تجاری</Link>
            <Link href="/account">حساب کاربری</Link>
            <Link href="/tracking">پیگیری سفارش</Link>
            <Link href="/faq">سؤالات متداول</Link>
          </div>

          <div className="footer-column">
            <strong>ارتباط</strong>
            <Link href="/contact">تماس با ما</Link>
            <Link href="/about">درباره مجموعه</Link>
            <Link href="/quick-order">
              درخواست خرید عمده
            </Link>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© JALALI COSMETICS</span>
          <span>BEAUTY. BUSINESS. TRUST.</span>
          <span>تمام حقوق محفوظ است.</span>
        </div>
      </footer>
    </main>
  );
}
