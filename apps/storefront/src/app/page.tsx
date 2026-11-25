
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
  if (Array.isArray(data)) return data as T[];

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

function mediaUrl(path?: string | null) {
  if (!path) return "";

  if (/^https?:\/\//i.test(path)) return path;

  try {
    return new URL(path, new URL(API_BASE).origin).toString();
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

function ProductCard({ product }: { product: Product }) {
  const identifier = product.slug || product.id;
  const image = mediaUrl(product.image);
  const available = product.availability === "in_stock";

  return (
    <article className="product-card">
      <Link
        href={`/products/${encodeURIComponent(String(identifier))}`}
        className="product-image"
      >
        {image ? (
          <img src={image} alt={product.name} />
        ) : (
          <div className="image-placeholder">
            <span>J</span>
            <small>JALALI COSMETICS</small>
          </div>
        )}

        <span className="image-tag">JALALI SELECTION</span>
      </Link>

      <div className="product-content">
        <div className="product-meta">
          <span>{product.brand?.name || "پخش جلالی"}</span>
          <span className={available ? "stock in" : "stock out"}>
            {available ? "موجود" : "ناموجود"}
          </span>
        </div>

        <h3>
          <Link href={`/products/${encodeURIComponent(String(identifier))}`}>
            {product.name}
          </Link>
        </h3>

        <p className="product-description">
          {product.short_description || "مشاهده مشخصات و اطلاعات محصول"}
        </p>

        <div className="product-bottom">
          <strong>{priceText(product.public_price)}</strong>
          <span>
            حداقل سفارش:{" "}
            {Number(product.minimum_order_quantity || 1).toLocaleString("fa-IR")}
          </span>
        </div>

        <Link
          className="product-link"
          href={`/products/${encodeURIComponent(String(identifier))}`}
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

  useEffect(() => {
    const controller = new AbortController();

    async function loadHome() {
      setLoading(true);
      setApiError(false);

      const requests = [
        fetch(`${API_BASE}/featured/`, {
          cache: "no-store",
          signal: controller.signal,
          headers: { Accept: "application/json" },
        }),
        fetch(`${API_BASE}/categories/`, {
          cache: "no-store",
          signal: controller.signal,
          headers: { Accept: "application/json" },
        }),
        fetch(`${API_BASE}/brands/`, {
          cache: "no-store",
          signal: controller.signal,
          headers: { Accept: "application/json" },
        }),
      ];

      try {
        const responses = await Promise.all(requests);

        if (responses.some((response) => !response.ok)) {
          throw new Error("API response failed");
        }

        const [featuredData, categoryData, brandData] =
          await Promise.all(responses.map((response) => response.json()));

        setProducts(getItems<Product>(featuredData).slice(0, 8));
        setCategories(getItems<Category>(categoryData).slice(0, 8));
        setBrands(getItems<Brand>(brandData).slice(0, 10));
      } catch (error) {
        if (
          error instanceof Error &&
          error.name === "AbortError"
        ) {
          return;
        }

        setApiError(true);
        setProducts([]);
        setCategories([]);
        setBrands([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadHome();

    return () => controller.abort();
  }, []);

  return (
    <main className="home-page" dir="rtl">
      <div className="announcement">
        <span>JALALI COSMETICS</span>
        <span className="announcement-divider">✦</span>
        <span>تجربه‌ای حرفه‌ای در تأمین عمده محصولات آرایشی و بهداشتی</span>
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
            <Link href="/products" className="hero-primary">
              مشاهده کاتالوگ محصولات
              <span>←</span>
            </Link>

            <Link href="/partner" className="hero-secondary">
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

          <div className="visual-index">JC / 001</div>
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
            <span className="section-eyebrow">EXPLORE COLLECTIONS</span>
            <h2>دسته‌بندی محصولات</h2>
            <p>
              مجموعه محصولات را بر اساس گروه کالایی بررسی کنید.
            </p>
          </div>

          <Link href="/categories" className="section-link">
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
                href={`/categories/${encodeURIComponent(category.slug)}`}
                className="category-card"
                key={category.id}
              >
                <span className="category-index">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="category-symbol">
                  {["✧", "◈", "◇", "✦", "❖", "◉", "✳", "⌑"][index]}
                </span>
                <strong>{category.name}</strong>
                <small>
                  {category.description || "مشاهده محصولات این دسته"}
                </small>
                <span className="category-arrow">←</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="section-empty">
            <span>✧</span>
            <p>
              دسته‌بندی‌ها پس از ثبت اطلاعات در سامانه اینجا نمایش داده می‌شوند.
            </p>
            <Link href="/categories">مشاهده صفحه دسته‌بندی‌ها</Link>
          </div>
        )}
      </section>

      <section className="featured-section">
        <div className="section-top">
          <div>
            <span className="section-eyebrow">SELECTED PRODUCTS</span>
            <h2>محصولات منتخب</h2>
            <p>
              محصولات منتخب ثبت‌شده در سامانه فروشگاه.
            </p>
          </div>

          <Link href="/products" className="section-link">
            مشاهده تمام محصولات
            <span>←</span>
          </Link>
        </div>

        {loading ? (
          <div className="products-grid">
            {Array.from({ length: 4 }).map((_, index) => (
              <div className="product-skeleton" key={index}>
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
              <ProductCard product={product} key={product.id} />
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
            <Link href="/products">رفتن به کاتالوگ محصولات</Link>
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

          <Link href="/partner" className="business-button">
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
            <span className="section-eyebrow">OUR BRANDS</span>
            <h2>برندهای مجموعه</h2>
            <p>برندهای ثبت‌شده در کاتالوگ پخش جلالی.</p>
          </div>

          <Link href="/brands" className="section-link">
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
                href={`/brands/${encodeURIComponent(brand.slug)}`}
                className="brand-card"
                key={brand.id}
              >
                {brand.logo ? (
                  <img src={mediaUrl(brand.logo)} alt={brand.name} />
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
            برندهای ثبت‌شده در سامانه در این بخش نمایش داده می‌شوند.
          </div>
        )}
      </section>

      <section className="contact-banner">
        <div>
          <span className="section-eyebrow">LET'S CONNECT</span>
          <h2>برای شروع همکاری آماده‌اید؟</h2>
          <p>
            برای دریافت اطلاعات بیشتر و ارتباط با مجموعه،
            از مسیرهای ارتباطی فروشگاه استفاده کنید.
          </p>
        </div>

        <div className="contact-actions">
          <Link href="/contact">ارتباط با مجموعه ←</Link>
          <Link href="/faq">سؤالات متداول</Link>
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
            <Link href="/quick-order">درخواست خرید عمده</Link>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© JALALI COSMETICS</span>
          <span>BEAUTY. BUSINESS. TRUST.</span>
          <span>تمام حقوق محفوظ است.</span>
        </div>
      </footer>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .home-page {
          min-height: 100vh;
          background: #0b0b0d;
          color: #f5f1ee;
          overflow: hidden;
        }

        a {
          text-decoration: none;
        }

        .announcement {
          min-height: 34px;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 13px;
          padding: 7px 15px;
          background: #171315;
          border-bottom: 1px solid #c99a8625;
          color: #bca69c;
          font-size: 9px;
          letter-spacing: 1px;
          text-align: center;
        }

        .announcement > span:first-child {
          color: #d0a18e;
          letter-spacing: 2px;
          font-weight: 800;
        }

        .announcement-divider {
          color: #c99a86;
        }

        .site-header {
          min-height: 88px;
          padding: 12px 6%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 25px;
          border-bottom: 1px solid #ffffff12;
          background: #0b0b0d;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #f5f1ee;
          flex-shrink: 0;
        }

        .brand-symbol {
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          border: 1px solid #c99a86;
          color: #c99a86;
          font-family: Georgia, serif;
          font-size: 29px;
        }

        .brand-copy strong,
        .brand-copy small {
          display: block;
        }

        .brand-copy strong {
          font-size: 12px;
          letter-spacing: 2px;
        }

        .brand-copy small {
          margin-top: 6px;
          color: #a18e86;
          font-size: 8px;
          letter-spacing: 1.5px;
        }

        .main-nav {
          display: flex;
          align-items: center;
          gap: 22px;
        }

        .main-nav a {
          color: #c1b7b2;
          font-size: 11px;
          transition: color .2s;
          white-space: nowrap;
        }

        .main-nav a:hover {
          color: #c99a86;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .account-link,
        .partner-link {
          padding: 11px 13px;
          font-size: 10px;
          white-space: nowrap;
        }

        .account-link {
          color: #d6c9c2;
          border: 1px solid #ffffff25;
        }

        .partner-link {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #c99a86;
          color: #171113;
          font-weight: 800;
        }

        .hero {
          position: relative;
          min-height: 590px;
          display: grid;
          grid-template-columns: 1.1fr .9fr;
          align-items: center;
          padding: 65px 9% 90px;
          overflow: hidden;
          background:
            radial-gradient(ellipse at 77% 48%, #754b3a25, transparent 38%),
            linear-gradient(110deg, #171315 0%, #0b0b0d 65%);
          border-bottom: 1px solid #c99a8626;
        }

        .hero-background-mark {
          position: absolute;
          right: 41%;
          top: -170px;
          color: #c99a8608;
          font-family: Georgia, serif;
          font-size: 650px;
          pointer-events: none;
        }

        .hero-content {
          position: relative;
          z-index: 2;
          max-width: 630px;
        }

        .hero-eyebrow,
        .section-eyebrow {
          color: #c99a86;
          font-size: 10px;
          letter-spacing: 3px;
          font-weight: 800;
        }

        .hero-line {
          width: 55px;
          height: 1px;
          margin: 25px 0;
          background: #c99a86;
        }

        .hero h1 {
          margin: 0;
          font-size: clamp(40px, 5.5vw, 69px);
          line-height: 1.65;
          font-weight: 900;
          letter-spacing: -2px;
        }

        .hero h1 em,
        .business-content h2 em {
          color: #d0a28f;
          font-style: normal;
        }

        .hero-content > p {
          max-width: 530px;
          margin: 15px 0 28px;
          color: #b4a8a2;
          font-size: 13px;
          line-height: 2.5;
        }

        .hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .hero-primary,
        .hero-secondary {
          min-height: 49px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          padding: 0 20px;
          font-size: 11px;
          font-weight: 800;
        }

        .hero-primary {
          color: #171113;
          background: #c99a86;
        }

        .hero-secondary {
          color: #e2c7bb;
          border: 1px solid #806052;
        }

        .hero-caption {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 65px;
          color: #a18e86;
          font-size: 8px;
          letter-spacing: 2px;
        }

        .hero-caption > span:first-child {
          color: #c99a86;
        }

        .caption-line {
          width: 55px;
          height: 1px;
          background: #74564a;
        }

        .hero-visual {
          position: relative;
          width: min(100%, 410px);
          aspect-ratio: 1;
          margin: auto;
        }

        .visual-frame {
          position: absolute;
          inset: 7%;
          display: grid;
          place-items: center;
          border: 1px solid #c99a8650;
          background: radial-gradient(circle, #57382c28, transparent 65%);
          transform: rotate(45deg);
        }

        .visual-circle {
          position: absolute;
          border: 1px solid #c99a8640;
          border-radius: 50%;
        }

        .circle-one {
          width: 76%;
          height: 76%;
        }

        .circle-two {
          width: 112%;
          height: 112%;
          border-style: dashed;
          opacity: .45;
        }

        .visual-monogram {
          display: flex;
          flex-direction: column;
          align-items: center;
          transform: rotate(-45deg);
        }

        .visual-monogram span {
          color: #d4a48f;
          font-family: Georgia, serif;
          font-size: 155px;
          line-height: 1;
          text-shadow: 0 0 65px #c99a8640;
        }

        .visual-monogram small {
          margin-top: 10px;
          color: #d0a28f;
          font-size: 10px;
          letter-spacing: 5px;
        }

        .visual-side-label {
          position: absolute;
          left: -80px;
          bottom: 45px;
          color: #a98778;
          font-size: 8px;
          line-height: 2.2;
          letter-spacing: 2px;
          transform: rotate(-45deg);
        }

        .visual-bottom-label {
          position: absolute;
          right: -100px;
          top: 45px;
          color: #a98778;
          font-size: 8px;
          letter-spacing: 2px;
          transform: rotate(-45deg);
        }

        .visual-index {
          position: absolute;
          left: -15px;
          bottom: 5px;
          color: #9a8075;
          font-size: 9px;
          letter-spacing: 3px;
        }

        .hero-bottom {
          position: absolute;
          bottom: 0;
          left: 9%;
          right: 9%;
          min-height: 43px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid #ffffff17;
          color: #897c76;
          font-size: 8px;
          letter-spacing: 2px;
        }

        .value-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          padding: 28px 7%;
          background: #121214;
          border-bottom: 1px solid #ffffff12;
        }

        .value-strip > div {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 13px;
          padding: 8px;
          border-left: 1px solid #ffffff12;
        }

        .value-strip > div:last-child {
          border-left: 0;
        }

        .value-number {
          color: #c99a86;
          font-family: Georgia, serif;
          font-size: 23px;
        }

        .value-strip strong,
        .value-strip small {
          display: block;
        }

        .value-strip strong {
          font-size: 11px;
        }

        .value-strip small {
          margin-top: 7px;
          color: #948985;
          font-size: 9px;
        }

        .categories-section,
        .featured-section,
        .brands-section {
          max-width: 1320px;
          margin: auto;
          padding: 85px 6%;
        }

        .section-top {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 25px;
          margin-bottom: 30px;
        }

        .section-top h2 {
          margin: 12px 0 8px;
          font-size: 28px;
        }

        .section-top p {
          margin: 0;
          color: #a79b96;
          font-size: 11px;
          line-height: 2;
        }

        .section-link {
          display: flex;
          align-items: center;
          gap: 15px;
          padding-bottom: 8px;
          color: #d2a28e;
          border-bottom: 1px solid #77594d;
          font-size: 10px;
          white-space: nowrap;
        }

        .category-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }

        .category-card {
          position: relative;
          min-height: 205px;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 23px;
          overflow: hidden;
          border: 1px solid #40302c;
          background:
            radial-gradient(circle at 80% 20%, #c99a861a, transparent 45%),
            #151416;
          color: #f5f1ee;
          transition: border-color .2s, transform .2s;
        }

        .category-card:hover {
          border-color: #c99a86;
          transform: translateY(-4px);
        }

        .category-index {
          position: absolute;
          top: 17px;
          left: 18px;
          color: #80665c;
          font-size: 9px;
          letter-spacing: 2px;
        }

        .category-symbol {
          margin-bottom: 16px;
          color: #c99a86;
          font-size: 34px;
        }

        .category-card strong {
          font-size: 15px;
        }

        .category-card small {
          margin-top: 9px;
          color: #9d918b;
          font-size: 9px;
          line-height: 2;
        }

        .category-arrow {
          position: absolute;
          bottom: 22px;
          left: 22px;
          color: #c99a86;
          font-size: 18px;
        }

        .category-loading,
        .brand-loading {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }

        .category-loading span {
          height: 205px;
          background: linear-gradient(110deg, #171719, #242022, #171719);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
        }

        .featured-section {
          max-width: none;
          background: #121214;
          border-top: 1px solid #ffffff10;
          border-bottom: 1px solid #ffffff10;
        }

        .featured-section > .section-top,
        .featured-section > .products-grid,
        .featured-section > .section-empty {
          max-width: 1160px;
          margin-left: auto;
          margin-right: auto;
        }

        .products-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 17px;
        }

        .product-card {
          overflow: hidden;
          background: #19191c;
          border: 1px solid #ffffff12;
          transition: border-color .2s, transform .2s;
        }

        .product-card:hover {
          border-color: #c99a8670;
          transform: translateY(-3px);
        }

        .product-image {
          position: relative;
          height: 210px;
          display: grid;
          place-items: center;
          overflow: hidden;
          background: radial-gradient(circle, #57382c40, #151416 70%);
        }

        .product-image img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 20px;
        }

        .image-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          color: #c99a86;
        }

        .image-placeholder span {
          font-family: Georgia, serif;
          font-size: 100px;
        }

        .image-placeholder small {
          font-size: 8px;
          letter-spacing: 2px;
        }

        .image-tag {
          position: absolute;
          top: 12px;
          right: 12px;
          padding: 7px 9px;
          background: #171113d9;
          color: #d5a895;
          font-size: 7px;
          letter-spacing: 1px;
        }

        .product-content {
          padding: 15px;
        }

        .product-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          color: #c99a86;
          font-size: 9px;
        }

        .stock {
          padding: 5px 7px;
          border-radius: 3px;
          white-space: nowrap;
        }

        .stock.in {
          color: #8ac3a0;
          background: #8ac3a015;
        }

        .stock.out {
          color: #dc9999;
          background: #dc999915;
        }

        .product-content h3 {
          min-height: 48px;
          margin: 12px 0 5px;
          font-size: 13px;
          line-height: 1.9;
        }

        .product-content h3 a {
          color: #f5f1ee;
        }

        .product-description {
          min-height: 35px;
          color: #968b86;
          font-size: 9px;
          line-height: 2;
        }

        .product-bottom {
          display: flex;
          flex-direction: column;
          gap: 7px;
          padding-top: 13px;
          border-top: 1px solid #ffffff12;
        }

        .product-bottom strong {
          color: #d8ad9b;
          font-size: 12px;
        }

        .product-bottom > span {
          color: #918681;
          font-size: 9px;
        }

        .product-link {
          display: flex;
          justify-content: space-between;
          margin-top: 13px;
          padding: 10px;
          border: 1px solid #77594d;
          color: #d5a895;
          font-size: 10px;
        }

        .product-skeleton {
          padding: 12px;
          border: 1px solid #ffffff12;
          background: #19191c;
        }

        .product-skeleton > div {
          height: 190px;
          margin-bottom: 15px;
          background: #292326;
        }

        .product-skeleton > span {
          display: block;
          height: 10px;
          margin: 12px 0;
          background: #292326;
        }

        .section-empty {
          min-height: 190px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 25px;
          border: 1px solid #453530;
          background: #171517;
          text-align: center;
        }

        .section-empty > span {
          color: #c99a86;
          font-size: 30px;
        }

        .section-empty p {
          color: #b3a6a0;
          font-size: 11px;
          line-height: 2;
        }

        .section-empty a {
          color: #d5a895;
          font-size: 10px;
          border-bottom: 1px solid #77594d;
          padding-bottom: 5px;
        }

        .business-section {
          position: relative;
          min-height: 380px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 35px;
          padding: 65px 10%;
          overflow: hidden;
          background:
            radial-gradient(circle at 80% 50%, #c99a861b, transparent 32%),
            #191416;
          border-bottom: 1px solid #503b34;
        }

        .business-decoration {
          position: absolute;
          left: 8%;
          top: -95px;
          color: #c99a8609;
          font-family: Georgia, serif;
          font-size: 420px;
          pointer-events: none;
        }

        .business-content {
          position: relative;
          z-index: 1;
          max-width: 700px;
        }

        .business-content h2 {
          margin: 18px 0;
          font-size: clamp(27px, 4vw, 42px);
          line-height: 1.8;
        }

        .business-content p {
          max-width: 600px;
          color: #b1a49e;
          font-size: 12px;
          line-height: 2.5;
        }

        .business-button {
          display: inline-flex;
          align-items: center;
          gap: 20px;
          margin-top: 18px;
          padding: 14px 20px;
          background: #c99a86;
          color: #171113;
          font-size: 11px;
          font-weight: 800;
        }

        .business-stamp {
          position: relative;
          z-index: 1;
          flex-shrink: 0;
          width: 190px;
          height: 190px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 1px solid #c99a8660;
          border-radius: 50%;
          color: #c99a86;
        }

        .business-stamp > span {
          font-family: Georgia, serif;
          font-size: 85px;
          line-height: 1;
        }

        .business-stamp small {
          margin-top: 9px;
          font-size: 7px;
          letter-spacing: 2px;
        }

        .brands-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 13px;
        }

        .brand-card {
          min-height: 135px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 17px;
          border: 1px solid #383033;
          background: #151416;
          color: #e6d9d3;
          transition: border-color .2s;
        }

        .brand-card:hover {
          border-color: #c99a86;
        }

        .brand-card img {
          max-width: 75px;
          max-height: 45px;
          object-fit: contain;
        }

        .brand-initial {
          width: 43px;
          height: 43px;
          display: grid;
          place-items: center;
          border: 1px solid #c99a86;
          color: #c99a86;
          font-family: Georgia, serif;
          font-size: 25px;
        }

        .brand-card strong {
          font-size: 11px;
        }

        .brand-card small {
          color: #958781;
          font-size: 8px;
        }

        .brand-empty {
          padding: 35px;
          border: 1px solid #383033;
          color: #a99b95;
          text-align: center;
          font-size: 11px;
        }

        .brand-loading {
          grid-template-columns: repeat(5, 1fr);
        }

        .brand-loading span {
          height: 120px;
          background: #191719;
          animation: shimmer 1.4s infinite;
        }

        .contact-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 25px;
          padding: 55px 9%;
          background: #171416;
          border-top: 1px solid #ffffff12;
        }

        .contact-banner h2 {
          margin: 12px 0;
          font-size: 25px;
        }

        .contact-banner p {
          color: #a99c96;
          font-size: 11px;
          line-height: 2;
        }

        .contact-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .contact-actions a {
          padding: 13px 17px;
          border: 1px solid #806052;
          color: #d7ad9b;
          font-size: 10px;
          white-space: nowrap;
        }

        .contact-actions a:first-child {
          background: #c99a86;
          color: #171113;
          border-color: #c99a86;
        }

        .footer {
          padding: 55px 8% 0;
          background: #0a0a0c;
        }

        .footer-main {
          display: grid;
          grid-template-columns: 1.5fr repeat(3, 1fr);
          gap: 35px;
          padding-bottom: 45px;
        }

        .footer-brand p {
          max-width: 270px;
          margin-top: 20px;
          color: #928783;
          font-size: 10px;
          line-height: 2.5;
        }

        .footer-column {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .footer-column strong {
          margin-bottom: 7px;
          color: #d5a895;
          font-size: 11px;
        }

        .footer-column a {
          color: #a69a95;
          font-size: 10px;
        }

        .footer-column a:hover {
          color: #d5a895;
        }

        .footer-bottom {
          min-height: 55px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          border-top: 1px solid #ffffff16;
          color: #827873;
          font-size: 8px;
          letter-spacing: 1px;
        }

        @keyframes shimmer {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }

        @media (max-width: 1100px) {
          .main-nav {
            gap: 12px;
          }

          .main-nav a {
            font-size: 10px;
          }

          .products-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 850px) {
          .site-header {
            flex-wrap: wrap;
          }

          .main-nav {
            order: 3;
            width: 100%;
            overflow-x: auto;
            padding: 10px 0;
          }

          .header-actions {
            margin-right: auto;
          }

          .hero {
            grid-template-columns: 1fr;
            padding-top: 65px;
          }

          .hero-visual {
            width: min(75%, 330px);
            margin-top: 55px;
          }

          .hero-caption {
            margin-top: 35px;
          }

          .value-strip {
            grid-template-columns: repeat(2, 1fr);
            row-gap: 15px;
          }

          .value-strip > div:nth-child(2) {
            border-left: 0;
          }

          .category-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .products-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .brands-grid {
            grid-template-columns: repeat(3, 1fr);
          }

          .business-section {
            padding: 55px 7%;
          }

          .business-stamp {
            width: 145px;
            height: 145px;
          }

          .business-stamp > span {
            font-size: 65px;
          }
        }

        @media (max-width: 560px) {
          .announcement {
            font-size: 8px;
          }

          .site-header {
            padding: 13px 5%;
          }

          .brand-symbol {
            width: 39px;
            height: 39px;
          }

          .brand-copy strong {
            font-size: 10px;
          }

          .account-link {
            display: none;
          }

          .partner-link {
            padding: 10px;
            font-size: 9px;
          }

          .hero {
            min-height: auto;
            padding: 55px 7% 75px;
          }

          .hero h1 {
            font-size: 42px;
          }

          .hero-content > p {
            font-size: 11px;
          }

          .hero-visual {
            width: 75%;
          }

          .visual-monogram span {
            font-size: 115px;
          }

          .hero-bottom {
            left: 7%;
            right: 7%;
            font-size: 7px;
          }

          .value-strip {
            padding: 20px 4%;
          }

          .value-strip > div {
            justify-content: flex-start;
            border: 0;
          }

          .value-strip strong {
            font-size: 9px;
          }

          .value-strip small {
            font-size: 8px;
          }

          .categories-section,
          .featured-section,
          .brands-section {
            padding: 60px 5%;
          }

          .section-top {
            align-items: flex-start;
            flex-direction: column;
          }

          .section-top h2 {
            font-size: 24px;
          }

          .category-grid {
            gap: 9px;
          }

          .category-card {
            min-height: 170px;
            padding: 15px;
          }

          .category-card strong {
            font-size: 12px;
          }

          .category-card small {
            font-size: 8px;
          }

          .products-grid {
            gap: 10px;
          }

          .product-image {
            height: 150px;
          }

          .product-content {
            padding: 10px;
          }

          .product-content h3 {
            font-size: 11px;
          }

          .product-description {
            font-size: 8px;
          }

          .product-bottom strong {
            font-size: 10px;
          }

          .business-section {
            align-items: flex-start;
            flex-direction: column;
          }

          .business-content h2 {
            font-size: 27px;
          }

          .business-stamp {
            width: 125px;
            height: 125px;
            align-self: center;
          }

          .business-stamp > span {
            font-size: 55px;
          }

          .brands-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .contact-banner {
            align-items: flex-start;
            flex-direction: column;
            padding: 45px 6%;
          }

          .contact-banner h2 {
            font-size: 21px;
          }

          .footer {
            padding: 45px 6% 0;
          }

          .footer-main {
            grid-template-columns: repeat(2, 1fr);
            gap: 30px 20px;
          }

          .footer-brand {
            grid-column: 1 / -1;
          }

          .footer-bottom {
            flex-wrap: wrap;
            justify-content: center;
            padding: 15px 0;
            text-align: center;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: .01ms !important;
            transition-duration: .01ms !important;
          }
        }
      `}</style>
    </main>
  );
}
