
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type ProductImage = {
  id: number;
  image: string;
  alt_text?: string;
  is_primary?: boolean;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  short_description?: string;
  description?: string;
  image?: string | null;
  gallery?: ProductImage[];
  category?: {
    id: number;
    name: string;
    slug: string;
  };
  brand?: {
    id: number;
    name: string;
    slug: string;
  } | null;
  public_price: number;
  availability: "in_stock" | "out_of_stock";
  minimum_order_quantity: number;
  units_per_carton: number;
  weight_grams: number;
  is_featured: boolean;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://jalali-cosmetics-api.onrender.com/api/store";

function formatPrice(value: number) {
  return (
    new Intl.NumberFormat("fa-IR").format(value) +
    " تومان"
  );
}

function getImageUrl(value?: string | null) {
  if (!value) return "";

  if (
    value.startsWith("https://") ||
    value.startsWith("http://")
  ) {
    return value;
  }

  const apiOrigin = API_BASE.replace(/\/api\/store\/?$/, "");
  return `${apiOrigin}${value.startsWith("/") ? "" : "/"}${value}`;
}

export default function ProductDetailsPage() {
  const params = useParams<{ identifier: string }>();
  const identifier = params.identifier;

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

      try {
        const response = await fetch(
          `${API_BASE}/products/${encodeURIComponent(identifier)}/`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            signal: controller.signal,
            cache: "no-store",
          }
        );

        if (response.status === 404) {
          setError("محصول موردنظر پیدا نشد.");
          return;
        }

        if (!response.ok) {
          throw new Error("دریافت اطلاعات محصول ناموفق بود.");
        }

        const data: Product = await response.json();

        setProduct(data);

        const primaryImage =
          data.gallery?.find((item) => item.is_primary)?.image ||
          data.image ||
          data.gallery?.[0]?.image ||
          "";

        setSelectedImage(primaryImage);
      } catch (err) {
        if (
          err instanceof Error &&
          err.name === "AbortError"
        ) {
          return;
        }

        setError(
          "ارتباط با سامانه محصولات برقرار نشد. لطفاً دوباره تلاش کنید."
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

  const images = product
    ? [
        ...(product.image
          ? [{ id: -1, image: product.image, alt_text: product.name }]
          : []),
        ...(product.gallery || []),
      ].filter(
        (item, index, list) =>
          list.findIndex((other) => other.image === item.image) === index
      )
    : [];

  if (loading) {
    return (
      <main className="product-state" dir="rtl">
        <div className="loader" />
        <h2>در حال دریافت اطلاعات محصول</h2>
        <p>لطفاً چند لحظه صبر کنید...</p>
        <style jsx>{`
          .product-state {
            min-height: 75vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: #f5f1ee;
            text-align: center;
            gap: 12px;
          }
          .loader {
            width: 48px;
            height: 48px;
            border: 3px solid #ffffff20;
            border-top-color: #c99a86;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          h2 {
            font-size: 19px;
          }
          p {
            color: #aaa1a0;
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
      <main className="product-state" dir="rtl">
        <span className="error-symbol">!</span>
        <h1>محصول در دسترس نیست</h1>
        <p>{error || "اطلاعات این محصول پیدا نشد."}</p>
        <Link href="/categories" className="back-button">
          بازگشت به فروشگاه
        </Link>

        <style jsx>{`
          .product-state {
            min-height: 75vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 25px;
            color: #f5f1ee;
            text-align: center;
            gap: 15px;
          }
          .error-symbol {
            width: 65px;
            height: 65px;
            display: grid;
            place-items: center;
            border: 1px solid #c99a8655;
            border-radius: 50%;
            color: #c99a86;
            font-size: 32px;
          }
          p {
            color: #aaa1a0;
            line-height: 2;
          }
          .back-button {
            margin-top: 12px;
            padding: 13px 25px;
            border-radius: 10px;
            color: #171112;
            background: #c99a86;
            font-weight: 800;
          }
        `}</style>
      </main>
    );
  }

  const inStock = product.availability === "in_stock";

  return (
    <main className="product-detail-page" dir="rtl">
      <div className="breadcrumb">
        <Link href="/">صفحه اصلی</Link>
        <span>/</span>
        <Link href="/categories">فروشگاه</Link>
        <span>/</span>
        <span>{product.name}</span>
      </div>

      <section className="product-detail">
        <div className="gallery-section">
          <div className="main-image">
            {selectedImage ? (
              <img
                src={getImageUrl(selectedImage)}
                alt={product.name}
              />
            ) : (
              <div className="image-placeholder">
                <span>J</span>
                <small>JALALI COSMETICS</small>
              </div>
            )}

            {product.is_featured && (
              <span className="featured-label">
                محصول ویژه
              </span>
            )}
          </div>

          {images.length > 1 && (
            <div className="thumbnail-list">
              {images.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={
                    selectedImage === item.image
                      ? "thumbnail active"
                      : "thumbnail"
                  }
                  onClick={() => setSelectedImage(item.image)}
                  aria-label="انتخاب تصویر محصول"
                >
                  <img
                    src={getImageUrl(item.image)}
                    alt={item.alt_text || product.name}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="information-section">
          <span className="brand-label">
            {product.brand?.name || "JALALI COSMETICS"}
          </span>

          <h1>{product.name}</h1>

          {product.short_description && (
            <p className="short-description">
              {product.short_description}
            </p>
          )}

          <div className="product-identifiers">
            <div>
              <span>کد محصول</span>
              <strong>{product.sku}</strong>
            </div>

            {product.category && (
              <div>
                <span>دسته‌بندی</span>
                <strong>{product.category.name}</strong>
              </div>
            )}
          </div>

          <div className="price-panel">
            <span>قیمت عمومی هر واحد</span>
            <strong>
              {formatPrice(product.public_price)}
            </strong>
            <small>
              قیمت همکاری فقط برای حساب همکار تأییدشده قابل نمایش است.
            </small>
          </div>

          <div className="availability-panel">
            <span
              className={
                inStock ? "stock-dot available" : "stock-dot unavailable"
              }
            />
            <strong>
              {inStock ? "موجود در فروشگاه" : "فعلاً ناموجود"}
            </strong>
          </div>

          <div className="purchase-specifications">
            <div>
              <span>حداقل تعداد سفارش</span>
              <strong>
                {new Intl.NumberFormat("fa-IR").format(
                  product.minimum_order_quantity
                )}{" "}
                عدد
              </strong>
            </div>

            <div>
              <span>تعداد در هر کارتن</span>
              <strong>
                {new Intl.NumberFormat("fa-IR").format(
                  product.units_per_carton
                )}{" "}
                عدد
              </strong>
            </div>

            {product.weight_grams > 0 && (
              <div>
                <span>وزن محصول</span>
                <strong>
                  {new Intl.NumberFormat("fa-IR").format(
                    product.weight_grams
                  )}{" "}
                  گرم
                </strong>
              </div>
            )}
          </div>

          <Link
            href="/quick-order"
            className={
              inStock
                ? "order-button"
                : "order-button disabled"
            }
            aria-disabled={!inStock}
            onClick={(event) => {
              if (!inStock) event.preventDefault();
            }}
          >
            {inStock ? "ثبت درخواست سفارش" : "محصول ناموجود است"}
            <span>←</span>
          </Link>

          <div className="trust-note">
            <span>✦</span>
            <p>
              پخش جلالی؛ همراه فروشگاه‌ها و فعالان حوزه
              آرایشی و بهداشتی در تأمین محصولات
            </p>
          </div>
        </div>
      </section>

      <section className="description-section">
        <div className="section-heading">
          <span>PRODUCT INFORMATION</span>
          <h2>معرفی محصول</h2>
        </div>

        <div className="description-content">
          {product.description?.trim() ? (
            <p>{product.description}</p>
          ) : (
            <p className="empty-description">
              توضیحات تکمیلی این محصول هنوز ثبت نشده است.
            </p>
          )}
        </div>
      </section>

      <footer className="product-footer">
        <span>JALALI COSMETICS</span>
        <p>BEAUTY. BUSINESS. TRUST.</p>
      </footer>

      <style jsx>{`
        .product-detail-page {
          min-height: 100vh;
          padding: 0 22px 70px;
          color: #f5f1ee;
          background: #0b0b0d;
        }

        .breadcrumb {
          max-width: 1200px;
          margin: 0 auto;
          padding: 27px 0;
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          color: #8f8784;
          font-size: 12px;
        }

        .breadcrumb a {
          color: #c99a86;
        }

        .product-detail {
          max-width: 1200px;
          margin: 10px auto 65px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 65px;
          align-items: start;
        }

        .main-image {
          min-height: 440px;
          position: relative;
          overflow: hidden;
          display: grid;
          place-items: center;
          border: 1px solid #c99a8630;
          border-radius: 22px;
          background:
            radial-gradient(circle at 50% 40%, #c99a8618, transparent 60%),
            #151417;
        }

        .main-image > img {
          width: 100%;
          height: 440px;
          object-fit: contain;
        }

        .image-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          color: #c99a86;
        }

        .image-placeholder span {
          font-family: Georgia, serif;
          font-size: 150px;
          opacity: 0.5;
        }

        .image-placeholder small {
          letter-spacing: 4px;
          font-size: 10px;
        }

        .featured-label {
          position: absolute;
          top: 18px;
          right: 18px;
          padding: 9px 15px;
          border-radius: 30px;
          color: #171112;
          background: #c99a86;
          font-size: 12px;
          font-weight: 800;
        }

        .thumbnail-list {
          display: flex;
          gap: 12px;
          margin-top: 15px;
          flex-wrap: wrap;
        }

        .thumbnail {
          width: 78px;
          height: 78px;
          padding: 5px;
          overflow: hidden;
          border: 1px solid #ffffff20;
          border-radius: 12px;
          background: #171619;
        }

        .thumbnail.active {
          border-color: #c99a86;
        }

        .thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .information-section {
          padding-top: 15px;
        }

        .brand-label {
          color: #c99a86;
          font-size: 12px;
          letter-spacing: 2px;
          font-weight: 800;
        }

        h1 {
          margin: 18px 0;
          font-size: clamp(25px, 4vw, 37px);
          line-height: 1.8;
          font-weight: 900;
        }

        .short-description {
          color: #aaa1a0;
          font-size: 14px;
          line-height: 2.2;
        }

        .product-identifiers {
          display: flex;
          flex-wrap: wrap;
          gap: 35px;
          padding: 22px 0;
          margin-top: 15px;
          border-top: 1px solid #ffffff12;
          border-bottom: 1px solid #ffffff12;
        }

        .product-identifiers div,
        .purchase-specifications div {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .product-identifiers span,
        .purchase-specifications span {
          color: #928986;
          font-size: 12px;
        }

        .product-identifiers strong,
        .purchase-specifications strong {
          color: #f5f1ee;
          font-size: 14px;
        }

        .price-panel {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 22px;
          margin-top: 22px;
          border: 1px solid #c99a8635;
          border-radius: 15px;
          background: #c99a8609;
        }

        .price-panel > span {
          color: #aaa1a0;
          font-size: 13px;
        }

        .price-panel strong {
          color: #e1b9a8;
          font-size: 25px;
        }

        .price-panel small {
          color: #928986;
          font-size: 11px;
          line-height: 2;
        }

        .availability-panel {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 23px 0;
          font-size: 13px;
        }

        .stock-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
        }

        .available {
          background: #61b995;
          box-shadow: 0 0 12px #61b99570;
        }

        .unavailable {
          background: #df7777;
        }

        .purchase-specifications {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 20px;
          padding: 22px 0;
          border-top: 1px solid #ffffff12;
        }

        .order-button {
          min-height: 54px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
          margin-top: 20px;
          border-radius: 12px;
          color: #171112;
          background: #c99a86;
          font-weight: 900;
          transition: 0.2s;
        }

        .order-button:hover {
          background: #e1b9a8;
          transform: translateY(-2px);
        }

        .order-button.disabled {
          color: #aaa1a0;
          background: #29272a;
          cursor: not-allowed;
        }

        .trust-note {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-top: 25px;
          padding: 16px;
          border-radius: 12px;
          background: #ffffff06;
        }

        .trust-note span {
          color: #c99a86;
        }

        .trust-note p {
          margin: 0;
          color: #aaa1a0;
          font-size: 12px;
          line-height: 2;
        }

        .description-section {
          max-width: 1200px;
          margin: 0 auto;
          padding: 35px;
          border: 1px solid #ffffff14;
          border-radius: 18px;
          background: #141416;
        }

        .section-heading > span {
          color: #c99a86;
          font-size: 10px;
          letter-spacing: 3px;
        }

        .section-heading h2 {
          margin: 12px 0 25px;
          font-size: 23px;
        }

        .description-content p {
          color: #c2b9b5;
          line-height: 2.5;
          font-size: 14px;
          white-space: pre-line;
        }

        .empty-description {
          color: #817875 !important;
        }

        .product-footer {
          margin-top: 55px;
          text-align: center;
          color: #c99a86;
          letter-spacing: 3px;
          font-size: 11px;
        }

        .product-footer p {
          color: #77706d;
          font-size: 9px;
        }

        @media (max-width: 800px) {
          .product-detail {
            grid-template-columns: 1fr;
            gap: 35px;
          }

          .main-image {
            min-height: 330px;
          }

          .main-image > img {
            height: 330px;
          }

          .information-section {
            padding-top: 0;
          }

          .description-section {
            padding: 22px;
          }
        }

        @media (max-width: 420px) {
          .product-detail-page {
            padding-inline: 14px;
          }

          .main-image {
            min-height: 280px;
          }

          .main-image > img {
            height: 280px;
          }

          .price-panel strong {
            font-size: 21px;
          }
        }
      `}</style>
    </main>
  );
}
