
"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Product = {
  id: string;
  name: string;
  slug: string;
  sku?: string;
  short_description?: string;
  description?: string;
  image?: string | null;
  category?: {
    id: number | string;
    name: string;
    slug: string;
  } | null;
  brand?: {
    id: number | string;
    name: string;
    slug: string;
  } | null;
  public_price?: number | string | null;
  availability?: string;
  minimum_order_quantity?: number;
  units_per_carton?: number;
  is_featured?: boolean;
};

type ProductResponse = {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: Product[];
};

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://jalali-cosmetics-api.onrender.com/api/store"
).replace(/\/+$/, "");

const PAGE_SIZE = 24;

function formatPrice(value?: number | string | null) {
  const price = Number(value || 0);

  if (!Number.isFinite(price) || price <= 0) {
    return "برای استعلام تماس بگیرید";
  }

  return (
    new Intl.NumberFormat("fa-IR").format(price) +
    " تومان"
  );
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

function normalizeProducts(data: ProductResponse | Product[]) {
  if (Array.isArray(data)) {
    return {
      results: data,
      count: data.length,
      next: null,
      previous: null,
    };
  }

  return {
    results: Array.isArray(data.results) ? data.results : [],
    count: Number(data.count || 0),
    next: data.next || null,
    previous: data.previous || null,
  };
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [availability, setAvailability] = useState("");
  const [ordering, setOrdering] = useState("-created_at");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [page, setPage] = useState(1);

  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const totalPages = Math.max(
    1,
    Math.ceil(total / PAGE_SIZE)
  );

  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    params.set("page", String(page));
    params.set("page_size", String(PAGE_SIZE));

    if (search.trim()) {
      params.set("search", search.trim());
    }

    if (category.trim()) {
      params.set("category", category.trim());
    }

    if (brand.trim()) {
      params.set("brand", brand.trim());
    }

    if (availability) {
      params.set("availability", availability);
    }

    if (ordering) {
      params.set("ordering", ordering);
    }

    if (minPrice.trim()) {
      params.set("min_price", minPrice.trim());
    }

    if (maxPrice.trim()) {
      params.set("max_price", maxPrice.trim());
    }

    return params.toString();
  }, [
    page,
    search,
    category,
    brand,
    availability,
    ordering,
    minPrice,
    maxPrice,
  ]);

  const loadProducts = useCallback(
    async (signal: AbortSignal) => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_BASE}/products/?${queryString}`,
          {
            method: "GET",
            cache: "no-store",
            headers: {
              Accept: "application/json",
            },
            signal,
          }
        );

        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? "مسیر دریافت محصولات پیدا نشد."
              : "دریافت فهرست محصولات با مشکل مواجه شد."
          );
        }

        const data: ProductResponse | Product[] =
          await response.json();

        const normalized = normalizeProducts(data);

        setProducts(normalized.results);
        setTotal(normalized.count);
      } catch (err) {
        if (
          err instanceof Error &&
          err.name === "AbortError"
        ) {
          return;
        }

        setProducts([]);
        setTotal(0);

        setError(
          err instanceof Error
            ? err.message
            : "خطای نامشخص در دریافت محصولات."
        );
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    },
    [queryString]
  );

  useEffect(() => {
    const controller = new AbortController();

    loadProducts(controller.signal);

    return () => controller.abort();
  }, [loadProducts]);

  function resetFilters() {
    setSearch("");
    setCategory("");
    setBrand("");
    setAvailability("");
    setOrdering("-created_at");
    setMinPrice("");
    setMaxPrice("");
    setPage(1);
  }

  function changeFilter(
    setter: (value: string) => void,
    value: string
  ) {
    setter(value);
    setPage(1);
  }

  function goToPage(nextPage: number) {
    if (nextPage < 1 || nextPage > totalPages) return;

    setPage(nextPage);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  return (
    <main className="products-page" dir="rtl">
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
            <Link href="/categories">دسته‌بندی‌ها</Link>
            <Link href="/brands">برندها</Link>
            <Link href="/about">درباره ما</Link>
          </nav>

          <div className="header-actions">
            <Link href="/account" className="header-link">
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
              JALALI PRODUCT COLLECTION
            </span>

            <h1>
              مجموعه محصولات
              <span>آرایشی و بهداشتی</span>
            </h1>

            <p>
              محصولات فروشگاه را بررسی کنید، جست‌وجو کنید
              و بر اساس دسته‌بندی، برند و وضعیت موجودی
              کالای موردنظر خود را پیدا کنید.
            </p>

            <div className="hero-actions">
              <a href="#catalog" className="primary-button">
                مشاهده محصولات
                <span>←</span>
              </a>

              <Link
                href="/partner"
                className="secondary-button"
              >
                شرایط همکاری
              </Link>
            </div>

            <div className="hero-trust">
              <span>✦</span>
              عرضه عمده محصولات
              <i />
              ارسال سراسری ایران
              <i />
              اطلاعات موجودی از سامانه
            </div>
          </div>

          <div className="hero-art">
            <div className="art-ring ring-one" />
            <div className="art-ring ring-two" />

            <div className="art-center">
              <span>J</span>
              <small>JALALI</small>
            </div>

            <div className="art-floating floating-top">
              <span>✦</span>
              <strong>BEAUTY</strong>
              <small>COLLECTION</small>
            </div>

            <div className="art-floating floating-bottom">
              <strong>WHOLESALE</strong>
              <small>BUSINESS PARTNER</small>
            </div>
          </div>
        </div>
      </section>

      <section className="catalog-section" id="catalog">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                EXPLORE OUR PRODUCTS
              </span>

              <h2>فهرست محصولات</h2>

              <p>
                جست‌وجو و بررسی محصولات موجود در کاتالوگ
                رسمی پخش جلالی
              </p>
            </div>

            <div className="result-count">
              <span>تعداد نتایج</span>
              <strong>
                {total.toLocaleString("fa-IR")}
              </strong>
              <small>محصول</small>
            </div>
          </div>

          <div className="search-panel">
            <div className="search-box">
              <span className="search-icon">⌕</span>

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  changeFilter(setSearch, event.target.value)
                }
                placeholder="نام محصول، کد کالا یا عبارت موردنظر..."
                aria-label="جست‌وجوی محصولات"
              />

              {search && (
                <button
                  type="button"
                  className="clear-search"
                  onClick={() => changeFilter(setSearch, "")}
                  aria-label="پاک کردن جست‌وجو"
                >
                  ×
                </button>
              )}
            </div>

            <button
              type="button"
              className="filter-toggle"
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              <span>☷</span>
              فیلترهای پیشرفته
              <span className="toggle-arrow">
                {filtersOpen ? "−" : "+"}
              </span>
            </button>
          </div>

          {filtersOpen && (
            <div className="filter-panel">
              <div className="filter-field">
                <label htmlFor="category">
                  شناسه دسته‌بندی
                </label>

                <input
                  id="category"
                  value={category}
                  onChange={(event) =>
                    changeFilter(setCategory, event.target.value)
                  }
                  placeholder="نام یا شناسه دسته‌بندی"
                />
              </div>

              <div className="filter-field">
                <label htmlFor="brand">
                  شناسه برند
                </label>

                <input
                  id="brand"
                  value={brand}
                  onChange={(event) =>
                    changeFilter(setBrand, event.target.value)
                  }
                  placeholder="نام یا شناسه برند"
                />
              </div>

              <div className="filter-field">
                <label htmlFor="availability">
                  وضعیت موجودی
                </label>

                <select
                  id="availability"
                  value={availability}
                  onChange={(event) =>
                    changeFilter(
                      setAvailability,
                      event.target.value
                    )
                  }
                >
                  <option value="">همه وضعیت‌ها</option>
                  <option value="in_stock">موجود</option>
                  <option value="out_of_stock">ناموجود</option>
                </select>
              </div>

              <div className="filter-field">
                <label htmlFor="ordering">
                  مرتب‌سازی
                </label>

                <select
                  id="ordering"
                  value={ordering}
                  onChange={(event) =>
                    changeFilter(setOrdering, event.target.value)
                  }
                >
                  <option value="-created_at">
                    جدیدترین محصولات
                  </option>
                  <option value="created_at">
                    قدیمی‌ترین محصولات
                  </option>
                  <option value="name">
                    نام محصول: صعودی
                  </option>
                  <option value="-name">
                    نام محصول: نزولی
                  </option>
                  <option value="public_price">
                    قیمت: کم به زیاد
                  </option>
                  <option value="-public_price">
                    قیمت: زیاد به کم
                  </option>
                </select>
              </div>

              <div className="filter-field">
                <label htmlFor="minPrice">
                  حداقل قیمت (تومان)
                </label>

                <input
                  id="minPrice"
                  inputMode="numeric"
                  value={minPrice}
                  onChange={(event) =>
                    changeFilter(setMinPrice, event.target.value)
                  }
                  placeholder="حداقل قیمت"
                />
              </div>

              <div className="filter-field">
                <label htmlFor="maxPrice">
                  حداکثر قیمت (تومان)
                </label>

                <input
                  id="maxPrice"
                  inputMode="numeric"
                  value={maxPrice}
                  onChange={(event) =>
                    changeFilter(setMaxPrice, event.target.value)
                  }
                  placeholder="حداکثر قیمت"
                />
              </div>

              <div className="filter-actions">
                <button
                  type="button"
                  className="reset-button"
                  onClick={resetFilters}
                >
                  پاک کردن فیلترها
                </button>
              </div>
            </div>
          )}

          <div className="catalog-toolbar">
            <div>
              <span className="toolbar-dot" />
              کاتالوگ محصولات
            </div>

            <span>
              {loading
                ? "در حال به‌روزرسانی..."
                : `${products.length.toLocaleString("fa-IR")} محصول در این صفحه`}
            </span>
          </div>

          {loading ? (
            <div className="state-box">
              <div className="spinner" />
              <h3>در حال دریافت کاتالوگ</h3>
              <p>
                اطلاعات محصولات از سامانه فروشگاه دریافت
                می‌شود.
              </p>
            </div>
          ) : error ? (
            <div className="state-box error-box">
              <span className="state-symbol">!</span>
              <h3>دریافت محصولات ناموفق بود</h3>
              <p>{error}</p>

              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  const controller = new AbortController();
                  loadProducts(controller.signal);
                }}
              >
                تلاش مجدد
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="state-box">
              <span className="empty-symbol">◇</span>
              <h3>محصولی پیدا نشد</h3>
              <p>
                برای مشاهده نتایج بیشتر، عبارت جست‌وجو یا
                فیلترهای انتخاب‌شده را تغییر دهید.
              </p>

              <button
                type="button"
                className="secondary-button"
                onClick={resetFilters}
              >
                حذف همه فیلترها
              </button>
            </div>
          ) : (
            <div className="products-grid">
              {products.map((product) => {
                const image = mediaUrl(product.image);
                const available =
                  product.availability === "in_stock";

                return (
                  <article
                    className="product-card"
                    key={product.id}
                  >
                    <Link
                      href={`/products/${encodeURIComponent(
                        product.slug || product.id
                      )}`}
                      className="product-image"
                    >
                      {image ? (
                        <img
                          src={image}
                          alt={product.name}
                          loading="lazy"
                        />
                      ) : (
                        <div className="image-placeholder">
                          <span>J</span>
                          <small>JALALI COSMETICS</small>
                        </div>
                      )}

                      {product.is_featured && (
                        <span className="featured-label">
                          منتخب
                        </span>
                      )}

                      <span className="image-arrow">↗</span>
                    </Link>

                    <div className="product-details">
                      <div className="product-meta">
                        <span>
                          {product.brand?.name || "JALALI"}
                        </span>

                        <span
                          className={
                            available
                              ? "stock stock-in"
                              : "stock stock-out"
                          }
                        >
                          {available ? "موجود" : "ناموجود"}
                        </span>
                      </div>

                      <Link
                        href={`/products/${encodeURIComponent(
                          product.slug || product.id
                        )}`}
                      >
                        <h3>{product.name}</h3>
                      </Link>

                      <p className="product-description">
                        {product.short_description ||
                          product.category?.name ||
                          "محصول آرایشی و بهداشتی"}
                      </p>

                      <div className="product-price">
                        <span>قیمت مصرف‌کننده</span>
                        <strong>
                          {formatPrice(product.public_price)}
                        </strong>
                      </div>

                      <div className="product-footer">
                        <span>
                          حداقل سفارش:{" "}
                          {Number(
                            product.minimum_order_quantity || 1
                          ).toLocaleString("fa-IR")}
                        </span>

                        <Link
                          href={`/products/${encodeURIComponent(
                            product.slug || product.id
                          )}`}
                          aria-label={`مشاهده ${product.name}`}
                        >
                          مشاهده محصول
                          <span>←</span>
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {!loading && !error && totalPages > 1 && (
            <div className="pagination">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
              >
                صفحه قبل
              </button>

              <div className="page-numbers">
                {Array.from(
                  { length: Math.min(totalPages, 5) },
                  (_, index) => {
                    let pageNumber = index + 1;

                    if (totalPages > 5 && page > 3) {
                      pageNumber = page - 2 + index;
                    }

                    if (pageNumber > totalPages) return null;

                    return (
                      <button
                        type="button"
                        key={pageNumber}
                        className={
                          page === pageNumber ? "active" : ""
                        }
                        onClick={() => goToPage(pageNumber)}
                      >
                        {pageNumber.toLocaleString("fa-IR")}
                      </button>
                    );
                  }
                )}
              </div>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => goToPage(page + 1)}
              >
                صفحه بعد
              </button>
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

            <h2>برای همکاری عمده آماده‌اید؟</h2>

            <p>
              برای بررسی شرایط همکاری و دریافت اطلاعات
              حساب همکاران، به بخش ثبت درخواست همکاری
              مراجعه کنید.
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
        .products-page {
          min-height: 100vh;
          background: #0b0b0d;
          color: #f5f1ee;
          overflow: hidden;
        }

        .container {
          width: min(1440px, calc(100% - 48px));
          margin-inline: auto;
        }

        .topbar {
          position: sticky;
          top: 0;
          z-index: 20;
          background: rgba(11, 11, 13, 0.94);
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
          border: 1px solid #c99a86;
          color: #c99a86;
          font-family: Georgia, serif;
          font-size: 27px;
          border-radius: 12px 12px 3px 12px;
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
          gap: 25px;
          font-size: 12px;
          color: #c4b9b4;
        }

        .main-nav a:hover,
        .header-link:hover {
          color: #c99a86;
        }

        .cart-link {
          min-height: 42px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 15px;
          border: 1px solid rgba(201, 154, 134, 0.5);
          border-radius: 10px;
          color: #e1b9a8;
        }

        .hero {
          position: relative;
          border-bottom: 1px solid rgba(201, 154, 134, 0.13);
          background:
            radial-gradient(
              ellipse at 18% 45%,
              rgba(201, 154, 134, 0.12),
              transparent 38%
            ),
            linear-gradient(120deg, #111012, #0b0b0d 65%);
        }

        .hero-inner {
          min-height: 490px;
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          align-items: center;
          gap: 50px;
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
          font-size: clamp(34px, 5vw, 59px);
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
          justify-content: center;
          align-items: center;
          gap: 16px;
          padding: 0 22px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 800;
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
          width: min(100%, 420px);
          aspect-ratio: 1;
          justify-self: center;
          display: grid;
          place-items: center;
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

        .art-floating {
          position: absolute;
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 13px 16px;
          border: 1px solid rgba(201, 154, 134, 0.35);
          border-radius: 10px;
          background: rgba(20, 18, 19, 0.94);
          box-shadow: 0 15px 40px #0008;
        }

        .art-floating strong {
          color: #e1b9a8;
          font-size: 11px;
          letter-spacing: 2px;
        }

        .art-floating small {
          color: #928783;
          font-size: 8px;
          letter-spacing: 1.5px;
        }

        .floating-top {
          top: 12%;
          right: -2%;
        }

        .floating-top span {
          color: #c99a86;
        }

        .floating-bottom {
          bottom: 13%;
          left: -2%;
        }

        .catalog-section {
          padding-block: 75px 90px;
        }

        .section-heading {
          display: flex;
          justify-content: space-between;
          align-items: end;
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
          min-width: 130px;
          padding: 15px 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px solid rgba(201, 154, 134, 0.22);
          border-radius: 12px;
          background: #141417;
        }

        .result-count span,
        .result-count small {
          color: #aaa1a0;
          font-size: 10px;
        }

        .result-count strong {
          color: #c99a86;
          font-size: 22px;
        }

        .search-panel {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 12px;
          margin-bottom: 14px;
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

        .search-box input {
          width: 100%;
          min-width: 0;
          height: 55px;
          color: #f5f1ee;
          background: transparent;
          border: 0;
          outline: 0;
          font-size: 12px;
        }

        .search-box input:focus {
          border: 0;
          outline: 0;
        }

        .clear-search {
          color: #c99a86;
          background: transparent;
          border: 0;
          font-size: 24px;
        }

        .filter-toggle {
          min-width: 190px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 0 15px;
          color: #e1b9a8;
          background: #19191d;
          border: 1px solid rgba(201, 154, 134, 0.3);
          border-radius: 12px;
          font-size: 11px;
        }

        .toggle-arrow {
          font-size: 17px;
        }

        .filter-panel {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
          margin-bottom: 24px;
          padding: 23px;
          border: 1px solid rgba(201, 154, 134, 0.2);
          border-radius: 14px;
          background: #141417;
        }

        .filter-field {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .filter-field label {
          color: #c9bdb8;
          font-size: 11px;
        }

        .filter-field input,
        .filter-field select {
          width: 100%;
          min-height: 45px;
          padding: 0 12px;
          color: #f5f1ee;
          background: #0b0b0d;
          border: 1px solid rgba(201, 154, 134, 0.22);
          border-radius: 8px;
          outline: none;
          font-size: 11px;
        }

        .filter-field input:focus,
        .filter-field select:focus {
          border-color: #c99a86;
        }

        .filter-field select option {
          background: #141417;
        }

        .filter-actions {
          display: flex;
          align-items: end;
        }

        .reset-button {
          min-height: 45px;
          padding: 0 18px;
          color: #e1b9a8;
          background: transparent;
          border: 1px solid rgba(201, 154, 134, 0.4);
          border-radius: 8px;
          font-size: 11px;
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
          border-radius: 50%;
          background: #c99a86;
          box-shadow: 0 0 12px #c99a86;
        }

        .products-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 20px;
        }

        .product-card {
          min-width: 0;
          overflow: hidden;
          border: 1px solid rgba(201, 154, 134, 0.17);
          border-radius: 15px;
          background: #141417;
          transition: 0.25s ease;
        }

        .product-card:hover {
          transform: translateY(-5px);
          border-color: rgba(201, 154, 134, 0.7);
          box-shadow: 0 18px 40px #0005;
        }

        .product-image {
          position: relative;
          display: block;
          aspect-ratio: 1 / 0.92;
          overflow: hidden;
          background: #1c1b20;
        }

        .product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.35s ease;
        }

        .product-card:hover .product-image img {
          transform: scale(1.045);
        }

        .image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 10px;
          background:
            radial-gradient(
              circle,
              rgba(201, 154, 134, 0.12),
              transparent 65%
            ),
            #19191d;
        }

        .image-placeholder span {
          color: #c99a86;
          font-family: Georgia, serif;
          font-size: 75px;
        }

        .image-placeholder small {
          color: #8f817b;
          font-size: 8px;
          letter-spacing: 2px;
        }

        .featured-label {
          position: absolute;
          top: 12px;
          right: 12px;
          padding: 6px 10px;
          color: #171112;
          background: #c99a86;
          border-radius: 20px;
          font-size: 9px;
          font-weight: 800;
        }

        .image-arrow {
          position: absolute;
          left: 12px;
          bottom: 12px;
          width: 30px;
          height: 30px;
          display: grid;
          place-items: center;
          color: #e1b9a8;
          background: #0b0b0ddd;
          border: 1px solid rgba(201, 154, 134, 0.4);
          border-radius: 50%;
        }

        .product-details {
          padding: 16px;
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
          padding: 5px 8px;
          border-radius: 20px;
          font-size: 9px;
        }

        .stock-in {
          color: #79c5a2;
          background: rgba(97, 185, 149, 0.1);
        }

        .stock-out {
          color: #d98a8a;
          background: rgba(217, 138, 138, 0.1);
        }

        .product-details h3 {
          min-height: 46px;
          margin: 13px 0 7px;
          color: #f5f1ee;
          font-size: 13px;
          line-height: 1.9;
        }

        .product-description {
          min-height: 36px;
          margin: 0;
          color: #938985;
          font-size: 10px;
          line-height: 1.8;
        }

        .product-price {
          display: flex;
          flex-direction: column;
          gap: 7px;
          margin-top: 15px;
          padding-top: 13px;
          border-top: 1px solid rgba(201, 154, 134, 0.13);
        }

        .product-price span {
          color: #938985;
          font-size: 9px;
        }

        .product-price strong {
          color: #e1b9a8;
          font-size: 12px;
          line-height: 1.8;
        }

        .product-footer {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: 15px;
          color: #938985;
          font-size: 9px;
        }

        .product-footer a {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #c99a86;
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
          max-width: 500px;
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

        .error-box .primary-button {
          margin-top: 12px;
        }

        .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 15px;
          margin-top: 40px;
        }

        .pagination > button,
        .page-numbers button {
          min-width: 42px;
          min-height: 42px;
          padding: 0 12px;
          color: #d6c9c3;
          background: #141417;
          border: 1px solid rgba(201, 154, 134, 0.22);
          border-radius: 9px;
          font-size: 11px;
        }

        .pagination button:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .page-numbers {
          display: flex;
          gap: 7px;
        }

        .page-numbers button.active {
          color: #171112;
          background: #c99a86;
          border-color: #c99a86;
          font-weight: 900;
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

        @media (max-width: 1050px) {
          .main-nav {
            gap: 13px;
          }

          .products-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .hero-inner {
            gap: 20px;
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
            padding-block: 50px;
          }

          .hero-copy h1 {
            font-size: 38px;
          }

          .hero-art {
            width: min(75%, 330px);
            margin-top: 15px;
          }

          .art-center span {
            font-size: 80px;
          }

          .catalog-section {
            padding-block: 48px 60px;
          }

          .section-heading {
            align-items: start;
          }

          .result-count {
            min-width: 100px;
            padding: 10px;
            flex-wrap: wrap;
            gap: 5px;
          }

          .search-panel {
            grid-template-columns: 1fr;
          }

          .filter-toggle {
            min-height: 48px;
          }

          .filter-panel {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            padding: 15px;
            gap: 13px;
          }

          .products-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
          }

          .product-details {
            padding: 12px;
          }

          .product-details h3 {
            font-size: 11px;
          }

          .product-price strong {
            font-size: 10px;
          }

          .product-footer {
            flex-direction: column;
            align-items: flex-start;
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

        @media (max-width: 420px) {
          .header-link {
            display: none;
          }

          .section-heading {
            flex-direction: column;
          }

          .result-count {
            width: 100%;
          }

          .filter-panel {
            grid-template-columns: 1fr;
          }

          .hero-copy h1 {
            font-size: 32px;
          }

          .hero-trust {
            line-height: 2;
          }

          .products-grid {
            gap: 9px;
          }

          .product-details {
            padding: 10px;
          }

          .product-meta {
            font-size: 8px;
          }

          .product-description {
            font-size: 9px;
          }

          .product-footer {
            font-size: 8px;
          }

          .pagination {
            gap: 7px;
          }

          .pagination > button {
            font-size: 9px;
          }
        }
      `}</style>
    </main>
  );
}
