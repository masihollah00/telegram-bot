
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type ProductImage = {
  id: number;
  image: string;
  alt_text?: string;
  sort_order?: number;
  is_primary?: boolean;
};

type Category = {
  id: number | string;
  name: string;
  slug: string;
  description?: string;
};

type Brand = {
  id: number | string;
  name: string;
  slug: string;
  description?: string;
  logo?: string | null;
  website?: string | null;
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
  category?: Category | null;
  brand?: Brand | null;
  public_price: number | string;
  availability: "in_stock" | "out_of_stock" | string;
  minimum_order_quantity?: number;
  units_per_carton?: number;
  weight_grams?: number;
  is_featured?: boolean;
  seo_title?: string;
  seo_description?: string;
};

type ProductListResponse = {
  results?: Product[];
  count?: number;
};

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://jalali-cosmetics-api.onrender.com/api/store"
).replace(/\/+$/, "");

function mediaUrl(path?: string | null): string {
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

function formatPrice(value: number | string): string {
  const price = Number(value || 0);

  if (!Number.isFinite(price) || price <= 0) {
    return "استعلام قیمت";
  }

  return (
    new Intl.NumberFormat("fa-IR").format(price) +
    " تومان"
  );
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("fa-IR").format(value);
}

function getProducts(data: unknown): Product[] {
  if (Array.isArray(data)) {
    return data as Product[];
  }

  if (
    data &&
    typeof data === "object" &&
    "results" in data &&
    Array.isArray((data as ProductListResponse).results)
  ) {
    return (data as ProductListResponse).results || [];
  }

  return [];
}

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const identifier = params?.slug || "";

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [activeImage, setActiveImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [error, setError] = useState("");
  const [shareMessage, setShareMessage] = useState("");

  const loadProduct = useCallback(async () => {
    if (!identifier) return;

    const controller = new AbortController();

    setLoading(true);
    setError("");
    setProduct(null);
    setRelatedProducts([]);
    setActiveImage("");

    try {
      const response = await fetch(
        `${API_BASE}/products/${encodeURIComponent(identifier)}/`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
          signal: controller.signal,
        }
      );

      if (response.status === 404) {
        throw new Error("محصول موردنظر در فروشگاه پیدا نشد.");
      }

      if (!response.ok) {
        throw new Error(
          "دریافت اطلاعات محصول با مشکل مواجه شد."
        );
      }

      const data = (await response.json()) as Product;

      if (!data || !data.id || !data.name) {
        throw new Error("اطلاعات دریافتی محصول معتبر نیست.");
      }

      setProduct(data);

      const images = [
        ...(data.image ? [data.image] : []),
        ...(Array.isArray(data.gallery)
          ? data.gallery
              .slice()
              .sort(
                (a, b) =>
                  Number(a.sort_order || 0) -
                  Number(b.sort_order || 0)
              )
              .map((item) => item.image)
          : []),
      ].filter(Boolean);

      setActiveImage(images.length ? images[0] : "");

      if (data.category?.slug) {
        setRelatedLoading(true);

        try {
          const relatedResponse = await fetch(
            `${API_BASE}/products/?category=${encodeURIComponent(
              data.category.slug
            )}&page_size=5`,
            {
              headers: {
                Accept: "application/json",
              },
              cache: "no-store",
              signal: controller.signal,
            }
          );

          if (relatedResponse.ok) {
            const relatedData: unknown =
              await relatedResponse.json();

            const items = getProducts(relatedData)
              .filter((item) => item.id !== data.id)
              .slice(0, 4);

            setRelatedProducts(items);
          }
        } catch (relatedError) {
          if (
            relatedError instanceof Error &&
            relatedError.name === "AbortError"
          ) {
            return;
          }
        } finally {
          if (!controller.signal.aborted) {
            setRelatedLoading(false);
          }
        }
      }
    } catch (err) {
      if (
        err instanceof Error &&
        err.name === "AbortError"
      ) {
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

    return () => controller.abort();
  }, [identifier]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const run = async () => {
      cleanup = await loadProduct();
    };

    run();

    return () => {
      cleanup?.();
    };
  }, [loadProduct]);

  const images = useMemo(() => {
    if (!product) return [];

    const all = [
      ...(product.image ? [product.image] : []),
      ...(Array.isArray(product.gallery)
        ? product.gallery
            .slice()
            .sort(
              (a, b) =>
                Number(a.sort_order || 0) -
                Number(b.sort_order || 0)
            )
            .map((item) => item.image)
        : []),
    ];

    return [...new Set(all.filter(Boolean))];
  }, [product]);

  const available =
    product?.availability === "in_stock";

  async function shareProduct() {
    if (!product || typeof window === "undefined") return;

    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: product.name,
          text: product.short_description || product.name,
          url,
        });

        return;
      }

      await navigator.clipboard.writeText(url);
      setShareMessage("لینک محصول کپی شد.");
    } catch {
      setShareMessage("اشتراک‌گذاری انجام نشد.");
    }
  }

  function retry() {
    window.location.reload();
  }

  if (loading) {
    return (
      <main className="detail-loading" dir="rtl">
        <div className="loading-mark">J</div>
        <div className="loading-line" />
        <p>در حال دریافت اطلاعات محصول...</p>

        <style jsx>{`
          .detail-loading {
            min-height: 75vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 18px;
            color: #f5f1ee;
            background: #0b0b0d;
          }

          .loading-mark {
            width: 76px;
            height: 76px;
            display: grid;
            place-items: center;
            border: 1px solid #c99a86;
            border-radius: 24px;
            color: #c99a86;
            font-family: Georgia, serif;
            font-size: 42px;
            animation: pulse 1.4s ease-in-out infinite;
          }

          .loading-line {
            width: 180px;
            height: 3px;
            overflow: hidden;
            border-radius: 10px;
            background: #252126;
          }

          .loading-line::after {
            display: block;
            width: 45%;
            height: 100%;
            content: "";
            background: #c99a86;
            animation: loading 1.2s ease-in-out infinite;
          }

          p {
            color: #aaa1a0;
            font-size: 13px;
          }

          @keyframes pulse {
            50% {
              opacity: 0.45;
              transform: scale(0.94);
            }
          }

          @keyframes loading {
            from {
              transform: translateX(220%);
            }
            to {
              transform: translateX(-220%);
            }
          }
        `}</style>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="detail-error" dir="rtl">
        <div className="error-card">
          <span className="error-icon">!</span>
          <span className="eyebrow">PRODUCT INFORMATION</span>
          <h1>محصول قابل نمایش نیست</h1>
          <p>
            {error || "اطلاعات این محصول در دسترس نیست."}
          </p>

          <div className="error-actions">
            <button type="button" onClick={retry}>
              تلاش دوباره
            </button>

            <Link href="/products">
              بازگشت به محصولات
            </Link>
          </div>
        </div>

        <style jsx>{`
          .detail-error {
            min-height: 75vh;
            display: grid;
            place-items: center;
            padding: 24px;
            color: #f5f1ee;
            background: #0b0b0d;
          }

          .error-card {
            width: min(100%, 540px);
            padding: 42px 30px;
            text-align: center;
            background: #151417;
            border: 1px solid rgba(201, 154, 134, 0.2);
            border-radius: 24px;
          }

          .error-icon {
            width: 54px;
            height: 54px;
            display: grid;
            place-items: center;
            margin: 0 auto 20px;
            border: 1px solid #df7777;
            border-radius: 50%;
            color: #df7777;
            font-size: 25px;
          }

          .eyebrow {
            color: #c99a86;
            font-size: 11px;
            letter-spacing: 2px;
          }

          h1 {
            margin: 16px 0;
            font-size: 25px;
          }

          p {
            color: #aaa1a0;
            line-height: 2;
          }

          .error-actions {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 12px;
            margin-top: 26px;
          }

          button,
          a {
            min-height: 45px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0 20px;
            border: 1px solid #c99a86;
            border-radius: 10px;
            color: #f5f1ee;
            background: transparent;
            cursor: pointer;
          }

          button {
            color: #171112;
            background: #c99a86;
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="product-detail-page" dir="rtl">
      <header className="detail-header">
        <div className="header-inner">
          <Link href="/" className="brand">
            <span className="brand-mark">J</span>

            <span className="brand-copy">
              <strong>JALALI COSMETICS</strong>
              <small>BEAUTY. BUSINESS. TRUST.</small>
            </span>
          </Link>

          <nav className="main-navigation">
            <Link href="/">صفحه اصلی</Link>
            <Link href="/products" className="active">
              محصولات
            </Link>
            <Link href="/categories">دسته‌بندی‌ها</Link>
            <Link href="/brands">برندها</Link>
            <Link href="/about">درباره ما</Link>
          </nav>

          <div className="header-actions">
            <Link href="/account">حساب کاربری</Link>
            <Link href="/cart" className="cart-link">
              سبد خرید
            </Link>
          </div>
        </div>
      </header>

      <div className="detail-container">
        <nav className="breadcrumbs" aria-label="مسیر صفحه">
          <Link href="/">صفحه اصلی</Link>
          <span>/</span>
          <Link href="/products">محصولات</Link>
          <span>/</span>

          {product.category && (
            <>
              <Link
                href={`/products?category=${encodeURIComponent(
                  product.category.slug
                )}`}
              >
                {product.category.name}
              </Link>
              <span>/</span>
            </>
          )}

          <strong>{product.name}</strong>
        </nav>

        <section className="product-main">
          <div className="gallery-column">
            <div className="main-image-frame">
              {activeImage ? (
                <img
                  className="main-product-image"
                  src={mediaUrl(activeImage)}
                  alt={product.name}
                  fetchPriority="high"
                />
              ) : (
                <div className="image-placeholder">
                  <span>J</span>
                  <strong>JALALI COSMETICS</strong>
                  <small>PRODUCT IMAGE</small>
                </div>
              )}

              {product.is_featured && (
                <span className="featured-badge">
                  محصول منتخب
                </span>
              )}

              <button
                type="button"
                className="image-share"
                onClick={shareProduct}
                aria-label="اشتراک‌گذاری محصول"
              >
                ↗
              </button>
            </div>

            {images.length > 1 && (
              <div className="thumbnail-list">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    className={
                      activeImage === image
                        ? "thumbnail active"
                        : "thumbnail"
                    }
                    onClick={() => setActiveImage(image)}
                    aria-label={`نمایش تصویر ${formatNumber(index + 1)}`}
                    aria-pressed={activeImage === image}
                  >
                    <img
                      src={mediaUrl(image)}
                      alt={`${product.name} - تصویر ${index + 1}`}
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}

            <div className="gallery-caption">
              <span>PRODUCT GALLERY</span>
              <span>
                {formatNumber(images.length)} تصویر ثبت‌شده
              </span>
            </div>
          </div>

          <div className="product-information">
            <div className="product-overline">
              <span>JALALI COSMETICS</span>
              {product.is_featured && (
                <span className="featured-text">
                  ✦ منتخب فروشگاه
                </span>
              )}
            </div>

            <h1>{product.name}</h1>

            {product.short_description && (
              <p className="short-description">
                {product.short_description}
              </p>
            )}

            <div className="product-identifiers">
              <div>
                <span>کد محصول</span>
                <strong>{product.sku || "ثبت نشده"}</strong>
              </div>

              {product.category && (
                <div>
                  <span>دسته‌بندی</span>
                  <Link
                    href={`/products?category=${encodeURIComponent(
                      product.category.slug
                    )}`}
                  >
                    {product.category.name}
                  </Link>
                </div>
              )}
            </div>

            {product.brand && (
              <div className="brand-information">
                <div className="brand-logo">
                  {product.brand.logo ? (
                    <img
                      src={mediaUrl(product.brand.logo)}
                      alt={product.brand.name}
                    />
                  ) : (
                    <span>
                      {product.brand.name.slice(0, 1)}
                    </span>
                  )}
                </div>

                <div>
                  <small>برند محصول</small>
                  <strong>{product.brand.name}</strong>
                </div>

                <Link
                  href={`/brands?search=${encodeURIComponent(
                    product.brand.name
                  )}`}
                >
                  مشاهده برند
                  <span>←</span>
                </Link>
              </div>
            )}

            <div className="availability-panel">
              <span
                className={
                  available
                    ? "availability-dot available"
                    : "availability-dot unavailable"
                }
              />

              <div>
                <strong>
                  {available ? "موجود در فروشگاه" : "ناموجود"}
                </strong>

                <small>
                  {available
                    ? "وضعیت موجودی از سامانه فروشگاه دریافت شده است."
                    : "در حال حاضر امکان تأیید موجودی این محصول وجود ندارد."}
                </small>
              </div>
            </div>

            <div className="price-panel">
              <span>قیمت عمومی محصول</span>
              <strong>{formatPrice(product.public_price)}</strong>
              <small>
                قیمت همکاری و شرایط عمده پس از تأیید حساب همکار
                مشخص می‌شود.
              </small>
            </div>

            <div className="purchase-details">
              <div>
                <span>حداقل سفارش</span>
                <strong>
                  {formatNumber(
                    Math.max(
                      1,
                      Number(product.minimum_order_quantity || 1)
                    )
                  )}{" "}
                  عدد
                </strong>
              </div>

              <div>
                <span>تعداد در کارتن</span>
                <strong>
                  {formatNumber(
                    Math.max(1, Number(product.units_per_carton || 1))
                  )}{" "}
                  عدد
                </strong>
              </div>

              {Number(product.weight_grams) > 0 && (
                <div>
                  <span>وزن</span>
                  <strong>
                    {formatNumber(Number(product.weight_grams))} گرم
                  </strong>
                </div>
              )}
            </div>

            <div className="purchase-actions">
              <Link href="/partner" className="primary-action">
                <span>درخواست همکاری و خرید عمده</span>
                <span>←</span>
              </Link>

              <Link href="/contact" className="secondary-action">
                پرسش درباره این محصول
              </Link>
            </div>

            {shareMessage && (
              <p className="share-feedback" role="status">
                {shareMessage}
              </p>
            )}

            <div className="trust-points">
              <div>
                <span>✦</span>
                اطلاعات محصول از سامانه فروشگاه
              </div>

              <div>
                <span>✦</span>
                ارسال سراسری طبق شرایط فروش
              </div>

              <div>
                <span>✦</span>
                امکان درخواست همکاری تجاری
              </div>
            </div>
          </div>
        </section>

        <section className="description-section">
          <div className="section-title">
            <span>PRODUCT DETAILS</span>
            <h2>معرفی و مشخصات محصول</h2>
            <p>
              اطلاعات ثبت‌شده برای آشنایی دقیق‌تر با محصول
            </p>
          </div>

          <div className="description-card">
            {product.description ? (
              <p className="full-description">
                {product.description}
              </p>
            ) : (
              <div className="description-empty">
                توضیحات تکمیلی این محصول هنوز در فروشگاه ثبت نشده است.
              </div>
            )}

            <div className="specification-grid">
              <div>
                <span>نام محصول</span>
                <strong>{product.name}</strong>
              </div>

              <div>
                <span>کد کالا</span>
                <strong>{product.sku}</strong>
              </div>

              <div>
                <span>وضعیت</span>
                <strong>
                  {available ? "موجود" : "ناموجود"}
                </strong>
              </div>

              <div>
                <span>حداقل سفارش</span>
                <strong>
                  {formatNumber(
                    Number(product.minimum_order_quantity || 1)
                  )}{" "}
                  عدد
                </strong>
              </div>

              {product.category && (
                <div>
                  <span>دسته‌بندی</span>
                  <strong>{product.category.name}</strong>
                </div>
              )}

              {product.brand && (
                <div>
                  <span>برند</span>
                  <strong>{product.brand.name}</strong>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="business-banner">
          <div>
            <span>BUSINESS PARTNERSHIP</span>
            <h2>قیمت و شرایط ویژه همکاری</h2>
            <p>
              برای بررسی شرایط خرید عمده، دریافت قیمت همکاری
              و ثبت درخواست تجاری با پخش جلالی آشنا شوید.
            </p>
          </div>

          <Link href="/partner">
            شرایط همکاری
            <span>←</span>
          </Link>
        </section>

        <section className="related-section">
          <div className="section-title related-heading">
            <div>
              <span>RELATED COLLECTION</span>
              <h2>محصولات مرتبط</h2>
              <p>
                محصولات دیگری از دسته‌بندی همین کالا
              </p>
            </div>

            {product.category && (
              <Link
                href={`/products?category=${encodeURIComponent(
                  product.category.slug
                )}`}
                className="all-products-link"
              >
                مشاهده همه
                <span>←</span>
              </Link>
            )}
          </div>

          {relatedLoading ? (
            <div className="related-empty">
              در حال دریافت محصولات مرتبط...
            </div>
          ) : relatedProducts.length > 0 ? (
            <div className="related-grid">
              {relatedProducts.map((item) => (
                <Link
                  href={`/products/${encodeURIComponent(
                    item.slug || item.id
                  )}`}
                  className="related-card"
                  key={item.id}
                >
                  <div className="related-image">
                    {item.image ? (
                      <img
                        src={mediaUrl(item.image)}
                        alt={item.name}
                        loading="lazy"
                      />
                    ) : (
                      <span>J</span>
                    )}

                    {item.availability === "in_stock" && (
                      <small>موجود</small>
                    )}
                  </div>

                  <div className="related-information">
                    <span>
                      {item.brand?.name || "JALALI COSMETICS"}
                    </span>
                    <strong>{item.name}</strong>
                    <b>{formatPrice(item.public_price)}</b>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="related-empty">
              در حال حاضر محصول مرتبط دیگری برای نمایش ثبت نشده است.
            </div>
          )}
        </section>
      </div>

      <footer className="detail-footer">
        <div>
          <strong>JALALI COSMETICS</strong>
          <span>BEAUTY. BUSINESS. TRUST.</span>
        </div>

        <nav>
          <Link href="/">صفحه اصلی</Link>
          <Link href="/products">محصولات</Link>
          <Link href="/partner">همکاری تجاری</Link>
          <Link href="/contact">تماس با ما</Link>
        </nav>

        <small>
          © JALALI COSMETICS
        </small>
      </footer>

      <style jsx>{`
        .product-detail-page {
          min-height: 100vh;
          color: #f5f1ee;
          background: transparent;
        }

        .detail-header {
          position: sticky;
          top: 0;
          z-index: 40;
          background: rgba(11, 11, 13, 0.94);
          border-bottom: 1px solid rgba(201, 154, 134, 0.18);
          backdrop-filter: blur(22px);
        }

        .header-inner {
          width: min(1440px, calc(100% - 44px));
          min-height: 82px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 25px;
          margin: auto;
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
          border-radius: 13px;
          color: #e1b9a8;
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
          letter-spacing: 1.3px;
        }

        .brand-copy small {
          color: #b99a8d;
          font-size: 9px;
          letter-spacing: 1px;
        }

        .main-navigation,
        .header-actions {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .main-navigation a,
        .header-actions a {
          color: #c4b9b5;
          font-size: 12px;
          transition: color 180ms ease;
        }

        .main-navigation a:hover,
        .main-navigation a.active,
        .header-actions a:hover {
          color: #e1b9a8;
        }

        .header-actions .cart-link {
          padding: 11px 16px;
          border: 1px solid rgba(201, 154, 134, 0.4);
          border-radius: 10px;
          color: #e1b9a8;
        }

        .detail-container {
          width: min(1320px, calc(100% - 44px));
          margin: auto;
        }

        .breadcrumbs {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 11px;
          padding: 27px 0;
          color: #918785;
          font-size: 11px;
        }

        .breadcrumbs a:hover {
          color: #e1b9a8;
        }

        .breadcrumbs strong {
          color: #e1b9a8;
          font-weight: 600;
        }

        .product-main {
          display: grid;
          grid-template-columns: minmax(0, 1.03fr) minmax(0, 0.97fr);
          gap: clamp(30px, 5vw, 72px);
          align-items: start;
          padding: 10px 0 80px;
        }

        .gallery-column {
          min-width: 0;
        }

        .main-image-frame {
          position: relative;
          aspect-ratio: 1 / 1;
          display: grid;
          place-items: center;
          overflow: hidden;
          background:
            radial-gradient(
              circle at 50% 45%,
              rgba(201, 154, 134, 0.12),
              transparent 58%
            ),
            #171518;
          border: 1px solid rgba(201, 154, 134, 0.2);
          border-radius: 24px;
        }

        .main-product-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 20px;
          transition: transform 500ms ease;
        }

        .main-image-frame:hover .main-product-image {
          transform: scale(1.035);
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
          font-size: 100px;
          opacity: 0.75;
        }

        .image-placeholder strong {
          font-size: 12px;
          letter-spacing: 2px;
        }

        .image-placeholder small {
          color: #83746e;
          font-size: 9px;
          letter-spacing: 2px;
        }

        .featured-badge {
          position: absolute;
          top: 18px;
          right: 18px;
          padding: 9px 13px;
          color: #171112;
          background: #c99a86;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 800;
        }

        .image-share {
          position: absolute;
          top: 17px;
          left: 17px;
          width: 40px;
          height: 40px;
          color: #e1b9a8;
          background: rgba(11, 11, 13, 0.8);
          border: 1px solid rgba(201, 154, 134, 0.3);
          border-radius: 12px;
          cursor: pointer;
          font-size: 20px;
        }

        .thumbnail-list {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 16px;
        }

        .thumbnail {
          width: 78px;
          height: 78px;
          overflow: hidden;
          padding: 4px;
          background: #171518;
          border: 1px solid rgba(201, 154, 134, 0.18);
          border-radius: 13px;
          cursor: pointer;
          transition: border-color 180ms ease;
        }

        .thumbnail.active {
          border: 2px solid #c99a86;
        }

        .thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          border-radius: 8px;
        }

        .gallery-caption {
          display: flex;
          justify-content: space-between;
          margin-top: 15px;
          color: #897d79;
          font-size: 10px;
        }

        .gallery-caption span:first-child {
          color: #c99a86;
          letter-spacing: 1.6px;
        }

        .product-information {
          min-width: 0;
          padding-top: 10px;
        }

        .product-overline {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          color: #c99a86;
          font-size: 10px;
          letter-spacing: 1.8px;
        }

        .featured-text {
          letter-spacing: 0;
          color: #e1b9a8;
        }

        .product-information h1 {
          margin: 20px 0 14px;
          font-size: clamp(26px, 3vw, 42px);
          line-height: 1.7;
          font-weight: 800;
        }

        .short-description {
          margin: 0;
          color: #aaa1a0;
          font-size: 14px;
          line-height: 2.2;
        }

        .product-identifiers {
          display: flex;
          flex-wrap: wrap;
          gap: 35px;
          margin-top: 28px;
          padding: 20px 0;
          border-top: 1px solid rgba(201, 154, 134, 0.15);
          border-bottom: 1px solid rgba(201, 154, 134, 0.15);
        }

        .product-identifiers div {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .product-identifiers span {
          color: #837a77;
          font-size: 10px;
        }

        .product-identifiers strong,
        .product-identifiers a {
          color: #e5dcd8;
          font-size: 12px;
        }

        .product-identifiers a:hover {
          color: #c99a86;
        }

        .brand-information {
          display: flex;
          align-items: center;
          gap: 13px;
          margin-top: 22px;
          padding: 15px;
          background: #151417;
          border: 1px solid rgba(201, 154, 134, 0.15);
          border-radius: 14px;
        }

        .brand-logo {
          width: 48px;
          height: 48px;
          display: grid;
          place-items: center;
          overflow: hidden;
          flex-shrink: 0;
          background: #201c1e;
          border-radius: 12px;
          color: #e1b9a8;
          font-size: 22px;
        }

        .brand-logo img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .brand-information > div:nth-child(2) {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .brand-information small {
          color: #8c817d;
          font-size: 10px;
        }

        .brand-information strong {
          font-size: 13px;
        }

        .brand-information > a {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-right: auto;
          color: #c99a86;
          font-size: 11px;
        }

        .availability-panel {
          display: flex;
          align-items: center;
          gap: 13px;
          margin-top: 22px;
          padding: 17px;
          background: rgba(97, 185, 149, 0.055);
          border: 1px solid rgba(97, 185, 149, 0.18);
          border-radius: 13px;
        }

        .availability-dot {
          width: 10px;
          height: 10px;
          flex-shrink: 0;
          border-radius: 50%;
        }

        .availability-dot.available {
          background: #61b995;
          box-shadow: 0 0 14px rgba(97, 185, 149, 0.5);
        }

        .availability-dot.unavailable {
          background: #df7777;
          box-shadow: 0 0 14px rgba(223, 119, 119, 0.3);
        }

        .availability-panel > div {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .availability-panel strong {
          font-size: 12px;
        }

        .availability-panel small {
          color: #9e9692;
          font-size: 10px;
          line-height: 1.8;
        }

        .price-panel {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 22px;
          padding: 23px;
          background:
            linear-gradient(
              120deg,
              rgba(201, 154, 134, 0.1),
              rgba(201, 154, 134, 0.025)
            ),
            #171518;
          border: 1px solid rgba(201, 154, 134, 0.25);
          border-radius: 16px;
        }

        .price-panel > span {
          color: #aaa1a0;
          font-size: 11px;
        }

        .price-panel > strong {
          color: #e1b9a8;
          font-size: clamp(23px, 3vw, 31px);
          font-weight: 800;
        }

        .price-panel small {
          color: #938986;
          font-size: 10px;
          line-height: 1.9;
        }

        .purchase-details {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 18px;
        }

        .purchase-details > div {
          display: flex;
          flex-direction: column;
          gap: 9px;
          padding: 15px;
          background: #151417;
          border: 1px solid rgba(201, 154, 134, 0.13);
          border-radius: 12px;
        }

        .purchase-details span {
          color: #908581;
          font-size: 10px;
        }

        .purchase-details strong {
          font-size: 12px;
        }

        .purchase-actions {
          display: grid;
          gap: 11px;
          margin-top: 22px;
        }

        .primary-action,
        .secondary-action {
          min-height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 12px 18px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 700;
          transition: transform 180ms ease, background 180ms ease;
        }

        .primary-action {
          color: #171112;
          background: #c99a86;
        }

        .primary-action:hover {
          background: #e1b9a8;
          transform: translateY(-2px);
        }

        .secondary-action {
          color: #e1b9a8;
          border: 1px solid rgba(201, 154, 134, 0.35);
        }

        .secondary-action:hover {
          background: rgba(201, 154, 134, 0.08);
        }

        .share-feedback {
          color: #61b995;
          font-size: 11px;
        }

        .trust-points {
          display: grid;
          gap: 12px;
          margin-top: 25px;
          padding-top: 20px;
          border-top: 1px solid rgba(201, 154, 134, 0.13);
        }

        .trust-points div {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #aaa1a0;
          font-size: 11px;
        }

        .trust-points span {
          color: #c99a86;
        }

        .description-section,
        .related-section {
          padding: 45px 0 70px;
          border-top: 1px solid rgba(201, 154, 134, 0.15);
        }

        .section-title {
          margin-bottom: 25px;
        }

        .section-title > span,
        .section-title > div > span {
          color: #c99a86;
          font-size: 10px;
          letter-spacing: 2px;
        }

        .section-title h2 {
          margin: 12px 0 8px;
          font-size: clamp(21px, 3vw, 30px);
        }

        .section-title p {
          margin: 0;
          color: #968b87;
          font-size: 12px;
          line-height: 2;
        }

        .description-card {
          padding: clamp(20px, 4vw, 34px);
          background: #151417;
          border: 1px solid rgba(201, 154, 134, 0.16);
          border-radius: 18px;
        }

        .full-description {
          margin: 0;
          color: #c5bbb7;
          font-size: 13px;
          line-height: 2.5;
          white-space: pre-line;
        }

        .description-empty {
          color: #948985;
          font-size: 12px;
          line-height: 2;
        }

        .specification-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin-top: 27px;
          padding-top: 25px;
          border-top: 1px solid rgba(201, 154, 134, 0.13);
        }

        .specification-grid > div {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 14px;
          background: #1b191c;
          border-radius: 10px;
        }

        .specification-grid span {
          color: #8f8581;
          font-size: 10px;
        }

        .specification-grid strong {
          color: #e5dcd8;
          font-size: 11px;
          overflow-wrap: anywhere;
        }

        .business-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 25px;
          margin: 0 0 65px;
          padding: clamp(24px, 5vw, 42px);
          background:
            radial-gradient(
              circle at 90% 50%,
              rgba(201, 154, 134, 0.14),
              transparent 45%
            ),
            #171518;
          border: 1px solid rgba(201, 154, 134, 0.25);
          border-radius: 20px;
        }

        .business-banner > div > span {
          color: #c99a86;
          font-size: 10px;
          letter-spacing: 2px;
        }

        .business-banner h2 {
          margin: 12px 0;
          font-size: clamp(19px, 3vw, 27px);
        }

        .business-banner p {
          max-width: 650px;
          margin: 0;
          color: #aaa1a0;
          font-size: 12px;
          line-height: 2.1;
        }

        .business-banner > a {
          min-width: 165px;
          min-height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          flex-shrink: 0;
          padding: 10px 16px;
          color: #171112;
          background: #c99a86;
          border-radius: 11px;
          font-size: 12px;
          font-weight: 800;
        }

        .related-heading {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 20px;
        }

        .all-products-link {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #c99a86;
          font-size: 11px;
          white-space: nowrap;
        }

        .related-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 17px;
        }

        .related-card {
          overflow: hidden;
          background: #151417;
          border: 1px solid rgba(201, 154, 134, 0.15);
          border-radius: 15px;
          transition: transform 220ms ease, border-color 220ms ease;
        }

        .related-card:hover {
          transform: translateY(-5px);
          border-color: #c99a86;
        }

        .related-image {
          position: relative;
          aspect-ratio: 1 / 1;
          display: grid;
          place-items: center;
          overflow: hidden;
          background: #1d1a1d;
          color: #c99a86;
          font-size: 65px;
        }

        .related-image img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 12px;
          transition: transform 300ms ease;
        }

        .related-card:hover .related-image img {
          transform: scale(1.05);
        }

        .related-image small {
          position: absolute;
          top: 10px;
          right: 10px;
          padding: 6px 9px;
          color: #a6d9c0;
          background: rgba(11, 11, 13, 0.85);
          border-radius: 7px;
          font-size: 9px;
        }

        .related-information {
          display: flex;
          flex-direction: column;
          gap: 9px;
          padding: 15px;
        }

        .related-information span {
          color: #c99a86;
          font-size: 9px;
        }

        .related-information strong {
          min-height: 44px;
          font-size: 12px;
          line-height: 1.9;
        }

        .related-information b {
          color: #e1b9a8;
          font-size: 12px;
        }

        .related-empty {
          padding: 35px;
          color: #938986;
          text-align: center;
          background: #151417;
          border: 1px solid rgba(201, 154, 134, 0.12);
          border-radius: 15px;
          font-size: 12px;
        }

        .detail-footer {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 25px;
          padding: 35px max(22px, calc((100% - 1320px) / 2));
          background: #101013;
          border-top: 1px solid rgba(201, 154, 134, 0.18);
        }

        .detail-footer > div {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .detail-footer > div strong {
          font-size: 12px;
          letter-spacing: 1px;
        }

        .detail-footer > div span {
          color: #c99a86;
          font-size: 9px;
          letter-spacing: 1px;
        }

        .detail-footer nav {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
        }

        .detail-footer nav a,
        .detail-footer > small {
          color: #968b87;
          font-size: 10px;
        }

        .detail-footer nav a:hover {
          color: #e1b9a8;
        }

        @media (max-width: 1050px) {
          .main-navigation {
            gap: 13px;
          }

          .main-navigation a {
            font-size: 11px;
          }

          .product-main {
            gap: 30px;
          }

          .related-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 760px) {
          .header-inner {
            min-height: 70px;
          }

          .main-navigation {
            display: none;
          }

          .header-actions {
            gap: 12px;
          }

          .header-actions a {
            font-size: 10px;
          }

          .detail-container {
            width: min(100% - 28px, 600px);
          }

          .breadcrumbs {
            padding: 20px 0;
            font-size: 10px;
          }

          .product-main {
            grid-template-columns: 1fr;
            gap: 30px;
            padding-bottom: 50px;
          }

          .gallery-column {
            width: 100%;
          }

          .main-image-frame {
            border-radius: 18px;
          }

          .product-information {
            padding-top: 0;
          }

          .product-information h1 {
            font-size: 27px;
          }

          .thumbnail {
            width: 66px;
            height: 66px;
          }

          .description-section,
          .related-section {
            padding: 35px 0 45px;
          }

          .specification-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .business-banner {
            align-items: stretch;
            flex-direction: column;
            margin-bottom: 45px;
          }

          .business-banner > a {
            width: 100%;
          }

          .detail-footer {
            flex-direction: column;
            align-items: flex-start;
            padding: 30px 20px;
          }
        }

        @media (max-width: 420px) {
          .brand-copy strong {
            font-size: 10px;
          }

          .brand-copy small {
            font-size: 8px;
          }

          .brand-mark {
            width: 38px;
            height: 38px;
          }

          .header-actions a:first-child {
            display: none;
          }

          .purchase-details {
            grid-template-columns: 1fr 1fr;
          }

          .specification-grid {
            grid-template-columns: 1fr 1fr;
          }

          .related-grid {
            gap: 10px;
          }

          .related-information {
            padding: 11px;
          }

          .related-information strong {
            font-size: 11px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            scroll-behavior: auto !important;
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </main>
  );
}
