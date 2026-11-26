
"use client";

import Link from "next/link";

const audiences = [
  {
    id: "retail",
    number: "01",
    eyebrow: "PERSONAL SHOPPING",
    title: "خرید شخصی",
    description:
      "محصولات آرایشی و بهداشتی را بررسی کن، مشخصات و قیمت عمومی را ببین و خریدت را از فروشگاه پخش جلالی دنبال کن.",
    features: [
      "مشاهده کاتالوگ محصولات",
      "جستجو و مقایسه کالاها",
      "سبد خرید و ثبت سفارش",
      "پیگیری وضعیت سفارش",
    ],
    button: "ورود به فروشگاه",
    href: "/products",
    icon: "✧",
    featured: false,
  },
  {
    id: "wholesale",
    number: "02",
    eyebrow: "WHOLESALE & BUSINESS",
    title: "همکاری عمده و تجاری",
    description:
      "برای فروشگاه‌ها، مغازه‌داران و فعالان بازار؛ درخواست همکاری ثبت کن و پس از تأیید، از شرایط اختصاصی خرید عمده استفاده کن.",
    features: [
      "درخواست عضویت همکاران",
      "بررسی و تأیید حساب تجاری",
      "دسترسی به قیمت همکاری",
      "ثبت و پیگیری سفارش عمده",
    ],
    button: "شروع همکاری تجاری",
    href: "/partner",
    icon: "◈",
    featured: true,
  },
];

export default function AudiencePaths() {
  return (
    <section
      className="audience-section"
      dir="rtl"
      aria-labelledby="audience-title"
    >
      <div className="audience-heading">
        <span className="audience-eyebrow">
          TWO WAYS TO SHOP · ONE TRUSTED SOURCE
        </span>

        <h2 id="audience-title">
          مسیر خریدت را
          <span>انتخاب کن.</span>
        </h2>

        <p>
          چه برای خرید شخصی وارد شده باشی و چه برای توسعه
          کسب‌وکارت، مسیر مناسب تو در پخش جلالی آماده است.
        </p>
      </div>

      <div className="audience-grid">
        {audiences.map((item) => (
          <article
            className={`audience-card ${
              item.featured ? "audience-featured" : ""
            }`}
            key={item.id}
          >
            <div className="audience-card-top">
              <span className="audience-number">
                {item.number}
              </span>

              <span className="audience-icon" aria-hidden="true">
                {item.icon}
              </span>
            </div>

            <span className="audience-card-eyebrow">
              {item.eyebrow}
            </span>

            <h3>{item.title}</h3>

            <p className="audience-description">
              {item.description}
            </p>

            <div className="audience-divider" />

            <ul className="audience-features">
              {item.features.map((feature) => (
                <li key={feature}>
                  <span aria-hidden="true">✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            <Link
              href={item.href}
              className="audience-button"
            >
              {item.button}
              <span aria-hidden="true">←</span>
            </Link>

            {item.featured && (
              <span className="audience-card-label">
                BUSINESS PARTNERS
              </span>
            )}
          </article>
        ))}
      </div>

      <div className="audience-footer">
        <span>JALALI COSMETICS</span>
        <span className="audience-footer-line" />
        <span>BEAUTY. BUSINESS. TRUST.</span>
      </div>

      <style jsx>{`
        .audience-section {
          position: relative;
          padding: 100px 6%;
          overflow: hidden;
          background:
            radial-gradient(
              ellipse at 50% 0%,
              rgba(201, 154, 134, 0.11),
              transparent 55%
            ),
            #0b0b0d;
          color: #f5f1ee;
          border-top: 1px solid rgba(201, 154, 134, 0.16);
          border-bottom: 1px solid rgba(201, 154, 134, 0.16);
        }

        .audience-heading {
          max-width: 720px;
          margin: 0 auto 55px;
          text-align: center;
        }

        .audience-eyebrow {
          color: #c99a86;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 3px;
        }

        .audience-heading h2 {
          margin: 20px 0 12px;
          font-size: clamp(32px, 5vw, 51px);
          line-height: 1.7;
          font-weight: 900;
        }

        .audience-heading h2 span {
          display: block;
          color: #c99a86;
        }

        .audience-heading p {
          max-width: 570px;
          margin: auto;
          color: #aaa19e;
          font-size: 13px;
          line-height: 2.5;
        }

        .audience-grid {
          width: min(1050px, 100%);
          margin: auto;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 22px;
        }

        .audience-card {
          position: relative;
          min-height: 510px;
          display: flex;
          flex-direction: column;
          padding: 34px;
          overflow: hidden;
          background:
            radial-gradient(
              circle at 90% 5%,
              rgba(201, 154, 134, 0.09),
              transparent 42%
            ),
            #151416;
          border: 1px solid rgba(201, 154, 134, 0.22);
          border-radius: 8px;
          transition:
            transform 0.3s ease,
            border-color 0.3s ease,
            background 0.3s ease;
        }

        .audience-card:hover {
          transform: translateY(-6px);
          border-color: #c99a86;
        }

        .audience-featured {
          background:
            radial-gradient(
              circle at 90% 5%,
              rgba(201, 154, 134, 0.18),
              transparent 45%
            ),
            linear-gradient(145deg, #211a19, #151416 65%);
          border-color: rgba(201, 154, 134, 0.65);
          box-shadow: 0 20px 70px rgba(0, 0, 0, 0.2);
        }

        .audience-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 32px;
        }

        .audience-number {
          color: #9d8276;
          font-size: 12px;
          letter-spacing: 3px;
        }

        .audience-icon {
          width: 55px;
          height: 55px;
          display: grid;
          place-items: center;
          color: #d4a18d;
          border: 1px solid rgba(201, 154, 134, 0.55);
          border-radius: 50%;
          font-size: 27px;
        }

        .audience-card-eyebrow {
          color: #c99a86;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 2.5px;
        }

        .audience-card h3 {
          margin: 13px 0;
          font-size: 27px;
          font-weight: 900;
        }

        .audience-description {
          min-height: 82px;
          margin: 0;
          color: #aaa19e;
          font-size: 12px;
          line-height: 2.4;
        }

        .audience-divider {
          width: 100%;
          height: 1px;
          margin: 23px 0;
          background: rgba(201, 154, 134, 0.2);
        }

        .audience-features {
          display: grid;
          gap: 16px;
          margin: 0 0 30px;
          padding: 0;
          list-style: none;
        }

        .audience-features li {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #d8ceca;
          font-size: 12px;
        }

        .audience-features li span {
          width: 21px;
          height: 21px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          color: #c99a86;
          border: 1px solid rgba(201, 154, 134, 0.45);
          border-radius: 50%;
          font-size: 10px;
        }

        .audience-button {
          min-height: 52px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-top: auto;
          padding: 0 19px;
          color: #171113;
          background: #c99a86;
          border: 1px solid #c99a86;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 900;
          transition:
            background 0.2s ease,
            transform 0.2s ease;
        }

        .audience-button:hover {
          background: #e1b9a8;
          transform: translateY(-2px);
        }

        .audience-button span {
          font-size: 20px;
        }

        .audience-card-label {
          position: absolute;
          top: 16px;
          left: -31px;
          width: 125px;
          padding: 6px 0;
          transform: rotate(-45deg);
          background: #c99a86;
          color: #171113;
          text-align: center;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .audience-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 17px;
          margin-top: 48px;
          color: #8e7970;
          font-size: 8px;
          letter-spacing: 2px;
        }

        .audience-footer-line {
          width: 45px;
          height: 1px;
          background: #74564a;
        }

        @media (max-width: 760px) {
          .audience-section {
            padding: 70px 6%;
          }

          .audience-grid {
            grid-template-columns: 1fr;
            max-width: 510px;
          }

          .audience-card {
            min-height: 480px;
            padding: 27px;
          }

          .audience-heading {
            margin-bottom: 38px;
          }
        }

        @media (max-width: 420px) {
          .audience-card {
            padding: 23px;
          }

          .audience-card h3 {
            font-size: 23px;
          }

          .audience-footer {
            flex-wrap: wrap;
            font-size: 7px;
            gap: 10px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .audience-card,
          .audience-button {
            transition: none;
          }
        }
      `}</style>
    </section>
  );
}
