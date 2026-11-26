
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Brand = {
  id: number | string;
  name: string;
  slug: string;
  description?: string;
  logo?: string | null;
  website?: string | null;
};

type Product = {
  id: string | number;
  name: string;
  slug: string;
  sku?: string;
  short_description?: string;
  image?: string | null;
  public_price?: number | string;
  availability?: string;
  minimum_order_quantity?: number;
  category?: { name: string; slug: string } | null;
};

type ApiList<T> = {
  count?: number;
  results?: T[];
};

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://jalali-cosmetics-api.onrender.com/api/store"
).replace(/\/+$/, "");

function getItems<T>(data: T[] | ApiList<T>): T[] {
  if (Array.isArray(data)) return data;
  return Array.isArray(data.results) ? data.results : [];
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

function formatPrice(value?: number | string) {
  const price = Number(value || 0);

  if (!Number.isFinite(price) || price <= 0) {
    return "استعلام قیمت";
  }

  return new Intl.NumberFormat("fa-IR").format(price) + " تومان";
}

export default function BrandDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = String(params.slug || "");

  const [brand, setBrand] = useState<Brand | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState("-created_at");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;

    const controller = new AbortController();

    async function loadBrand() {
      setLoading(true);
      setError("");

      try {
        const [brandResponse, productsResponse] = await Promise.all([
          fetch(`${API_BASE}/brands/${encodeURIComponent(slug)}/`, {
            cache: "no-store",
            headers: { Accept: "application/json" },
            signal: controller.signal,
          }),
          fetch(
            `${API_BASE}/products/?brand=${encodeURIComponent(slug)}&page_size=100`,
            {
              cache: "no-store",
              headers: { Accept: "application/json" },
              signal: controller.signal,
            }
          ),
        ]);

        if (!brandResponse.ok) {
          throw new Error(
            brandResponse.status === 404
              ? "برند موردنظر پیدا نشد."
              : "دریافت اطلاعات برند با مشکل مواجه شد."
          );
        }

        if (!productsResponse.ok) {
          throw new Error("دریافت محصولات این برند انجام نشد.");
        }

        const brandData: Brand = await brandResponse.json();
        const productData: ApiList<Product> | Product[] =
          await productsResponse.json();

        setBrand(brandData);
        setProducts(getItems(productData));
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;

        setError(
          err instanceof Error
            ? err.message
            : "خطای نامشخص در دریافت اطلاعات."
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadBrand();

    return () => controller.abort();
  }, [slug]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();

    const result = products.filter((product) => {
      if (!query) return true;

      return (
        product.name?.toLocaleLowerCase().includes(query) ||
        product.sku?.toLocaleLowerCase().includes(query) ||
        product.short_description?.toLocaleLowerCase().includes(query)
      );
    });

    if (ordering === "name") {
      return [...result].sort((a, b) =>
        a.name.localeCompare(b.name, "fa")
      );
    }

    if (ordering === "price") {
      return [...result].sort(
        (a, b) =>
          Number(a.public_price || 0) -
          Number(b.public_price || 0)
      );
    }

    return result;
  }, [products, search, ordering]);

  const availableCount = products.filter(
    (product) => product.availability === "in_stock"
  ).length;

  if (loading) {
    return (
      <main className="brand-detail" dir="rtl">
        <div className="loading-state">
          <span className="loading-mark">J</span>
          <p>در حال دریافت اطلاعات برند...</p>
        </div>
        <BrandStyles />
      </main>
    );
  }

  if (error || !brand) {
    return (
      <main className="brand-detail" dir="rtl">
        <header className="header">
          <Link href="/" className="brand-logo">
            <span>J</span>
            <strong>JALALI COSMETICS</strong>
          </Link>
          <Link href="/brands" className="back-link">
            بازگشت به برندها
          </Link>
        </header>

        <section className="message-state">
          <span className="state-mark">!</span>
          <h1>نمایش برند ممکن نیست</h1>
          <p>{error || "اطلاعات برند در دسترس نیست."}</p>
          <Link href="/brands">مشاهده فهرست برندها</Link>
        </section>
        <BrandStyles />
      </main>
    );
  }

  const logo = mediaUrl(brand.logo);

  return (
    <main className="brand-detail" dir="rtl">
      <header className="header">
        <Link href="/" className="brand-logo">
          <span>J</span>
          <strong>JALALI COSMETICS</strong>
        </Link>

        <nav>
          <Link href="/">صفحه اصلی</Link>
          <Link href="/products">محصولات</Link>
          <Link href="/categories">دسته‌بندی‌ها</Link>
          <Link href="/brands" className="active">برندها</Link>
          <Link href="/about">درباره ما</Link>
        </nav>

        <div className="header-actions">
          <Link href="/account">حساب کاربری</Link>
          <Link href="/cart" className="cart-button">سبد خرید ↗</Link>
        </div>
      </header>

      <section className="brand-hero">
        <div className="hero-content">
          <span className="eyebrow">JALALI COSMETICS · BRAND PROFILE</span>

          <h1>
            محصولات برند
            <strong>{brand.name}</strong>
          </h1>

          <p>
            مجموعه محصولات ثبت‌شده این برند را در کاتالوگ پخش جلالی
            بررسی کنید و کالای موردنظر خود را پیدا کنید.
          </p>

          <div className="hero-actions">
            <a href="#brand-products" className="primary-button">
              مشاهده محصولات این برند ←
            </a>

            <Link href="/brands" className="secondary-button">
              همه برندها
            </Link>
          </div>
        </div>

        <div className="brand-emblem">
          <div className="emblem-ring">
            {logo ? (
              <img src={logo} alt={`لوگوی ${brand.name}`} />
            ) : (
              <span>{brand.name.slice(0, 1)}</span>
            )}
          </div>
          <small>OFFICIAL BRAND CATALOG</small>
        </div>
      </section>

      <section className="brand-overview">
        <div className="overview-heading">
          <span className="eyebrow">BRAND INFORMATION</span>
          <h2>معرفی برند</h2>
        </div>

        <div className="overview-content">
          <div className="overview-logo">
            {logo ? (
              <img src={logo} alt={brand.name} />
            ) : (
              <span>{brand.name.slice(0, 1)}</span>
            )}
          </div>

          <div className="overview-description">
            <h3>{brand.name}</h3>
            <p>
              {brand.description ||
                `محصولات ثبت‌شده ${brand.name} را در کاتالوگ پخش جلالی بررسی کنید.`}
            </p>

            {brand.website && (
              <a
                href={brand.website}
                target="_blank"
                rel="noopener noreferrer"
                className="website-link"
              >
                وب‌سایت برند ↗
              </a>
            )}
          </div>

          <div className="overview-stats">
            <div>
              <strong>{products.length.toLocaleString("fa-IR")}</strong>
              <span>محصول ثبت‌شده</span>
            </div>
            <div>
              <strong>{availableCount.toLocaleString("fa-IR")}</strong>
              <span>محصول موجود</span>
            </div>
          </div>
        </div>
      </section>

      <section className="products-section" id="brand-products">
        <div className="section-heading">
          <div>
            <span className="eyebrow">PRODUCT COLLECTION</span>
            <h2>محصولات {brand.name}</h2>
            <p>فهرست محصولات مرتبط با این برند</p>
          </div>

          <span className="result-count">
            {filteredProducts.length.toLocaleString("fa-IR")} محصول
          </span>
        </div>

        <div className="toolbar">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="جست‌وجو در محصولات این برند..."
            aria-label="جست‌وجوی محصولات برند"
          />

          <select
            value={ordering}
            onChange={(event) => setOrdering(event.target.value)}
            aria-label="مرتب‌سازی محصولات"
          >
            <option value="-created_at">جدیدترین محصولات</option>
            <option value="name">نام محصول</option>
            <option value="price">قیمت از کم به زیاد</option>
          </select>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="empty-state">
            <span>⌕</span>
            <h3>
              {search
                ? "محصولی با این عبارت پیدا نشد"
                : "محصولی برای این برند ثبت نشده است"}
            </h3>
            <p>
              {search
                ? "عبارت جست‌وجو را تغییر دهید."
                : "با ثبت محصولات این برند، آن‌ها در این بخش نمایش داده می‌شوند."}
            </p>
          </div>
        ) : (
          <div className="product-grid">
            {filteredProducts.map((product) => {
              const image = mediaUrl(product.image);
              const available = product.availability === "in_stock";

              return (
                <article className="product-card" key={product.id}>
                  <Link
                    href={`/products/${encodeURIComponent(product.slug || String(product.id))}`}
                    className="product-image"
                  >
                    {image ? (
                      <img src={image} alt={product.name} loading="lazy" />
                    ) : (
                      <span className="image-placeholder">J</span>
                    )}

                    <span className={`availability ${available ? "available" : "unavailable"}`}>
                      {available ? "موجود" : "ناموجود"}
                    </span>
                  </Link>

                  <div className="product-info">
                    <span className="product-category">
                      {product.category?.name || brand.name}
                    </span>

                    <Link
                      href={`/products/${encodeURIComponent(product.slug || String(product.id))}`}
                      className="product-name"
                    >
                      {product.name}
                    </Link>

                    {product.short_description && (
                      <p>{product.short_description}</p>
                    )}

                    {product.sku && (
                      <div className="sku">
                        کد کالا: <b>{product.sku}</b>
                      </div>
                    )}

                    <div className="product-footer">
                      <div>
                        <small>قیمت مصرف‌کننده</small>
                        <strong>{formatPrice(product.public_price)}</strong>
                      </div>

                      <Link
                        href={`/products/${encodeURIComponent(product.slug || String(product.id))}`}
                      >
                        جزئیات ←
                      </Link>
                    </div>

                    {product.minimum_order_quantity && (
                      <div className="minimum-order">
                        حداقل سفارش:
                        <strong>
                          {product.minimum_order_quantity.toLocaleString("fa-IR")} عدد
                        </strong>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="partner-banner">
        <div>
          <span>BUSINESS PARTNERSHIP</span>
          <h2>خرید همکاری و عمده</h2>
          <p>
            برای آشنایی با شرایط همکاری و ثبت درخواست خرید عمده،
            صفحه همکاری پخش جلالی را بررسی کنید.
          </p>
        </div>

        <Link href="/partner">شرایط همکاری ←</Link>
      </section>

      <footer className="footer">
        <div>
          <strong>JALALI COSMETICS</strong>
          <small>BEAUTY. BUSINESS. TRUST.</small>
        </div>

        <nav>
          <Link href="/">صفحه اصلی</Link>
          <Link href="/products">محصولات</Link>
          <Link href="/categories">دسته‌بندی‌ها</Link>
          <Link href="/brands">برندها</Link>
          <Link href="/contact">تماس با ما</Link>
        </nav>

        <span>پخش جلالی · عرضه محصولات آرایشی و بهداشتی</span>
      </footer>

      <BrandStyles />
    </main>
  );
}

function BrandStyles() {
  return (
    <style jsx global>{`
      .brand-detail {
        min-height: 100vh;
        background: #0b0b0d;
        color: #f5f1ee;
        font-family: inherit;
      }

      .brand-detail * { box-sizing: border-box; }
      .brand-detail a { color: inherit; text-decoration: none; }

      .header {
        min-height: 82px;
        padding: 15px 6%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 25px;
        border-bottom: 1px solid #302725;
        background: #0b0b0d;
      }

      .brand-logo {
        display: flex;
        align-items: center;
        gap: 12px;
        white-space: nowrap;
      }

      .brand-logo > span {
        width: 43px;
        height: 43px;
        display: grid;
        place-items: center;
        border: 1px solid #c99a86;
        color: #c99a86;
        font: 30px Georgia, serif;
      }

      .brand-logo strong {
        font-size: 11px;
        letter-spacing: 1.5px;
      }

      .header nav, .header-actions {
        display: flex;
        align-items: center;
        gap: 23px;
      }

      .header nav a, .header-actions a {
        color: #b9aaa4;
        font-size: 10px;
        white-space: nowrap;
      }

      .header nav a.active { color: #c99a86; }

      .header-actions .cart-button {
        padding: 12px 15px;
        border: 1px solid #76594e;
        color: #d8ad9b;
      }

      .brand-hero {
        min-height: 410px;
        padding: 65px 9%;
        display: grid;
        grid-template-columns: 1.2fr .8fr;
        align-items: center;
        gap: 50px;
        background:
          radial-gradient(ellipse at 75% 45%, #35231f 0%, transparent 42%),
          linear-gradient(110deg, #0b0b0d, #171214);
        border-bottom: 1px solid #3a2c29;
      }

      .eyebrow {
        color: #c99a86;
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 2.5px;
      }

      .hero-content h1 {
        margin: 20px 0;
        font-size: clamp(29px, 4vw, 48px);
        line-height: 1.8;
      }

      .hero-content h1 strong {
        display: block;
        color: #c99a86;
      }

      .hero-content p {
        max-width: 570px;
        color: #b3a7a2;
        font-size: 12px;
        line-height: 2.4;
      }

      .hero-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 27px;
      }

      .primary-button, .secondary-button {
        padding: 14px 20px;
        font-size: 10px;
      }

      .primary-button {
        background: #c99a86;
        color: #171113 !important;
        font-weight: 800;
      }

      .secondary-button {
        border: 1px solid #705347;
        color: #d9b7a8 !important;
      }

      .brand-emblem {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
      }

      .emblem-ring {
        width: 245px;
        height: 245px;
        display: grid;
        place-items: center;
        overflow: hidden;
        border: 1px solid #b88b78;
        border-radius: 50%;
        outline: 1px solid #63473d;
        outline-offset: 12px;
        background: radial-gradient(circle, #30201c, #111012 72%);
      }

      .emblem-ring img {
        width: 75%;
        height: 75%;
        object-fit: contain;
      }

      .emblem-ring span {
        color: #c99a86;
        font: 120px Georgia, serif;
      }

      .brand-emblem small {
        color: #a68c80;
        font-size: 8px;
        letter-spacing: 2px;
      }

      .brand-overview, .products-section {
        max-width: 1400px;
        margin: 0 auto;
        padding: 65px 6%;
      }

      .overview-heading h2, .section-heading h2 {
        margin: 12px 0;
        font-size: 25px;
      }

      .overview-content {
        margin-top: 25px;
        padding: 28px;
        display: grid;
        grid-template-columns: 125px minmax(0, 1fr) auto;
        align-items: center;
        gap: 25px;
        border: 1px solid #3b302e;
        border-radius: 8px;
        background: #151416;
      }

      .overview-logo {
        width: 115px;
        height: 115px;
        display: grid;
        place-items: center;
        overflow: hidden;
        border: 1px solid #554039;
        background: #20191a;
      }

      .overview-logo img {
        width: 85%;
        height: 85%;
        object-fit: contain;
      }

      .overview-logo span {
        color: #c99a86;
        font: 65px Georgia, serif;
      }

      .overview-description h3 {
        margin: 0 0 12px;
        font-size: 18px;
      }

      .overview-description p {
        max-width: 700px;
        color: #a99b96;
        font-size: 11px;
        line-height: 2.4;
      }

      .website-link {
        display: inline-block;
        margin-top: 8px;
        color: #c99a86 !important;
        font-size: 10px;
      }

      .overview-stats {
        display: flex;
        gap: 25px;
      }

      .overview-stats div {
        display: flex;
        flex-direction: column;
        gap: 9px;
      }

      .overview-stats strong {
        color: #d8ad9b;
        font-size: 23px;
      }

      .overview-stats span {
        color: #968a85;
        font-size: 9px;
        white-space: nowrap;
      }

      .section-heading {
        display: flex;
        align-items: end;
        justify-content: space-between;
        gap: 20px;
      }

      .section-heading p {
        color: #968a85;
        font-size: 11px;
      }

      .result-count {
        color: #d8ad9b;
        font-size: 11px;
      }

      .toolbar {
        display: flex;
        gap: 12px;
        margin: 27px 0;
      }

      .toolbar input, .toolbar select {
        min-height: 48px;
        padding: 0 15px;
        border: 1px solid #403638;
        border-radius: 5px;
        outline: none;
        background: #171517;
        color: #f5f1ee;
        font: inherit;
        font-size: 11px;
      }

      .toolbar input { flex: 1; min-width: 0; }
      .toolbar input:focus, .toolbar select:focus { border-color: #c99a86; }

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
        transition: transform .2s, border-color .2s;
      }

      .product-card:hover {
        transform: translateY(-4px);
        border-color: #987060;
      }

      .product-image {
        height: 225px;
        position: relative;
        display: grid;
        place-items: center;
        overflow: hidden;
        background: radial-gradient(circle, #33241f, #171517 75%);
      }

      .product-image img {
        width: 100%;
        height: 100%;
        padding: 17px;
        object-fit: contain;
      }

      .image-placeholder {
        color: #c99a86;
        font: 95px Georgia, serif;
      }

      .availability {
        position: absolute;
        right: 12px;
        bottom: 12px;
        padding: 7px 10px;
        border-radius: 3px;
        font-size: 9px;
      }

      .availability.available { background: #17352b; color: #91d0b3; }
      .availability.unavailable { background: #3b2223; color: #e1a1a1; }

      .product-info { padding: 15px; }

      .product-category {
        color: #b08c7d;
        font-size: 9px;
      }

      .product-name {
        display: block;
        min-height: 48px;
        margin: 11px 0 7px;
        color: #f1e8e3;
        font-size: 13px;
        font-weight: 700;
        line-height: 1.9;
      }

      .product-info p {
        min-height: 35px;
        color: #968a85;
        font-size: 9px;
        line-height: 2;
      }

      .sku {
        padding: 10px 0;
        border-top: 1px solid #30282a;
        color: #968a85;
        font-size: 9px;
      }

      .sku b { color: #d5c3bb; direction: ltr; }

      .product-footer {
        display: flex;
        align-items: end;
        justify-content: space-between;
        gap: 8px;
        padding-top: 12px;
        border-top: 1px solid #30282a;
      }

      .product-footer div {
        display: flex;
        flex-direction: column;
        gap: 7px;
      }

      .product-footer small { color: #968a85; font-size: 9px; }
      .product-footer strong { color: #d8ad9b; font-size: 11px; }
      .product-footer > a {
        padding: 10px 12px;
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
        color: #968a85;
        font-size: 9px;
      }

      .minimum-order strong { color: #d5c3bb; }

      .empty-state, .message-state {
        min-height: 300px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 30px;
        border: 1px solid #3b302e;
        background: #151416;
        text-align: center;
      }

      .empty-state > span, .state-mark {
        color: #c99a86;
        font: 55px Georgia, serif;
      }

      .empty-state h3, .message-state h1 { font-size: 18px; }
      .empty-state p, .message-state p {
        color: #a99b96;
        font-size: 11px;
        line-height: 2.2;
      }

      .message-state a {
        margin-top: 15px;
        padding: 13px 20px;
        background: #c99a86;
        color: #171113;
        font-size: 10px;
      }

      .partner-banner {
        margin: 0 6% 65px;
        padding: 35px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 25px;
        border: 1px solid #493630;
        background: radial-gradient(circle at 85% 40%, #39241f, transparent 40%), #191416;
      }

      .partner-banner > div > span {
        color: #c99a86;
        font-size: 9px;
        letter-spacing: 2px;
      }

      .partner-banner h2 { font-size: 21px; }
      .partner-banner p { color: #a99b96; font-size: 11px; line-height: 2.2; }

      .partner-banner > a {
        flex-shrink: 0;
        padding: 15px 22px;
        background: #c99a86;
        color: #171113;
        font-size: 10px;
        font-weight: 700;
      }

      .footer {
        min-height: 110px;
        padding: 25px 6%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 20px;
        border-top: 1px solid #30282a;
      }

      .footer > div {
        display: flex;
        flex-direction: column;
        gap: 7px;
      }

      .footer > div strong {
        color: #c99a86;
        font-size: 12px;
        letter-spacing: 2px;
      }

      .footer small, .footer > span {
        color: #8d817d;
        font-size: 9px;
      }

      .footer nav { display: flex; flex-wrap: wrap; gap: 18px; }
      .footer nav a { color: #a99b96; font-size: 10px; }

      .loading-state {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 20px;
        color: #b9aaa4;
      }

      .loading-mark {
        color: #c99a86;
        font: 75px Georgia, serif;
      }

      @media (max-width: 1050px) {
        .header { flex-wrap: wrap; }
        .header nav { order: 3; width: 100%; justify-content: center; }
        .product-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .overview-content { grid-template-columns: 100px 1fr; }
        .overview-stats { grid-column: 1 / -1; }
      }

      @media (max-width: 650px) {
        .header { padding: 15px 18px; }
        .header nav { justify-content: flex-start; overflow-x: auto; gap: 18px; }
        .header nav a { flex-shrink: 0; }
        .brand-hero { grid-template-columns: 1fr; padding: 45px 22px; }
        .brand-emblem { display: none; }
        .brand-overview, .products-section { padding: 42px 17px; }
        .overview-content { grid-template-columns: 75px 1fr; padding: 17px; gap: 15px; }
        .overview-logo { width: 72px; height: 72px; }
        .overview-stats { gap: 25px; }
        .toolbar { flex-direction: column; }
        .product-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
        .product-image { height: 155px; }
        .product-info { padding: 10px; }
        .product-name { font-size: 11px; }
        .product-footer { align-items: stretch; flex-direction: column; }
        .product-footer > a { text-align: center; }
        .partner-banner { margin: 0 17px 40px; flex-direction: column; align-items: stretch; padding: 23px; }
        .partner-banner > a { text-align: center; }
        .footer { flex-direction: column; text-align: center; }
        .footer nav { justify-content: center; }
      }

      @media (prefers-reduced-motion: reduce) {
        .brand-detail *, .brand-detail *::before, .brand-detail *::after {
          animation-duration: .01ms !important;
          transition-duration: .01ms !important;
          scroll-behavior: auto !important;
        }
      }
    `}</style>
  );
}
