
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Category = {
  id: string;
  title: string;
  english: string;
  description: string;
  icon: string;
  count: number;
  featured: boolean;
};

const categories: Category[] = [
  {
    id: "skincare",
    title: "مراقبت از پوست",
    english: "SKINCARE",
    description: "محصولات مراقبتی، آبرسان، پاک‌کننده و تخصصی پوست",
    icon: "✦",
    count: 24,
    featured: true,
  },
  {
    id: "haircare",
    title: "مراقبت از مو",
    english: "HAIRCARE",
    description: "شامپو، ماسک مو، سرم و محصولات مراقبت از مو",
    icon: "〰",
    count: 18,
    featured: true,
  },
  {
    id: "makeup",
    title: "آرایشی",
    english: "MAKEUP",
    description: "لوازم آرایش صورت، چشم، لب و محصولات زیبایی",
    icon: "◈",
    count: 32,
    featured: true,
  },
  {
    id: "perfume",
    title: "عطر و خوشبوکننده",
    english: "FRAGRANCE",
    description: "عطر، اسپری و محصولات خوشبوکننده",
    icon: "❋",
    count: 12,
    featured: false,
  },
  {
    id: "bodycare",
    title: "مراقبت از بدن",
    english: "BODYCARE",
    description: "لوسیون، کرم بدن و محصولات بهداشتی",
    icon: "◇",
    count: 15,
    featured: false,
  },
  {
    id: "tools",
    title: "ابزار زیبایی",
    english: "BEAUTY TOOLS",
    description: "ابزارهای کاربردی آرایشی و مراقبتی",
    icon: "⌁",
    count: 10,
    featured: false,
  },
  {
    id: "nails",
    title: "ناخن",
    english: "NAIL CARE",
    description: "لاک، مراقبت ناخن و لوازم جانبی",
    icon: "✧",
    count: 9,
    featured: false,
  },
  {
    id: "hygiene",
    title: "بهداشت شخصی",
    english: "PERSONAL CARE",
    description: "محصولات بهداشتی و مراقبت روزانه",
    icon: "＋",
    count: 14,
    featured: false,
  },
];

export default function CategoriesPage() {
  const [search, setSearch] = useState("");
  const [featuredOnly, setFeaturedOnly] = useState(false);

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();

    return categories.filter((category) => {
      const matchesSearch =
        !query ||
        category.title.toLowerCase().includes(query) ||
        category.english.toLowerCase().includes(query) ||
        category.description.toLowerCase().includes(query);

      const matchesFeatured =
        !featuredOnly || category.featured;

      return matchesSearch && matchesFeatured;
    });
  }, [search, featuredOnly]);

  const totalProducts = categories.reduce(
    (sum, category) => sum + category.count,
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
          <Link href="/">صفحه اصلی</Link>
          <Link href="/products">محصولات</Link>
          <Link href="/cart">سبد خرید</Link>
        </nav>
      </header>

      <section className="hero">
        <div className="heroContent">
          <span className="eyebrow">EXPLORE OUR COLLECTION</span>
          <h1>
            دنیای محصولات
            <br />
            <span>زیبایی و مراقبت</span>
          </h1>
          <p>
            دسته‌بندی‌های تخصصی محصولات را بررسی کنید و
            کالای موردنظر خود را سریع‌تر پیدا کنید.
          </p>

          <div className="heroStats">
            <div>
              <strong>{categories.length.toLocaleString("fa-IR")}</strong>
              <span>دسته‌بندی</span>
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

        <div className="heroArtwork">
          <div className="artCircle">
            <span>J</span>
          </div>
          <div className="artLabel">
            <small>JALALI COLLECTION</small>
            <strong>BEAUTY & CARE</strong>
          </div>
        </div>
      </section>

      <section className="catalog">
        <div className="catalogHeading">
          <div>
            <span className="eyebrow">PRODUCT DIRECTORY</span>
            <h2>دسته‌بندی‌ها</h2>
            <p>انتخاب سریع گروه محصولات موردنظر</p>
          </div>
          <span className="categoryCount">
            {filteredCategories.length.toLocaleString("fa-IR")} دسته
          </span>
        </div>

        <div className="toolbar">
          <div className="searchBox">
            <span>⌕</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="جستجوی دسته‌بندی..."
              aria-label="جستجوی دسته‌بندی"
            />
          </div>

          <button
            className={featuredOnly ? "filter active" : "filter"}
            onClick={() => setFeaturedOnly((value) => !value)}
            type="button"
          >
            {featuredOnly ? "★ فقط منتخب‌ها" : "☆ دسته‌های منتخب"}
          </button>
        </div>

        {filteredCategories.length > 0 ? (
          <div className="categoryGrid">
            {filteredCategories.map((category, index) => (
              <article className="categoryCard" key={category.id}>
                <div className="cardTop">
                  <span className="categoryIcon">
                    {category.icon}
                  </span>
                  {category.featured && (
                    <span className="featured">منتخب</span>
                  )}
                </div>

                <span className="englishName">
                  {category.english}
                </span>

                <h3>{category.title}</h3>
                <p>{category.description}</p>

                <div className="cardBottom">
                  <span>
                    {category.count.toLocaleString("fa-IR")} محصول نمونه
                  </span>
                  <Link
                    href={`/products?category=${encodeURIComponent(category.id)}`}
                    aria-label={`مشاهده محصولات ${category.title}`}
                  >
                    مشاهده محصولات <span>←</span>
                  </Link>
                </div>

                <span className="cardNumber">
                  {(index + 1).toString().padStart(2, "0")}
                </span>
              </article>
            ))}
          </div>
        ) : (
          <div className="noResults">
            <span>⌕</span>
            <h3>دسته‌بندی پیدا نشد</h3>
            <p>عبارت دیگری را برای جستجو وارد کنید.</p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setFeaturedOnly(false);
              }}
            >
              نمایش همه دسته‌بندی‌ها
            </button>
          </div>
        )}
      </section>

      <section className="wholesale">
        <div>
          <span className="eyebrow">BUSINESS PARTNERSHIP</span>
          <h2>خرید عمده و همکاری تجاری</h2>
          <p>
            برای دسترسی به شرایط همکاری و قیمت‌های اختصاصی
            ویژه همکاران، درخواست همکاری خود را ثبت کنید.
          </p>
        </div>
        <Link href="/partner">اطلاعات همکاری ←</Link>
      </section>

      <footer className="footer">
        <strong>JALALI COSMETICS</strong>
        <span>BEAUTY. BUSINESS. TRUST.</span>
        <span>© JALALI COSMETICS</span>
      </footer>

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: #0b0b0d;
          color: #f5f1ee;
          padding: 0 6%;
        }

        .header {
          min-height: 88px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #292326;
          gap: 20px;
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
          border: 1px solid #c99a86;
          color: #c99a86;
          display: grid;
          place-items: center;
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
          color: #a99b96;
          font-size: 8px;
          letter-spacing: 1.5px;
          margin-top: 5px;
        }

        nav {
          display: flex;
          gap: 27px;
        }

        nav a {
          color: #c7bbb6;
          font-size: 12px;
          text-decoration: none;
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
          border-bottom: 1px solid #292326;
        }

        .eyebrow {
          color: #c99a86;
          font-size: 10px;
          letter-spacing: 2.5px;
        }

        .hero h1 {
          font-size: clamp(31px, 5vw, 53px);
          line-height: 1.65;
          margin: 14px 0;
        }

        .hero h1 span {
          color: #c99a86;
        }

        .heroContent > p {
          color: #a99b96;
          max-width: 470px;
          font-size: 13px;
          line-height: 2.2;
        }

        .heroStats {
          display: flex;
          gap: 40px;
          margin-top: 35px;
          flex-wrap: wrap;
        }

        .heroStats div {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .heroStats strong {
          color: #c99a86;
          font-size: 17px;
        }

        .heroStats span {
          color: #a99b96;
          font-size: 10px;
        }

        .heroArtwork {
          min-height: 280px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        .artCircle {
          width: 220px;
          height: 220px;
          border: 1px solid #806052;
          border-radius: 50%;
          display: grid;
          place-items: center;
          box-shadow:
            0 0 0 18px #151113,
            0 0 0 19px #40302c,
            0 0 70px #5c4035;
        }

        .artCircle span {
          font-family: Georgia, serif;
          font-size: 120px;
          color: #c99a86;
        }

        .artLabel {
          position: absolute;
          bottom: 20px;
          display: flex;
          flex-direction: column;
          gap: 7px;
          text-align: center;
        }

        .artLabel small {
          color: #a99b96;
          letter-spacing: 2px;
          font-size: 9px;
        }

        .artLabel strong {
          color: #c99a86;
          letter-spacing: 3px;
          font-size: 12px;
        }

        .catalog {
          padding: 65px 0;
        }

        .catalogHeading {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 15px;
        }

        .catalogHeading h2 {
          font-size: 30px;
          margin: 10px 0;
        }

        .catalogHeading p {
          color: #a99b96;
          font-size: 12px;
        }

        .categoryCount {
          color: #c99a86;
          font-size: 12px;
        }

        .toolbar {
          display: flex;
          gap: 13px;
          margin: 30px 0;
        }

        .searchBox {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 12px;
          background: #151416;
          border: 1px solid #393033;
          border-radius: 7px;
          padding: 0 15px;
          min-height: 49px;
        }

        .searchBox span {
          color: #c99a86;
          font-size: 23px;
        }

        .searchBox input {
          flex: 1;
          min-width: 0;
          background: transparent;
          border: 0;
          outline: none;
          color: #fff;
          font: inherit;
          font-size: 12px;
        }

        .filter {
          border: 1px solid #55413a;
          background: #151416;
          color: #c99a86;
          border-radius: 7px;
          padding: 0 18px;
          font: inherit;
          font-size: 11px;
          cursor: pointer;
        }

        .filter.active {
          background: #c99a86;
          color: #171113;
        }

        .categoryGrid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }

        .categoryCard {
          min-height: 240px;
          padding: 21px;
          position: relative;
          overflow: hidden;
          border: 1px solid #30282a;
          border-radius: 10px;
          background: linear-gradient(145deg, #191719, #111012);
          transition: border-color 0.2s, transform 0.2s;
        }

        .categoryCard:hover {
          border-color: #a17a69;
          transform: translateY(-4px);
        }

        .cardTop {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .categoryIcon {
          width: 43px;
          height: 43px;
          display: grid;
          place-items: center;
          border: 1px solid #76594e;
          color: #c99a86;
          font-size: 24px;
        }

        .featured {
          color: #c99a86;
          font-size: 9px;
          border: 1px solid #76594e;
          padding: 5px 8px;
        }

        .englishName {
          display: block;
          color: #8f7770;
          font-size: 9px;
          letter-spacing: 2px;
          margin-top: 21px;
        }

        .categoryCard h3 {
          margin: 8px 0;
          font-size: 16px;
        }

        .categoryCard p {
          color: #a99b96;
          font-size: 10px;
          line-height: 2;
          min-height: 40px;
        }

        .cardBottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          border-top: 1px solid #30282a;
          padding-top: 13px;
          margin-top: 16px;
        }

        .cardBottom > span {
          color: #938681;
          font-size: 9px;
        }

        .cardBottom a {
          color: #c99a86;
          text-decoration: none;
          font-size: 10px;
          white-space: nowrap;
        }

        .cardNumber {
          position: absolute;
          top: 12px;
          left: 15px;
          color: #ffffff08;
          font-size: 32px;
          font-family: Georgia, serif;
          pointer-events: none;
        }

        .noResults {
          padding: 65px 15px;
          text-align: center;
          border: 1px solid #30282a;
          border-radius: 10px;
        }

        .noResults > span {
          color: #c99a86;
          font-size: 35px;
        }

        .noResults p {
          color: #a99b96;
          font-size: 12px;
        }

        .noResults button {
          margin-top: 15px;
          padding: 12px 18px;
          background: #c99a86;
          color: #171113;
          border: 0;
          border-radius: 5px;
          cursor: pointer;
          font: inherit;
          font-size: 11px;
        }

        .wholesale {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 25px;
          padding: 35px;
          background: #191416;
          border: 1px solid #4a3732;
          border-radius: 10px;
          margin-bottom: 65px;
        }

        .wholesale h2 {
          font-size: 22px;
          margin: 10px 0;
        }

        .wholesale p {
          color: #a99b96;
          font-size: 11px;
          line-height: 2;
        }

        .wholesale a {
          color: #171113;
          background: #c99a86;
          padding: 15px 22px;
          border-radius: 5px;
          text-decoration: none;
          font-size: 11px;
          white-space: nowrap;
        }

        .footer {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          padding: 25px 0;
          border-top: 1px solid #292326;
          color: #a99b96;
          font-size: 9px;
          letter-spacing: 1px;
        }

        .footer strong {
          color: #c99a86;
        }

        @media (max-width: 950px) {
          .categoryGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .hero {
            grid-template-columns: 1fr 0.7fr;
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
            gap: 10px;
          }

          .hero {
            grid-template-columns: 1fr;
            padding: 35px 0;
          }

          .heroArtwork {
            min-height: 230px;
          }

          .artCircle {
            width: 165px;
            height: 165px;
          }

          .artCircle span {
            font-size: 90px;
          }

          .toolbar {
            flex-direction: column;
          }

          .filter {
            min-height: 45px;
          }

          .categoryGrid {
            grid-template-columns: 1fr;
          }

          .wholesale {
            flex-direction: column;
            align-items: stretch;
            padding: 23px;
          }

          .wholesale a {
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
