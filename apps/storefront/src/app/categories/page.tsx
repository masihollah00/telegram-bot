
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Category = {
  id: number | string;
  name: string;
  slug: string;
  description?: string;
  image?: string | null;
  product_count?: number;
};

type CategoryResponse = {
  count?: number;
  results?: Category[];
};

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://jalali-cosmetics-api.onrender.com/api/store"
).replace(/\/+$/, "");

function mediaUrl(path?: string | null) {
  if (!path) return "";

  if (/^https?:\/\//i.test(path)) return path;

  try {
    return new URL(path, new URL(API_BASE).origin).toString();
  } catch {
    return path;
  }
}

function normalizeCategories(data: unknown): Category[] {
  if (Array.isArray(data)) {
    return data as Category[];
  }

  if (
    data &&
    typeof data === "object" &&
    "results" in data &&
    Array.isArray((data as CategoryResponse).results)
  ) {
    return (data as CategoryResponse).results || [];
  }

  return [];
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("fa-IR").format(value);
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("default");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadCategories() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_BASE}/categories/`,
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
              ? "مسیر دریافت دسته‌بندی‌ها پیدا نشد."
              : "دریافت دسته‌بندی‌ها با مشکل مواجه شد."
          );
        }

        const data: unknown = await response.json();
        setCategories(normalizeCategories(data));
      } catch (err) {
        if (
          err instanceof Error &&
          err.name === "AbortError"
        ) {
          return;
        }

        setCategories([]);

        setError(
          err instanceof Error
            ? err.message
            : "خطای نامشخص در دریافت دسته‌بندی‌ها."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadCategories();

    return () => controller.abort();
  }, []);

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();

    const result = categories.filter((category) => {
      if (!query) return true;

      return (
        category.name?.toLocaleLowerCase().includes(query) ||
        category.slug?.toLocaleLowerCase().includes(query) ||
        category.description?.toLocaleLowerCase().includes(query)
      );
    });

    if (sort === "name") {
      return [...result].sort((a, b) =>
        a.name.localeCompare(b.name, "fa")
      );
    }

    if (sort === "count") {
      return [...result].sort(
        (a, b) =>
          Number(b.product_count || 0) -
          Number(a.product_count || 0)
      );
    }

    return result;
  }, [categories, search, sort]);

  const totalProducts = useMemo(
    () =>
      categories.reduce(
        (sum, category) =>
          sum + Number(category.product_count || 0),
        0
      ),
    [categories]
  );

  return (
    <main className="categories-page" dir="rtl">
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
            <Link href="/brands">برندها</Link>
            <Link href="/about">درباره ما</Link>
          </nav>

          <div className="header-actions">
            <Link href="/account" className="account-link">
              حساب کاربری
            </Link>

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
              JALALI PRODUCT CATEGORIES
            </span>

            <h1>
              دنیای محصولات
              <span>در دسته‌بندی‌های تخصصی</span>
            </h1>

            <p>
              دسته‌بندی‌های ثبت‌شده در کاتالوگ پخش جلالی
              را بررسی کنید و محصولات مرتبط با هر بخش را
              سریع‌تر پیدا کنید.
            </p>

            <div className="hero-actions">
              <a href="#category-catalog" className="primary-button">
                مشاهده دسته‌بندی‌ها
                <span>←</span>
              </a>

              <Link href="/products" className="secondary-button">
                مشاهده همه محصولات
              </Link>
            </div>

            <div className="hero-trust">
              <span>✦</span>
              دسته‌بندی‌های سامانه
              <i />
              اطلاعات به‌روز
              <i />
              خرید عمده
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
              <strong>PRODUCT DIRECTORY</strong>
              <small>CURATED COLLECTION</small>
            </div>

            <div className="art-label label-bottom">
              <strong>BEAUTY</strong>
              <small>BUSINESS & TRUST</small>
            </div>
          </div>
        </div>
      </section>

      <section className="catalog-section" id="category-catalog">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                EXPLORE CATEGORIES
              </span>

              <h2>دسته‌بندی محصولات</h2>

              <p>
                فهرست دسته‌بندی‌ها و تعداد محصولات هر بخش
                بر اساس اطلاعات دریافتی از سامانه
              </p>
            </div>

            <div className="catalog-stats">
              <div>
                <span>دسته‌بندی‌ها</span>
                <strong>
                  {formatNumber(categories.length)}
                </strong>
              </div>

              <div>
                <span>مجموع کالاهای موجود</span>
                <strong>
                  {formatNumber(totalProducts)}
                </strong>
              </div>
            </div>
          </div>

          <div className="toolbar">
            <div className="search-box">
              <span className="search-icon">⌕</span>

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="جست‌وجوی نام یا توضیحات دسته‌بندی..."
                aria-label="جست‌وجوی دسته‌بندی‌ها"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="clear-search"
                  aria-label="پاک کردن جست‌وجو"
                >
                  ×
                </button>
              )}
            </div>

            <label className="sort-control">
              <span>مرتب‌سازی</span>

              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
              >
                <option value="default">ترتیب سامانه</option>
                <option value="name">نام دسته‌بندی</option>
                <option value="count">تعداد محصولات</option>
              </select>
            </label>
          </div>

          {loading && (
            <div className="category-grid">
              {Array.from({ length: 6 }).map((_, index) => (
                <div className="category-skeleton" key={index}>
                  <div className="skeleton-image" />
                  <div className="skeleton-line wide" />
                  <div className="skeleton-line" />
                  <div className="skeleton-line short" />
                </div>
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="state-card error-card">
              <span className="state-symbol">!</span>
              <h3>دریافت اطلاعات انجام نشد</h3>
              <p>{error}</p>

              <button
                type="button"
                onClick={() => window.location.reload()}
              >
                تلاش دوباره
              </button>
            </div>
          )}

          {!loading && !error && filteredCategories.length === 0 && (
            <div className="state-card">
              <span className="state-symbol">⌕</span>

              <h3>
                {search
                  ? "دسته‌بندی موردنظر پیدا نشد"
                  : "هنوز دسته‌بندی ثبت نشده است"}
              </h3>

              <p>
                {search
                  ? "عبارت دیگری را جست‌وجو کنید یا فیلتر جست‌وجو را پاک کنید."
                  : "پس از ثبت دسته‌بندی‌ها در پنل مدیریت، اطلاعات آن‌ها در این بخش نمایش داده می‌شود."}
              </p>

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                >
                  پاک کردن جست‌وجو
                </button>
              )}
            </div>
          )}

          {!loading && !error && filteredCategories.length > 0 && (
            <>
              <div className="results-line">
                <span>
                  نمایش {formatNumber(filteredCategories.length)} دسته‌بندی
                </span>

                <span>
                  از {formatNumber(categories.length)} دسته‌بندی ثبت‌شده
                </span>
              </div>

              <div className="category-grid">
                {filteredCategories.map((category, index) => {
                  const image = mediaUrl(category.image);
                  const productCount = Number(
                    category.product_count || 0
                  );

                  return (
                    <article
                      className="category-card"
                      key={category.id}
                    >
                      <Link
                        href={`/categories/${encodeURIComponent(category.slug)}`}
                        className="card-link"
                        aria-label={`مشاهده محصولات دسته ${category.name}`}
                      >
                        <div className="card-image">
                          {image ? (
                            <img
                              src={image}
                              alt={category.name}
                              loading="lazy"
                            />
                          ) : (
                            <div className="image-placeholder">
                              <span>J</span>
                              <small>JALALI COSMETICS</small>
                            </div>
                          )}

                          <span className="card-index">
                            {String(index + 1).padStart(2, "0")}
                          </span>

                          <span className="image-overlay" />
                        </div>

                        <div className="card-content">
                          <div className="card-topline">
                            <span className="card-eyebrow">
                              PRODUCT CATEGORY
                            </span>

                            <span className="category-arrow">
                              ↗
                            </span>
                          </div>

                          <h3>{category.name}</h3>

                          <p>
                            {category.description ||
                              "مشاهده محصولات ثبت‌شده در این دسته‌بندی"}
                          </p>

                          <div className="card-footer">
                            <div className="product-count">
                              <strong>
                                {formatNumber(productCount)}
                              </strong>

                              <span>کالای موجود</span>
                            </div>

                            <span className="view-link">
                              مشاهده محصولات
                              <b>←</b>
                            </span>
                          </div>
                        </div>
                      </Link>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>

      <section className="wholesale-banner">
        <div className="banner-decoration">J</div>

        <div className="banner-copy">
          <span>BUSINESS PARTNERSHIP</span>
          <h2>برای خرید عمده آماده‌اید؟</h2>
          <p>
            برای آشنایی با شرایط همکاری تجاری و دریافت
            اطلاعات خرید عمده، بخش همکاری را بررسی کنید.
          </p>
        </div>

        <Link href="/partner">
          مشاهده شرایط همکاری
          <span>←</span>
        </Link>
      </section>

      <footer className="footer">
        <div>
          <strong>JALALI COSMETICS</strong>
          <span>BEAUTY. BUSINESS. TRUST.</span>
        </div>

        <nav>
          <Link href="/">صفحه اصلی</Link>
          <Link href="/products">محصولات</Link>
          <Link href="/brands">برندها</Link>
          <Link href="/contact">تماس با ما</Link>
        </nav>

        <small>پخش جلالی · عرضه عمده محصولات آرایشی و بهداشتی</small>
      </footer>

      <style jsx>{`
        .categories-page {
          min-height: 100vh;
          overflow: hidden;
          background: #0b0b0d;
          color: #f5f1ee;
          font-family: inherit;
        }

        .container {
          width: min(1200px, 88%);
          margin: 0 auto;
        }

        a {
          color: inherit;
          text-decoration: none;
        }

        .topbar {
          position: relative;
          z-index: 5;
          border-bottom: 1px solid #292326;
          background: #0b0b0d;
        }

        .topbar-inner {
          min-height: 86px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }

        .brand {
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
          margin-top: 5px;
          color: #9d918d;
          font-size: 8px;
          letter-spacing: 1.4px;
        }

        .main-nav {
          display: flex;
          align-items: center;
          gap: 27px;
        }

        .main-nav a,
        .header-actions a {
          color: #c9bfbb;
          font-size: 11px;
          transition: color .2s ease;
        }

        .main-nav a:hover,
        .header-actions a:hover {
          color: #c99a86;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 17px;
          white-space: nowrap;
        }

        .header-actions .cart-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 15px;
          border: 1px solid #715347;
          color: #d9b5a5;
        }

        .cart-link span {
          font-size: 16px;
        }

        .hero {
          position: relative;
          overflow: hidden;
          border-bottom: 1px solid #302725;
          background:
            radial-gradient(ellipse at 76% 50%, #30201d 0%, transparent 43%),
            linear-gradient(110deg, #0b0b0d, #151112);
        }

        .hero-inner {
          min-height: 440px;
          display: grid;
          grid-template-columns: 1.1fr .9fr;
          align-items: center;
          gap: 50px;
          padding-top: 35px;
          padding-bottom: 35px;
        }

        .hero-copy {
          position: relative;
          z-index: 2;
        }

        .eyebrow {
          color: #c99a86;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 3px;
        }

        .hero-copy h1 {
          margin: 20px 0 17px;
          font-size: clamp(30px, 4vw, 49px);
          line-height: 1.8;
          font-weight: 900;
        }

        .hero-copy h1 span {
          display: block;
          color: #c99a86;
        }

        .hero-copy > p {
          max-width: 590px;
          color: #b3a7a2;
          font-size: 13px;
          line-height: 2.4;
        }

        .hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 27px;
        }

        .primary-button,
        .secondary-button {
          min-height: 46px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 22px;
          padding: 0 19px;
          border: 1px solid #c99a86;
          font-size: 11px;
          transition: .2s ease;
        }

        .primary-button {
          background: #c99a86;
          color: #171113;
          font-weight: 800;
        }

        .primary-button:hover {
          background: #e0b7a5;
        }

        .secondary-button {
          color: #d5b2a3;
          background: transparent;
        }

        .secondary-button:hover {
          background: #251b19;
        }

        .hero-trust {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 11px;
          margin-top: 32px;
          color: #9c918d;
          font-size: 10px;
        }

        .hero-trust > span {
          color: #c99a86;
          font-size: 16px;
        }

        .hero-trust i {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: #80665c;
        }

        .hero-art {
          position: relative;
          min-height: 340px;
          display: grid;
          place-items: center;
        }

        .art-ring {
          position: absolute;
          border: 1px solid #76564b;
          border-radius: 50%;
          transform: rotate(-22deg);
        }

        .ring-one {
          width: 280px;
          height: 280px;
        }

        .ring-two {
          width: 220px;
          height: 340px;
          border-color: #4c3933;
          transform: rotate(48deg);
        }

        .art-center {
          width: 160px;
          height: 160px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 1px solid #c99a86;
          border-radius: 50%;
          background: radial-gradient(circle, #38231e, #151113 72%);
          box-shadow: 0 0 70px #9a655333;
        }

        .art-center span {
          color: #d8ae9b;
          font-family: Georgia, serif;
          font-size: 94px;
          line-height: 1;
        }

        .art-center small {
          margin-top: 5px;
          color: #d5b2a3;
          font-size: 8px;
          letter-spacing: 4px;
        }

        .art-label {
          position: absolute;
          display: flex;
          flex-direction: column;
          gap: 5px;
          padding: 12px 15px;
          border: 1px solid #594139;
          background: #171315eF;
          box-shadow: 0 10px 35px #0008;
        }

        .art-label strong {
          color: #d5b09e;
          font-size: 9px;
          letter-spacing: 1.8px;
        }

        .art-label small {
          color: #92817b;
          font-size: 8px;
          letter-spacing: 1px;
        }

        .label-top {
          top: 32px;
          right: 0;
        }

        .label-bottom {
          bottom: 27px;
          left: 0;
        }

        .catalog-section {
          padding: 78px 0 90px;
        }

        .section-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 25px;
          margin-bottom: 32px;
        }

        .section-heading h2 {
          margin: 12px 0 8px;
          font-size: 28px;
        }

        .section-heading p {
          margin: 0;
          color: #968b88;
          font-size: 11px;
          line-height: 2;
        }

        .catalog-stats {
          display: flex;
          gap: 12px;
        }

        .catalog-stats > div {
          min-width: 125px;
          display: flex;
          flex-direction: column;
          gap: 7px;
          padding: 15px 18px;
          border: 1px solid #39302e;
          background: #151416;
        }

        .catalog-stats span {
          color: #9f928d;
          font-size: 9px;
        }

        .catalog-stats strong {
          color: #d7b19f;
          font-size: 22px;
        }

        .toolbar {
          display: flex;
          gap: 13px;
          margin-bottom: 23px;
        }

        .search-box {
          min-height: 52px;
          flex: 1;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 16px;
          border: 1px solid #3a302e;
          background: #151416;
        }

        .search-icon {
          color: #c99a86;
          font-size: 25px;
        }

        .search-box input {
          width: 100%;
          min-width: 0;
          border: 0;
          outline: 0;
          background: transparent;
          color: #f5f1ee;
          font-family: inherit;
          font-size: 11px;
        }

        .search-box input::placeholder {
          color: #766d6a;
        }

        .clear-search {
          border: 0;
          background: transparent;
          color: #c99a86;
          font-size: 22px;
          cursor: pointer;
        }

        .sort-control {
          min-width: 205px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 13px;
          border: 1px solid #3a302e;
          background: #151416;
        }

        .sort-control span {
          color: #9f928d;
          white-space: nowrap;
          font-size: 10px;
        }

        .sort-control select {
          width: 100%;
          min-width: 0;
          border: 0;
          outline: 0;
          background: transparent;
          color: #e5d8d2;
          font-family: inherit;
          font-size: 10px;
        }

        .sort-control option {
          background: #171416;
        }

        .results-line {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          margin: 22px 0 14px;
          color: #8f8581;
          font-size: 10px;
        }

        .category-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }

        .category-card {
          min-width: 0;
          overflow: hidden;
          border: 1px solid #352b29;
          background: #151416;
          transition:
            transform .25s ease,
            border-color .25s ease,
            box-shadow .25s ease;
        }

        .category-card:hover {
          transform: translateY(-5px);
          border-color: #9b6e5c;
          box-shadow: 0 18px 45px #0005;
        }

        .card-link {
          display: block;
          height: 100%;
        }

        .card-image {
          position: relative;
          height: 205px;
          overflow: hidden;
          background:
            radial-gradient(circle at 50% 45%, #46302a, #1b1718 72%);
        }

        .card-image > img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform .45s ease;
        }

        .category-card:hover .card-image > img {
          transform: scale(1.045);
        }

        .image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 5px;
          color: #c99a86;
        }

        .image-placeholder span {
          font-family: Georgia, serif;
          font-size: 105px;
          line-height: 1;
        }

        .image-placeholder small {
          font-size: 8px;
          letter-spacing: 3px;
        }

        .card-index {
          position: absolute;
          z-index: 2;
          top: 13px;
          right: 13px;
          padding: 7px 9px;
          border: 1px solid #b68a78;
          background: #100e0dcc;
          color: #e1b8a5;
          font-size: 9px;
          letter-spacing: 1px;
        }

        .image-overlay {
          position: absolute;
          inset: 45% 0 0;
          background: linear-gradient(transparent, #0b0b0d88);
          pointer-events: none;
        }

        .card-content {
          padding: 20px;
        }

        .card-topline {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .card-eyebrow {
          color: #b18b7d;
          font-size: 8px;
          letter-spacing: 2px;
        }

        .category-arrow {
          width: 27px;
          height: 27px;
          display: grid;
          place-items: center;
          border: 1px solid #594139;
          color: #d2a794;
          font-size: 13px;
          transition: .2s ease;
        }

        .category-card:hover .category-arrow {
          background: #c99a86;
          color: #171113;
        }

        .card-content h3 {
          margin: 14px 0 8px;
          font-size: 18px;
        }

        .card-content > p {
          min-height: 46px;
          margin: 0;
          color: #9e9290;
          font-size: 10px;
          line-height: 2.1;
        }

        .card-footer {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 10px;
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px solid #30292a;
        }

        .product-count {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .product-count strong {
          color: #d6ad9b;
          font-size: 19px;
        }

        .product-count span {
          color: #897d79;
          font-size: 9px;
        }

        .view-link {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #c99a86;
          font-size: 9px;
          white-space: nowrap;
        }

        .view-link b {
          font-size: 15px;
        }

        .category-skeleton {
          min-height: 340px;
          padding-bottom: 20px;
          border: 1px solid #30292a;
          background: #151416;
        }

        .skeleton-image {
          height: 205px;
          background: linear-gradient(
            100deg,
            #1b191a 20%,
            #292222 40%,
            #1b191a 60%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }

        .skeleton-line {
          width: 65%;
          height: 9px;
          margin: 17px 20px 0;
          background: #30292a;
        }

        .skeleton-line.wide {
          width: 48%;
          height: 13px;
          margin-top: 22px;
        }

        .skeleton-line.short {
          width: 35%;
        }

        @keyframes shimmer {
          to {
            background-position: -200% 0;
          }
        }

        .state-card {
          max-width: 620px;
          margin: 35px auto;
          padding: 45px 25px;
          border: 1px solid #453631;
          background: #151416;
          text-align: center;
        }

        .state-symbol {
          width: 48px;
          height: 48px;
          display: grid;
          place-items: center;
          margin: 0 auto 17px;
          border: 1px solid #c99a86;
          border-radius: 50%;
          color: #c99a86;
          font-size: 23px;
        }

        .state-card h3 {
          margin: 0 0 12px;
          font-size: 18px;
        }

        .state-card p {
          color: #a79a95;
          font-size: 11px;
          line-height: 2.2;
        }

        .state-card button {
          margin-top: 15px;
          padding: 12px 19px;
          border: 1px solid #c99a86;
          background: #c99a86;
          color: #171113;
          font-family: inherit;
          font-size: 11px;
          cursor: pointer;
        }

        .wholesale-banner {
          position: relative;
          width: min(1200px, 88%);
          min-height: 190px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 30px;
          overflow: hidden;
          margin: 0 auto 80px;
          padding: 35px 45px;
          border: 1px solid #664b40;
          background:
            radial-gradient(circle at 10% 50%, #56382d77, transparent 35%),
            linear-gradient(110deg, #211817, #151315);
        }

        .banner-decoration {
          position: absolute;
          left: 25%;
          top: -85px;
          color: #c99a86;
          opacity: .055;
          font-family: Georgia, serif;
          font-size: 270px;
          pointer-events: none;
        }

        .banner-copy {
          position: relative;
          z-index: 1;
        }

        .banner-copy > span {
          color: #c99a86;
          font-size: 9px;
          letter-spacing: 3px;
        }

        .banner-copy h2 {
          margin: 12px 0 8px;
          font-size: 23px;
        }

        .banner-copy p {
          max-width: 600px;
          margin: 0;
          color: #aa9c96;
          font-size: 11px;
          line-height: 2.1;
        }

        .wholesale-banner > a {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 20px;
          flex-shrink: 0;
          padding: 15px 20px;
          background: #c99a86;
          color: #171113;
          font-size: 11px;
          font-weight: 800;
        }

        .wholesale-banner > a span {
          font-size: 16px;
        }

        .footer {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 30px 6%;
          border-top: 1px solid #30292a;
          background: #09090b;
        }

        .footer > div {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .footer > div strong {
          color: #d4aa98;
          font-size: 11px;
          letter-spacing: 2px;
        }

        .footer > div span {
          color: #887b77;
          font-size: 8px;
          letter-spacing: 1.5px;
        }

        .footer nav {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
        }

        .footer nav a {
          color: #a99b96;
          font-size: 10px;
        }

        .footer nav a:hover {
          color: #c99a86;
        }

        .footer > small {
          color: #766d6a;
          font-size: 9px;
        }

        @media (max-width: 900px) {
          .main-nav {
            gap: 13px;
          }

          .main-nav a {
            font-size: 10px;
          }

          .hero-inner {
            gap: 20px;
          }

          .category-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 650px) {
          .container {
            width: 90%;
          }

          .topbar-inner {
            min-height: 75px;
            flex-wrap: wrap;
            padding: 13px 0;
            gap: 14px;
          }

          .brand-mark {
            width: 38px;
            height: 38px;
            font-size: 25px;
          }

          .brand-copy strong {
            font-size: 10px;
          }

          .main-nav {
            order: 3;
            width: 100%;
            justify-content: space-between;
            gap: 8px;
            padding-top: 9px;
            border-top: 1px solid #292326;
          }

          .main-nav a {
            font-size: 9px;
          }

          .header-actions {
            gap: 10px;
          }

          .header-actions a {
            font-size: 9px;
          }

          .header-actions .cart-link {
            gap: 6px;
            padding: 9px;
          }

          .hero-inner {
            grid-template-columns: 1fr;
            padding-top: 55px;
            padding-bottom: 25px;
          }

          .hero-copy h1 {
            font-size: 30px;
          }

          .hero-copy > p {
            font-size: 11px;
          }

          .hero-trust {
            font-size: 8px;
            gap: 7px;
          }

          .hero-art {
            min-height: 270px;
          }

          .ring-one {
            width: 220px;
            height: 220px;
          }

          .ring-two {
            width: 180px;
            height: 280px;
          }

          .art-center {
            width: 130px;
            height: 130px;
          }

          .art-center span {
            font-size: 75px;
          }

          .label-top {
            right: 2%;
            top: 12px;
          }

          .label-bottom {
            left: 2%;
            bottom: 5px;
          }

          .catalog-section {
            padding: 55px 0;
          }

          .section-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .section-heading h2 {
            font-size: 23px;
          }

          .catalog-stats {
            width: 100%;
          }

          .catalog-stats > div {
            flex: 1;
            min-width: 0;
          }

          .toolbar {
            flex-direction: column;
          }

          .search-box {
            min-height: 48px;
          }

          .sort-control {
            min-height: 46px;
          }

          .category-grid {
            grid-template-columns: 1fr;
            gap: 14px;
          }

          .card-image {
            height: 210px;
          }

          .card-content h3 {
            font-size: 17px;
          }

          .results-line {
            font-size: 9px;
          }

          .wholesale-banner {
            width: 90%;
            align-items: stretch;
            flex-direction: column;
            margin-bottom: 50px;
            padding: 27px 22px;
          }

          .banner-copy h2 {
            font-size: 20px;
          }

          .wholesale-banner > a {
            justify-content: center;
          }

          .footer {
            align-items: flex-start;
            flex-direction: column;
            padding: 27px 5%;
          }

          .footer nav {
            gap: 15px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            scroll-behavior: auto !important;
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: .01ms !important;
          }
        }
      `}</style>
    </main>
  );
}
