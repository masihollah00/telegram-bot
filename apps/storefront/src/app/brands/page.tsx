
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Brand = {
  id: string;
  name: string;
  english: string;
  description: string;
  category: string;
  productCount: number;
  featured: boolean;
};

const brands: Brand[] = [
  {
    id: "brand-01",
    name: "لورآل",
    english: "L'OREAL",
    description: "محصولات آرایشی و مراقبت از پوست و مو",
    category: "آرایشی و مراقبتی",
    productCount: 18,
    featured: true,
  },
  {
    id: "brand-02",
    name: "نوتروژینا",
    english: "NEUTROGENA",
    description: "محصولات مراقبت تخصصی پوست",
    category: "مراقبت پوست",
    productCount: 14,
    featured: true,
  },
  {
    id: "brand-03",
    name: "گارنیر",
    english: "GARNIER",
    description: "محصولات مراقبت پوست و مو",
    category: "مراقبتی",
    productCount: 12,
    featured: true,
  },
  {
    id: "brand-04",
    name: "نیوا",
    english: "NIVEA",
    description: "محصولات بهداشت شخصی و مراقبت بدن",
    category: "بهداشت و مراقبت",
    productCount: 16,
    featured: false,
  },
  {
    id: "brand-05",
    name: "میبلین",
    english: "MAYBELLINE",
    description: "محصولات آرایش صورت و چشم",
    category: "آرایشی",
    productCount: 11,
    featured: true,
  },
  {
    id: "brand-06",
    name: "هد اند شولدرز",
    english: "HEAD & SHOULDERS",
    description: "محصولات مراقبت و شست‌وشوی مو",
    category: "مراقبت مو",
    productCount: 9,
    featured: false,
  },
  {
    id: "brand-07",
    name: "داو",
    english: "DOVE",
    description: "محصولات مراقبت و بهداشت بدن",
    category: "بهداشت شخصی",
    productCount: 10,
    featured: false,
  },
  {
    id: "brand-08",
    name: "اسنس",
    english: "ESSENCE",
    description: "محصولات آرایشی و زیبایی",
    category: "آرایشی",
    productCount: 8,
    featured: false,
  },
  {
    id: "brand-09",
    name: "سیمپل",
    english: "SIMPLE",
    description: "محصولات مراقبت روزانه پوست",
    category: "مراقبت پوست",
    productCount: 7,
    featured: false,
  },
  {
    id: "brand-10",
    name: "پنتن",
    english: "PANTENE",
    description: "محصولات مراقبت و تقویت مو",
    category: "مراقبت مو",
    productCount: 13,
    featured: false,
  },
  {
    id: "brand-11",
    name: "فلورمار",
    english: "FLORMAR",
    description: "محصولات آرایش و زیبایی",
    category: "آرایشی",
    productCount: 9,
    featured: false,
  },
  {
    id: "brand-12",
    name: "بیول",
    english: "BIO'L",
    description: "محصولات مراقبت و زیبایی",
    category: "مراقبتی",
    productCount: 6,
    featured: false,
  },
];

const categories = [
  "همه برندها",
  "آرایشی",
  "مراقبت پوست",
  "مراقبت مو",
  "بهداشت شخصی",
  "مراقبتی",
];

export default function BrandsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("همه برندها");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [sort, setSort] = useState("name");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = brands.filter((brand) => {
      const matchesSearch =
        !query ||
        brand.name.toLowerCase().includes(query) ||
        brand.english.toLowerCase().includes(query) ||
        brand.description.toLowerCase().includes(query);

      const matchesCategory =
        category === "همه برندها" ||
        brand.category.includes(category);

      const matchesFeatured =
        !featuredOnly || brand.featured;

      return matchesSearch && matchesCategory && matchesFeatured;
    });

    if (sort === "count") {
      result.sort((a, b) => b.productCount - a.productCount);
    } else if (sort === "name") {
      result.sort((a, b) =>
        a.english.localeCompare(b.english)
      );
    }

    return result;
  }, [search, category, featuredOnly, sort]);

  const totalProducts = brands.reduce(
    (sum, brand) => sum + brand.productCount,
    0
  );

  return (
    <main className="page" dir="rtl">
      <header className="header">
        <Link href="/" className="brand">
          <span className="logo">J</span>
          <span>
            <strong>JALALI COSMETICS</strong>
            <small>BEAUTY. BUSINESS. TRUST.</small>
          </span>
        </Link>

        <nav>
          <Link href="/">خانه</Link>
          <Link href="/products">محصولات</Link>
          <Link href="/categories">دسته‌بندی‌ها</Link>
          <Link href="/cart">سبد خرید</Link>
        </nav>
      </header>

      <section className="hero">
        <div className="heroText">
          <span className="eyebrow">OUR BRAND COLLECTION</span>
          <h1>
            برندهای
            <br />
            <span>دنیای زیبایی</span>
          </h1>
          <p>
            برندهای محصولات را بررسی کنید و مجموعه کالاهای
            موردنظر خود را از میان دسته‌بندی‌های مختلف پیدا کنید.
          </p>

          <div className="stats">
            <div>
              <strong>{brands.length.toLocaleString("fa-IR")}</strong>
              <span>برند نمونه</span>
            </div>
            <div>
              <strong>{totalProducts.toLocaleString("fa-IR")}+</strong>
              <span>محصول نمونه</span>
            </div>
            <div>
              <strong>WHOLESALE</strong>
              <span>فروش عمده</span>
            </div>
          </div>
        </div>

        <div className="heroVisual">
          <div className="ring">
            <span>J</span>
          </div>
          <div className="visualText">
            <strong>SELECTED BRANDS</strong>
            <small>JALALI COSMETICS</small>
          </div>
        </div>
      </section>

      <section className="catalog">
        <div className="catalogTitle">
          <div>
            <span className="eyebrow">BRAND DIRECTORY</span>
            <h2>فهرست برندها</h2>
            <p>جستجو و بررسی برندهای محصولات</p>
          </div>
          <span className="resultCount">
            {filtered.length.toLocaleString("fa-IR")} برند
          </span>
        </div>

        <div className="filters">
          <div className="searchBox">
            <span>⌕</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجوی نام برند..."
              aria-label="جستجوی برند"
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="فیلتر دسته‌بندی برند"
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="مرتب‌سازی برندها"
          >
            <option value="name">مرتب‌سازی نام</option>
            <option value="count">بیشترین تعداد محصول</option>
          </select>

          <button
            type="button"
            className={featuredOnly ? "featured active" : "featured"}
            onClick={() => setFeaturedOnly((value) => !value)}
          >
            {featuredOnly ? "★ منتخب‌ها" : "☆ برندهای منتخب"}
          </button>
        </div>

        {filtered.length > 0 ? (
          <div className="brandGrid">
            {filtered.map((brand, index) => (
              <article className="brandCard" key={brand.id}>
                <div className="cardTop">
                  <span className="brandSymbol">
                    {brand.english.charAt(0)}
                  </span>
                  {brand.featured && (
                    <span className="tag">منتخب</span>
                  )}
                </div>

                <span className="englishName">
                  {brand.english}
                </span>

                <h3>{brand.name}</h3>
                <p>{brand.description}</p>

                <div className="categoryTag">
                  {brand.category}
                </div>

                <div className="cardBottom">
                  <span>
                    {brand.productCount.toLocaleString("fa-IR")} محصول نمونه
                  </span>
                  <Link
                    href={`/products?brand=${encodeURIComponent(brand.id)}`}
                    aria-label={`مشاهده محصولات برند ${brand.name}`}
                  >
                    مشاهده <span>←</span>
                  </Link>
                </div>

                <span className="number">
                  {(index + 1).toString().padStart(2, "0")}
                </span>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty">
            <span>⌕</span>
            <h3>برندی پیدا نشد</h3>
            <p>فیلترها یا عبارت جستجو را تغییر دهید.</p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCategory("همه برندها");
                setFeaturedOnly(false);
                setSort("name");
              }}
            >
              پاک کردن فیلترها
            </button>
          </div>
        )}
      </section>

      <section className="partnerBanner">
        <div>
          <span className="eyebrow">BUSINESS PARTNERSHIP</span>
          <h2>برای خرید عمده آماده‌اید؟</h2>
          <p>
            درخواست همکاری ثبت کنید تا پس از تأیید مدیریت،
            شرایط ویژه همکاران برای حساب شما فعال شود.
          </p>
        </div>
        <Link href="/partner">درخواست همکاری ←</Link>
      </section>

      <footer className="footer">
        <strong>JALALI COSMETICS</strong>
        <span>BEAUTY. BUSINESS. TRUST.</span>
        <span>© JALALI COSMETICS</span>
      </footer>

      <style jsx>{`
        .page {
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
          text-decoration: none;
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
          text-decoration: none;
          font-size: 11px;
        }

        nav a:hover {
          color: #c99a86;
        }

        .hero {
          min-height: 390px;
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          align-items: center;
          gap: 35px;
          border-bottom: 1px solid #30282a;
        }

        .eyebrow {
          color: #c99a86;
          font-size: 10px;
          letter-spacing: 2.5px;
        }

        .hero h1 {
          margin: 14px 0;
          font-size: clamp(32px, 5vw, 53px);
          line-height: 1.6;
        }

        .hero h1 span {
          color: #c99a86;
        }

        .heroText > p {
          max-width: 480px;
          color: #a99b96;
          font-size: 13px;
          line-height: 2.2;
        }

        .stats {
          display: flex;
          gap: 40px;
          margin-top: 30px;
          flex-wrap: wrap;
        }

        .stats div {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .stats strong {
          color: #c99a86;
          font-size: 17px;
        }

        .stats span {
          color: #a99b96;
          font-size: 10px;
        }

        .heroVisual {
          min-height: 290px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .ring {
          width: 215px;
          height: 215px;
          display: grid;
          place-items: center;
          border: 1px solid #806052;
          border-radius: 50%;
          box-shadow: 0 0 0 17px #171315,
            0 0 0 18px #49352f,
            0 0 65px #513a32;
        }

        .ring span {
          color: #c99a86;
          font-family: Georgia, serif;
          font-size: 115px;
        }

        .visualText {
          position: absolute;
          bottom: 15px;
          display: flex;
          flex-direction: column;
          gap: 7px;
          text-align: center;
        }

        .visualText strong {
          color: #c99a86;
          font-size: 11px;
          letter-spacing: 2px;
        }

        .visualText small {
          color: #a99b96;
          font-size: 9px;
          letter-spacing: 2px;
        }

        .catalog {
          padding: 65px 0;
        }

        .catalogTitle {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 15px;
        }

        .catalogTitle h2 {
          margin: 12px 0;
          font-size: 30px;
        }

        .catalogTitle p {
          color: #a99b96;
          font-size: 12px;
        }

        .resultCount {
          color: #c99a86;
          font-size: 12px;
        }

        .filters {
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr auto;
          gap: 12px;
          margin: 30px 0;
        }

        .searchBox {
          min-height: 47px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 13px;
          background: #151416;
          border: 1px solid #393033;
          border-radius: 6px;
        }

        .searchBox span {
          color: #c99a86;
          font-size: 22px;
        }

        .searchBox input {
          width: 100%;
          min-width: 0;
          border: 0;
          outline: none;
          background: transparent;
          color: #fff;
          font: inherit;
          font-size: 11px;
        }

        .filters select,
        .featured {
          min-height: 47px;
          padding: 0 12px;
          border: 1px solid #393033;
          border-radius: 6px;
          background: #151416;
          color: #d7c8c1;
          font: inherit;
          font-size: 10px;
          outline: none;
        }

        .featured {
          border-color: #76594e;
          color: #c99a86;
          cursor: pointer;
        }

        .featured.active {
          background: #c99a86;
          color: #171113;
        }

        .brandGrid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .brandCard {
          min-height: 245px;
          position: relative;
          overflow: hidden;
          padding: 22px;
          border: 1px solid #30282a;
          border-radius: 9px;
          background: linear-gradient(145deg, #191719, #111012);
          transition: 0.2s;
        }

        .brandCard:hover {
          border-color: #a17a69;
          transform: translateY(-4px);
        }

        .cardTop {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .brandSymbol {
          width: 49px;
          height: 49px;
          display: grid;
          place-items: center;
          border: 1px solid #76594e;
          color: #c99a86;
          font-family: Georgia, serif;
          font-size: 25px;
        }

        .tag {
          padding: 5px 8px;
          border: 1px solid #76594e;
          color: #c99a86;
          font-size: 9px;
        }

        .englishName {
          display: block;
          margin-top: 18px;
          color: #9a7c71;
          font-size: 9px;
          letter-spacing: 2px;
        }

        .brandCard h3 {
          margin: 8px 0;
          font-size: 17px;
        }

        .brandCard p {
          min-height: 35px;
          color: #a99b96;
          font-size: 10px;
          line-height: 2;
        }

        .categoryTag {
          display: inline-block;
          padding: 5px 9px;
          background: #251d1e;
          color: #c99a86;
          border-radius: 4px;
          font-size: 9px;
        }

        .cardBottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: 16px;
          padding-top: 13px;
          border-top: 1px solid #30282a;
        }

        .cardBottom > span {
          color: #9d908a;
          font-size: 9px;
        }

        .cardBottom a {
          color: #c99a86;
          text-decoration: none;
          font-size: 10px;
        }

        .number {
          position: absolute;
          top: 12px;
          left: 14px;
          color: #ffffff08;
          font-size: 34px;
          pointer-events: none;
        }

        .empty {
          padding: 60px 15px;
          text-align: center;
          border: 1px solid #30282a;
          border-radius: 9px;
        }

        .empty > span {
          color: #c99a86;
          font-size: 36px;
        }

        .empty p {
          color: #a99b96;
          font-size: 12px;
        }

        .empty button {
          margin-top: 15px;
          padding: 12px 18px;
          border: 0;
          border-radius: 5px;
          background: #c99a86;
          color: #171113;
          font: inherit;
          font-size: 11px;
          cursor: pointer;
        }

        .partnerBanner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 25px;
          padding: 32px;
          margin-bottom: 60px;
          border: 1px solid #4a3732;
          border-radius: 9px;
          background: #191416;
        }

        .partnerBanner h2 {
          margin: 12px 0;
          font-size: 22px;
        }

        .partnerBanner p {
          color: #a99b96;
          font-size: 11px;
          line-height: 2;
        }

        .partnerBanner a {
          padding: 14px 20px;
          background: #c99a86;
          border-radius: 5px;
          color: #171113;
          font-size: 11px;
          text-decoration: none;
          white-space: nowrap;
        }

        .footer {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          padding: 25px 0;
          border-top: 1px solid #30282a;
          color: #a99b96;
          font-size: 9px;
          letter-spacing: 1px;
        }

        .footer strong {
          color: #c99a86;
        }

        @media (max-width: 900px) {
          .brandGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .filters {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 650px) {
          .page {
            padding: 0 17px;
          }

          .header {
            flex-wrap: wrap;
            padding: 15px 0;
          }

          nav {
            width: 100%;
            justify-content: space-between;
            gap: 8px;
          }

          nav a {
            font-size: 9px;
          }

          .hero {
            grid-template-columns: 1fr;
            padding: 35px 0;
          }

          .heroVisual {
            min-height: 240px;
          }

          .ring {
            width: 165px;
            height: 165px;
          }

          .ring span {
            font-size: 90px;
          }

          .filters {
            grid-template-columns: 1fr;
          }

          .brandGrid {
            grid-template-columns: 1fr;
          }

          .partnerBanner {
            flex-direction: column;
            align-items: stretch;
            padding: 22px;
          }

          .partnerBanner a {
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
