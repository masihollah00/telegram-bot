
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Brand = {
  id: number | string;
  name: string;
  slug: string;
  description?: string;
  logo?: string | null;
  website?: string | null;
};

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://jalali-cosmetics-api.onrender.com/api/store"
).replace(/\/+$/, "");

function mediaUrl(path?: string | null) {
  if (!path) return "";

  if (/^https?:\/\//i.test(path)) return path;

  try {
    return new URL(
      path,
      new URL(API_BASE).origin
    ).toString();
  } catch {
    return path;
  }
}

function normalizeBrands(data: unknown): Brand[] {
  if (Array.isArray(data)) return data as Brand[];

  if (
    data &&
    typeof data === "object" &&
    "results" in data &&
    Array.isArray((data as { results: unknown }).results)
  ) {
    return (data as { results: Brand[] }).results;
  }

  return [];
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("name");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadBrands() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_BASE}/brands/`,
          {
            method: "GET",
            cache: "no-store",
            headers: {
              Accept: "application/json",
            },
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? "مسیر دریافت برندها پیدا نشد."
              : "دریافت فهرست برندها با مشکل مواجه شد."
          );
        }

        const data = await response.json();
        setBrands(normalizeBrands(data));
      } catch (err) {
        if (
          err instanceof Error &&
          err.name === "AbortError"
        ) {
          return;
        }

        setBrands([]);
        setError(
          err instanceof Error
            ? err.message
            : "خطای نامشخص در دریافت برندها."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadBrands();

    return () => controller.abort();
  }, []);

  const filteredBrands = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();

    const result = brands.filter((brand) => {
      if (!query) return true;

      return (
        brand.name?.toLocaleLowerCase().includes(query) ||
        brand.slug?.toLocaleLowerCase().includes(query) ||
        brand.description?.toLocaleLowerCase().includes(query)
      );
    });

    return [...result].sort((a, b) => {
      if (sort === "name-desc") {
        return b.name.localeCompare(a.name, "fa");
      }

      return a.name.localeCompare(b.name, "fa");
    });
  }, [brands, search, sort]);

  return (
    <main className="brands-page" dir="rtl">
      <header className="topbar">
        <div className="container topbar-inner">
          <Link href="/" className="brand">
            <span className="brand-mark">J</span>

            <span className="brand-copy">
              <strong>JALALI COSMETICS</strong>
              <small>BEAUTY. BUSINESS. TRUST.</small>
            </span>
          </Link>

          <nav className="main-nav">
            <Link href="/">صفحه اصلی</Link>
            <Link href="/products">محصولات</Link>
            <Link href="/categories">دسته‌بندی‌ها</Link>
            <Link href="/about">درباره ما</Link>
          </nav>

          <div className="header-actions">
            <Link href="/account">حساب کاربری</Link>

            <Link href="/cart" className="cart-link">
              سبد خرید
              <span>↗</span>
            </Link>
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <span className="eyebrow">
              OUR BRAND COLLECTION
            </span>

            <h1>
              دنیای برندهای
              <span>آرایشی و بهداشتی</span>
            </h1>

            <p>
              برندهای ثبت‌شده در کاتالوگ پخش جلالی را
              بررسی کنید و محصولات هر برند را به‌صورت
              مستقیم مشاهده کنید.
            </p>

            <div className="hero-actions">
              <a href="#brand-catalog" className="primary-button">
                مشاهده برندها
                <span>←</span>
              </a>

              <Link href="/partner" className="secondary-button">
                همکاری تجاری
              </Link>
            </div>

            <div className="hero-trust">
              <span>✦</span>
              برندهای ثبت‌شده در سامانه
              <i />
              کاتالوگ به‌روز
              <i />
              فروش عمده
            </div>
          </div>

          <div className="hero-art">
            <div className="art-ring ring-one" />
            <div className="art-ring ring-two" />

            <div className="art-center">
              <span>J</span>
              <small>JALALI</small>
            </div>

            <div className="art-label label-top">
              <strong>BRAND DIRECTORY</strong>
              <small>OFFICIAL COLLECTION</small>
            </div>

            <div className="art-label label-bottom">
              <strong>BEAUTY</strong>
              <small>BUSINESS & TRUST</small>
            </div>
          </div>
        </div>
      </section>

      <section className="catalog-section" id="brand-catalog">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">BRAND DIRECTORY</span>
              <h2>فهرست برندها</h2>
              <p>
                جست‌وجو و مشاهده برندهای موجود در پایگاه
                اطلاعات فروشگاه
              </p>
            </div>

            <div className="result-count">
              <span>برندهای ثبت‌شده</span>
              <strong>
                {brands.length.toLocaleString("fa-IR")}
              </strong>
            </div>
          </div>

          <div className="search-panel">
            <div className="search-box">
              <span className="search-icon">⌕</span>

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="جست‌وجوی نام برند یا توضیحات..."
                aria-label="جست‌وجوی برندها"
              />

              {search && (
                <button
                  type="button"
                  className="clear-search"
                  onClick={() => setSearch("")}
                  aria-label="پاک کردن جست‌وجو"
                >
                  ×
                </button>
              )}
            </div>

            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              aria-label="مرتب‌سازی برندها"
            >
              <option value="name">مرتب‌سازی: نام صعودی</option>
              <option value="name-desc">مرتب‌سازی: نام نزولی</option>
            </select>
          </div>

          <div className="catalog-toolbar">
            <div>
              <span className="toolbar-dot" />
              کاتالوگ رسمی برندها
            </div>

            <span>
              {loading
                ? "در حال دریافت اطلاعات..."
                : `${filteredBrands.length.toLocaleString("fa-IR")} نتیجه`}
            </span>
          </div>

          {loading ? (
            <div className="state-box">
              <div className="spinner" />
              <h3>در حال دریافت برندها</h3>
              <p>
                اطلاعات از پایگاه داده فروشگاه دریافت
                می‌شود.
              </p>
            </div>
          ) : error ? (
            <div className="state-box error-box">
              <span className="state-symbol">!</span>
              <h3>دریافت برندها ناموفق بود</h3>
              <p>{error}</p>

              <button
                type="button"
                className="primary-button"
                onClick={() => window.location.reload()}
              >
                تلاش مجدد
              </button>
            </div>
          ) : filteredBrands.length === 0 ? (
            <div className="state-box">
              <span className="empty-symbol">◇</span>
              <h3>
                {brands.length === 0
                  ? "هنوز برندی ثبت نشده است"
                  : "برندی با این مشخصات پیدا نشد"}
              </h3>

              <p>
                {brands.length === 0
                  ? "پس از ثبت برندها در پنل مدیریت، اطلاعات آن‌ها در این قسمت نمایش داده می‌شود."
                  : "عبارت جست‌وجو را تغییر دهید یا جست‌وجو را پاک کنید."}
              </p>

              {search && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setSearch("")}
                >
                  پاک کردن جست‌وجو
                </button>
              )}
            </div>
          ) : (
            <div className="brand-grid">
              {filteredBrands.map((brand, index) => {
                const logo = mediaUrl(brand.logo);

                return (
                  <article className="brand-card" key={brand.id}>
                    <div className="card-top">
                      <div className="brand-symbol">
                        {logo ? (
                          <img
                            src={logo}
                            alt={`لوگوی ${brand.name}`}
                            loading="lazy"
                          />
                        ) : (
                          <span>
                            {brand.name?.charAt(0) || "J"}
                          </span>
                        )}
                      </div>

                      <span className="brand-number">
                        {(index + 1).toString().padStart(2, "0")}
                      </span>
                    </div>

                    <div className="brand-content">
                      <span className="english-name">
                        {brand.slug}
                      </span>

                      <h3>{brand.name}</h3>

                      <p>
                        {brand.description ||
                          "اطلاعات تکمیلی این برند هنوز ثبت نشده است."}
                      </p>
                    </div>

                    <div className="card-bottom">
                      {brand.website ? (
                        <a
                          href={brand.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="website-link"
                        >
                          وب‌سایت برند
                          <span>↗</span>
                        </a>
                      ) : (
                        <span className="brand-record">
                          JALALI COLLECTION
                        </span>
                      )}

                      <Link
                        href={`/brands/${encodeURIComponent(brand.slug)}`}
                        className="view-link"
                      >
                        مشاهده محصولات
                        <span>←</span>
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="partner-banner">
        <div className="container partner-inner">
          <div>
            <span className="eyebrow">
              BUSINESS PARTNERSHIP
            </span>

            <h2>به شبکه همکاران پخش جلالی بپیوندید</h2>

            <p>
              برای اطلاع از شرایط همکاری و دسترسی به
              خدمات ویژه همکاران، درخواست همکاری خود را
              ثبت کنید.
            </p>
          </div>

          <Link href="/partner" className="primary-button">
            درخواست همکاری
            <span>←</span>
          </Link>
        </div>
      </section>

      <footer className="footer">
        <div className="container footer-inner">
          <Link href="/" className="footer-brand">
            <span>J</span>
            <strong>JALALI COSMETICS</strong>
          </Link>

          <p>BEAUTY. BUSINESS. TRUST.</p>

          <div className="footer-links">
            <Link href="/contact">تماس با ما</Link>
            <Link href="/faq">سؤالات متداول</Link>
            <Link href="/about">درباره پخش جلالی</Link>
          </div>

          <small>
            © {new Date().getFullYear()} JALALI COSMETICS
          </small>
        </div>
      </footer>

      <style jsx>{`
        .brands-page {
          min-height: 100vh;
          overflow: hidden;
          color: #f5f1ee;
          background: #0b0b0d;
        }

        .container {
          width: min(1440px, calc(100% - 48px));
          margin-inline: auto;
        }

        .topbar {
          position: sticky;
          top: 0;
          z-index: 30;
          background: rgba(11, 11, 13, 0.95);
          border-bottom: 1px solid rgba(201, 154, 134, 0.17);
          backdrop-filter: blur(18px);
        }

        .topbar-inner {
          min-height: 82px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 25px;
        }

        .brand,
        .footer-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }

        .brand-mark {
          width: 43px;
          height: 43px;
          display: grid;
          place-items: center;
          color: #c99a86;
          border: 1px solid #c99a86;
          border-radius: 12px 12px 3px 12px;
          font-family: Georgia, serif;
          font-size: 27px;
        }

        .brand-copy {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .brand-copy strong {
          font-size: 13px;
          letter-spacing: 1.5px;
        }

        .brand-copy small {
          color: #c99a86;
          font-size: 9px;
          letter-spacing: 1.4px;
        }

        .main-nav,
        .header-actions {
          display: flex;
          align-items: center;
          gap: 23px;
          color: #c4b9b4;
          font-size: 12px;
        }

        .main-nav a:hover,
        .header-actions > a:hover {
          color: #c99a86;
        }

        .cart-link {
          min-height: 42px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 15px;
          color: #e1b9a8;
          border: 1px solid rgba(201, 154, 134, 0.5);
          border-radius: 10px;
        }

        .hero {
          border-bottom: 1px solid rgba(201, 154, 134, 0.13);
          background:
            radial-gradient(
              ellipse at 17% 50%,
              rgba(201, 154, 134, 0.12),
              transparent 40%
            ),
            linear-gradient(120deg, #111012, #0b0b0d 70%);
        }

        .hero-inner {
          min-height: 475px;
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          align-items: center;
          gap: 40px;
          padding-block: 65px;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: #c99a86;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2px;
        }

        .eyebrow::before {
          content: "";
          width: 25px;
          height: 1px;
          background: #c99a86;
        }

        .hero-copy h1 {
          margin: 22px 0 18px;
          font-size: clamp(35px, 5vw, 58px);
          line-height: 1.55;
          font-weight: 900;
        }

        .hero-copy h1 span {
          display: block;
          color: #c99a86;
        }

        .hero-copy > p {
          max-width: 600px;
          color: #aaa1a0;
          font-size: 14px;
          line-height: 2.3;
        }

        .hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 28px;
        }

        .primary-button,
        .secondary-button {
          min-height: 47px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
          padding: 0 22px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .primary-button {
          color: #171112;
          background: #c99a86;
          border: 1px solid #c99a86;
        }

        .primary-button:hover {
          background: #e1b9a8;
          transform: translateY(-2px);
        }

        .secondary-button {
          color: #e1b9a8;
          background: transparent;
          border: 1px solid rgba(201, 154, 134, 0.5);
        }

        .secondary-button:hover {
          background: rgba(201, 154, 134, 0.1);
        }

        .hero-trust {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 35px;
          color: #938985;
          font-size: 10px;
        }

        .hero-trust span {
          color: #c99a86;
        }

        .hero-trust i {
          width: 3px;
          height: 3px;
          background: #c99a86;
          border-radius: 50%;
        }

        .hero-art {
          position: relative;
          width: min(100%, 410px);
          aspect-ratio: 1;
          display: grid;
          place-items: center;
          justify-self: center;
        }

        .art-ring {
          position: absolute;
          border: 1px solid rgba(201, 154, 134, 0.22);
          border-radius: 50%;
        }

        .ring-one {
          width: 90%;
          height: 90%;
        }

        .ring-two {
          width: 68%;
          height: 68%;
          border-style: dashed;
          animation: rotate 55s linear infinite;
        }

        @keyframes rotate {
          to {
            transform: rotate(360deg);
          }
        }

        .art-center {
          width: 48%;
          aspect-ratio: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 1px solid #c99a86;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            #28201e,
            #111012 72%
          );
          box-shadow: 0 0 65px rgba(201, 154, 134, 0.12);
        }

        .art-center span {
          color: #c99a86;
          font-family: Georgia, serif;
          font-size: 105px;
          line-height: 1;
        }

        .art-center small {
          margin-top: 8px;
          color: #d6b2a3;
          font-size: 9px;
          letter-spacing: 5px;
        }

        .art-label {
          position: absolute;
          display: flex;
          flex-direction: column;
          gap: 7px;
          padding: 13px 16px;
          border: 1px solid rgba(201, 154, 134, 0.35);
          border-radius: 10px;
          background: rgba(20, 18, 19, 0.95);
          box-shadow: 0 15px 40px #0008;
        }

        .art-label strong {
          color: #e1b9a8;
          font-size: 10px;
          letter-spacing: 2px;
        }

        .art-label small {
          color: #928783;
          font-size: 8px;
          letter-spacing: 1.5px;
        }

        .label-top {
          top: 12%;
          right: -2%;
        }

        .label-bottom {
          bottom: 13%;
          left: -2%;
        }

        .catalog-section {
          padding-block: 75px 90px;
        }

        .section-heading {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 25px;
          margin-bottom: 30px;
        }

        .section-heading h2 {
          margin: 13px 0 7px;
          font-size: clamp(25px, 3vw, 36px);
        }

        .section-heading p {
          margin: 0;
          color: #aaa1a0;
          font-size: 12px;
          line-height: 2;
        }

        .result-count {
          min-width: 150px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 15px 18px;
          border: 1px solid rgba(201, 154, 134, 0.22);
          border-radius: 12px;
          background: #141417;
        }

        .result-count span {
          color: #aaa1a0;
          font-size: 10px;
        }

        .result-count strong {
          color: #c99a86;
          font-size: 23px;
        }

        .search-panel {
          display: grid;
          grid-template-columns: 1fr 230px;
          gap: 12px;
          margin-bottom: 15px;
        }

        .search-box {
          min-height: 57px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 18px;
          border: 1px solid rgba(201, 154, 134, 0.25);
          border-radius: 12px;
          background: #141417;
        }

        .search-icon {
          color: #c99a86;
          font-size: 28px;
        }

        .search-box input,
        .search-panel select {
          width: 100%;
          min-width: 0;
          height: 55px;
          color: #f5f1ee;
          background: transparent;
          border: 0;
          outline: 0;
          font-size: 12px;
        }

        .search-panel select {
          padding: 0 14px;
          border: 1px solid rgba(201, 154, 134, 0.25);
          border-radius: 12px;
          background: #141417;
        }

        .search-panel select option {
          background: #141417;
        }

        .clear-search {
          color: #c99a86;
          background: transparent;
          border: 0;
          font-size: 24px;
        }

        .catalog-toolbar {
          min-height: 52px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
          padding: 0 3px;
          color: #938985;
          font-size: 11px;
        }

        .catalog-toolbar > div {
          display: flex;
          align-items: center;
          gap: 9px;
          color: #e1b9a8;
          font-weight: 800;
        }

        .toolbar-dot {
          width: 7px;
          height: 7px;
          background: #c99a86;
          border-radius: 50%;
          box-shadow: 0 0 12px #c99a86;
        }

        .brand-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }

        .brand-card {
          min-width: 0;
          padding: 22px;
          border: 1px solid rgba(201, 154, 134, 0.18);
          border-radius: 15px;
          background:
            radial-gradient(
              ellipse at 100% 0%,
              rgba(201, 154, 134, 0.07),
              transparent 48%
            ),
            #141417;
          transition: 0.25s ease;
        }

        .brand-card:hover {
          transform: translateY(-4px);
          border-color: rgba(201, 154, 134, 0.65);
          box-shadow: 0 18px 40px #0005;
        }

        .card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .brand-symbol {
          width: 68px;
          height: 68px;
          display: grid;
          place-items: center;
          overflow: hidden;
          border: 1px solid rgba(201, 154, 134, 0.45);
          border-radius: 15px;
          background: #1c1b20;
        }

        .brand-symbol img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 7px;
        }

        .brand-symbol span {
          color: #c99a86;
          font-family: Georgia, serif;
          font-size: 42px;
        }

        .brand-number {
          color: #756965;
          font-size: 11px;
          letter-spacing: 2px;
        }

        .brand-content {
          min-height: 135px;
        }

        .english-name {
          display: block;
          color: #c99a86;
          font-size: 9px;
          letter-spacing: 1.8px;
          overflow-wrap: anywhere;
        }

        .brand-content h3 {
          margin: 11px 0 8px;
          color: #f5f1ee;
          font-size: 20px;
        }

        .brand-content p {
          min-height: 45px;
          margin: 0;
          color: #aaa1a0;
          font-size: 11px;
          line-height: 2;
        }

        .card-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          padding-top: 17px;
          border-top: 1px solid rgba(201, 154, 134, 0.13);
        }

        .brand-record,
        .website-link {
          color: #8e827d;
          font-size: 9px;
          letter-spacing: 1px;
        }

        .website-link {
          color: #c99a86;
        }

        .view-link {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #e1b9a8;
          font-size: 10px;
          font-weight: 800;
        }

        .state-box {
          min-height: 300px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 35px 20px;
          text-align: center;
          border: 1px solid rgba(201, 154, 134, 0.18);
          border-radius: 15px;
          background: #141417;
        }

        .state-box h3 {
          margin: 17px 0 5px;
          font-size: 17px;
        }

        .state-box p {
          max-width: 530px;
          color: #aaa1a0;
          font-size: 12px;
          line-height: 2;
        }

        .spinner {
          width: 43px;
          height: 43px;
          border: 3px solid rgba(201, 154, 134, 0.18);
          border-top-color: #c99a86;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .state-symbol,
        .empty-symbol {
          width: 52px;
          height: 52px;
          display: grid;
          place-items: center;
          color: #c99a86;
          border: 1px solid rgba(201, 154, 134, 0.5);
          border-radius: 50%;
          font-size: 26px;
        }

        .error-box .state-symbol {
          color: #d98a8a;
          border-color: #d98a8a;
        }

        .error-box .primary-button,
        .state-box .secondary-button {
          margin-top: 12px;
        }

        .partner-banner {
          padding-block: 55px;
          border-block: 1px solid rgba(201, 154, 134, 0.2);
          background:
            radial-gradient(
              ellipse at 15% 50%,
              rgba(201, 154, 134, 0.12),
              transparent 45%
            ),
            #121113;
        }

        .partner-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 30px;
        }

        .partner-inner h2 {
          margin: 13px 0 8px;
          font-size: clamp(22px, 3vw, 32px);
        }

        .partner-inner p {
          max-width: 650px;
          margin: 0;
          color: #aaa1a0;
          font-size: 12px;
          line-height: 2.2;
        }

        .footer {
          padding-block: 35px;
          background: #09090b;
        }

        .footer-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
        }

        .footer-brand span {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          color: #c99a86;
          border: 1px solid #c99a86;
          border-radius: 9px;
          font-family: Georgia, serif;
          font-size: 21px;
        }

        .footer-brand strong {
          font-size: 11px;
          letter-spacing: 1px;
        }

        .footer-inner > p {
          color: #c99a86;
          font-size: 9px;
          letter-spacing: 2px;
        }

        .footer-links {
          display: flex;
          flex-wrap: wrap;
          gap: 18px;
          color: #aaa1a0;
          font-size: 10px;
        }

        .footer-inner > small {
          width: 100%;
          padding-top: 18px;
          border-top: 1px solid rgba(201, 154, 134, 0.12);
          color: #716966;
          font-size: 9px;
          text-align: center;
        }

        @media (max-width: 1000px) {
          .main-nav {
            gap: 12px;
          }

          .brand-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 760px) {
          .container {
            width: min(100% - 28px, 1440px);
          }

          .topbar-inner {
            min-height: 70px;
          }

          .main-nav {
            display: none;
          }

          .header-actions {
            gap: 10px;
            font-size: 10px;
          }

          .brand-copy strong {
            font-size: 10px;
          }

          .brand-copy small {
            font-size: 7px;
          }

          .brand-mark {
            width: 37px;
            height: 37px;
          }

          .hero-inner {
            grid-template-columns: 1fr;
            padding-block: 48px;
          }

          .hero-copy h1 {
            font-size: 38px;
          }

          .hero-art {
            width: min(75%, 330px);
            margin-top: 10px;
          }

          .art-center span {
            font-size: 80px;
          }

          .catalog-section {
            padding-block: 48px 60px;
          }

          .search-panel {
            grid-template-columns: 1fr;
          }

          .search-panel select {
            min-height: 48px;
          }

          .brand-grid {
            gap: 12px;
          }

          .brand-card {
            padding: 15px;
          }

          .partner-inner {
            align-items: flex-start;
            flex-direction: column;
          }

          .footer-inner {
            justify-content: center;
            text-align: center;
          }

          .footer-links {
            justify-content: center;
          }
        }

        @media (max-width: 430px) {
          .header-actions > a:first-child {
            display: none;
          }

          .section-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .result-count {
            width: 100%;
          }

          .brand-grid {
            grid-template-columns: 1fr;
          }

          .brand-card {
            padding: 20px;
          }

          .brand-content {
            min-height: auto;
            padding-bottom: 18px;
          }

          .brand-content p {
            min-height: auto;
          }

          .hero-copy h1 {
            font-size: 32px;
          }
        }
      `}</style>
    </main>
  );
}
