
"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Category = {
  id: number | string;
  name: string;
  slug: string;
  product_count?: number;
};

type Brand = {
  id: number | string;
  name: string;
  slug: string;
  logo?: string;
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
  category?: Category | null;
  brand?: Brand | null;
};

type ApiList<T> = {
  results?: T[];
  count?: number;
  next?: string | null;
  previous?: string | null;
};

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://jalali-cosmetics-api.onrender.com/api/store"
).replace(/\/+$/, "");

const PAGE_SIZE = 24;

function getItems<T>(data: T[] | ApiList<T> | null | undefined): T[] {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

function formatPrice(value: number | string) {
  const price = Number(value || 0);

  if (!Number.isFinite(price) || price <= 0) {
    return "استعلام قیمت";
  }

  return new Intl.NumberFormat("fa-IR").format(price) + " تومان";
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

function getProductLink(product: Product) {
  return `/products/${encodeURIComponent(
    product.slug || String(product.id)
  )}`;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [availability, setAvailability] = useState("");
  const [ordering, setOrdering] = useState("-created_at");

  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileFilters, setMobileFilters] = useState(false);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    setCategory(params.get("category") || "");
    setBrand(params.get("brand") || "");
    setSearch(params.get("search") || "");
    setPage(1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadFilters() {
      setFilterLoading(true);

      try {
        const [categoryResponse, brandResponse] = await Promise.all([
          fetch(`${API_BASE}/categories/`, {
            headers: { Accept: "application/json" },
            cache: "no-store",
            signal: controller.signal,
          }),
          fetch(`${API_BASE}/brands/`, {
            headers: { Accept: "application/json" },
            cache: "no-store",
            signal: controller.signal,
          }),
        ]);

        if (categoryResponse.ok) {
          const data = await categoryResponse.json();
          setCategories(getItems<Category>(data));
        }

        if (brandResponse.ok) {
          const data = await brandResponse.json();
          setBrands(getItems<Brand>(data));
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
      } finally {
        if (!controller.signal.aborted) {
          setFilterLoading(false);
        }
      }
    }

    loadFilters();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProducts() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();

        params.set("page", String(page));

        if (search.trim()) {
          params.set("search", search.trim());
        }

        if (category) {
          params.set("category", category);
        }

        if (brand) {
          params.set("brand", brand);
        }

        if (availability) {
          params.set("availability", availability);
        }

        if (ordering) {
          params.set("ordering", ordering);
        }

        const response = await fetch(
          `${API_BASE}/products/?${params.toString()}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            cache: "no-store",
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(
            "دریافت فهرست محصولات با مشکل مواجه شد. لطفاً دوباره تلاش کنید."
          );
        }

        const data = await response.json();

        const items = getItems<Product>(data);

        setProducts(items);

        if (Array.isArray(data)) {
          setTotalCount(data.length);
        } else {
          setTotalCount(
            Number(data.count ?? items.length)
          );
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        setProducts([]);
        setTotalCount(0);

        setError(
          err instanceof Error
            ? err.message
            : "خطای نامشخص هنگام دریافت محصولات."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => controller.abort();
  }, [page, search, category, brand, availability, ordering]);

  const activeFilterCount = useMemo(() => {
    return [
      category,
      brand,
      availability,
      search.trim(),
    ].filter(Boolean).length;
  }, [category, brand, availability, search]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
  }

  function resetFilters() {
    setSearch("");
    setCategory("");
    setBrand("");
    setAvailability("");
    setOrdering("-created_at");
    setPage(1);

    window.history.replaceState(
      {},
      "",
      window.location.pathname
    );
  }

  function changePage(nextPage: number) {
    if (nextPage < 1 || nextPage > totalPages) return;

    setPage(nextPage);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  return (
    <main className="products-page" dir="rtl">
      <header className="site-header">
        <Link href="/" className="brand">
          <span className="brand-mark">J</span>

          <span className="brand-text">
            <strong>JALALI COSMETICS</strong>
            <small>BEAUTY. BUSINESS. TRUST.</small>
          </span>
        </Link>

        <nav className="main-nav">
          <Link href="/">صفحه اصلی</Link>
          <Link href="/products" className="active">محصولات</Link>
          <Link href="/categories">دسته‌بندی‌ها</Link>
          <Link href="/brands">برندها</Link>
          <Link href="/about">درباره ما</Link>
          <Link href="/contact">تماس با ما</Link>
        </nav>

        <div className="header-actions">
          <Link href="/account" className="account-link">
            حساب کاربری
          </Link>

          <Link href="/cart" className="cart-link">
            سبد خرید
          </Link>
        </div>
      </header>

      <section className="catalog-hero">
        <div className="hero-content">
          <div className="eyebrow">
            JALALI COSMETICS · PRODUCT COLLECTION
          </div>

          <h1>
            مجموعه محصولات
            <span>آرایشی و بهداشتی</span>
          </h1>

          <p>
            محصولات فروشگاه را بررسی کنید، برند موردنظر خود را
            انتخاب کنید و برای خرید عمده درخواست ثبت کنید.
          </p>

          <div className="hero-stats">
            <div>
              <strong>
                {totalCount.toLocaleString("fa-IR")}
              </strong>
              <span>محصول در نتایج فعلی</span>
            </div>

            <div>
              <strong>
                {categories.length.toLocaleString("fa-IR")}
              </strong>
              <span>دسته‌بندی</span>
            </div>

            <div>
              <strong>
                {brands.length.toLocaleString("fa-IR")}
              </strong>
              <span>برند</span>
            </div>
          </div>
        </div>

        <div className="hero-decoration">
          <div className="decoration-ring ring-one" />
          <div className="decoration-ring ring-two" />
          <div className="decoration-center">J</div>
          <span className="decoration-caption">
            WHOLESALE BEAUTY COLLECTION
          </span>
        </div>
      </section>

      <section className="catalog-container">
        <div className="catalog-heading">
          <div>
            <span className="section-kicker">OUR COLLECTION</span>
            <h2>محصولات فروشگاه</h2>
            <p>
              جستجو و انتخاب از میان محصولات ثبت‌شده در سامانه
            </p>
          </div>

          <button
            type="button"
            className="mobile-filter-button"
            onClick={() => setMobileFilters(!mobileFilters)}
          >
            فیلترها
            {activeFilterCount > 0 && (
              <span>{activeFilterCount.toLocaleString("fa-IR")}</span>
            )}
          </button>
        </div>

        <form className="search-bar" onSubmit={handleSearch}>
          <span className="search-icon">⌕</span>

          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="نام محصول، کد کالا یا عبارت موردنظر را جستجو کنید..."
            aria-label="جستجوی محصولات"
          />

          <button type="submit">
            جستجو
          </button>
        </form>

        <div className="catalog-layout">
          <aside className={`filter-sidebar ${mobileFilters ? "mobile-open" : ""}`}>
            <div className="filter-header">
              <div>
                <span>PRODUCT FILTERS</span>
                <h3>فیلتر محصولات</h3>
              </div>

              <button
                type="button"
                onClick={resetFilters}
                className="reset-button"
              >
                پاک‌کردن
              </button>
            </div>

            <div className="filter-group">
              <label htmlFor="category-filter">دسته‌بندی</label>

              <select
                id="category-filter"
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">همه دسته‌بندی‌ها</option>

                {categories.map((item) => (
                  <option key={item.id} value={item.slug}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="brand-filter">برند</label>

              <select
                id="brand-filter"
                value={brand}
                onChange={(event) => {
                  setBrand(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">همه برندها</option>

                {brands.map((item) => (
                  <option key={item.id} value={item.slug}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="availability-filter">وضعیت موجودی</label>

              <select
                id="availability-filter"
                value={availability}
                onChange={(event) => {
                  setAvailability(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">همه محصولات</option>
                <option value="in_stock">فقط محصولات موجود</option>
                <option value="out_of_stock">محصولات ناموجود</option>
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="sort-filter">مرتب‌سازی</label>

              <select
                id="sort-filter"
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
                <option value="public_price">قیمت: کم به زیاد</option>
                <option value="-public_price">قیمت: زیاد به کم</option>
              </select>
            </div>

            <div className="filter-note">
              <span>✦</span>
              <p>
                اطلاعات موجودی از سامانه فروشگاه دریافت می‌شود.
                تعداد دقیق موجودی عمومی نمایش داده نمی‌شود.
              </p>
            </div>

            <Link href="/partner" className="partner-card">
              <span>BUSINESS PARTNERSHIP</span>
              <strong>خرید با شرایط همکاری</strong>
              <small>آشنایی با شرایط همکاران ←</small>
            </Link>
          </aside>

          <div className="products-content">
            <div className="results-toolbar">
              <div>
                <strong>
                  {totalCount.toLocaleString("fa-IR")}
                </strong>
                <span>محصول در نتایج</span>
              </div>

              <div className="toolbar-status">
                {loading ? "در حال بروزرسانی..." : "فهرست محصولات"}
              </div>
            </div>

            {error && (
              <div className="error-panel">
                <span className="error-symbol">!</span>
                <h3>دریافت اطلاعات ناموفق بود</h3>
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() => setPage((current) => current)}
                >
                  تلاش دوباره
                </button>
              </div>
            )}

            {loading && !error && (
              <div className="product-grid">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div className="skeleton-card" key={index}>
                    <div className="skeleton-image" />
                    <div className="skeleton-line long" />
                    <div className="skeleton-line short" />
                    <div className="skeleton-footer" />
                  </div>
                ))}
              </div>
            )}

            {!loading && !error && products.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">⌕</div>
                <span>NO PRODUCTS FOUND</span>
                <h3>محصولی پیدا نشد</h3>
                <p>
                  با فیلترهای فعلی محصولی برای نمایش وجود ندارد.
                  فیلترها را تغییر دهید یا جستجوی دیگری انجام دهید.
                </p>
                <button type="button" onClick={resetFilters}>
                  نمایش همه محصولات
                </button>
              </div>
            )}

            {!loading && !error && products.length > 0 && (
              <>
                <div className="product-grid">
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
                          href={getProductLink(product)}
                          className="product-image"
                        >
                          {image ? (
                            <img
                              src={image}
                              alt={product.name}
                              loading="lazy"
                            />
                          ) : (
                            <div className="image-fallback">
                              <span>J</span>
                              <small>JALALI COSMETICS</small>
                            </div>
                          )}

                          {product.is_featured && (
                            <span className="featured-label">
                              منتخب
                            </span>
                          )}

                          <span
                            className={
                              available
                                ? "availability-label available"
                                : "availability-label unavailable"
                            }
                          >
                            {available ? "موجود" : "ناموجود"}
                          </span>
                        </Link>

                        <div className="product-card-body">
                          <div className="product-card-meta">
                            <span>
                              {product.brand?.name || "JALALI COSMETICS"}
                            </span>

                            {product.category?.name && (
                              <span>{product.category.name}</span>
                            )}
                          </div>

                          <Link
                            href={getProductLink(product)}
                            className="product-name"
                          >
                            {product.name}
                          </Link>

                          {product.short_description && (
                            <p className="product-description">
                              {product.short_description}
                            </p>
                          )}

                          <div className="product-sku">
                            کد کالا:
                            <strong>{product.sku || "ثبت نشده"}</strong>
                          </div>

                          <div className="product-card-footer">
                            <div className="price-info">
                              <span>قیمت عمومی</span>
                              <strong>
                                {formatPrice(product.public_price)}
                              </strong>
                            </div>

                            <Link
                              href={getProductLink(product)}
                              className="details-button"
                              aria-label={`مشاهده ${product.name}`}
                            >
                              مشاهده
                              <span>←</span>
                            </Link>
                          </div>

                          <div className="minimum-order">
                            حداقل سفارش:
                            <strong>
                              {Number(
                                product.minimum_order_quantity || 1
                              ).toLocaleString("fa-IR")}
                              {" "}عدد
                            </strong>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => changePage(page - 1)}
                    >
                      قبلی
                    </button>

                    <span>
                      صفحه
                      <strong>{page.toLocaleString("fa-IR")}</strong>
                      از
                      <strong>{totalPages.toLocaleString("fa-IR")}</strong>
                    </span>

                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => changePage(page + 1)}
                    >
                      بعدی
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      <section className="catalog-bottom-banner">
        <div>
          <span>JALALI COSMETICS · WHOLESALE</span>
          <h2>برای همکاری تجاری آماده‌اید؟</h2>
          <p>
            درخواست همکاری خود را ثبت کنید تا پس از بررسی،
            شرایط ویژه همکاران برای حساب شما مشخص شود.
          </p>
        </div>

        <Link href="/partner">
          درخواست همکاری
          <span>←</span>
        </Link>
      </section>

      <footer className="site-footer">
        <div className="footer-brand">
          <strong>JALALI COSMETICS</strong>
          <span>BEAUTY. BUSINESS. TRUST.</span>
        </div>

        <div className="footer-links">
          <Link href="/about">درباره ما</Link>
          <Link href="/contact">تماس با ما</Link>
          <Link href="/faq">سؤالات متداول</Link>
          <Link href="/tracking">پیگیری سفارش</Link>
        </div>

        <small>© JALALI COSMETICS</small>
      </footer>

      <style jsx>{`
        .products-page {
          min-height: 100vh;
          background: #0b0b0d;
          color: #f5f1ee;
          overflow: hidden;
        }

        .site-header {
          min-height: 88px;
          padding: 0 6%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 25px;
          border-bottom: 1px solid #30282a;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #f5f1ee;
          text-decoration: none;
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
          font-size: 28px;
        }

        .brand-text strong,
        .brand-text small {
          display: block;
        }

        .brand-text strong {
          font-size: 12px;
          letter-spacing: 2px;
        }

        .brand-text small {
          margin-top: 5px;
          color: #a99b96;
          font-size: 8px;
          letter-spacing: 1.5px;
        }

        .main-nav {
          display: flex;
          align-items: center;
          gap: 23px;
        }

        .main-nav a {
          color: #c5b9b4;
          font-size: 11px;
          transition: color 0.2s;
        }

        .main-nav a:hover,
        .main-nav a.active {
          color: #c99a86;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 9px;
          flex-shrink: 0;
        }

        .header-actions a {
          padding: 11px 13px;
          border: 1px solid #59433b;
          border-radius: 5px;
          color: #d6c3ba;
          font-size: 10px;
        }

        .header-actions .cart-link {
          border-color: #c99a86;
          background: #c99a86;
          color: #171113;
        }

        .catalog-hero {
          min-height: 340px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 35px;
          padding: 55px 10%;
          overflow: hidden;
          border-bottom: 1px solid #30282a;
          background:
            radial-gradient(ellipse at 75% 45%, #39241f 0%, transparent 42%),
            linear-gradient(110deg, #111012, #171214);
        }

        .hero-content {
          position: relative;
          z-index: 2;
          max-width: 620px;
        }

        .eyebrow,
        .section-kicker {
          color: #c99a86;
          font-size: 10px;
          letter-spacing: 2.5px;
        }

        .hero-content h1 {
          margin: 20px 0 13px;
          font-size: clamp(28px, 4vw, 43px);
          line-height: 1.8;
        }

        .hero-content h1 span {
          display: block;
          color: #c99a86;
        }

        .hero-content > p {
          max-width: 540px;
          color: #b4a7a1;
          font-size: 12px;
          line-height: 2.3;
        }

        .hero-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 35px;
          margin-top: 30px;
        }

        .hero-stats div {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .hero-stats strong {
          color: #e0b6a5;
          font-family: Georgia, serif;
          font-size: 22px;
        }

        .hero-stats span {
          color: #958985;
          font-size: 10px;
        }

        .hero-decoration {
          width: 270px;
          height: 270px;
          position: relative;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          margin-left: 5%;
        }

        .decoration-ring {
          position: absolute;
          border: 1px solid #8b6253;
          border-radius: 50%;
        }

        .ring-one {
          width: 220px;
          height: 220px;
        }

        .ring-two {
          width: 170px;
          height: 170px;
          border-color: #c99a86;
        }

        .decoration-center {
          color: #c99a86;
          font-family: Georgia, serif;
          font-size: 105px;
        }

        .decoration-caption {
          position: absolute;
          bottom: -4px;
          color: #987c70;
          font-size: 8px;
          letter-spacing: 2px;
          white-space: nowrap;
        }

        .catalog-container {
          max-width: 1500px;
          margin: 0 auto;
          padding: 65px 6%;
        }

        .catalog-heading {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 25px;
        }

        .catalog-heading h2 {
          margin: 10px 0;
          font-size: 25px;
        }

        .catalog-heading p {
          color: #968a85;
          font-size: 11px;
        }

        .mobile-filter-button {
          display: none;
        }

        .search-bar {
          height: 58px;
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 6px 10px 6px 7px;
          border: 1px solid #44332f;
          border-radius: 7px;
          background: #151416;
          margin-bottom: 30px;
        }

        .search-icon {
          color: #c99a86;
          font-size: 29px;
          padding: 0 10px;
        }

        .search-bar input {
          min-width: 0;
          flex: 1;
          height: 100%;
          border: none;
          outline: none;
          background: transparent;
          color: #f5f1ee;
          font-family: inherit;
          font-size: 12px;
        }

        .search-bar input::placeholder {
          color: #776d69;
        }

        .search-bar button {
          height: 44px;
          padding: 0 25px;
          border: none;
          border-radius: 5px;
          background: #c99a86;
          color: #171113;
          font-family: inherit;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }

        .catalog-layout {
          display: grid;
          grid-template-columns: 245px minmax(0, 1fr);
          gap: 28px;
          align-items: start;
        }

        .filter-sidebar {
          padding: 22px 18px;
          border: 1px solid #332a2a;
          border-radius: 9px;
          background: #131214;
        }

        .filter-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding-bottom: 20px;
          border-bottom: 1px solid #30282a;
        }

        .filter-header span {
          color: #c99a86;
          font-size: 8px;
          letter-spacing: 1.5px;
        }

        .filter-header h3 {
          margin: 8px 0 0;
          font-size: 15px;
        }

        .reset-button {
          border: none;
          background: transparent;
          color: #c99a86;
          font-family: inherit;
          font-size: 10px;
          cursor: pointer;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 19px 0;
          border-bottom: 1px solid #30282a;
        }

        .filter-group label {
          color: #d7c9c3;
          font-size: 11px;
        }

        .filter-group select {
          width: 100%;
          height: 43px;
          padding: 0 10px;
          border: 1px solid #403638;
          border-radius: 5px;
          outline: none;
          background: #1b191b;
          color: #cfc3bd;
          font-family: inherit;
          font-size: 10px;
        }

        .filter-group select:focus {
          border-color: #c99a86;
        }

        .filter-note {
          display: flex;
          gap: 9px;
          margin-top: 19px;
          padding: 13px;
          border: 1px solid #45342e;
          border-radius: 6px;
          background: #1b1717;
        }

        .filter-note span {
          color: #c99a86;
        }

        .filter-note p {
          margin: 0;
          color: #a99b96;
          font-size: 9px;
          line-height: 2;
        }

        .partner-card {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 20px;
          padding: 16px;
          border: 1px solid #63483d;
          border-radius: 6px;
          background: linear-gradient(135deg, #2a1c19, #171416);
        }

        .partner-card span {
          color: #c99a86;
          font-size: 8px;
          letter-spacing: 1px;
        }

        .partner-card strong {
          color: #f0ded5;
          font-size: 12px;
        }

        .partner-card small {
          color: #c99a86;
          font-size: 9px;
        }

        .products-content {
          min-width: 0;
        }

        .results-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 18px;
          padding: 13px 16px;
          border: 1px solid #30282a;
          border-radius: 6px;
          background: #141315;
        }

        .results-toolbar > div:first-child {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #a99b96;
          font-size: 10px;
        }

        .results-toolbar strong {
          color: #d7ad9c;
          font-size: 14px;
        }

        .toolbar-status {
          color: #8d817d;
          font-size: 9px;
        }

        .product-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 17px;
        }

        .product-card {
          min-width: 0;
          overflow: hidden;
          border: 1px solid #352c2b;
          border-radius: 8px;
          background: #151416;
          transition: transform 0.2s, border-color 0.2s;
        }

        .product-card:hover {
          transform: translateY(-4px);
          border-color: #8a6557;
        }

        .product-image {
          height: 220px;
          position: relative;
          display: grid;
          place-items: center;
          overflow: hidden;
          border-bottom: 1px solid #30282a;
          background:
            radial-gradient(circle at center, #35251f, #171517 72%);
        }

        .product-image > img {
          width: 100%;
          height: 100%;
          padding: 18px;
          object-fit: contain;
          transition: transform 0.3s;
        }

        .product-card:hover .product-image > img {
          transform: scale(1.04);
        }

        .image-fallback {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 7px;
          color: #c99a86;
        }

        .image-fallback span {
          font-family: Georgia, serif;
          font-size: 90px;
        }

        .image-fallback small {
          font-size: 8px;
          letter-spacing: 2px;
        }

        .featured-label {
          position: absolute;
          top: 12px;
          right: 12px;
          padding: 6px 9px;
          border: 1px solid #c99a86;
          border-radius: 3px;
          background: #1a1414;
          color: #d8ad9b;
          font-size: 9px;
        }

        .availability-label {
          position: absolute;
          bottom: 12px;
          right: 12px;
          padding: 6px 9px;
          border-radius: 3px;
          font-size: 9px;
        }

        .availability-label.available {
          background: #17352b;
          color: #91d0b3;
        }

        .availability-label.unavailable {
          background: #3b2223;
          color: #e1a1a1;
        }

        .product-card-body {
          padding: 15px;
        }

        .product-card-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          color: #a78c80;
          font-size: 8px;
        }

        .product-card-meta span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .product-name {
          display: block;
          min-height: 48px;
          margin: 12px 0 5px;
          color: #f1e8e3;
          font-size: 13px;
          line-height: 1.9;
          font-weight: 700;
        }

        .product-description {
          height: 36px;
          overflow: hidden;
          margin: 5px 0 12px;
          color: #968a85;
          font-size: 9px;
          line-height: 2;
        }

        .product-sku {
          display: flex;
          gap: 7px;
          padding: 10px 0;
          border-top: 1px solid #30282a;
          color: #8e817c;
          font-size: 9px;
        }

        .product-sku strong {
          color: #c5b4ac;
          direction: ltr;
        }

        .product-card-footer {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 8px;
          padding-top: 10px;
          border-top: 1px solid #30282a;
        }

        .price-info {
          display: flex;
          flex-direction: column;
          gap: 7px;
          min-width: 0;
        }

        .price-info span {
          color: #938681;
          font-size: 9px;
        }

        .price-info strong {
          color: #d8ad9b;
          font-size: 11px;
          overflow-wrap: anywhere;
        }

        .details-button {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
          padding: 10px 12px;
          border-radius: 4px;
          background: #c99a86;
          color: #171113;
          font-size: 9px;
          font-weight: 700;
        }

        .minimum-order {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          margin-top: 12px;
          padding-top: 10px;
          border-top: 1px solid #30282a;
          color: #938681;
          font-size: 9px;
        }

        .minimum-order strong {
          color: #d2c0b8;
        }

        .skeleton-card {
          min-width: 0;
          padding-bottom: 15px;
          overflow: hidden;
          border: 1px solid #352c2b;
          border-radius: 8px;
          background: #151416;
        }

        .skeleton-image {
          height: 220px;
          background: linear-gradient(
            100deg,
            #1b191b 20%,
            #292326 40%,
            #1b191b 60%
          );
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
        }

        .skeleton-line {
          height: 10px;
          margin: 18px 15px 0;
          border-radius: 5px;
          background: #292426;
        }

        .skeleton-line.long {
          width: 70%;
        }

        .skeleton-line.short {
          width: 42%;
          margin-top: 12px;
        }

        .skeleton-footer {
          height: 35px;
          margin: 20px 15px 0;
          border-top: 1px solid #30282a;
        }

        @keyframes shimmer {
          to {
            background-position: -200% 0;
          }
        }

        .empty-state,
        .error-panel {
          min-height: 350px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 35px;
          border: 1px solid #352c2b;
          border-radius: 8px;
          background: #151416;
          text-align: center;
        }

        .empty-icon,
        .error-symbol {
          width: 65px;
          height: 65px;
          display: grid;
          place-items: center;
          margin-bottom: 20px;
          border: 1px solid #8c6556;
          border-radius: 50%;
          color: #c99a86;
          font-size: 35px;
        }

        .empty-state > span {
          color: #c99a86;
          font-size: 9px;
          letter-spacing: 3px;
        }

        .empty-state h3,
        .error-panel h3 {
          margin: 13px 0;
          font-size: 19px;
        }

        .empty-state p,
        .error-panel p {
          max-width: 430px;
          color: #a99b96;
          font-size: 11px;
          line-height: 2.2;
        }

        .empty-state button,
        .error-panel button {
          margin-top: 18px;
          padding: 13px 22px;
          border: none;
          border-radius: 5px;
          background: #c99a86;
          color: #171113;
          font-family: inherit;
          font-size: 10px;
          cursor: pointer;
        }

        .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          margin-top: 35px;
        }

        .pagination button {
          min-width: 85px;
          padding: 12px 16px;
          border: 1px solid #76594e;
          border-radius: 5px;
          background: #191618;
          color: #d8ad9b;
          font-family: inherit;
          font-size: 10px;
          cursor: pointer;
        }

        .pagination button:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .pagination span {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #a99b96;
          font-size: 10px;
        }

        .pagination strong {
          color: #d8ad9b;
        }

        .catalog-bottom-banner {
          max-width: 1300px;
          margin: 0 auto 65px;
          padding: 35px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 25px;
          border: 1px solid #493630;
          border-radius: 9px;
          background:
            radial-gradient(circle at 85% 40%, #39241f, transparent 40%),
            #191416;
        }

        .catalog-bottom-banner > div > span {
          color: #c99a86;
          font-size: 9px;
          letter-spacing: 2px;
        }

        .catalog-bottom-banner h2 {
          margin: 12px 0;
          font-size: 21px;
        }

        .catalog-bottom-banner p {
          color: #a99b96;
          font-size: 11px;
          line-height: 2.2;
        }

        .catalog-bottom-banner > a {
          display: flex;
          align-items: center;
          gap: 15px;
          flex-shrink: 0;
          padding: 15px 22px;
          border-radius: 5px;
          background: #c99a86;
          color: #171113;
          font-size: 10px;
          font-weight: 700;
        }

        .site-footer {
          min-height: 100px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
          padding: 25px 6%;
          border-top: 1px solid #30282a;
        }

        .footer-brand {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .footer-brand strong {
          color: #c99a86;
          font-size: 12px;
          letter-spacing: 2px;
        }

        .footer-brand span {
          color: #8d817d;
          font-size: 8px;
          letter-spacing: 1.5px;
        }

        .footer-links {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
        }

        .footer-links a,
        .site-footer > small {
          color: #a99b96;
          font-size: 10px;
        }

        @media (max-width: 1100px) {
          .site-header {
            flex-wrap: wrap;
            padding-top: 15px;
            padding-bottom: 15px;
          }

          .main-nav {
            order: 3;
            width: 100%;
            justify-content: center;
          }

          .product-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 760px) {
          .catalog-hero {
            padding: 45px 7%;
          }

          .hero-decoration {
            width: 170px;
            height: 170px;
            margin: 0;
          }

          .ring-one {
            width: 150px;
            height: 150px;
          }

          .ring-two {
            width: 115px;
            height: 115px;
          }

          .decoration-center {
            font-size: 75px;
          }

          .decoration-caption {
            font-size: 6px;
          }

          .catalog-layout {
            grid-template-columns: 1fr;
          }

          .filter-sidebar {
            display: none;
          }

          .filter-sidebar.mobile-open {
            display: block;
          }

          .mobile-filter-button {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 11px 15px;
            border: 1px solid #76594e;
            border-radius: 5px;
            background: #191618;
            color: #d8ad9b;
            font-family: inherit;
            font-size: 10px;
          }

          .mobile-filter-button span {
            color: #f5f1ee;
          }

          .catalog-bottom-banner {
            margin-right: 5%;
            margin-left: 5%;
          }
        }

        @media (max-width: 560px) {
          .site-header {
            padding-right: 17px;
            padding-left: 17px;
          }

          .main-nav {
            justify-content: flex-start;
            gap: 17px;
            overflow-x: auto;
            padding: 5px 0;
          }

          .main-nav a {
            flex-shrink: 0;
          }

          .header-actions a {
            padding: 9px 10px;
            font-size: 9px;
          }

          .catalog-hero {
            min-height: 300px;
            padding: 35px 22px;
          }

          .hero-decoration {
            display: none;
          }

          .hero-content h1 {
            font-size: 29px;
          }

          .hero-stats {
            gap: 22px;
          }

          .catalog-container {
            padding: 42px 17px;
          }

          .catalog-heading {
            align-items: center;
          }

          .catalog-heading h2 {
            font-size: 21px;
          }

          .search-bar {
            height: 53px;
          }

          .search-bar input {
            font-size: 10px;
          }

          .search-bar button {
            padding: 0 15px;
          }

          .product-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }

          .product-image {
            height: 155px;
          }

          .product-card-body {
            padding: 10px;
          }

          .product-name {
            min-height: 48px;
            font-size: 11px;
          }

          .product-card-meta {
            font-size: 7px;
          }

          .price-info strong {
            font-size: 9px;
          }

          .details-button {
            gap: 5px;
            padding: 9px 8px;
            font-size: 8px;
          }

          .minimum-order {
            font-size: 8px;
          }

          .catalog-bottom-banner {
            align-items: stretch;
            flex-direction: column;
            padding: 23px;
          }

          .catalog-bottom-banner > a {
            justify-content: center;
          }

          .site-footer {
            flex-direction: column;
            text-align: center;
          }

          .footer-links {
            justify-content: center;
          }
        }
      `}</style>
    </main>
  );
}
