
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type ProductImage = {
  id: number | string;
  image: string;
  alt_text?: string;
  is_primary?: boolean;
};

type Product = {
  id: string | number;
  name: string;
  slug: string;
  sku: string;
  short_description?: string;
  description?: string;
  image?: string | null;
  gallery?: ProductImage[];
  category?: {
    id: number | string;
    name: string;
    slug: string;
  } | null;
  brand?: {
    id: number | string;
    name: string;
    slug: string;
    logo?: string;
  } | null;
  public_price: number | string;
  availability: "in_stock" | "out_of_stock" | string;
  minimum_order_quantity: number;
  units_per_carton: number;
  weight_grams: number;
  is_featured: boolean;
};

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://jalali-cosmetics-api.onrender.com/api/store"
).replace(/\/+$/, "");

function formatPrice(value: number | string) {
  const price = Number(value || 0);

  if (!Number.isFinite(price) || price <= 0) {
    return "برای استعلام تماس بگیرید";
  }

  return new Intl.NumberFormat("fa-IR").format(price) + " تومان";
}

function mediaUrl(path?: string | null) {
  if (!path) return "";

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  try {
    return new URL(path, new URL(API_BASE).origin).toString();
  } catch {
    return path;
  }
}

export default function ProductDetailsPage() {
  const params = useParams<{ slug: string }>();
  const identifier = params?.slug;

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!identifier) return;

    const controller = new AbortController();

    async function loadProduct() {
      setLoading(true);
      setError("");
      setProduct(null);
      setSelectedImage("");

      try {
        const response = await fetch(
          `${API_BASE}/products/${encodeURIComponent(identifier)}/`,
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
          if (response.status === 404) {
            throw new Error("محصول موردنظر در فروشگاه پیدا نشد.");
          }

          throw new Error("دریافت اطلاعات محصول با مشکل مواجه شد.");
        }

        const data: Product = await response.json();

        setProduct(data);

        const primaryImage =
          data.gallery?.find((item) => item.is_primary)?.image ||
          data.image ||
          data.gallery?.[0]?.image ||
          "";

        setSelectedImage(mediaUrl(primaryImage));
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "خطای نامشخص در دریافت اطلاعات محصول."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadProduct();

    return () => controller.abort();
  }, [identifier]);

  const images = useMemo(() => {
    if (!product) return [];

    const all = [
      ...(product.image ? [product.image] : []),
      ...(product.gallery || []).map((item) => item.image),
    ];

    return Array.from(new Set(all.filter(Boolean))).map(mediaUrl);
  }, [product]);

  const available = product?.availability === "in_stock";

  const quickOrderHref = product
    ? `/quick-order?sku=${encodeURIComponent(
        product.sku
      )}&quantity=${Math.max(
        1,
        Number(product.minimum_order_quantity || 1)
      )}&product=${encodeURIComponent(product.name)}`
    : "/quick-order";

  if (loading) {
    return (
      <main className="state-page" dir="rtl">
        <div className="state-card">
          <div className="loader" />
          <h2>در حال دریافت اطلاعات محصول</h2>
          <p>لطفاً چند لحظه منتظر بمانید.</p>
          <span>JALALI COSMETICS</span>
        </div>

        <style jsx>{`
          .state-page {
            min-height: 100vh;
            display: grid;
            place-items: center;
            padding: 25px;
            background: #0b0b0d;
            color: #f5f1ee;
          }

          .state-card {
            width: min(100%, 450px);
            padding: 45px 25px;
            text-align: center;
            border: 1px solid #44332f;
            border-radius: 16px;
            background: #151416;
          }

          .loader {
            width: 42px;
            height: 42px;
            margin: 0 auto 25px;
            border: 3px solid #40302c;
            border-top-color: #c99a86;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }

          h2 {
            font-size: 17px;
          }

          p {
            color: #a99b96;
            font-size: 12px;
            line-height: 2;
          }

          span {
            display: block;
            margin-top: 25px;
            color: #c99a86;
            font-size: 10px;
            letter-spacing: 3px;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="state-page" dir="rtl">
        <div className="state-card">
          <div className="error-icon">!</div>
          <span className="eyebrow">PRODUCT NOT FOUND</span>
          <h1>محصول در دسترس نیست</h1>
          <p>
            {error || "اطلاعاتی برای این محصول دریافت نشد."}
          </p>
          <div className="state-actions">
            <Link href="/products">بازگشت به محصولات</Link>
            <Link href="/">صفحه اصلی</Link>
          </div>
          <small>JALALI COSMETICS</small>
        </div>

        <style jsx>{`
          .state-page {
            min-height: 100vh;
            display: grid;
            place-items: center;
            padding: 25px;
            background: #0b0b0d;
            color: #f5f1ee;
          }

          .state-card {
            width: min(100%, 500px);
            padding: 45px 25px;
            text-align: center;
            border: 1px solid #44332f;
            border-radius: 16px;
            background: #151416;
          }

          .error-icon {
            width: 55px;
            height: 55px;
            display: grid;
            place-items: center;
            margin: 0 auto 20px;
            border: 1px solid #c99a86;
            border-radius: 50%;
            color: #c99a86;
            font-size: 30px;
          }

          .eyebrow {
            color: #c99a86;
            font-size: 10px;
            letter-spacing: 3px;
          }

          h1 {
            font-size: 23px;
            margin: 16px 0;
          }

          p {
            color: #aaa0a0;
            font-size: 12px;
            line-height: 2.2;
          }

          .state-actions {
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 25px;
          }

          .state-actions a {
            padding: 12px 18px;
            border: 1px solid #c99a86;
            border-radius: 7px;
            color: #c99a86;
            font-size: 11px;
          }

          .state-actions a:first-child {
            background: #c99a86;
            color: #171113;
          }

          small {
            display: block;
            margin-top: 30px;
            color: #8f7770;
            letter-spacing: 2px;
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="product-page" dir="rtl">
      <header className="header">
        <Link href="/" className="brand">
          <span className="logo">J</span>
          <span>
            <strong>JALALI COSMETICS</strong>
            <small>BEAUTY. BUSINESS. TRUST.</small>
          </span>
        </Link>

        <nav>
          <Link href="/">صفحه اصلی</Link>
          <Link href="/products">محصولات</Link>
          <Link href="/categories">دسته‌بندی‌ها</Link>
          <Link href="/cart">سبد خرید</Link>
        </nav>
      </header>

      <div className="breadcrumb">
        <Link href="/">صفحه اصلی</Link>
        <span>/</span>
        <Link href="/products">محصولات</Link>
        <span>/</span>
        <strong>{product.name}</strong>
      </div>

      <section className="product-layout">
        <div className="gallery-section">
          <div className="main-image">
            {selectedImage ? (
              <img
                src={selectedImage}
                alt={product.name}
              />
            ) : (
              <div className="image-placeholder">
                <span>J</span>
                <small>JALALI COSMETICS</small>
              </div>
            )}

            {product.is_featured && (
              <span className="featured-badge">
                محصول منتخب
              </span>
            )}
          </div>

          {images.length > 1 && (
            <div className="thumbnail-list">
              {images.map((image, index) => (
                <button
                  type="button"
                  key={`${image}-${index}`}
                  className={
                    selectedImage === image
                      ? "thumbnail active"
                      : "thumbnail"
                  }
                  onClick={() => setSelectedImage(image)}
                  aria-label={`تصویر شماره ${index + 1}`}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="product-info">
          <div className="product-label">
            PRODUCT DETAILS
          </div>

          <h1>{product.name}</h1>

          {product.short_description && (
            <p className="short-description">
              {product.short_description}
            </p>
          )}

          <div className="meta-list">
            <div>
              <span>کد محصول</span>
              <strong>{product.sku}</strong>
            </div>

            {product.brand && (
              <div>
                <span>برند</span>
                <strong>{product.brand.name}</strong>
              </div>
            )}

            {product.category && (
              <div>
                <span>دسته‌بندی</span>
                <strong>{product.category.name}</strong>
              </div>
            )}
          </div>

          <div className="price-panel">
            <span>قیمت عمومی</span>
            <strong>{formatPrice(product.public_price)}</strong>
            <small>
              قیمت همکاری فقط برای حساب همکار تأییدشده قابل نمایش است.
            </small>
          </div>

          <div className="availability-panel">
            <span className={available ? "stock-dot in" : "stock-dot out"} />
            <strong>
              {available ? "موجود در انبار" : "در حال حاضر ناموجود"}
            </strong>
          </div>

          <div className="purchase-details">
            <div>
              <span>حداقل تعداد سفارش</span>
              <strong>
                {Number(product.minimum_order_quantity || 1).toLocaleString("fa-IR")}
                {" "}عدد
              </strong>
            </div>

            <div>
              <span>تعداد در هر کارتن</span>
              <strong>
                {Number(product.units_per_carton || 1).toLocaleString("fa-IR")}
                {" "}عدد
              </strong>
            </div>

            <div>
              <span>وزن محصول</span>
              <strong>
                {product.weight_grams
                  ? `${Number(product.weight_grams).toLocaleString("fa-IR")} گرم`
                  : "ثبت نشده"}
              </strong>
            </div>
          </div>

          <div className="action-buttons">
            {available ? (
              <Link href={quickOrderHref} className="primary-button">
                درخواست خرید عمده
                <span>←</span>
              </Link>
            ) : (
              <Link href="/contact" className="primary-button">
                استعلام تأمین محصول
                <span>←</span>
              </Link>
            )}

            <Link href="/partner" className="secondary-button">
              شرایط همکاری
            </Link>
          </div>

          <div className="trust-note">
            <span>✦</span>
            اطلاعات قیمت و موجودی از سامانه محصولات دریافت می‌شود.
          </div>
        </div>
      </section>

      <section className="description-section">
        <div className="section-heading">
          <span>PRODUCT INFORMATION</span>
          <h2>توضیحات محصول</h2>
        </div>

        <div className="description-card">
          {product.description ? (
            <p>{product.description}</p>
          ) : (
            <p>
              توضیحات تکمیلی این محصول هنوز توسط مدیریت فروشگاه ثبت نشده است.
            </p>
          )}
        </div>
      </section>

      <section className="wholesale-banner">
        <div>
          <span>BUSINESS PARTNERSHIP</span>
          <h2>برای خرید عمده و همکاری آماده‌اید؟</h2>
          <p>
            درخواست همکاری خود را ثبت کنید تا پس از بررسی،
            شرایط اختصاصی همکاران برای حساب شما فعال شود.
          </p>
        </div>

        <Link href="/partner">درخواست همکاری ←</Link>
      </section>

      <footer className="footer">
        <strong>JALALI COSMETICS</strong>
        <span>BEAUTY. BUSINESS. TRUST.</span>
        <Link href="/contact">ارتباط با ما</Link>
      </footer>

      <style jsx>{`
        .product-page {
          min-height: 100vh;
          padding: 0 6%;
          background: #0b0b0d;
          color: #f5f1ee;
        }

        .header {
          min-height: 88px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          border-bottom: 1px solid #30282a;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          color: inherit;
        }

        .logo {
          width: 43px;
          height: 43px;
          display: grid;
          place-items: center;
          border: 1px solid #c99a86;
          color: #c99a86;
          font-family: Georgia, serif;
          font-size: 28px;
        }

        .brand strong,
        .brand small {
          display: block;
        }

        .brand strong {
          font-size: 13px;
          letter-spacing: 2px;
        }

        .brand small {
          margin-top: 5px;
          color: #a99b96;
          font-size: 8px;
          letter-spacing: 1.5px;
        }

        nav {
          display: flex;
          gap: 25px;
        }

        nav a {
          color: #c7bbb6;
          font-size: 11px;
        }

        nav a:hover {
          color: #c99a86;
        }

        .breadcrumb {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          max-width: 1250px;
          margin: 27px auto;
          color: #928681;
          font-size: 11px;
        }

        .breadcrumb a {
          color: #c99a86;
        }

        .breadcrumb strong {
          color: #f5f1ee;
          font-weight: 500;
        }

        .product-layout {
          max-width: 1250px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 55px;
          align-items: start;
          padding: 25px 0 70px;
        }

        .gallery-section {
          min-width: 0;
        }

        .main-image {
          position: relative;
          min-height: 430px;
          aspect-ratio: 1 / 1;
          display: grid;
          place-items: center;
          overflow: hidden;
          border: 1px solid #44332f;
          border-radius: 15px;
          background:
            radial-gradient(circle at center, #34231f, #151416 68%);
        }

        .main-image > img {
          width: 100%;
          height: 100%;
          max-height: 550px;
          position: absolute;
          inset: 0;
          object-fit: contain;
          padding: 25px;
        }

        .image-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          color: #c99a86;
        }

        .image-placeholder span {
          font-family: Georgia, serif;
          font-size: 150px;
          line-height: 1;
        }

        .image-placeholder small {
          font-size: 10px;
          letter-spacing: 3px;
        }

        .featured-badge {
          position: absolute;
          top: 18px;
          right: 18px;
          padding: 9px 13px;
          border: 1px solid #c99a86;
          background: #171113;
          color: #d9ad9a;
          font-size: 10px;
        }

        .thumbnail-list {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 15px;
        }

        .thumbnail {
          width: 76px;
          height: 76px;
          overflow: hidden;
          padding: 4px;
          border: 1px solid #44332f;
          border-radius: 8px;
          background: #171517;
          cursor: pointer;
        }

        .thumbnail.active {
          border-color: #c99a86;
        }

        .thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .product-info {
          padding-top: 12px;
        }

        .product-label {
          color: #c99a86;
          font-size: 10px;
          letter-spacing: 3px;
        }

        .product-info h1 {
          margin: 17px 0;
          font-size: clamp(25px, 3vw, 37px);
          line-height: 1.8;
        }

        .short-description {
          color: #aaa0a0;
          font-size: 13px;
          line-height: 2.2;
        }

        .meta-list {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin: 25px 0;
        }

        .meta-list div {
          display: flex;
          flex-direction: column;
          gap: 9px;
          padding: 14px;
          border: 1px solid #30282a;
          border-radius: 8px;
          background: #141416;
        }

        .meta-list span,
        .purchase-details span {
          color: #958985;
          font-size: 10px;
        }

        .meta-list strong,
        .purchase-details strong {
          color: #e7d9d3;
          font-size: 12px;
          overflow-wrap: anywhere;
        }

        .price-panel {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 22px;
          border: 1px solid #5c4137;
          border-radius: 10px;
          background: linear-gradient(120deg, #211816, #151315);
        }

        .price-panel > span {
          color: #a99b96;
          font-size: 11px;
        }

        .price-panel > strong {
          color: #d8ad9b;
          font-size: 25px;
        }

        .price-panel small {
          color: #938681;
          font-size: 10px;
          line-height: 2;
        }

        .availability-panel {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 22px 0;
          font-size: 12px;
        }

        .stock-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
        }

        .stock-dot.in {
          background: #61b995;
          box-shadow: 0 0 12px #61b99566;
        }

        .stock-dot.out {
          background: #df7777;
        }

        .purchase-details {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          padding: 18px 0;
          border-top: 1px solid #30282a;
          border-bottom: 1px solid #30282a;
        }

        .purchase-details div {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .action-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 25px;
        }

        .action-buttons a {
          min-height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          padding: 0 20px;
          border-radius: 7px;
          font-size: 11px;
          font-weight: 700;
        }

        .primary-button {
          flex: 1;
          background: #c99a86;
          color: #171113;
        }

        .secondary-button {
          border: 1px solid #76594e;
          color: #d8ad9b;
        }

        .trust-note {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-top: 22px;
          color: #968a85;
          font-size: 10px;
          line-height: 2;
        }

        .trust-note span {
          color: #c99a86;
        }

        .description-section {
          max-width: 1250px;
          margin: 0 auto;
          padding: 45px 0;
          border-top: 1px solid #30282a;
        }

        .section-heading > span,
        .wholesale-banner > div > span {
          color: #c99a86;
          font-size: 10px;
          letter-spacing: 2px;
        }

        .section-heading h2 {
          margin: 10px 0 22px;
          font-size: 24px;
        }

        .description-card {
          padding: 25px;
          border: 1px solid #30282a;
          border-radius: 10px;
          background: #141416;
        }

        .description-card p {
          margin: 0;
          color: #c0b5b0;
          font-size: 13px;
          line-height: 2.5;
          white-space: pre-line;
        }

        .wholesale-banner {
          max-width: 1250px;
          margin: 35px auto 65px;
          padding: 30px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 25px;
          border: 1px solid #4a3732;
          border-radius: 12px;
          background: #191416;
        }

        .wholesale-banner h2 {
          margin: 12px 0;
          font-size: 21px;
        }

        .wholesale-banner p {
          color: #a99b96;
          font-size: 11px;
          line-height: 2;
        }

        .wholesale-banner > a {
          flex-shrink: 0;
          padding: 14px 20px;
          border-radius: 6px;
          background: #c99a86;
          color: #171113;
          font-size: 11px;
        }

        .footer {
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 15px;
          padding: 25px 0;
          border-top: 1px solid #30282a;
          color: #a99b96;
          font-size: 10px;
          letter-spacing: 1px;
        }

        .footer strong {
          color: #c99a86;
        }

        .footer a:hover {
          color: #c99a86;
        }

        @media (max-width: 850px) {
          .product-layout {
            grid-template-columns: 1fr;
            gap: 30px;
          }

          .gallery-section {
            max-width: 650px;
            width: 100%;
            margin: auto;
          }

          .main-image {
            min-height: 300px;
          }
        }

        @media (max-width: 650px) {
          .product-page {
            padding: 0 17px;
          }

          .header {
            flex-wrap: wrap;
            padding: 15px 0;
          }

          nav {
            width: 100%;
            justify-content: space-between;
            gap: 10px;
          }

          .product-layout {
            padding-top: 5px;
          }

          .meta-list {
            grid-template-columns: 1fr 1fr;
          }

          .purchase-details {
            grid-template-columns: 1fr;
          }

          .purchase-details div {
            flex-direction: row;
            justify-content: space-between;
          }

          .wholesale-banner {
            align-items: stretch;
            flex-direction: column;
            padding: 22px;
          }

          .wholesale-banner > a {
            text-align: center;
          }

          .footer {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </main>
  );
}
