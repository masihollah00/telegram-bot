
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type ProductImage = {
  id: number | string;
  image: string;
  alt_text?: string;
  is_primary?: boolean;
  sort_order?: number;
};

type Product = {
  id: number | string;
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
    image?: string;
  } | null;
  brand?: {
    id: number | string;
    name: string;
    slug: string;
    logo?: string;
    website?: string;
  } | null;
  public_price: number | string;
  availability: string;
  minimum_order_quantity: number;
  units_per_carton: number;
  weight_grams: number;
  is_featured: boolean;
  seo_title?: string;
  seo_description?: string;
};

type ProductListResponse = {
  results?: Product[];
  count?: number;
  next?: string | null;
  previous?: string | null;
};

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://jalali-cosmetics-api.onrender.com/api/store"
).replace(/\/+$/, "");

const FALLBACK_IMAGE = "";

function formatNumber(value: number | string) {
  const number = Number(value || 0);

  if (!Number.isFinite(number)) return "۰";

  return new Intl.NumberFormat("fa-IR").format(number);
}

function formatPrice(value: number | string) {
  const price = Number(value || 0);

  if (!Number.isFinite(price) || price <= 0) {
    return "برای استعلام تماس بگیرید";
  }

  return `${formatNumber(price)} تومان`;
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

async function apiGet<T>(
  path: string,
  signal?: AbortSignal
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
    signal,
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("محصول موردنظر پیدا نشد.");
    }

    if (response.status >= 500) {
      throw new Error(
        "سامانه فروشگاه موقتاً در دسترس نیست. کمی بعد دوباره تلاش کنید."
      );
    }

    throw new Error("دریافت اطلاعات با مشکل مواجه شد.");
  }

  return response.json();
}

function Icon({
  name,
  size = 20,
}: {
  name: string;
  size?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  if (name === "share") {
    return (
      <svg {...common}>
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="m8.7 10.7 6.6-4.4M8.7 13.3l6.6 4.4" />
      </svg>
    );
  }

  if (name === "copy") {
    return (
      <svg {...common}>
        <rect x="8" y="8" width="12" height="12" rx="2" />
        <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
      </svg>
    );
  }

  if (name === "check") {
    return (
      <svg {...common}>
        <path d="m5 12 4 4L19 6" />
      </svg>
    );
  }

  if (name === "plus") {
    return (
      <svg {...common}>
        <path d="M12 5v14M5 12h14" />
      </svg>
    );
  }

  if (name === "minus") {
    return (
      <svg {...common}>
        <path d="M5 12h14" />
      </svg>
    );
  }

  if (name === "arrow") {
    return (
      <svg {...common}>
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    );
  }

  if (name === "truck") {
    return (
      <svg {...common}>
        <path d="M3 6h11v11H3zM14 10h4l3 4v3h-7z" />
        <circle cx="7.5" cy="18" r="1.5" />
        <circle cx="17.5" cy="18" r="1.5" />
      </svg>
    );
  }

  if (name === "shield") {
    return (
      <svg {...common}>
        <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    );
  }

  if (name === "box") {
    return (
      <svg {...common}>
        <path d="m12 3 9 5-9 5-9-5 9-5z" />
        <path d="M3 8v9l9 5 9-5V8M12 13v9" />
      </svg>
    );
  }

  if (name === "image") {
    return (
      <svg {...common}>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

function ProductSkeleton() {
  return (
    <main className="jalali-product" dir="rtl">
      <div className="skeleton-top" />
      <div className="skeleton-layout">
        <div className="skeleton-image" />
        <div className="skeleton-details">
          <div className="skeleton-line short" />
          <div className="skeleton-line title" />
          <div className="skeleton-line" />
          <div className="skeleton-line" />
          <div className="skeleton-price" />
          <div className="skeleton-button" />
        </div>
      </div>
      <style jsx>{styles}
      </style>
    </main>
  );
}

function ProductCard({
  product,
}: {
  product: Product;
}) {
  const image = mediaUrl(
    product.image ||
    product.gallery?.find((item) => item.is_primary)?.image ||
    product.gallery?.[0]?.image
  );

  const inStock = product.availability === "in_stock";

  return (
    <Link
      href={`/products/${encodeURIComponent(product.slug || String(product.id))}`}
      className="related-card"
    >
      <div className="related-image">
        {image ? (
          <img src={image} alt={product.name} loading="lazy" />
        ) : (
          <div className="no-image">
            <Icon name="image" size={30} />
            <span>JALALI</span>
          </div>
        )}

        {product.is_featured && (
          <span className="related-featured">منتخب</span>
        )}
      </div>

      <div className="related-content">
        {product.brand?.name && (
          <span className="related-brand">{product.brand.name}</span>
        )}

        <strong>{product.name}</strong>

        <div className="related-bottom">
          <span className={inStock ? "related-stock yes" : "related-stock no"}>
            {inStock ? "موجود" : "ناموجود"}
          </span>

          <b>{formatPrice(product.public_price)}</b>
        </div>
      </div>
    </Link>
  );
}

export default function ProductDetailsPage() {
  const params = useParams<{ slug: string }>();
  const identifier = params?.slug;

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [selectedImage, setSelectedImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [zoomOpen, setZoomOpen] = useState(false);

  const loadProduct = useCallback(async (signal: AbortSignal) => {
    if (!identifier) return;

    setLoading(true);
    setError("");
    setProduct(null);
    setRelated([]);

    try {
      const data = await apiGet<Product>(
        `/products/${encodeURIComponent(identifier)}/`,
        signal
      );

      setProduct(data);

      const minimum = Math.max(
        1,
        Number(data.minimum_order_quantity || 1)
      );

      setQuantity(minimum);

      const primary =
        data.gallery?.find((item) => item.is_primary)?.image ||
        data.image ||
        data.gallery?.[0]?.image ||
        "";

      setSelectedImage(mediaUrl(primary));

      if (data.category?.slug) {
        setRelatedLoading(true);

        try {
          const relatedData = await apiGet<
            ProductListResponse | Product[]
          >(
            `/products/?category=${encodeURIComponent(
              data.category.slug
            )}&page_size=8`,
            signal
          );

          const items = Array.isArray(relatedData)
            ? relatedData
            : relatedData.results || [];

          setRelated(
            items
              .filter(
                (item) =>
                  String(item.id) !== String(data.id)
              )
              .slice(0, 6)
          );
        } catch {
          // شکست بخش محصولات مرتبط نباید صفحه اصلی محصول را مختل کند.
          setRelated([]);
        } finally {
          if (!signal.aborted) {
            setRelatedLoading(false);
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : "خطای نامشخص در دریافت محصول."
      );
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  }, [identifier]);

  useEffect(() => {
    const controller = new AbortController();

    loadProduct(controller.signal);

    return () => controller.abort();
  }, [loadProduct]);

  const images = useMemo(() => {
    if (!product) return [];

    const gallery = (product.gallery || [])
      .slice()
      .sort(
        (a, b) =>
          Number(a.sort_order || 0) -
          Number(b.sort_order || 0)
      );

    const all = [
      ...(product.image ? [product.image] : []),
      ...gallery.map((item) => item.image),
    ];

    return Array.from(
      new Set(all.filter(Boolean))
    ).map(mediaUrl);
  }, [product]);

  const available =
    product?.availability === "in_stock";

  const minimumQuantity = Math.max(
    1,
    Number(product?.minimum_order_quantity || 1)
  );

  const cartonQuantity = Math.max(
    1,
    Number(product?.units_per_carton || 1)
  );

  const quickOrderHref = product
    ? `/quick-order?sku=${encodeURIComponent(
        product.sku
      )}&quantity=${quantity}&product=${encodeURIComponent(
        product.name
      )}`
    : "/quick-order";

  const changeQuantity = (value: number) => {
    if (!product) return;

    const safeValue = Math.max(
      minimumQuantity,
      Math.floor(value || minimumQuantity)
    );

    setQuantity(safeValue);
  };

  const shareProduct = async () => {
    if (!product || typeof window === "undefined") return;

    const shareData = {
      title: product.name,
      text: `مشاهده محصول ${product.name} در JALALI COSMETICS`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareData.url);
        setNotice("لینک محصول کپی شد.");
      } else {
        setNotice("امکان اشتراک‌گذاری در این مرورگر فراهم نیست.");
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setNotice("اشتراک‌گذاری انجام نشد.");
      }
    }
  };

  const copySku = async () => {
    if (!product?.sku) return;

    try {
      await navigator.clipboard.writeText(product.sku);
      setNotice("کد محصول کپی شد.");
    } catch {
      setNotice("کپی در این مرورگر پشتیبانی نمی‌شود.");
    }
  };

  useEffect(() => {
    if (!notice) return;

    const timer = window.setTimeout(() => {
      setNotice("");
    }, 2800);

    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!zoomOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setZoomOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [zoomOpen]);

  if (loading) {
    return <ProductSkeleton />;
  }

  if (error || !product) {
    return (
      <main className="jalali-product state-page" dir="rtl">
        <div className="state-card">
          <div className="state-mark">J</div>
          <span className="english-kicker">PRODUCT INFORMATION</span>
          <h1>محصول در دسترس نیست</h1>
          <p>
            {error || "اطلاعات این محصول دریافت نشد."}
          </p>

          <div className="state-buttons">
            <button
              type="button"
              onClick={() => {
                const controller = new AbortController();
                loadProduct(controller.signal);
              }}
            >
              تلاش مجدد
            </button>

            <Link href="/products">مشاهده محصولات</Link>
          </div>

          <span className="state-brand">
            JALALI COSMETICS
          </span>
        </div>

        <style jsx>{styles}</style>
      </main>
    );
  }

  return (
    <main className="jalali-product" dir="rtl">
      <div className="announcement">
        <span>JALALI COSMETICS</span>
        <i />
        <span>BEAUTY. BUSINESS. TRUST.</span>
        <i />
        <span>ارسال سراسری سفارش‌ها در ایران</span>
      </div>

      <header className="site-header">
        <Link href="/" className="brand-lockup">
          <span className="brand-symbol">J</span>
          <span className="brand-words">
            <strong>JALALI COSMETICS</strong>
            <small>BEAUTY. BUSINESS. TRUST.</small>
          </span>
        </Link>

        <nav className="main-nav">
          <Link href="/">صفحه اصلی</Link>
          <Link href="/products" className="active">محصولات</Link>
          <Link href="/categories">دسته‌بندی‌ها</Link>
          <Link href="/brands">برندها</Link>
          <Link href="/partner">همکاری تجاری</Link>
        </nav>

        <div className="header-actions">
          <Link href="/cart" className="header-link">
            سبد خرید
          </Link>
          <Link href="/account" className="account-link">
            حساب کاربری
          </Link>
        </div>
      </header>

      <div className="breadcrumb">
        <Link href="/">خانه</Link>
        <span>/</span>
        <Link href="/products">محصولات</Link>

        {product.category && (
          <>
            <span>/</span>
            <Link
              href={`/categories/${encodeURIComponent(
                product.category.slug
              )}`}
            >
              {product.category.name}
            </Link>
          </>
        )}

        <span>/</span>
        <strong>{product.name}</strong>
      </div>

      <section className="product-hero">
        <div className="gallery-column">
          <div className="gallery-topline">
            <span>PRODUCT GALLERY</span>

            <button
              type="button"
              className="icon-action"
              onClick={shareProduct}
              aria-label="اشتراک‌گذاری محصول"
            >
              <Icon name="share" />
            </button>
          </div>

          <div className="main-photo">
            {selectedImage ? (
              <button
                type="button"
                className="photo-button"
                onClick={() => setZoomOpen(true)}
                aria-label="نمایش بزرگ تصویر محصول"
              >
                <img
                  src={selectedImage}
                  alt={product.name}
                  fetchPriority="high"
                />
              </button>
            ) : (
              <div className="photo-empty">
                <Icon name="image" size={54} />
                <span>JALALI COSMETICS</span>
                <small>PRODUCT IMAGE</small>
              </div>
            )}

            {product.is_featured && (
              <span className="featured-label">
                <span>✦</span>
                محصول منتخب
              </span>
            )}

            <span className="photo-index">
              {images.length
                ? `${formatNumber(
                    Math.max(1, images.indexOf(selectedImage) + 1)
                  )} / ${formatNumber(images.length)}`
                : "تصویر محصول"}
            </span>
          </div>

          {images.length > 1 && (
            <div className="thumbnail-strip">
              {images.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  className={
                    selectedImage === image
                      ? "thumbnail selected"
                      : "thumbnail"
                  }
                  onClick={() => setSelectedImage(image)}
                  aria-label={`انتخاب تصویر ${index + 1}`}
                >
                  <img
                    src={image}
                    alt={`${product.name} - ${index + 1}`}
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}

          <div className="gallery-caption">
            <span>JALALI SELECTED COLLECTION</span>
            <span>01 / PRODUCT DETAIL</span>
          </div>
        </div>

        <div className="information-column">
          <div className="product-overline">
            <span>PRODUCT DETAILS</span>

            {product.is_featured && (
              <span className="featured-text">FEATURED</span>
            )}
          </div>

          <h1>{product.name}</h1>

          {product.short_description && (
            <p className="short-description">
              {product.short_description}
            </p>
          )}

          <div className="identity-row">
            <div className="identity-item">
              <span>کد محصول</span>
              <strong>{product.sku || "ثبت نشده"}</strong>
              {product.sku && (
                <button
                  type="button"
                  onClick={copySku}
                  aria-label="کپی کد محصول"
                >
                  <Icon name="copy" size={14} />
                </button>
              )}
            </div>

            {product.brand && (
              <Link
                href={`/brands/${encodeURIComponent(
                  product.brand.slug
                )}`}
                className="identity-item identity-link"
              >
                <span>برند</span>
                <strong>{product.brand.name}</strong>
                <Icon name="arrow" size={14} />
              </Link>
            )}
          </div>

          {product.category && (
            <Link
              href={`/categories/${encodeURIComponent(
                product.category.slug
              )}`}
              className="category-chip"
            >
              <span>دسته‌بندی:</span>
              <strong>{product.category.name}</strong>
              <Icon name="arrow" size={13} />
            </Link>
          )}

          <div className="price-card">
            <div className="price-heading">
              <span>قیمت مصرف‌کننده / عمومی</span>
              <span className="price-currency">IRR · TOMAN</span>
            </div>

            <strong className="price-value">
              {formatPrice(product.public_price)}
            </strong>

            <p>
              قیمت همکاری و شرایط خرید عمده پس از تأیید حساب همکار
              در دسترس قرار می‌گیرد.
            </p>
          </div>

          <div className="stock-row">
            <div className="stock-status">
              <span className={available ? "stock-light on" : "stock-light off"} />
              <strong>
                {available ? "موجود و آماده سفارش" : "در حال حاضر ناموجود"}
              </strong>
            </div>

            <span className="stock-public">
              وضعیت موجودی به‌روز
            </span>
          </div>

          <div className="order-panel">
            <div className="order-panel-heading">
              <div>
                <span>ORDER QUANTITY</span>
                <strong>تعداد سفارش</strong>
              </div>

              <span className="minimum-tag">
                حداقل {formatNumber(minimumQuantity)} عدد
              </span>
            </div>

            <div className="quantity-control">
              <button
                type="button"
                disabled={!available || quantity <= minimumQuantity}
                onClick={() => changeQuantity(quantity - 1)}
                aria-label="کاهش تعداد"
              >
                <Icon name="minus" />
              </button>

              <input
                type="number"
                min={minimumQuantity}
                step="1"
                value={quantity}
                disabled={!available}
                onChange={(event) =>
                  changeQuantity(Number(event.target.value))
                }
                aria-label="تعداد سفارش"
              />

              <button
                type="button"
                disabled={!available}
                onClick={() => changeQuantity(quantity + 1)}
                aria-label="افزایش تعداد"
              >
                <Icon name="plus" />
              </button>
            </div>

            <div className="order-facts">
              <div>
                <span>حداقل سفارش</span>
                <strong>{formatNumber(minimumQuantity)} عدد</strong>
              </div>

              <div>
                <span>تعداد در کارتن</span>
                <strong>{formatNumber(cartonQuantity)} عدد</strong>
              </div>

              <div>
                <span>وزن خالص</span>
                <strong>
                  {product.weight_grams
                    ? `${formatNumber(product.weight_grams)} گرم`
                    : "ثبت نشده"}
                </strong>
              </div>
            </div>

            <Link
              href={available ? quickOrderHref : "/contact"}
              className={
                available
                  ? "primary-order-button"
                  : "primary-order-button disabled"
              }
              aria-disabled={!available}
              onClick={(event) => {
                if (!available) {
                  event.preventDefault();
                }
              }}
            >
              <span>
                {available
                  ? "ثبت درخواست خرید"
                  : "استعلام تأمین محصول"}
              </span>
              <Icon name="arrow" size={19} />
            </Link>

            <Link href="/partner" className="partner-order-link">
              خریدار عمده هستید؟ درخواست همکاری ثبت کنید
            </Link>
          </div>

          <div className="service-points">
            <div>
              <Icon name="shield" size={20} />
              <span>
                <strong>اطلاعات شفاف محصول</strong>
                <small>مشخصات ثبت‌شده در سامانه فروشگاه</small>
              </span>
            </div>

            <div>
              <Icon name="truck" size={20} />
              <span>
                <strong>ارسال سراسری</strong>
                <small>هماهنگی ارسال هنگام ثبت سفارش</small>
              </span>
            </div>

            <div>
              <Icon name="box" size={20} />
              <span>
                <strong>مناسب خرید عمده</strong>
                <small>امکان ثبت درخواست همکاری تجاری</small>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="details-section">
        <div className="section-title">
          <div>
            <span>PRODUCT STORY</span>
            <h2>معرفی و توضیحات محصول</h2>
          </div>

          <span className="section-number">01</span>
        </div>

        <div className="description-layout">
          <div className="description-main">
            <h3>{product.name}</h3>

            {product.description ? (
              <p className="description-text">
                {product.description}
              </p>
            ) : product.short_description ? (
              <p className="description-text">
                {product.short_description}
              </p>
            ) : (
              <p className="description-muted">
                توضیحات تکمیلی این محصول هنوز توسط مدیریت فروشگاه ثبت نشده است.
                برای دریافت اطلاعات بیشتر می‌توانید با واحد فروش تماس بگیرید.
              </p>
            )}
          </div>

          <aside className="description-aside">
            <span>JALALI COSMETICS</span>
            <strong>BEAUTY.</strong>
            <strong>BUSINESS.</strong>
            <strong>TRUST.</strong>
            <small>PRODUCT INFORMATION</small>
          </aside>
        </div>
      </section>

      <section className="business-banner">
        <div className="business-decoration">J</div>

        <div className="business-copy">
          <span>BUSINESS PARTNERSHIP</span>
          <h2>همکاری تجاری با پخش جلالی</h2>
          <p>
            برای دریافت شرایط همکاری و دسترسی به خدمات ویژه همکاران،
            درخواست خود را ثبت کنید.
          </p>
        </div>

        <Link href="/partner">
          ثبت درخواست همکاری
          <Icon name="arrow" size={18} />
        </Link>
      </section>

      <section className="related-section">
        <div className="section-title">
          <div>
            <span>YOU MAY ALSO LIKE</span>
            <h2>محصولات مرتبط</h2>
          </div>

          {product.category && (
            <Link
              href={`/categories/${encodeURIComponent(
                product.category.slug
              )}`}
              className="view-all"
            >
              مشاهده همه
              <Icon name="arrow" size={16} />
            </Link>
          )}
        </div>

        {relatedLoading ? (
          <div className="related-loading">
            در حال دریافت محصولات مرتبط...
          </div>
        ) : related.length > 0 ? (
          <div className="related-grid">
            {related.map((item) => (
              <ProductCard
                key={String(item.id)}
                product={item}
              />
            ))}
          </div>
        ) : (
          <div className="related-empty">
            <span>J</span>
            <p>
              در حال حاضر محصول مرتبط دیگری برای نمایش ثبت نشده است.
            </p>
          </div>
        )}
      </section>

      <footer className="site-footer">
        <div className="footer-main">
          <Link href="/" className="footer-brand">
            <span className="brand-symbol">J</span>
            <span>
              <strong>JALALI COSMETICS</strong>
              <small>BEAUTY. BUSINESS. TRUST.</small>
            </span>
          </Link>

          <p>
            پخش جلالی؛ تجربه‌ای حرفه‌ای در خرید محصولات آرایشی و بهداشتی.
          </p>

          <div className="footer-links">
            <Link href="/products">محصولات</Link>
            <Link href="/partner">همکاری تجاری</Link>
            <Link href="/contact">تماس با ما</Link>
            <Link href="/faq">راهنما</Link>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© JALALI COSMETICS</span>
          <span>BEAUTY. BUSINESS. TRUST.</span>
        </div>
      </footer>

      {available && (
        <div className="mobile-order-bar">
          <div>
            <small>قیمت عمومی</small>
            <strong>{formatPrice(product.public_price)}</strong>
          </div>

          <Link href={quickOrderHref}>
            ثبت درخواست
            <Icon name="arrow" size={17} />
          </Link>
        </div>
      )}

      {notice && (
        <div className="notice-toast" role="status">
          <Icon name="check" size={17} />
          {notice}
        </div>
      )}

      {zoomOpen && selectedImage && (
        <div
          className="zoom-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="نمایش تصویر محصول"
          onClick={() => setZoomOpen(false)}
        >
          <button
            type="button"
            className="zoom-close"
            onClick={() => setZoomOpen(false)}
            aria-label="بستن تصویر"
          >
            ×
          </button>

          <img
            src={selectedImage}
            alt={product.name}
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}

      <style jsx>{styles}</style>
    </main>
  );
}

const styles = `
  .jalali-product {
    --black: #0b0b0d;
    --panel: #151416;
    --panel2: #1b191a;
    --rose: #c99a86;
    --rose-light: #e0b7a5;
    --white: #f5f1ee;
    --muted: #a69a95;
    --line: rgba(201,154,134,.19);
    min-height: 100vh;
    padding: 0 5.2%;
    background: var(--black);
    color: var(--white);
    overflow: hidden;
  }

  .announcement {
    min-height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 13px;
    border-bottom: 1px solid var(--line);
    color: #b7a9a2;
    font-size: 9px;
    letter-spacing: 1px;
  }

  .announcement span:first-child {
    color: var(--rose);
    font-weight: 800;
  }

  .announcement i {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: var(--rose);
  }

  .site-header {
    min-height: 90px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 22px;
    border-bottom: 1px solid var(--line);
  }

  .brand-lockup,
  .footer-brand {
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--white);
    text-decoration: none;
    flex-shrink: 0;
  }

  .brand-symbol {
    width: 46px;
    height: 46px;
    display: grid;
    place-items: center;
    border: 1px solid var(--rose);
    color: var(--rose);
    font-family: Georgia,serif;
    font-size: 29px;
    line-height: 1;
  }

  .brand-words,
  .footer-brand > span:last-child {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .brand-words strong,
  .footer-brand strong {
    font-size: 12px;
    letter-spacing: 2px;
  }

  .brand-words small,
  .footer-brand small {
    color: var(--muted);
    font-size: 8px;
    letter-spacing: 1.5px;
  }

  .main-nav {
    display: flex;
    align-items: center;
    gap: 25px;
  }

  .main-nav a,
  .header-link {
    color: #c7bbb6;
    font-size: 11px;
    text-decoration: none;
    transition: color .2s ease;
  }

  .main-nav a:hover,
  .main-nav a.active,
  .header-link:hover {
    color: var(--rose-light);
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .account-link {
    padding: 11px 15px;
    border: 1px solid var(--line);
    color: var(--rose-light);
    font-size: 10px;
    text-decoration: none;
  }

  .breadcrumb {
    max-width: 1320px;
    margin: 25px auto;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    color: #8e817c;
    font-size: 10px;
  }

  .breadcrumb a {
    color: #c7a293;
    text-decoration: none;
  }

  .breadcrumb strong {
    color: var(--white);
    font-weight: 500;
  }

  .product-hero {
    max-width: 1320px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: minmax(0,1.04fr) minmax(0,.96fr);
    align-items: start;
    gap: clamp(30px,5vw,75px);
    padding: 12px 0 80px;
  }

  .gallery-column {
    min-width: 0;
  }

  .gallery-topline {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 13px;
    color: var(--rose);
    font-size: 9px;
    letter-spacing: 2px;
  }

  .icon-action {
    width: 36px;
    height: 36px;
    display: grid;
    place-items: center;
    border: 1px solid var(--line);
    border-radius: 50%;
    background: transparent;
    color: var(--rose-light);
    cursor: pointer;
  }

  .main-photo {
    position: relative;
    aspect-ratio: 1 / 1.03;
    display: grid;
    place-items: center;
    overflow: hidden;
    border: 1px solid rgba(201,154,134,.28);
    background:
      radial-gradient(ellipse at 50% 45%, #342622 0%, #1a1718 45%, #111012 100%);
  }

  .photo-button {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    padding: 24px;
    border: 0;
    background: transparent;
    cursor: zoom-in;
  }

  .photo-button img {
    width: 100%;
    height: 100%;
    max-height: 680px;
    object-fit: contain;
    transition: transform .45s ease;
  }

  .photo-button:hover img {
    transform: scale(1.035);
  }

  .photo-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
    color: var(--rose);
  }

  .photo-empty span {
    font-family: Georgia,serif;
    font-size: 19px;
    letter-spacing: 3px;
  }

  .photo-empty small {
    color: #9a8278;
    font-size: 8px;
    letter-spacing: 3px;
  }

  .featured-label {
    position: absolute;
    top: 17px;
    right: 17px;
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 9px 12px;
    border: 1px solid rgba(201,154,134,.55);
    background: rgba(11,11,13,.86);
    color: var(--rose-light);
    font-size: 9px;
  }

  .featured-label span {
    color: var(--rose);
  }

  .photo-index {
    position: absolute;
    bottom: 15px;
    left: 15px;
    padding: 7px 10px;
    background: rgba(11,11,13,.75);
    color: #d2c2bb;
    font-size: 9px;
  }

  .thumbnail-strip {
    display: flex;
    gap: 10px;
    overflow-x: auto;
    padding: 13px 1px 5px;
  }

  .thumbnail {
    width: 78px;
    height: 78px;
    flex: 0 0 78px;
    padding: 5px;
    overflow: hidden;
    border: 1px solid var(--line);
    background: #171517;
    cursor: pointer;
  }

  .thumbnail.selected {
    border-color: var(--rose);
    box-shadow: 0 0 0 1px rgba(201,154,134,.15);
  }

  .thumbnail img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .gallery-caption {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding-top: 14px;
    color: #796e69;
    font-size: 8px;
    letter-spacing: 1.5px;
  }

  .information-column {
    min-width: 0;
    padding-top: 8px;
  }

  .product-overline {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: var(--rose);
    font-size: 9px;
    letter-spacing: 2.5px;
  }

  .featured-text {
    padding: 6px 9px;
    border: 1px solid var(--line);
    color: var(--rose-light);
    font-size: 8px;
  }

  .information-column h1 {
    margin: 20px 0 13px;
    color: var(--white);
    font-size: clamp(25px,3vw,39px);
    font-weight: 700;
    line-height: 1.8;
    overflow-wrap: anywhere;
  }

  .short-description {
    margin: 0;
    color: #b2a6a0;
    font-size: 12px;
    line-height: 2.35;
  }

  .identity-row {
    display: grid;
    grid-template-columns: repeat(2,minmax(0,1fr));
    gap: 10px;
    margin-top: 23px;
  }

  .identity-item {
    min-width: 0;
    min-height: 66px;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    border: 1px solid var(--line);
    background: rgba(255,255,255,.018);
    color: var(--white);
    text-decoration: none;
  }

  .identity-item > span {
    color: #948781;
    font-size: 9px;
  }

  .identity-item strong {
    min-width: 0;
    margin-right: auto;
    color: #e5d9d3;
    font-size: 11px;
    overflow-wrap: anywhere;
  }

  .identity-item button {
    display: grid;
    place-items: center;
    padding: 3px;
    border: 0;
    background: transparent;
    color: var(--rose);
    cursor: pointer;
  }

  .identity-link svg {
    color: var(--rose);
  }

  .category-chip {
    width: fit-content;
    max-width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
    padding: 9px 12px;
    border: 1px solid var(--line);
    color: #a99b96;
    font-size: 9px;
    text-decoration: none;
  }

  .category-chip strong {
    color: var(--rose-light);
    font-weight: 600;
  }

  .price-card {
    margin-top: 24px;
    padding: 21px;
    border: 1px solid rgba(201,154,134,.42);
    background:
      linear-gradient(120deg,rgba(201,154,134,.12),rgba(255,255,255,.015));
  }

  .price-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    color: #b7aaa4;
    font-size: 10px;
  }

  .price-currency {
    color: #8d7971;
    font-size: 8px;
    letter-spacing: 1px;
  }

  .price-value {
    display: block;
    margin-top: 13px;
    color: var(--rose-light);
    font-size: clamp(20px,2.2vw,28px);
    line-height: 1.8;
    overflow-wrap: anywhere;
  }

  .price-card p {
    margin: 10px 0 0;
    color: #998b85;
    font-size: 9px;
    line-height: 2.2;
  }

  .stock-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 19px 0;
    border-bottom: 1px solid var(--line);
  }

  .stock-status {
    display: flex;
    align-items: center;
    gap: 9px;
    font-size: 11px;
  }

  .stock-light {
    width: 8px;
    height: 8px;
    flex: 0 0 8px;
    border-radius: 50%;
  }

  .stock-light.on {
    background: #67b899;
    box-shadow: 0 0 12px rgba(103,184,153,.45);
  }

  .stock-light.off {
    background: #d17c7c;
  }

  .stock-public {
    color: #8e827d;
    font-size: 9px;
  }

  .order-panel {
    margin-top: 20px;
    padding: 19px;
    border: 1px solid var(--line);
    background: #131214;
  }

  .order-panel-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .order-panel-heading > div {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .order-panel-heading > div span {
    color: var(--rose);
    font-size: 8px;
    letter-spacing: 2px;
  }

  .order-panel-heading > div strong {
    font-size: 12px;
  }

  .minimum-tag {
    padding: 7px 9px;
    border: 1px solid var(--line);
    color: #c9b4a9;
    font-size: 9px;
  }

  .quantity-control {
    width: 170px;
    height: 43px;
    display: flex;
    align-items: center;
    margin-top: 17px;
    border: 1px solid var(--line);
  }

  .quantity-control button {
    width: 42px;
    height: 100%;
    display: grid;
    place-items: center;
    border: 0;
    background: #211b1b;
    color: var(--rose-light);
    cursor: pointer;
  }

  .quantity-control button:disabled {
    opacity: .35;
    cursor: not-allowed;
  }

  .quantity-control input {
    width: 84px;
    height: 100%;
    border: 0;
    outline: none;
    background: transparent;
    color: var(--white);
    text-align: center;
    font-size: 13px;
    font-family: inherit;
  }

  .quantity-control input::-webkit-inner-spin-button,
  .quantity-control input::-webkit-outer-spin-button {
    appearance: none;
    margin: 0;
  }

  .order-facts {
    display: grid;
    grid-template-columns: repeat(3,minmax(0,1fr));
    gap: 10px;
    margin-top: 18px;
    padding: 15px 0;
    border-top: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
  }

  .order-facts div {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .order-facts span {
    color: #8f837e;
    font-size: 8px;
  }

  .order-facts strong {
    color: #e5d8d2;
    font-size: 10px;
  }

  .primary-order-button {
    min-height: 51px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 17px;
    padding: 0 17px;
    background: var(--rose);
    color: #171113;
    font-size: 11px;
    font-weight: 800;
    text-decoration: none;
    transition: background .2s ease,transform .2s ease;
  }

  .primary-order-button:hover {
    background: var(--rose-light);
    transform: translateY(-2px);
  }

  .primary-order-button.disabled {
    opacity: .55;
    cursor: not-allowed;
  }

  .partner-order-link {
    display: block;
    margin-top: 15px;
    color: var(--rose-light);
    text-align: center;
    font-size: 9px;
    text-decoration: none;
  }

  .service-points {
    display: grid;
    grid-template-columns: repeat(3,minmax(0,1fr));
    gap: 10px;
    margin-top: 20px;
  }

  .service-points > div {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 12px 9px;
    border: 1px solid rgba(201,154,134,.12);
    background: rgba(255,255,255,.015);
    color: var(--rose);
  }

  .service-points svg {
    flex: 0 0 auto;
  }

  .service-points span {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .service-points strong {
    color: #d9cbc4;
    font-size: 8px;
  }

  .service-points small {
    color: #8f837e;
    font-size: 7px;
    line-height: 1.8;
  }

  .details-section,
  .related-section {
    max-width: 1320px;
    margin: 0 auto;
    padding: 55px 0;
    border-top: 1px solid var(--line);
  }

  .section-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
    margin-bottom: 25px;
  }

  .section-title > div > span {
    color: var(--rose);
    font-size: 9px;
    letter-spacing: 2px;
  }

  .section-title h2 {
    margin: 9px 0 0;
    font-size: 23px;
  }

  .section-number {
    color: rgba(201,154,134,.38);
    font-family: Georgia,serif;
    font-size: 43px;
  }

  .description-layout {
    display: grid;
    grid-template-columns: minmax(0,1fr) 250px;
    gap: 20px;
  }

  .description-main {
    min-height: 190px;
    padding: 26px;
    border: 1px solid var(--line);
    background: #131214;
  }

  .description-main h3 {
    margin: 0 0 14px;
    color: var(--rose-light);
    font-size: 16px;
  }

  .description-text,
  .description-muted {
    margin: 0;
    color: #c0b5af;
    font-size: 12px;
    line-height: 2.7;
    white-space: pre-line;
    overflow-wrap: anywhere;
  }

  .description-muted {
    color: #938680;
  }

  .description-aside {
    min-height: 190px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 22px;
    border: 1px solid rgba(201,154,134,.24);
    background:
      radial-gradient(circle at 100% 0%,#35241f,transparent 70%),
      #171416;
  }

  .description-aside > span {
    margin-bottom: 15px;
    color: var(--rose);
    font-size: 8px;
    letter-spacing: 2px;
  }

  .description-aside strong {
    color: #e2c2b4;
    font-family: Georgia,serif;
    font-size: 22px;
    letter-spacing: 2px;
    line-height: 1.5;
  }

  .description-aside small {
    margin-top: 15px;
    color: #8d7c75;
    font-size: 8px;
    letter-spacing: 2px;
  }

  .business-banner {
    max-width: 1320px;
    min-height: 190px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 25px;
    overflow: hidden;
    margin: 35px auto 60px;
    padding: 35px;
    border: 1px solid rgba(201,154,134,.38);
    background:
      linear-gradient(100deg,rgba(201,154,134,.12),transparent 65%),
      #171416;
  }

  .business-decoration {
    position: absolute;
    left: 28%;
    top: -80px;
    color: rgba(201,154,134,.055);
    font-family: Georgia,serif;
    font-size: 280px;
    line-height: 1;
    pointer-events: none;
  }

  .business-copy {
    position: relative;
    z-index: 1;
  }

  .business-copy > span {
    color: var(--rose);
    font-size: 9px;
    letter-spacing: 2px;
  }

  .business-copy h2 {
    margin: 12px 0;
    font-size: 22px;
  }

  .business-copy p {
    max-width: 570px;
    margin: 0;
    color: #aa9d97;
    font-size: 10px;
    line-height: 2.3;
  }

  .business-banner > a {
    position: relative;
    z-index: 1;
    min-height: 47px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 15px;
    flex-shrink: 0;
    padding: 0 18px;
    background: var(--rose);
    color: #171113;
    font-size: 10px;
    font-weight: 800;
    text-decoration: none;
  }

  .related-section {
    padding-top: 45px;
    padding-bottom: 65px;
  }

  .view-all {
    display: flex;
    align-items: center;
    gap: 9px;
    color: var(--rose-light);
    font-size: 10px;
    text-decoration: none;
  }

  .related-grid {
    display: grid;
    grid-template-columns: repeat(3,minmax(0,1fr));
    gap: 17px;
  }

  .related-card {
    min-width: 0;
    overflow: hidden;
    border: 1px solid var(--line);
    background: #151416;
    color: var(--white);
    text-decoration: none;
    transition: transform .2s ease,border-color .2s ease;
  }

  .related-card:hover {
    transform: translateY(-4px);
    border-color: rgba(201,154,134,.55);
  }

  .related-image {
    position: relative;
    aspect-ratio: 1 / .82;
    display: grid;
    place-items: center;
    overflow: hidden;
    background: radial-gradient(circle,#30221f,#151416 75%);
  }

  .related-image img {
    width: 100%;
    height: 100%;
    padding: 13px;
    object-fit: contain;
    transition: transform .3s ease;
  }

  .related-card:hover .related-image img {
    transform: scale(1.04);
  }

  .no-image {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 9px;
    color: var(--rose);
  }

  .no-image span {
    font-size: 8px;
    letter-spacing: 2px;
  }

  .related-featured {
    position: absolute;
    top: 10px;
    right: 10px;
    padding: 6px 8px;
    background: #171113;
    color: var(--rose-light);
    font-size: 8px;
  }

  .related-content {
    padding: 14px;
  }

  .related-brand {
    display: block;
    margin-bottom: 7px;
    color: var(--rose);
    font-size: 8px;
  }

  .related-content > strong {
    min-height: 42px;
    display: block;
    color: #e9ded8;
    font-size: 11px;
    line-height: 1.9;
  }

  .related-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-top: 13px;
    padding-top: 12px;
    border-top: 1px solid var(--line);
  }

  .related-bottom b {
    color: var(--rose-light);
    font-size: 10px;
  }

  .related-stock {
    font-size: 8px;
  }

  .related-stock.yes {
    color: #72bd9f;
  }

  .related-stock.no {
    color: #d17c7c;
  }

  .related-empty,
  .related-loading {
    min-height: 130px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    border: 1px solid var(--line);
    color: #948680;
    font-size: 10px;
    text-align: center;
  }

  .related-empty > span {
    color: var(--rose);
    font-family: Georgia,serif;
    font-size: 30px;
  }

  .site-footer {
    border-top: 1px solid var(--line);
  }

  .footer-main {
    display: grid;
    grid-template-columns: 1.2fr 1fr 1fr;
    align-items: center;
    gap: 25px;
    padding: 32px 0;
  }

  .footer-main > p {
    color: #968984;
    font-size: 9px;
    line-height: 2.3;
  }

  .footer-links {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
  }

  .footer-links a {
    color: #b6a8a1;
    font-size: 9px;
    text-decoration: none;
  }

  .footer-links a:hover {
    color: var(--rose-light);
  }

  .footer-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
    padding: 16px 0;
    border-top: 1px solid var(--line);
    color: #827671;
    font-size: 8px;
    letter-spacing: 1.5px;
  }

  .mobile-order-bar {
    display: none;
  }

  .notice-toast {
    position: fixed;
    z-index: 100;
    bottom: 25px;
    right: 25px;
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 13px 18px;
    border: 1px solid var(--line);
    background: #211a1a;
    color: var(--rose-light);
    box-shadow: 0 10px 35px #0008;
    font-size: 11px;
  }

  .zoom-overlay {
    position: fixed;
    z-index: 200;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 35px;
    background: rgba(0,0,0,.94);
    cursor: zoom-out;
  }

  .zoom-overlay img {
    max-width: 95vw;
    max-height: 88vh;
    object-fit: contain;
  }

  .zoom-close {
    position: absolute;
    top: 20px;
    left: 25px;
    width: 42px;
    height: 42px;
    border: 1px solid var(--line);
    background: #171416;
    color: var(--rose-light);
    font-size: 25px;
    cursor: pointer;
  }

  .state-page {
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 25px;
  }

  .state-card {
    width: min(100%,520px);
    padding: 45px 30px;
    border: 1px solid var(--line);
    background: #151416;
    text-align: center;
  }

  .state-mark {
    width: 65px;
    height: 65px;
    display: grid;
    place-items: center;
    margin: 0 auto 20px;
    border: 1px solid var(--rose);
    color: var(--rose);
    font-family: Georgia,serif;
    font-size: 38px;
  }

  .english-kicker {
    color: var(--rose);
    font-size: 9px;
    letter-spacing: 2px;
  }

  .state-card h1 {
    margin: 15px 0;
    font-size: 22px;
  }

  .state-card p {
    color: #a99b96;
    font-size: 11px;
    line-height: 2.2;
  }

  .state-buttons {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 25px;
  }

  .state-buttons button,
  .state-buttons a {
    min-height: 42px;
    display: grid;
    place-items: center;
    padding: 0 17px;
    border: 1px solid var(--rose);
    background: var(--rose);
    color: #171113;
    font-family: inherit;
    font-size: 10px;
    text-decoration: none;
    cursor: pointer;
  }

  .state-buttons a {
    background: transparent;
    color: var(--rose-light);
  }

  .state-brand {
    display: block;
    margin-top: 30px;
    color: #88756d;
    font-size: 9px;
    letter-spacing: 2px;
  }

  .skeleton-top {
    height: 80px;
    border-bottom: 1px solid var(--line);
  }

  .skeleton-layout {
    max-width: 1250px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 50px;
    margin: 55px auto;
  }

  .skeleton-image,
  .skeleton-line,
  .skeleton-price,
  .skeleton-button {
    background: linear-gradient(90deg,#191719,#292123,#191719);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite linear;
  }

  .skeleton-image {
    aspect-ratio: 1;
  }

  .skeleton-details {
    display: flex;
    flex-direction: column;
    gap: 17px;
    padding-top: 20px;
  }

  .skeleton-line {
    height: 14px;
    width: 100%;
  }

  .skeleton-line.short {
    width: 25%;
    height: 9px;
  }

  .skeleton-line.title {
    width: 75%;
    height: 34px;
  }

  .skeleton-price {
    height: 110px;
    margin-top: 15px;
  }

  .skeleton-button {
    height: 50px;
  }

  @keyframes shimmer {
    to { background-position: -200% 0; }
  }

  @media(max-width:1050px) {
    .jalali-product {
      padding: 0 3%;
    }

    .main-nav {
      gap: 14px;
    }

    .product-hero {
      gap: 30px;
    }

    .service-points {
      grid-template-columns: 1fr;
    }
  }

  @media(max-width:760px) {
    .site-header {
      min-height: 75px;
      flex-wrap: wrap;
      padding: 13px 0;
    }

    .main-nav {
      order: 3;
      width: 100%;
      justify-content: space-between;
      overflow-x: auto;
      padding: 8px 0 3px;
    }

    .main-nav a {
      white-space: nowrap;
      font-size: 9px;
    }

    .header-actions {
      margin-right: auto;
    }

    .account-link {
      display: none;
    }

    .product-hero {
      grid-template-columns: 1fr;
      gap: 35px;
      padding-bottom: 55px;
    }

    .gallery-column {
      width: 100%;
      max-width: 650px;
      margin: auto;
    }

    .information-column {
      padding-top: 0;
    }

    .main-photo {
      aspect-ratio: 1 / .9;
    }

    .service-points {
      grid-template-columns: repeat(3,minmax(0,1fr));
    }

    .description-layout {
      grid-template-columns: 1fr;
    }

    .description-aside {
      min-height: 145px;
    }

    .footer-main {
      grid-template-columns: 1fr 1fr;
    }

    .footer-links {
      grid-column: 1 / -1;
    }
  }

  @media(max-width:520px) {
    .jalali-product {
      padding: 0 15px;
      padding-bottom: 75px;
    }

    .announcement {
      gap: 7px;
      font-size: 7px;
    }

    .brand-symbol {
      width: 39px;
      height: 39px;
      font-size: 25px;
    }

    .brand-words strong {
      font-size: 10px;
    }

    .brand-words small {
      font-size: 7px;
    }

    .header-link {
      font-size: 9px;
    }

    .breadcrumb {
      margin: 18px 0;
      font-size: 9px;
    }

    .product-hero {
      gap: 28px;
    }

    .main-photo {
      aspect-ratio: 1 / 1;
    }

    .thumbnail {
      width: 66px;
      height: 66px;
      flex-basis: 66px;
    }

    .information-column h1 {
      font-size: 25px;
    }

    .identity-row {
      grid-template-columns: 1fr;
    }

    .price-card {
      padding: 17px;
    }

    .price-value {
      font-size: 21px;
    }

    .order-panel {
      padding: 14px;
    }

    .order-facts {
      gap: 6px;
    }

    .order-facts span {
      font-size: 7px;
    }

    .order-facts strong {
      font-size: 9px;
    }

    .service-points {
      grid-template-columns: 1fr;
    }

    .service-points > div {
      align-items: center;
    }

    .service-points small {
      font-size: 8px;
    }

    .details-section,
    .related-section {
      padding: 38px 0;
    }

    .section-title h2 {
      font-size: 19px;
    }

    .description-main {
      padding: 19px;
    }

    .business-banner {
      align-items: stretch;
      flex-direction: column;
      padding: 23px;
    }

    .business-copy h2 {
      font-size: 19px;
    }

    .business-banner > a {
      width: 100%;
    }

    .related-grid {
      grid-template-columns: repeat(2,minmax(0,1fr));
      gap: 10px;
    }

    .related-content {
      padding: 10px;
    }

    .related-content > strong {
      font-size: 9px;
    }

    .related-bottom {
      align-items: flex-start;
      flex-direction: column;
    }

    .related-bottom b {
      font-size: 9px;
    }

    .footer-main {
      grid-template-columns: 1fr;
      gap: 14px;
    }

    .footer-links {
      grid-column: auto;
    }

    .footer-bottom {
      font-size: 7px;
    }

    .mobile-order-bar {
      position: fixed;
      z-index: 80;
      right: 0;
      bottom: 0;
      left: 0;
      min-height: 67px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 9px 15px;
      border-top: 1px solid var(--line);
      background: rgba(17,15,17,.97);
      backdrop-filter: blur(12px);
    }

    .mobile-order-bar > div {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .mobile-order-bar small {
      color: #9b8e88;
      font-size: 8px;
    }

    .mobile-order-bar strong {
      color: var(--rose-light);
      font-size: 12px;
      overflow-wrap: anywhere;
    }

    .mobile-order-bar > a {
      min-height: 42px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 9px;
      flex-shrink: 0;
      padding: 0 16px;
      background: var(--rose);
      color: #171113;
      font-size: 10px;
      font-weight: 800;
      text-decoration: none;
    }

    .notice-toast {
      right: 12px;
      bottom: 83px;
      left: 12px;
      justify-content: center;
      font-size: 10px;
    }

    .skeleton-layout {
      grid-template-columns: 1fr;
      gap: 25px;
      margin: 25px auto;
    }
  }

  @media(prefers-reduced-motion:reduce) {
    *,
    *::before,
    *::after {
      scroll-behavior: auto !important;
      animation-duration: .01ms !important;
      transition-duration: .01ms !important;
    }
  }
`;
