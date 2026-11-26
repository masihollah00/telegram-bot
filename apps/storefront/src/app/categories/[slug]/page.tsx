
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type Category = {
  id: number | string;
  name: string;
  slug: string;
  description?: string;
  image?: string | null;
  product_count?: number;
};

type Brand = {
  id: number | string;
  name: string;
  slug: string;
  logo?: string | null;
};

type Product = {
  id: string | number;
  name: string;
  slug: string;
  sku: string;
  short_description?: string;
  image?: string | null;
  public_price: number | string;
  availability: string;
  minimum_order_quantity?: number;
  is_featured?: boolean;
  brand?: Brand | null;
};

type ApiList<T> = {
  count?: number;
  results?: T[];
  next?: string | null;
  previous?: string | null;
};

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://jalali-cosmetics-api.onrender.com/api/store"
).replace(/\/+$/, "");

const PAGE_SIZE = 24;

function mediaUrl(path?: string | null): string {
  if (!path) return "";

  if (/^https?:\/\//i.test(path)) return path;

  try {
    return new URL(path, new URL(API_BASE).origin).toString();
  } catch {
    return path;
  }
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("fa-IR").format(value);
}

function formatPrice(value: number | string): string {
  const price = Number(value || 0);

  if (!Number.isFinite(price) || price <= 0) {
    return "استعلام قیمت";
  }

  return `${formatNumber(price)} تومان`;
}

function getItems<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];

  if (
    data &&
    typeof data === "object" &&
    "results" in data &&
    Array.isArray((data as ApiList<T>).results)
  ) {
    return (data as ApiList<T>).results || [];
  }

  return [];
}

function productLink(product: Product): string {
  return `/products/${encodeURIComponent(
    product.slug || String(product.id)
  )}`;
}

export default function CategoryDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug || "";

  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [availability, setAvailability] = useState("");
  const [ordering, setOrdering] = useState("-created_at");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingCategory, setLoadingCategory] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState("");
  const [mobileFilters, setMobileFilters] = useState(false);

  const totalPages = Math.max(
    1,
    Math.ceil(totalCount / PAGE_SIZE)
  );

  const loadCategory = useCallback(async (signal: AbortSignal) => {
    if (!slug) return;

    setLoadingCategory(true);

    try {
      const response = await fetch(
        `${API_BASE}/categories/${encodeURIComponent(slug)}/`,
        {
          headers: { Accept: "application/json" },
          cache: "no-store",
          signal,
        }
      );

      if (!response.ok) {
        throw new Error(
          response.status === 404
            ? "این دسته‌بندی در فروشگاه پیدا نشد."
            : "دریافت اطلاعات دسته‌بندی ناموفق بود."
        );
      }

      const data = (await response.json()) as Category;

      if (!data || !data.id || !data.name) {
        throw new Error("اطلاعات دسته‌بندی معتبر نیست.");
      }

      setCategory(data);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;

      setCategory(null);
      setError(
        err instanceof Error
          ? err.message
          : "خطای نامشخص در دریافت دسته‌بندی."
      );
    } finally {
      if (!signal.aborted) setLoadingCategory(false);
    }
  }, [slug]);

  const loadProducts = useCallback(async (signal: AbortSignal) => {
    if (!slug) return;

    setLoadingProducts(true);

    try {
      const query = new URLSearchParams();

      query.set("category", slug);
      query.set("page", String(page));
      query.set("page_size", String(PAGE_SIZE));

      if (search.trim()) {
        query.set("search", search.trim());
      }

      if (availability) {
        query.set("availability", availability);
      }

      if (ordering) {
        query.set("ordering", ordering);
      }

      const response = await fetch(
        `${API_BASE}/products/?${query.toString()}`,
        {
          headers: { Accept: "application/json" },
          cache: "no-store",
          signal,
        }
      );

      if (!response.ok) {
        throw new Error("دریافت محصولات این دسته‌بندی ناموفق بود.");
      }

      const data: unknown = await response.json();
      const items = getItems<Product>(data);

      setProducts(items);

      if (Array.isArray(data)) {
        setTotalCount(data.length);
      } else if (
        data &&
        typeof data === "object" &&
        "count" in data
      ) {
        setTotalCount(Number((data as ApiList<Product>).count || 0));
      } else {
        setTotalCount(items.length);
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;

      setProducts([]);
      setTotalCount(0);
      setError(
        err instanceof Error
          ? err.message
          : "خطای نامشخص در دریافت محصولات."
      );
    } finally {
      if (!signal.aborted) setLoadingProducts(false);
    }
  }, [slug, page, search, availability, ordering]);

  useEffect(() => {
    const controller = new AbortController();
    loadCategory(controller.signal);
    return () => controller.abort();
  }, [loadCategory]);

  useEffect(() => {
    const controller = new AbortController();
    loadProducts(controller.signal);
    return () => controller.abort();
  }, [loadProducts]);

  const availableCount = useMemo(
    () =>
      products.filter(
        (item) => item.availability === "in_stock"
      ).length,
    [products]
  );

  function resetFilters() {
    setSearch("");
    setAvailability("");
    setOrdering("-created_at");
    setPage(1);
  }

  function changePage(nextPage: number) {
    if (nextPage < 1 || nextPage > totalPages) return;

    setPage(nextPage);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  if (loadingCategory) {
    return (
      <main className="category-state" dir="rtl">
        <div className="state-mark">J</div>
        <div className="state-spinner" />
        <p>در حال دریافت اطلاعات دسته‌بندی...</p>
        <style jsx>{`
          .category-state {
            min-height: 75vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 18px;
            color: #f5f1ee;
            background: #0b0b0d;
          }
          .state-mark {
            width: 68px;
            height: 68px;
            display: grid;
            place-items: center;
            color: #c99a86;
            border: 1px solid #c99a86;
            border-radius: 18px;
            font-family: Georgia, serif;
            font-size: 38px;
          }
          .state-spinner {
            width: 30px;
            height: 30px;
            border: 2px solid #352a29;
            border-top-color: #c99a86;
            border-radius: 50%;
            animation: spin .8s linear infinite;
          }
          p {
            color: #aaa1a0;
            font-size: 12px;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </main>
    );
  }

  if (!category) {
    return (
      <main className="category-state" dir="rtl">
        <div className="error-mark">!</div>
        <h1>دسته‌بندی در دسترس نیست</h1>
        <p>{error || "اطلاعات این دسته‌بندی پیدا نشد."}</p>
        <Link href="/categories">بازگشت به دسته‌بندی‌ها</Link>

        <style jsx>{`
          .category-state {
            min-height: 75vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 15px;
            padding: 25px;
            color: #f5f1ee;
            background: #0b0b0d;
            text-align: center;
          }
          .error-mark {
            width: 55px;
            height: 55px;
            display: grid;
            place-items: center;
            color: #df8888;
            border: 1px solid #df8888;
            border-radius: 50%;
            font-size: 25px;
          }
          p {
            color: #aaa1a0;
            font-size: 12px;
          }
          a {
            margin-top: 10px;
            padding: 13px 20px;
            color: #171112;
            background: #c99a86;
            border-radius: 10px;
            font-size: 12px;
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="category-page" dir="rtl">
      <header className="site-header">
        <div className="header-inner">
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
            <Link href="/categories" className="active">دسته‌بندی‌ها</Link>
            <Link href="/brands">برندها</Link>
            <Link href="/about">درباره ما</Link>
          </nav>

          <div className="header-actions">
            <Link href="/account">حساب کاربری</Link>
            <Link href="/cart" className="cart-link">سبد خرید</Link>
          </div>
        </div>
      </header>

      <div className="breadcrumbs">
        <Link href="/">صفحه اصلی</Link>
        <span>/</span>
        <Link href="/categories">دسته‌بندی‌ها</Link>
        <span>/</span>
        <strong>{category.name}</strong>
      </div>

      <section className="category-hero">
        <div className="hero-content">
          <span className="eyebrow">JALALI COSMETICS · COLLECTION</span>
          <h1>{category.name}</h1>

          <p>
            {category.description ||
              `محصولات ثبت‌شده در دسته‌بندی ${category.name} را بررسی کنید و کالای موردنظر خود را پیدا کنید.`}
          </p>

          <div className="hero-actions">
            <a href="#category-products" className="primary-button">
              مشاهده محصولات
              <span>←</span>
            </a>
            <Link href="/partner" className="secondary-button">
              شرایط خرید عمده
            </Link>
          </div>

          <div className="hero-stats">
            <div>
              <strong>{formatNumber(totalCount)}</strong>
              <span>محصول در نتایج</span>
            </div>
            <div>
              <strong>{formatNumber(availableCount)}</strong>
              <span>موجود در صفحه فعلی</span>
            </div>
          </div>
        </div>

        <div className="hero-image">
          {category.image ? (
            <img
              src={mediaUrl(category.image)}
              alt={category.name}
            />
          ) : (
            <div className="image-placeholder">
              <span>J</span>
              <small>JALALI COSMETICS</small>
            </div>
          )}
          <div className="image-label">
            <span>COLLECTION</span>
            <strong>{category.name}</strong>
          </div>
        </div>
      </section>

      <section className="catalog-section" id="category-products">
        <div className="section-heading">
          <div>
            <span className="eyebrow">PRODUCT DIRECTORY</span>
            <h2>محصولات این دسته‌بندی</h2>
            <p>محصولات ثبت‌شده در سامانه پخش جلالی</p>
          </div>

          <button
            type="button"
            className="mobile-filter-toggle"
            onClick={() => setMobileFilters(!mobileFilters)}
          >
            فیلتر و مرتب‌سازی
          </button>
        </div>

        <div className="catalog-layout">
          <aside className={`filters ${mobileFilters ? "open" : ""}`}>
            <div className="filter-heading">
              <div>
                <span>REFINE COLLECTION</span>
                <h3>فیلتر محصولات</h3>
              </div>
              <button type="button" onClick={resetFilters}>
                پاک‌کردن
              </button>
            </div>

            <label htmlFor="availability">وضعیت موجودی</label>
            <select
              id="availability"
              value={availability}
              onChange={(event) => {
                setAvailability(event.target.value);
                setPage(1);
              }}
            >
              <option value="">همه محصولات</option>
              <option value="in_stock">فقط موجودها</option>
              <option value="out_of_stock">فقط ناموجودها</option>
            </select>

            <label htmlFor="ordering">مرتب‌سازی</label>
            <select
              id="ordering"
              value={ordering}
              onChange={(event) => {
                setOrdering(event.target.value);
                setPage(1);
              }}
            >
              <option value="-created_at">جدیدترین محصولات</option>
              <option value="created_at">قدیمی‌ترین محصولات</option>
              <option value="name">نام محصول: صعودی</option>
              <option value="-name">نام محصول: نزولی</option>
              <option value="public_price">ارزان‌ترین</option>
              <option value="-public_price">گران‌ترین</option>
            </select>

            <div className="filter-note">
              <span>✦</span>
              موجودی و اطلاعات محصولات از سامانه فروشگاه دریافت می‌شود.
            </div>
          </aside>

          <div className="products-area">
            <form
              className="search-bar"
              onSubmit={(event) => {
                event.preventDefault();
                setPage(1);
              }}
            >
              <span>⌕</span>
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="جست‌وجو در محصولات این دسته‌بندی..."
                aria-label="جست‌وجو در محصولات"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="پاک کردن جست‌وجو"
                >
                  ×
                </button>
              )}
            </form>

            <div className="results-toolbar">
              <span>
                {formatNumber(totalCount)} محصول
              </span>
              <span>
                صفحه {formatNumber(page)} از {formatNumber(totalPages)}
              </span>
            </div>

            {error && (
              <div className="inline-error" role="alert">
                {error}
              </div>
            )}

            {loadingProducts ? (
              <div className="product-grid">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div className="product-skeleton" key={index}>
                    <div />
                    <span />
                    <span />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="empty-state">
                <span>◇</span>
                <h3>محصولی برای نمایش پیدا نشد</h3>
                <p>
                  ممکن است در این دسته محصولی ثبت نشده باشد یا فیلترهای انتخابی نتیجه‌ای نداشته باشند.
                </p>
                <button type="button" onClick={resetFilters}>
                  پاک کردن فیلترها
                </button>
              </div>
            ) : (
              <div className="product-grid">
                {products.map((product) => {
                  const image = mediaUrl(product.image);
                  const inStock = product.availability === "in_stock";

                  return (
                    <article className="product-card" key={product.id}>
                      <Link
                        href={productLink(product)}
                        className="product-image"
                      >
                        {image ? (
                          <img
                            src={image}
                            alt={product.name}
                            loading="lazy"
                          />
                        ) : (
                          <span className="image-letter">J</span>
                        )}

                        {product.is_featured && (
                          <span className="featured-label">منتخب</span>
                        )}

                        <span
                          className={
                            inStock
                              ? "stock-label in-stock"
                              : "stock-label out-stock"
                          }
                        >
                          {inStock ? "موجود" : "ناموجود"}
                        </span>
                      </Link>

                      <div className="product-info">
                        <span className="product-brand">
                          {product.brand?.name || "JALALI COSMETICS"}
                        </span>

                        <Link
                          href={productLink(product)}
                          className="product-name"
                        >
                          {product.name}
                        </Link>

                        {product.short_description && (
                          <p>{product.short_description}</p>
                        )}

                        <div className="product-meta">
                          <span>کد: {product.sku}</span>
                          <span>
                            حداقل سفارش: {formatNumber(
                              Number(product.minimum_order_quantity || 1)
                            )}
                          </span>
                        </div>

                        <div className="product-bottom">
                          <strong>
                            {formatPrice(product.public_price)}
                          </strong>

                          <Link
                            href={productLink(product)}
                            aria-label={`مشاهده ${product.name}`}
                          >
                            مشاهده
                            <span>←</span>
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {!loadingProducts && totalPages > 1 && (
              <nav className="pagination" aria-label="صفحه‌بندی محصولات">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => changePage(page - 1)}
                >
                  قبلی
                </button>

                <span>
                  {formatNumber(page)} / {formatNumber(totalPages)}
                </span>

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => changePage(page + 1)}
                >
                  بعدی
                </button>
              </nav>
            )}
          </div>
        </div>
      </section>

      <section className="partner-banner">
        <div>
          <span>BUSINESS PARTNERSHIP</span>
          <h2>خرید عمده از پخش جلالی</h2>
          <p>
            برای بررسی شرایط همکاری و دریافت قیمت مخصوص همکاران،
            درخواست همکاری خود را ثبت کنید.
          </p>
        </div>
        <Link href="/partner">
          درخواست همکاری
          <span>←</span>
        </Link>
      </section>

      <footer className="site-footer">
        <div>
          <strong>JALALI COSMETICS</strong>
          <span>BEAUTY. BUSINESS. TRUST.</span>
        </div>
        <nav>
          <Link href="/">صفحه اصلی</Link>
          <Link href="/products">محصولات</Link>
          <Link href="/categories">دسته‌بندی‌ها</Link>
          <Link href="/brands">برندها</Link>
          <Link href="/contact">تماس با ما</Link>
        </nav>
        <small>پخش جلالی · عرضه عمده محصولات آرایشی و بهداشتی</small>
      </footer>

      <style jsx>{`
        .category-page {
          min-height: 100vh;
          color: #f5f1ee;
          background: #0b0b0d;
          overflow: hidden;
        }

        a {
          color: inherit;
          text-decoration: none;
        }

        .site-header {
          position: sticky;
          top: 0;
          z-index: 30;
          background: rgba(11, 11, 13, .95);
          border-bottom: 1px solid rgba(201, 154, 134, .18);
          backdrop-filter: blur(18px);
        }

        .header-inner {
          width: min(1440px, calc(100% - 48px));
          min-height: 80px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 22px;
          margin: auto;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 11px;
          flex-shrink: 0;
        }

        .brand-mark {
          width: 43px;
          height: 43px;
          display: grid;
          place-items: center;
          color: #c99a86;
          border: 1px solid #c99a86;
          border-radius: 12px;
          font-family: Georgia, serif;
          font-size: 27px;
        }

        .brand-copy {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .brand-copy strong {
          font-size: 12px;
          letter-spacing: 1.5px;
        }

        .brand-copy small {
          color: #c99a86;
          font-size: 8px;
          letter-spacing: 1.3px;
        }

        .main-nav,
        .header-actions {
          display: flex;
          align-items: center;
          gap: 20px;
          color: #c4b9b4;
          font-size: 11px;
        }

        .main-nav a:hover,
        .main-nav .active,
        .header-actions a:hover {
          color: #c99a86;
        }

        .cart-link {
          padding: 12px 15px;
          border: 1px solid rgba(201, 154, 134, .4);
          border-radius: 9px;
          color: #e1b9a8;
        }

        .breadcrumbs {
          width: min(1320px, calc(100% - 44px));
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 12px;
          margin: auto;
          padding: 25px 0;
          color: #8f8581;
          font-size: 11px;
        }

        .breadcrumbs strong {
          color: #e1b9a8;
        }

        .category-hero {
          width: min(1320px, calc(100% - 44px));
          min-height: 410px;
          display: grid;
          grid-template-columns: 1.1fr .9fr;
          align-items: center;
          gap: 50px;
          margin: 0 auto 55px;
          padding: 40px;
          background:
            radial-gradient(ellipse at 85% 40%, rgba(201,154,134,.13), transparent 45%),
            linear-gradient(120deg, #151316, #100f11);
          border: 1px solid rgba(201,154,134,.18);
          border-radius: 22px;
        }

        .eyebrow {
          color: #c99a86;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2px;
        }

        .hero-content h1 {
          margin: 20px 0 15px;
          font-size: clamp(32px, 4vw, 49px);
          line-height: 1.5;
        }

        .hero-content > p {
          max-width: 620px;
          color: #aaa1a0;
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
          min-height: 47px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 13px;
          padding: 0 20px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 800;
        }

        .primary-button {
          color: #171112;
          background: #c99a86;
        }

        .secondary-button {
          color: #e1b9a8;
          border: 1px solid rgba(201,154,134,.45);
        }

        .hero-stats {
          display: flex;
          gap: 30px;
          margin-top: 35px;
        }

        .hero-stats div {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .hero-stats strong {
          color: #e1b9a8;
          font-size: 23px;
        }

        .hero-stats span {
          color: #928783;
          font-size: 10px;
        }

        .hero-image {
          position: relative;
          min-height: 310px;
          display: grid;
          place-items: center;
          overflow: hidden;
          background: #1b181b;
          border: 1px solid rgba(201,154,134,.25);
          border-radius: 18px;
        }

        .hero-image > img {
          width: 100%;
          height: 100%;
          max-height: 360px;
          object-fit: contain;
          padding: 20px;
        }

        .image-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          color: #c99a86;
        }

        .image-placeholder span {
          font-family: Georgia, serif;
          font-size: 110px;
        }

        .image-placeholder small {
          font-size: 9px;
          letter-spacing: 2px;
        }

        .image-label {
          position: absolute;
          right: 16px;
          bottom: 16px;
          display: flex;
          flex-direction: column;
          gap: 7px;
          padding: 12px 16px;
          background: rgba(11,11,13,.88);
          border: 1px solid rgba(201,154,134,.35);
          border-radius: 10px;
        }

        .image-label span {
          color: #c99a86;
          font-size: 8px;
          letter-spacing: 2px;
        }

        .image-label strong {
          font-size: 12px;
        }

        .catalog-section {
          width: min(1320px, calc(100% - 44px));
          margin: auto;
          padding: 35px 0 80px;
        }

        .section-heading {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 25px;
        }

        .section-heading h2 {
          margin: 12px 0 7px;
          font-size: clamp(23px, 3vw, 32px);
        }

        .section-heading p {
          margin: 0;
          color: #958a86;
          font-size: 12px;
        }

        .mobile-filter-toggle {
          display: none;
          padding: 12px 15px;
          color: #e1b9a8;
          background: transparent;
          border: 1px solid rgba(201,154,134,.4);
          border-radius: 9px;
        }

        .catalog-layout {
          display: grid;
          grid-template-columns: 250px minmax(0, 1fr);
          gap: 22px;
          align-items: start;
        }

        .filters {
          position: sticky;
          top: 100px;
          display: flex;
          flex-direction: column;
          gap: 13px;
          padding: 20px;
          background: #151417;
          border: 1px solid rgba(201,154,134,.16);
          border-radius: 15px;
        }

        .filter-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 12px;
        }

        .filter-heading span {
          color: #c99a86;
          font-size: 8px;
          letter-spacing: 1.4px;
        }

        .filter-heading h3 {
          margin: 7px 0 0;
          font-size: 15px;
        }

        .filter-heading button {
          color: #c99a86;
          background: transparent;
          border: 0;
          cursor: pointer;
          font-size: 10px;
        }

        .filters > label {
          color: #aaa1a0;
          font-size: 11px;
        }

        .filters select {
          width: 100%;
          min-height: 45px;
          padding: 0 11px;
          color: #f5f1ee;
          background: #201d20;
          border: 1px solid rgba(201,154,134,.2);
          border-radius: 9px;
          outline: none;
          font-family: inherit;
          font-size: 11px;
        }

        .filters option {
          background: #171518;
        }

        .filter-note {
          display: flex;
          gap: 8px;
          margin-top: 10px;
          padding-top: 15px;
          border-top: 1px solid rgba(201,154,134,.14);
          color: #918682;
          font-size: 10px;
          line-height: 1.9;
        }

        .filter-note span {
          color: #c99a86;
        }

        .products-area {
          min-width: 0;
        }

        .search-bar {
          min-height: 55px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 16px;
          background: #151417;
          border: 1px solid rgba(201,154,134,.2);
          border-radius: 12px;
        }

        .search-bar > span {
          color: #c99a86;
          font-size: 25px;
        }

        .search-bar input {
          width: 100%;
          min-width: 0;
          height: 52px;
          color: #f5f1ee;
          background: transparent;
          border: 0;
          outline: none;
          font-family: inherit;
          font-size: 12px;
        }

        .search-bar button {
          color: #c99a86;
          background: transparent;
          border: 0;
          cursor: pointer;
          font-size: 22px;
        }

        .results-toolbar {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 18px 2px;
          color: #a39792;
          font-size: 10px;
        }

        .inline-error {
          margin-bottom: 15px;
          padding: 13px;
          color: #e5a0a0;
          background: rgba(223,119,119,.08);
          border: 1px solid rgba(223,119,119,.2);
          border-radius: 9px;
          font-size: 11px;
        }

        .product-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 15px;
        }

        .product-card {
          min-width: 0;
          overflow: hidden;
          background: #151417;
          border: 1px solid rgba(201,154,134,.15);
          border-radius: 14px;
          transition: transform .2s ease, border-color .2s ease;
        }

        .product-card:hover {
          transform: translateY(-4px);
          border-color: rgba(201,154,134,.6);
        }

        .product-image {
          position: relative;
          aspect-ratio: 1 / 1;
          display: grid;
          place-items: center;
          overflow: hidden;
          background: #201d20;
        }

        .product-image img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 13px;
          transition: transform .3s ease;
        }

        .product-card:hover .product-image img {
          transform: scale(1.05);
        }

        .image-letter {
          color: #c99a86;
          font-family: Georgia, serif;
          font-size: 70px;
        }

        .featured-label,
        .stock-label {
          position: absolute;
          top: 10px;
          padding: 6px 9px;
          border-radius: 7px;
          font-size: 9px;
        }

        .featured-label {
          right: 10px;
          color: #171112;
          background: #c99a86;
        }

        .stock-label {
          left: 10px;
          background: rgba(11,11,13,.85);
        }

        .in-stock {
          color: #9ed8bd;
        }

        .out-stock {
          color: #e3a0a0;
        }

        .product-info {
          padding: 14px;
        }

        .product-brand {
          display: block;
          color: #c99a86;
          font-size: 9px;
        }

        .product-name {
          min-height: 44px;
          display: block;
          margin-top: 9px;
          font-size: 12px;
          line-height: 1.9;
          font-weight: 800;
        }

        .product-info > p {
          min-height: 38px;
          margin: 6px 0;
          color: #938985;
          font-size: 10px;
          line-height: 1.8;
        }

        .product-meta {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid rgba(201,154,134,.12);
          color: #8d827e;
          font-size: 9px;
        }

        .product-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-top: 13px;
        }

        .product-bottom strong {
          color: #e1b9a8;
          font-size: 11px;
        }

        .product-bottom a {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #c99a86;
          font-size: 10px;
        }

        .product-skeleton {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 12px;
          background: #151417;
          border-radius: 14px;
        }

        .product-skeleton > div {
          aspect-ratio: 1;
          background: #252125;
          border-radius: 9px;
          animation: shimmer 1.4s infinite alternate;
        }

        .product-skeleton > span {
          width: 75%;
          height: 9px;
          background: #252125;
          border-radius: 8px;
        }

        .product-skeleton > span:last-child {
          width: 45%;
        }

        @keyframes shimmer {
          to { opacity: .35; }
        }

        .empty-state {
          min-height: 290px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 25px;
          text-align: center;
          background: #151417;
          border: 1px solid rgba(201,154,134,.15);
          border-radius: 15px;
        }

        .empty-state > span {
          color: #c99a86;
          font-size: 45px;
        }

        .empty-state h3 {
          margin: 12px 0 4px;
          font-size: 16px;
        }

        .empty-state p {
          max-width: 460px;
          color: #938985;
          font-size: 11px;
          line-height: 2;
        }

        .empty-state button {
          margin-top: 12px;
          padding: 11px 17px;
          color: #171112;
          background: #c99a86;
          border: 0;
          border-radius: 8px;
          cursor: pointer;
          font-family: inherit;
          font-size: 11px;
        }

        .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          margin-top: 30px;
          color: #b7aaa5;
          font-size: 11px;
        }

        .pagination button {
          min-width: 85px;
          min-height: 38px;
          color: #e1b9a8;
          background: #171518;
          border: 1px solid rgba(201,154,134,.3);
          border-radius: 9px;
          cursor: pointer;
          font-family: inherit;
        }

        .pagination button:disabled {
          opacity: .35;
          cursor: not-allowed;
        }

        .partner-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 25px;
          padding: 45px max(22px, calc((100% - 1320px) / 2));
          background:
            radial-gradient(ellipse at 80% 50%, rgba(201,154,134,.13), transparent 45%),
            #151316;
          border-block: 1px solid rgba(201,154,134,.2);
        }

        .partner-banner > div > span {
          color: #c99a86;
          font-size: 9px;
          letter-spacing: 2px;
        }

        .partner-banner h2 {
          margin: 12px 0;
          font-size: 25px;
        }

        .partner-banner p {
          max-width: 650px;
          color: #aaa1a0;
          font-size: 11px;
          line-height: 2.2;
        }

        .partner-banner > a {
          min-height: 46px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 0 19px;
          color: #171112;
          background: #c99a86;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 800;
          white-space: nowrap;
        }

        .site-footer {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 22px;
          padding: 32px max(22px, calc((100% - 1320px) / 2));
          background: #09090b;
        }

        .site-footer > div {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .site-footer > div strong {
          font-size: 11px;
          letter-spacing: 1px;
        }

        .site-footer > div span {
          color: #c99a86;
          font-size: 8px;
          letter-spacing: 1px;
        }

        .site-footer nav {
          display: flex;
          flex-wrap: wrap;
          gap: 17px;
          color: #aaa1a0;
          font-size: 10px;
        }

        .site-footer > small {
          width: 100%;
          padding-top: 17px;
          color: #716966;
          border-top: 1px solid rgba(201,154,134,.12);
          text-align: center;
          font-size: 9px;
        }

        @media (max-width: 1050px) {
          .main-nav {
            gap: 11px;
            font-size: 10px;
          }

          .product-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 760px) {
          .header-inner {
            width: calc(100% - 28px);
            min-height: 68px;
          }

          .main-nav {
            display: none;
          }

          .header-actions {
            gap: 12px;
            font-size: 10px;
          }

          .header-actions > a:first-child {
            display: none;
          }

          .category-hero {
            grid-template-columns: 1fr;
            gap: 25px;
            width: calc(100% - 28px);
            padding: 24px;
          }

          .hero-image {
            min-height: 240px;
          }

          .catalog-section {
            width: calc(100% - 28px);
          }

          .catalog-layout {
            grid-template-columns: 1fr;
          }

          .mobile-filter-toggle {
            display: block;
          }

          .filters {
            display: none;
            position: static;
          }

          .filters.open {
            display: flex;
          }

          .section-heading {
            align-items: flex-start;
          }

          .partner-banner {
            align-items: stretch;
            flex-direction: column;
          }

          .partner-banner > a {
            width: 100%;
          }

          .site-footer {
            flex-direction: column;
            align-items: flex-start;
          }
        }

        @media (max-width: 430px) {
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

          .product-grid {
            grid-template-columns: 1fr 1fr;
            gap: 9px;
          }

          .product-info {
            padding: 10px;
          }

          .product-name {
            font-size: 11px;
          }

          .product-bottom {
            align-items: flex-start;
            flex-direction: column;
          }

          .product-bottom strong {
            font-size: 10px;
          }

          .hero-content h1 {
            font-size: 31px;
          }

          .hero-stats {
            gap: 20px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: .01ms !important;
            transition-duration: .01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>
    </main>
  );
}
