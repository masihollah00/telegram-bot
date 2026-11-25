
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Product = {
  id: number;
  name: string;
  brand: string;
  category: string;
  sku: string;
  price: number;
  available: boolean;
  description: string;
  symbol: string;
};

const products: Product[] = [
  {
    id: 1,
    name: "کرم آبرسان و مرطوب‌کننده",
    brand: "JALALI BEAUTY",
    category: "مراقبت پوست",
    sku: "JC-SK-001",
    price: 285000,
    available: true,
    description: "محصول مراقبت از پوست",
    symbol: "✧",
  },
  {
    id: 2,
    name: "شامپو تقویت‌کننده مو",
    brand: "JALALI CARE",
    category: "مراقبت مو",
    sku: "JC-HR-002",
    price: 195000,
    available: true,
    description: "محصول مراقبت از مو",
    symbol: "◈",
  },
  {
    id: 3,
    name: "رژ لب مات",
    brand: "JALALI COLOR",
    category: "آرایشی",
    sku: "JC-MK-003",
    price: 320000,
    available: false,
    description: "محصول آرایشی",
    symbol: "◇",
  },
  {
    id: 4,
    name: "سرم مراقبت از پوست",
    brand: "JALALI BEAUTY",
    category: "مراقبت پوست",
    sku: "JC-SK-004",
    price: 410000,
    available: true,
    description: "محصول مراقبت از پوست",
    symbol: "✦",
  },
  {
    id: 5,
    name: "ماسک تقویت‌کننده مو",
    brand: "JALALI CARE",
    category: "مراقبت مو",
    sku: "JC-HR-005",
    price: 245000,
    available: true,
    description: "محصول مراقبت از مو",
    symbol: "❖",
  },
  {
    id: 6,
    name: "پنکیک آرایشی",
    brand: "JALALI COLOR",
    category: "آرایشی",
    sku: "JC-MK-006",
    price: 375000,
    available: true,
    description: "محصول آرایشی",
    symbol: "◉",
  },
];

const categories = [
  "همه محصولات",
  "آرایشی",
  "مراقبت پوست",
  "مراقبت مو",
];

function formatPrice(price: number) {
  return new Intl.NumberFormat("fa-IR").format(price) + " تومان";
}

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("همه محصولات");
  const [availability, setAvailability] = useState("همه");
  const [sort, setSort] = useState("newest");

  const filteredProducts = useMemo(() => {
    let result = products.filter((product) => {
      const query = search.trim().toLowerCase();

      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.brand.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query);

      const matchesCategory =
        category === "همه محصولات" ||
        product.category === category;

      const matchesAvailability =
        availability === "همه" ||
        (availability === "موجود" && product.available) ||
        (availability === "ناموجود" && !product.available);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesAvailability
      );
    });

    result = [...result].sort((a, b) => {
      if (sort === "low") return a.price - b.price;
      if (sort === "high") return b.price - a.price;
      if (sort === "name") return a.name.localeCompare(b.name);
      return b.id - a.id;
    });

    return result;
  }, [search, category, availability, sort]);

  return (
    <main className="catalog-page" dir="rtl">
      <section className="catalog-hero">
        <div className="hero-content">
          <span className="eyebrow">JALALI COSMETICS</span>
          <h1>مجموعه محصولات</h1>
          <p>
            انتخاب محصولات آرایشی و بهداشتی با تجربه‌ای
            حرفه‌ای برای خرید عمده
          </p>
        </div>

        <div className="hero-decoration">J</div>
      </section>

      <div className="breadcrumb">
        <Link href="/">صفحه اصلی</Link>
        <span>/</span>
        <span>محصولات</span>
      </div>

      <section className="catalog-layout">
        <aside className="filters">
          <div className="filter-heading">
            <h2>فیلتر محصولات</h2>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCategory("همه محصولات");
                setAvailability("همه");
                setSort("newest");
              }}
            >
              پاک کردن
            </button>
          </div>

          <div className="filter-group">
            <label htmlFor="product-search">جستجوی محصول</label>
            <input
              id="product-search"
              type="search"
              placeholder="نام، برند یا کد کالا..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="filter-group">
            <h3>دسته‌بندی</h3>

            {categories.map((item) => (
              <button
                type="button"
                key={item}
                className={
                  category === item ? "filter-option active" : "filter-option"
                }
                onClick={() => setCategory(item)}
              >
                <span>{item}</span>
                <span className="option-arrow">‹</span>
              </button>
            ))}
          </div>

          <div className="filter-group">
            <h3>وضعیت موجودی</h3>

            {["همه", "موجود", "ناموجود"].map((item) => (
              <label className="radio-option" key={item}>
                <input
                  type="radio"
                  name="availability"
                  checked={availability === item}
                  onChange={() => setAvailability(item)}
                />
                <span>{item}</span>
              </label>
            ))}
          </div>

          <div className="filter-note">
            <span>✦</span>
            <p>
              قیمت‌ها و موجودی نهایی پس از اتصال فروشگاه به
              سامانه مدیریت محصولات نمایش داده می‌شوند.
            </p>
          </div>
        </aside>

        <div className="catalog-main">
          <div className="catalog-toolbar">
            <div>
              <span className="toolbar-label">کاتالوگ محصولات</span>
              <h2>محصولات پخش جلالی</h2>
              <p>
                {new Intl.NumberFormat("fa-IR").format(
                  filteredProducts.length
                )}{" "}
                محصول در این فهرست
              </p>
            </div>

            <div className="sort-control">
              <label htmlFor="sort-products">مرتب‌سازی:</label>
              <select
                id="sort-products"
                value={sort}
                onChange={(event) => setSort(event.target.value)}
              >
                <option value="newest">جدیدترین</option>
                <option value="low">ارزان‌ترین</option>
                <option value="high">گران‌ترین</option>
                <option value="name">نام محصول</option>
              </select>
            </div>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="products-grid">
              {filteredProducts.map((product) => (
                <article className="product-card" key={product.id}>
                  <Link
                    href={`/products/${product.id}`}
                    className="product-image"
                    aria-label={`مشاهده ${product.name}`}
                  >
                    <span className="product-symbol">
                      {product.symbol}
                    </span>
                    <span className="image-brand">
                      JALALI COSMETICS
                    </span>
                    <span className="image-caption">
                      BEAUTY. BUSINESS. TRUST.
                    </span>
                  </Link>

                  <div className="product-info">
                    <div className="product-meta">
                      <span>{product.brand}</span>
                      <span className="product-sku">
                        {product.sku}
                      </span>
                    </div>

                    <h3>
                      <Link href={`/products/${product.id}`}>
                        {product.name}
                      </Link>
                    </h3>

                    <p className="product-category">
                      {product.category}
                    </p>

                    <div className="product-bottom">
                      <div className="price">
                        <strong>{formatPrice(product.price)}</strong>
                        <small>قیمت نمونه نمایشی</small>
                      </div>

                      <span
                        className={
                          product.available
                            ? "stock available"
                            : "stock unavailable"
                        }
                      >
                        {product.available ? "موجود" : "ناموجود"}
                      </span>
                    </div>

                    <Link
                      href={`/products/${product.id}`}
                      className="details-button"
                    >
                      مشاهده جزئیات
                      <span>←</span>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span>⌕</span>
              <h3>محصولی پیدا نشد</h3>
              <p>
                عبارت جستجو یا فیلترهای انتخاب‌شده را تغییر دهید.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategory("همه محصولات");
                  setAvailability("همه");
                }}
              >
                نمایش همه محصولات
              </button>
            </div>
          )}
        </div>
      </section>

      <style jsx>{`
        .catalog-page {
          min-height: 100vh;
          background: #0b0b0d;
          color: #f5f1ee;
          padding-bottom: 90px;
        }

        .catalog-hero {
          min-height: 245px;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          padding: 45px max(7%, calc((100% - 1250px) / 2));
          background:
            radial-gradient(circle at 85% 40%, #6d40352c, transparent 35%),
            linear-gradient(115deg, #191416, #0b0b0d 70%);
          border-bottom: 1px solid #c99a862c;
        }

        .hero-content {
          position: relative;
          z-index: 1;
        }

        .eyebrow {
          color: #c99a86;
          font-size: 11px;
          letter-spacing: 4px;
        }

        .catalog-hero h1 {
          font-size: clamp(30px, 5vw, 48px);
          margin: 16px 0 10px;
          font-weight: 800;
        }

        .catalog-hero p {
          color: #b8aaa4;
          line-height: 2;
          font-size: 14px;
        }

        .hero-decoration {
          position: absolute;
          left: 12%;
          top: -80px;
          color: #c99a860c;
          font-size: 350px;
          font-family: Georgia, serif;
          pointer-events: none;
        }

        .breadcrumb {
          max-width: 1250px;
          margin: 25px auto;
          padding: 0 22px;
          display: flex;
          align-items: center;
          gap: 12px;
          color: #968d89;
          font-size: 13px;
        }

        .breadcrumb a {
          color: #c99a86;
          text-decoration: none;
        }

        .catalog-layout {
          max-width: 1250px;
          margin: 0 auto;
          padding: 0 22px;
          display: grid;
          grid-template-columns: 255px minmax(0, 1fr);
          gap: 28px;
          align-items: start;
        }

        .filters {
          background: #141416;
          border: 1px solid #ffffff12;
          border-radius: 14px;
          padding: 20px;
          position: sticky;
          top: 20px;
        }

        .filter-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 18px;
          border-bottom: 1px solid #ffffff12;
        }

        .filter-heading h2 {
          font-size: 17px;
          margin: 0;
        }

        .filter-heading button {
          color: #c99a86;
          background: none;
          border: 0;
          cursor: pointer;
          font: inherit;
          font-size: 12px;
        }

        .filter-group {
          padding: 21px 0;
          border-bottom: 1px solid #ffffff12;
        }

        .filter-group h3,
        .filter-group > label {
          display: block;
          font-size: 14px;
          font-weight: 700;
          margin: 0 0 14px;
        }

        .filter-group input[type="search"] {
          width: 100%;
          background: #0b0b0d;
          border: 1px solid #ffffff20;
          color: white;
          padding: 13px;
          border-radius: 8px;
          outline: none;
          font: inherit;
          font-size: 12px;
        }

        .filter-group input:focus {
          border-color: #c99a86;
        }

        .filter-option {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 11px 10px;
          color: #aaa1a0;
          background: transparent;
          border: 0;
          border-radius: 7px;
          cursor: pointer;
          text-align: right;
          font: inherit;
          font-size: 13px;
        }

        .filter-option.active {
          color: #c99a86;
          background: #c99a8612;
        }

        .option-arrow {
          font-size: 20px;
        }

        .radio-option {
          display: flex !important;
          align-items: center;
          gap: 10px;
          color: #b9b0ad;
          margin: 12px 0 !important;
          font-size: 13px !important;
          cursor: pointer;
        }

        .radio-option input {
          accent-color: #c99a86;
        }

        .filter-note {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          padding-top: 18px;
          color: #a99b95;
        }

        .filter-note span {
          color: #c99a86;
        }

        .filter-note p {
          font-size: 11px;
          line-height: 2;
          margin: 0;
        }

        .catalog-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 22px;
          flex-wrap: wrap;
        }

        .toolbar-label {
          color: #c99a86;
          font-size: 11px;
        }

        .catalog-toolbar h2 {
          font-size: 22px;
          margin: 8px 0;
        }

        .catalog-toolbar p {
          color: #918986;
          font-size: 12px;
          margin: 0;
        }

        .sort-control {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #aaa09c;
          font-size: 12px;
        }

        .sort-control select {
          background: #171719;
          border: 1px solid #ffffff20;
          color: #f5f1ee;
          padding: 10px;
          border-radius: 7px;
          font: inherit;
          outline: none;
        }

        .products-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }

        .product-card {
          overflow: hidden;
          background: #151517;
          border: 1px solid #ffffff12;
          border-radius: 12px;
          transition: border-color 0.2s, transform 0.2s;
        }

        .product-card:hover {
          border-color: #c99a8670;
          transform: translateY(-3px);
        }

        .product-image {
          height: 190px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          text-decoration: none;
          background:
            radial-gradient(circle at center, #c99a8624, transparent 65%),
            linear-gradient(145deg, #28201f, #111113);
          border-bottom: 1px solid #c99a8620;
        }

        .product-symbol {
          font-size: 65px;
          color: #c99a86;
          text-shadow: 0 0 30px #c99a8630;
        }

        .image-brand {
          font-size: 9px;
          letter-spacing: 3px;
          color: #d2b6a9;
          margin-top: 12px;
        }

        .image-caption {
          color: #76645e;
          font-size: 7px;
          letter-spacing: 2px;
          margin-top: 7px;
        }

        .product-info {
          padding: 15px;
        }

        .product-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 5px;
          color: #c99a86;
          font-size: 9px;
          letter-spacing: 0.5px;
        }

        .product-sku {
          color: #777071;
          font-size: 9px;
        }

        .product-info h3 {
          font-size: 14px;
          line-height: 1.8;
          margin: 12px 0 5px;
        }

        .product-info h3 a {
          color: #f5f1ee;
          text-decoration: none;
        }

        .product-category {
          color: #918986;
          font-size: 11px;
          margin: 0;
        }

        .product-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-top: 18px;
          padding-top: 13px;
          border-top: 1px solid #ffffff12;
        }

        .price {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .price strong {
          color: #e1c1b2;
          font-size: 13px;
        }

        .price small {
          color: #807773;
          font-size: 9px;
        }

        .stock {
          font-size: 10px;
          padding: 6px 8px;
          border-radius: 5px;
          white-space: nowrap;
        }

        .available {
          color: #8cc8a2;
          background: #8cc8a214;
        }

        .unavailable {
          color: #e49a9a;
          background: #e49a9a14;
        }

        .details-button {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 15px;
          padding: 11px 12px;
          color: #c99a86;
          border: 1px solid #c99a8645;
          border-radius: 7px;
          text-decoration: none;
          font-size: 12px;
          transition: background 0.2s;
        }

        .details-button:hover {
          background: #c99a8614;
        }

        .details-button span {
          font-size: 17px;
        }

        .empty-state {
          min-height: 330px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          text-align: center;
          background: #141416;
          border: 1px solid #ffffff12;
          border-radius: 12px;
          padding: 25px;
        }

        .empty-state > span {
          font-size: 50px;
          color: #c99a86;
        }

        .empty-state h3 {
          margin: 12px 0;
        }

        .empty-state p {
          color: #a69b96;
          font-size: 13px;
          line-height: 2;
        }

        .empty-state button {
          margin-top: 12px;
          padding: 11px 18px;
          color: #0b0b0d;
          background: #c99a86;
          border: 0;
          border-radius: 7px;
          cursor: pointer;
          font: inherit;
          font-size: 12px;
        }

        @media (max-width: 1050px) {
          .products-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 720px) {
          .catalog-layout {
            grid-template-columns: 1fr;
          }

          .filters {
            position: static;
          }

          .catalog-hero {
            min-height: 205px;
          }

          .hero-decoration {
            left: 0;
            font-size: 250px;
          }
        }

        @media (max-width: 430px) {
          .products-grid {
            grid-template-columns: 1fr;
          }

          .product-image {
            height: 210px;
          }

          .catalog-toolbar {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>
    </main>
  );
}
