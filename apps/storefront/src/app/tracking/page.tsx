
"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

type TrackingResult = {
  orderNumber: string;
  phone: string;
  status: string;
  statusLabel: string;
  description: string;
  updatedAt: string;
  steps: {
    title: string;
    description: string;
    completed: boolean;
    current: boolean;
  }[];
};

const statusStages = [
  {
    title: "ثبت سفارش",
    description: "سفارش در سیستم ثبت شده است.",
  },
  {
    title: "تأیید سفارش",
    description: "اطلاعات سفارش در انتظار تأیید مدیریت است.",
  },
  {
    title: "آماده‌سازی",
    description: "محصولات برای ارسال آماده می‌شوند.",
  },
  {
    title: "تحویل به ارسال",
    description: "سفارش به بخش ارسال تحویل داده شده است.",
  },
  {
    title: "تحویل سفارش",
    description: "سفارش به مشتری تحویل داده شده است.",
  },
];

export default function TrackingPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setResult(null);

    const cleanOrder = orderNumber.trim();
    const cleanPhone = phone.replace(/\s+/g, "");

    if (!cleanOrder) {
      setError("لطفاً شماره سفارش را وارد کنید.");
      return;
    }

    if (!/^(\+98|0)?9\d{9}$/.test(cleanPhone)) {
      setError("شماره موبایل واردشده معتبر نیست.");
      return;
    }

    setLoading(true);

    /*
      اتصال واقعی در مرحله بعد:
      GET /api/store/orders/track/?order_number=...&phone=...

      پاسخ باید فقط پس از اعتبارسنجی شماره سفارش و مالکیت
      آن توسط سرور برگردانده شود.
    */

    window.setTimeout(() => {
      setLoading(false);
      setError(
        "سامانه پیگیری هنوز به سرور سفارش‌ها متصل نشده است. پس از راه‌اندازی API، وضعیت واقعی سفارش نمایش داده می‌شود."
      );
    }, 450);
  }

  function resetForm() {
    setOrderNumber("");
    setPhone("");
    setResult(null);
    setError("");
  }

  return (
    <main className="tracking-page" dir="rtl">
      <section className="tracking-hero">
        <div className="hero-content">
          <span className="eyebrow">
            JALALI COSMETICS · ORDER TRACKING
          </span>

          <h1>
            سفارش خود را
            <br />
            لحظه‌به‌لحظه دنبال کنید.
          </h1>

          <p>
            با وارد کردن شماره سفارش و شماره موبایل ثبت‌شده،
            وضعیت خرید خود را پیگیری کنید.
          </p>

          <div className="hero-features">
            <span>پیگیری سفارش</span>
            <span />
            <span>اطلاعات مشتری</span>
            <span />
            <span>وضعیت ارسال</span>
          </div>
        </div>

        <div className="hero-graphic">
          <div className="graphic-ring ring-one" />
          <div className="graphic-ring ring-two" />
          <div className="graphic-box">
            <div className="box-top" />
            <div className="box-front">
              <span>J</span>
            </div>
          </div>
          <div className="graphic-caption">
            ORDER · TRACK · DELIVER
          </div>
        </div>
      </section>

      <section className="tracking-main">
        <div className="tracking-card">
          <div className="card-heading">
            <div className="heading-icon">01</div>
            <div>
              <span>ORDER INFORMATION</span>
              <h2>اطلاعات سفارش</h2>
              <p>
                مشخصات سفارش خود را برای پیگیری وارد کنید.
              </p>
            </div>
          </div>

          <form onSubmit={handleSearch}>
            <label>
              شماره سفارش
              <input
                value={orderNumber}
                onChange={(event) => {
                  setOrderNumber(event.target.value);
                  setError("");
                }}
                placeholder="مثلاً JAL-100025"
                autoComplete="off"
                maxLength={60}
                required
              />
            </label>

            <label>
              شماره موبایل ثبت‌شده در سفارش
              <input
                type="tel"
                value={phone}
                onChange={(event) => {
                  setPhone(event.target.value);
                  setError("");
                }}
                placeholder="09xxxxxxxxx"
                dir="ltr"
                autoComplete="tel"
                required
              />
            </label>

            {error && (
              <div className="error-message" role="alert">
                <span>!</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="search-button"
              disabled={loading}
            >
              {loading ? "در حال بررسی..." : "پیگیری سفارش"}
              <span>←</span>
            </button>
          </form>

          <div className="security-note">
            <span>◈</span>
            اطلاعات سفارش فقط باید پس از تأیید مالکیت آن
            توسط سرور نمایش داده شود.
          </div>
        </div>

        {result && (
          <section className="result-card">
            <div className="result-heading">
              <div>
                <span>TRACKING RESULT</span>
                <h2>وضعیت سفارش شما</h2>
              </div>
              <span className="status-badge">
                {result.statusLabel}
              </span>
            </div>

            <div className="order-details">
              <div>
                <span>شماره سفارش</span>
                <strong>{result.orderNumber}</strong>
              </div>
              <div>
                <span>شماره موبایل</span>
                <strong>{result.phone}</strong>
              </div>
              <div>
                <span>آخرین به‌روزرسانی</span>
                <strong>{result.updatedAt}</strong>
              </div>
            </div>

            <div className="current-status">
              <h3>{result.statusLabel}</h3>
              <p>{result.description}</p>
            </div>

            <div className="timeline">
              {result.steps.map((step, index) => (
                <div className="timeline-item" key={step.title}>
                  <div
                    className={[
                      "timeline-marker",
                      step.completed ? "completed" : "",
                      step.current ? "current" : "",
                    ].join(" ")}
                  >
                    {step.completed ? "✓" : index + 1}
                  </div>

                  <div>
                    <h4>{step.title}</h4>
                    <p>{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="tracking-help">
          <div>
            <span>NEED ASSISTANCE?</span>
            <h3>برای پیگیری به کمک نیاز دارید؟</h3>
            <p>
              اگر شماره سفارش خود را پیدا نمی‌کنید، با مجموعه
              ارتباط بگیرید.
            </p>
          </div>

          <Link href="/contact">
            ارتباط با ما
            <span>←</span>
          </Link>
        </div>
      </section>

      <section className="tracking-steps">
        <div className="section-heading">
          <span>HOW IT WORKS</span>
          <h2>مراحل پیگیری سفارش</h2>
        </div>

        <div className="steps-grid">
          {[
            {
              number: "01",
              title: "وارد کردن اطلاعات",
              description:
                "شماره سفارش و شماره موبایل ثبت‌شده را وارد کنید.",
            },
            {
              number: "02",
              title: "بررسی اطلاعات",
              description:
                "سامانه باید اطلاعات را با سفارش ثبت‌شده مطابقت دهد.",
            },
            {
              number: "03",
              title: "مشاهده وضعیت",
              description:
                "وضعیت معتبر سفارش و آخرین مرحله پردازش نمایش داده می‌شود.",
            },
          ].map((step) => (
            <article className="step-card" key={step.number}>
              <span>{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <style jsx>{`
        .tracking-page {
          min-height: 100vh;
          color: #f5f1ee;
          background: #0b0b0d;
          overflow: hidden;
        }

        .tracking-hero {
          position: relative;
          min-height: 440px;
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          align-items: center;
          gap: 30px;
          padding: 60px max(7%, calc((100% - 1160px) / 2));
          background:
            radial-gradient(
              circle at 80% 45%,
              rgba(201, 154, 134, 0.13),
              transparent 33%
            ),
            linear-gradient(120deg, #151214, #09090b);
          border-bottom: 1px solid #30282a;
        }

        .hero-content {
          position: relative;
          z-index: 2;
        }

        .eyebrow,
        .card-heading > div:last-child > span,
        .result-heading > div > span,
        .tracking-help > div > span,
        .section-heading > span {
          color: #c99a86;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 3px;
        }

        .hero-content h1 {
          margin: 22px 0 14px;
          font-size: clamp(35px, 5vw, 58px);
          line-height: 1.65;
          font-weight: 900;
          letter-spacing: -1.5px;
        }

        .hero-content > p {
          max-width: 540px;
          color: #aaa19e;
          font-size: 13px;
          line-height: 2.5;
        }

        .hero-features {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 12px;
          margin-top: 28px;
          color: #c1aaa0;
          font-size: 10px;
        }

        .hero-features > span:nth-child(even) {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #c99a86;
        }

        .hero-graphic {
          position: relative;
          width: min(100%, 330px);
          aspect-ratio: 1;
          margin: auto;
          display: grid;
          place-items: center;
        }

        .graphic-ring {
          position: absolute;
          border: 1px solid rgba(201, 154, 134, 0.3);
          border-radius: 50%;
        }

        .ring-one {
          width: 95%;
          height: 95%;
        }

        .ring-two {
          width: 72%;
          height: 72%;
          border-style: dashed;
        }

        .graphic-box {
          position: relative;
          width: 125px;
          height: 115px;
        }

        .box-front {
          position: absolute;
          bottom: 0;
          width: 125px;
          height: 82px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #c99a86, #755447);
          clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
        }

        .box-front span {
          color: #211512;
          font-family: Georgia, serif;
          font-size: 65px;
        }

        .box-top {
          position: absolute;
          top: 0;
          left: 0;
          width: 125px;
          height: 35px;
          background: #e0b5a2;
          clip-path: polygon(0 100%, 50% 0, 100% 100%);
        }

        .graphic-caption {
          position: absolute;
          bottom: -2px;
          color: #b18d7e;
          font-size: 8px;
          letter-spacing: 3px;
          white-space: nowrap;
        }

        .tracking-main {
          width: min(800px, 90%);
          margin: auto;
          padding: 80px 0 70px;
        }

        .tracking-card,
        .result-card {
          padding: 34px;
          background: #151518;
          border: 1px solid #393032;
          border-radius: 9px;
        }

        .card-heading {
          display: flex;
          align-items: center;
          gap: 17px;
          margin-bottom: 30px;
        }

        .heading-icon {
          flex: 0 0 48px;
          height: 48px;
          display: grid;
          place-items: center;
          border: 1px solid #856455;
          color: #c99a86;
          font-size: 12px;
        }

        .card-heading h2 {
          margin: 9px 0 5px;
          font-size: 22px;
        }

        .card-heading p {
          margin: 0;
          color: #99918e;
          font-size: 11px;
        }

        form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        label {
          display: flex;
          flex-direction: column;
          gap: 10px;
          color: #ded5d0;
          font-size: 12px;
          font-weight: 700;
        }

        input {
          box-sizing: border-box;
          width: 100%;
          min-height: 52px;
          padding: 0 15px;
          border: 1px solid #3c3436;
          border-radius: 5px;
          outline: none;
          background: #0d0d10;
          color: #f5f1ee;
          font: inherit;
          font-size: 13px;
          transition: border-color 0.2s;
        }

        input:focus {
          border-color: #c99a86;
        }

        input::placeholder {
          color: #77706e;
        }

        .search-button {
          min-height: 53px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          border: none;
          border-radius: 5px;
          background: #c99a86;
          color: #15100e;
          font-size: 13px;
          font-weight: 900;
          cursor: pointer;
        }

        .search-button:hover {
          background: #dfb19e;
        }

        .search-button:disabled {
          opacity: 0.65;
          cursor: wait;
        }

        .error-message {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 13px;
          background: #2a1717;
          border: 1px solid #673c3c;
          border-radius: 5px;
          color: #f0b7b0;
          font-size: 11px;
          line-height: 2;
        }

        .error-message > span {
          flex: 0 0 20px;
          height: 20px;
          display: grid;
          place-items: center;
          border: 1px solid #a85c56;
          border-radius: 50%;
        }

        .security-note {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          margin-top: 22px;
          padding-top: 18px;
          border-top: 1px solid #302a2c;
          color: #958b87;
          font-size: 10px;
          line-height: 2;
        }

        .security-note span {
          color: #c99a86;
          font-size: 17px;
        }

        .result-card {
          margin-top: 22px;
        }

        .result-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
        }

        .result-heading h2 {
          margin: 9px 0;
          font-size: 21px;
        }

        .status-badge {
          padding: 9px 14px;
          color: #e2bda9;
          background: #2b211e;
          border: 1px solid #77594d;
          border-radius: 4px;
          font-size: 10px;
        }

        .order-details {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 25px;
          padding: 20px 0;
          border-top: 1px solid #342e30;
          border-bottom: 1px solid #342e30;
        }

        .order-details div {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .order-details span {
          color: #918986;
          font-size: 10px;
        }

        .order-details strong {
          color: #e6dcd7;
          font-size: 11px;
          overflow-wrap: anywhere;
        }

        .current-status {
          padding: 20px;
          margin-top: 20px;
          background: #211b1b;
          border-right: 3px solid #c99a86;
        }

        .current-status h3 {
          margin: 0 0 8px;
          font-size: 15px;
        }

        .current-status p {
          margin: 0;
          color: #aaa19e;
          font-size: 11px;
          line-height: 2;
        }

        .timeline {
          margin-top: 30px;
        }

        .timeline-item {
          position: relative;
          display: flex;
          gap: 17px;
          min-height: 83px;
        }

        .timeline-item:not(:last-child)::before {
          content: "";
          position: absolute;
          top: 35px;
          right: 15px;
          width: 1px;
          height: 47px;
          background: #51413b;
        }

        .timeline-marker {
          flex: 0 0 32px;
          width: 32px;
          height: 32px;
          display: grid;
          place-items: center;
          border: 1px solid #55433d;
          border-radius: 50%;
          color: #a18c83;
          font-size: 11px;
        }

        .timeline-marker.completed,
        .timeline-marker.current {
          background: #3a2924;
          border-color: #c99a86;
          color: #e4bca9;
        }

        .timeline-item h4 {
          margin: 3px 0 7px;
          font-size: 12px;
        }

        .timeline-item p {
          margin: 0;
          color: #928986;
          font-size: 10px;
          line-height: 2;
        }

        .tracking-help {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-top: 22px;
          padding: 25px;
          background: #191719;
          border: 1px solid #433733;
          border-radius: 7px;
        }

        .tracking-help h3 {
          margin: 10px 0;
          font-size: 16px;
        }

        .tracking-help p {
          margin: 0;
          color: #a49b97;
          font-size: 10px;
          line-height: 2;
        }

        .tracking-help a {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 13px 18px;
          background: #c99a86;
          color: #15100e;
          border-radius: 4px;
          text-decoration: none;
          font-size: 11px;
          font-weight: 900;
        }

        .tracking-steps {
          padding: 80px 6%;
          background: #121214;
          border-top: 1px solid #302a2c;
        }

        .section-heading {
          text-align: center;
          margin-bottom: 40px;
        }

        .section-heading h2 {
          margin-top: 13px;
          font-size: 28px;
        }

        .steps-grid {
          max-width: 1050px;
          margin: auto;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
        }

        .step-card {
          padding: 27px;
          background: #19191d;
          border: 1px solid #332d30;
          border-radius: 7px;
        }

        .step-card > span {
          color: #c99a86;
          font-size: 12px;
          letter-spacing: 2px;
        }

        .step-card h3 {
          margin: 18px 0 10px;
          font-size: 15px;
        }

        .step-card p {
          color: #a29a96;
          font-size: 11px;
          line-height: 2.3;
        }

        @media (max-width: 750px) {
          .tracking-hero {
            grid-template-columns: 1fr;
            padding: 60px 7%;
          }

          .hero-graphic {
            width: 230px;
          }

          .tracking-main {
            padding-top: 55px;
          }

          .steps-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 520px) {
          .tracking-card,
          .result-card {
            padding: 23px 16px;
          }

          .hero-content h1 {
            font-size: 36px;
          }

          .order-details {
            grid-template-columns: 1fr;
            gap: 17px;
          }

          .tracking-help {
            align-items: stretch;
            flex-direction: column;
          }

          .tracking-help a {
            justify-content: center;
          }

          .result-heading {
            align-items: flex-start;
            flex-direction: column;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            transition: none !important;
          }
        }
      `}</style>
    </main>
  );
}
