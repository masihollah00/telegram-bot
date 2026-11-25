
"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

type ContactForm = {
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
};

const initialForm: ContactForm = {
  name: "",
  phone: "",
  email: "",
  subject: "پیگیری سفارش",
  message: "",
};

const subjects = [
  "پیگیری سفارش",
  "استعلام قیمت عمده",
  "درخواست همکاری",
  "مشاوره خرید محصولات",
  "پیشنهاد و انتقاد",
  "سایر موارد",
];

export default function ContactPage() {
  const [form, setForm] = useState<ContactForm>(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function updateField(
    field: keyof ContactForm,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
    setError("");
    setSubmitted(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const phone = form.phone.replace(/\s+/g, "");

    if (!form.name.trim()) {
      setError("لطفاً نام خود را وارد کنید.");
      return;
    }

    if (!/^(\+98|0)?9\d{9}$/.test(phone)) {
      setError("شماره موبایل واردشده معتبر نیست.");
      return;
    }

    if (form.message.trim().length < 10) {
      setError("متن پیام باید حداقل ۱۰ کاراکتر باشد.");
      return;
    }

    const request = {
      ...form,
      phone,
      createdAt: new Date().toISOString(),
      status: "draft",
    };

    try {
      const previous = JSON.parse(
        localStorage.getItem("jalali_contact_requests") || "[]"
      );

      const requests = Array.isArray(previous) ? previous : [];

      localStorage.setItem(
        "jalali_contact_requests",
        JSON.stringify([...requests, request])
      );

      setSubmitted(true);
      setForm(initialForm);
    } catch {
      setError("ذخیره پیام در این دستگاه امکان‌پذیر نیست.");
    }
  }

  return (
    <main dir="rtl" className="contact-page">
      <section className="contact-hero">
        <div className="hero-content">
          <span className="eyebrow">JALALI COSMETICS · CONTACT</span>
          <h1>
            ارتباطی مطمئن،
            <br />
            برای تجارتی ماندگار.
          </h1>
          <p>
            برای پیگیری سفارش‌ها، دریافت اطلاعات همکاری و
            مشاوره خرید عمده، پیام خود را برای ما ارسال کنید.
          </p>

          <div className="hero-actions">
            <a href="#contact-form" className="primary-button">
              ارسال پیام
              <span>←</span>
            </a>
            <Link href="/products" className="secondary-button">
              مشاهده محصولات
            </Link>
          </div>
        </div>

        <div className="hero-decoration">
          <div className="decoration-ring ring-one" />
          <div className="decoration-ring ring-two" />
          <div className="decoration-center">
            <span>J</span>
            <small>JALALI</small>
          </div>
          <div className="decoration-caption">
            BEAUTY. BUSINESS. TRUST.
          </div>
        </div>
      </section>

      <section className="contact-content">
        <div className="section-heading">
          <span>WE ARE HERE TO HELP</span>
          <h2>چطور می‌توانیم کمکتان کنیم؟</h2>
          <p>
            موضوع درخواست خود را مشخص کنید تا ارتباط با مجموعه
            هدفمندتر انجام شود.
          </p>
        </div>

        <div className="contact-grid">
          <div className="contact-information">
            <article className="info-card">
              <div className="info-icon">01</div>
              <div>
                <h3>پشتیبانی سفارش‌ها</h3>
                <p>
                  برای پیگیری وضعیت سفارش، فاکتور و هماهنگی ارسال
                  پیام بفرستید.
                </p>
              </div>
            </article>

            <article className="info-card">
              <div className="info-icon">02</div>
              <div>
                <h3>همکاری تجاری</h3>
                <p>
                  فروشگاه‌ها و همکاران می‌توانند درخواست همکاری
                  و دریافت شرایط فروش عمده را ثبت کنند.
                </p>
              </div>
            </article>

            <article className="info-card">
              <div className="info-icon">03</div>
              <div>
                <h3>مشاوره محصولات</h3>
                <p>
                  برای انتخاب محصولات، بررسی دسته‌بندی‌ها و
                  استعلام موجودی با ما در ارتباط باشید.
                </p>
              </div>
            </article>

            <div className="business-note">
              <span className="note-label">JALALI COSMETICS</span>
              <h3>همراه مطمئن کسب‌وکار شما</h3>
              <p>
                هدف ما ایجاد تجربه‌ای حرفه‌ای و قابل اعتماد
                در خرید عمده محصولات آرایشی و بهداشتی است.
              </p>
            </div>
          </div>

          <section className="contact-form-card" id="contact-form">
            <div className="form-heading">
              <span>CONTACT FORM</span>
              <h2>پیام خود را ارسال کنید</h2>
              <p>فیلدهای ستاره‌دار الزامی هستند.</p>
            </div>

            {submitted && (
              <div className="success-message" role="status">
                پیش‌نویس پیام در این دستگاه ذخیره شد.
                برای ارسال واقعی، اتصال سرویس ارتباط با سرور لازم است.
              </div>
            )}

            {error && (
              <div className="error-message" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <label>
                  نام و نام خانوادگی *
                  <input
                    value={form.name}
                    onChange={(event) =>
                      updateField("name", event.target.value)
                    }
                    placeholder="نام شما"
                    maxLength={100}
                    required
                  />
                </label>

                <label>
                  شماره موبایل *
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(event) =>
                      updateField("phone", event.target.value)
                    }
                    placeholder="09xxxxxxxxx"
                    dir="ltr"
                    required
                  />
                </label>
              </div>

              <label>
                ایمیل
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    updateField("email", event.target.value)
                  }
                  placeholder="name@example.com"
                  dir="ltr"
                  maxLength={150}
                />
              </label>

              <label>
                موضوع پیام *
                <select
                  value={form.subject}
                  onChange={(event) =>
                    updateField("subject", event.target.value)
                  }
                >
                  {subjects.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                متن پیام *
                <textarea
                  value={form.message}
                  onChange={(event) =>
                    updateField("message", event.target.value)
                  }
                  placeholder="درخواست یا توضیحات خود را بنویسید..."
                  rows={6}
                  minLength={10}
                  maxLength={3000}
                  required
                />
                <small className="character-count">
                  {form.message.length} / 3000
                </small>
              </label>

              <button type="submit" className="submit-button">
                ذخیره و ثبت پیش‌نویس
                <span>←</span>
              </button>

              <p className="form-disclaimer">
                در این مرحله پیام فقط به‌صورت پیش‌نویس روی دستگاه
                ذخیره می‌شود و هنوز به سرور ارسال نشده است.
              </p>
            </form>
          </section>
        </div>
      </section>

      <section className="contact-bottom">
        <div>
          <span>READY TO WORK TOGETHER?</span>
          <h2>برای شروع یک همکاری حرفه‌ای آماده‌اید؟</h2>
        </div>
        <Link href="/partner" className="bottom-button">
          درخواست همکاری
          <span>←</span>
        </Link>
      </section>

      <style jsx>{`
        .contact-page {
          min-height: 100vh;
          background: #0b0b0d;
          color: #f5f1ee;
          overflow: hidden;
        }

        .contact-hero {
          position: relative;
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          align-items: center;
          min-height: 510px;
          padding: 75px max(7%, calc((100% - 1250px) / 2));
          background:
            radial-gradient(
              circle at 78% 45%,
              rgba(201, 154, 134, 0.12),
              transparent 34%
            ),
            linear-gradient(135deg, #111114, #09090b);
          border-bottom: 1px solid #272326;
        }

        .hero-content {
          position: relative;
          z-index: 2;
          max-width: 620px;
        }

        .eyebrow,
        .section-heading > span,
        .form-heading > span,
        .contact-bottom > div > span {
          color: #c99a86;
          font-size: 11px;
          letter-spacing: 3px;
          font-weight: 800;
        }

        h1 {
          margin: 23px 0;
          font-size: clamp(35px, 5vw, 62px);
          line-height: 1.55;
          font-weight: 900;
          letter-spacing: -2px;
        }

        .hero-content > p {
          color: #aaa3a0;
          line-height: 2.2;
          font-size: 15px;
          max-width: 490px;
        }

        .hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 30px;
        }

        .primary-button,
        .secondary-button,
        .bottom-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 18px;
          min-height: 49px;
          padding: 0 23px;
          border-radius: 5px;
          text-decoration: none;
          font-weight: 800;
          font-size: 13px;
          transition: 0.2s ease;
        }

        .primary-button,
        .bottom-button {
          color: #111;
          background: #c99a86;
        }

        .primary-button:hover,
        .bottom-button:hover {
          background: #e0b5a2;
          transform: translateY(-2px);
        }

        .secondary-button {
          color: #f5f1ee;
          border: 1px solid #51413b;
        }

        .secondary-button:hover {
          border-color: #c99a86;
          color: #c99a86;
        }

        .hero-decoration {
          position: relative;
          width: min(100%, 390px);
          aspect-ratio: 1;
          margin: auto;
          display: grid;
          place-items: center;
        }

        .decoration-ring {
          position: absolute;
          border: 1px solid rgba(201, 154, 134, 0.35);
          border-radius: 50%;
        }

        .ring-one {
          width: 88%;
          height: 88%;
        }

        .ring-two {
          width: 66%;
          height: 66%;
          border-style: dashed;
          animation: rotate 35s linear infinite;
        }

        .decoration-center {
          width: 43%;
          height: 43%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 1px solid #c99a86;
          border-radius: 50%;
          background: radial-gradient(circle, #28201e, #100f10);
          box-shadow: 0 0 70px rgba(201, 154, 134, 0.12);
        }

        .decoration-center > span {
          color: #c99a86;
          font-family: Georgia, serif;
          font-size: 95px;
          line-height: 1;
        }

        .decoration-center small {
          color: #d5c2b9;
          letter-spacing: 5px;
          font-size: 9px;
        }

        .decoration-caption {
          position: absolute;
          bottom: 2%;
          color: #9d8276;
          font-size: 9px;
          letter-spacing: 4px;
          white-space: nowrap;
        }

        @keyframes rotate {
          to {
            transform: rotate(360deg);
          }
        }

        .contact-content {
          max-width: 1250px;
          margin: auto;
          padding: 90px 25px;
        }

        .section-heading {
          text-align: center;
          margin-bottom: 48px;
        }

        .section-heading h2 {
          margin: 15px 0;
          font-size: clamp(24px, 3vw, 36px);
        }

        .section-heading p {
          color: #99918e;
          font-size: 13px;
          line-height: 2;
        }

        .contact-grid {
          display: grid;
          grid-template-columns: 0.85fr 1.15fr;
          gap: 35px;
          align-items: start;
        }

        .contact-information {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .info-card {
          display: flex;
          align-items: flex-start;
          gap: 18px;
          padding: 23px;
          background: #141417;
          border: 1px solid #29272a;
          border-radius: 8px;
        }

        .info-icon {
          flex: 0 0 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border: 1px solid #795d52;
          color: #c99a86;
          font-size: 12px;
          font-weight: 900;
        }

        .info-card h3 {
          margin: 0 0 9px;
          font-size: 15px;
        }

        .info-card p {
          margin: 0;
          color: #9f9996;
          font-size: 12px;
          line-height: 2.1;
        }

        .business-note {
          padding: 30px;
          margin-top: 8px;
          background: linear-gradient(135deg, #211a18, #151416);
          border: 1px solid #60493f;
          border-radius: 8px;
        }

        .note-label {
          color: #c99a86;
          font-size: 10px;
          letter-spacing: 3px;
        }

        .business-note h3 {
          font-size: 21px;
          margin: 17px 0 10px;
        }

        .business-note p {
          color: #b4aaa5;
          font-size: 12px;
          line-height: 2.2;
        }

        .contact-form-card {
          padding: 35px;
          background: #141417;
          border: 1px solid #302b2c;
          border-radius: 10px;
        }

        .form-heading {
          margin-bottom: 27px;
        }

        .form-heading h2 {
          margin: 12px 0 8px;
          font-size: 24px;
        }

        .form-heading p {
          color: #99918e;
          font-size: 12px;
        }

        form {
          display: flex;
          flex-direction: column;
          gap: 19px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        label {
          display: flex;
          flex-direction: column;
          gap: 9px;
          color: #ded5d0;
          font-size: 12px;
          font-weight: 700;
        }

        input,
        select,
        textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #373236;
          outline: none;
          border-radius: 5px;
          padding: 13px 14px;
          background: #0d0d10;
          color: #f5f1ee;
          font: inherit;
          font-size: 13px;
          transition: border-color 0.2s;
        }

        input,
        select {
          min-height: 48px;
        }

        textarea {
          resize: vertical;
          line-height: 2;
        }

        input:focus,
        select:focus,
        textarea:focus {
          border-color: #c99a86;
        }

        input::placeholder,
        textarea::placeholder {
          color: #696366;
        }

        .character-count {
          align-self: flex-end;
          color: #827976;
          font-size: 10px;
        }

        .submit-button {
          display: flex;
          justify-content: space-between;
          align-items: center;
          min-height: 52px;
          padding: 0 20px;
          border: none;
          border-radius: 5px;
          background: #c99a86;
          color: #100e0d;
          font-weight: 900;
          cursor: pointer;
          font-size: 13px;
        }

        .submit-button:hover {
          background: #dfb19e;
        }

        .form-disclaimer {
          color: #8d8582;
          font-size: 10px;
          line-height: 2;
          margin: 0;
        }

        .success-message,
        .error-message {
          padding: 13px;
          margin-bottom: 18px;
          border-radius: 5px;
          font-size: 12px;
          line-height: 2;
        }

        .success-message {
          color: #b9dfc5;
          background: #14251b;
          border: 1px solid #31583d;
        }

        .error-message {
          color: #f0b7b0;
          background: #2a1717;
          border: 1px solid #673c3c;
        }

        .contact-bottom {
          max-width: 1200px;
          margin: 0 auto 80px;
          padding: 38px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 25px;
          background: linear-gradient(110deg, #201917, #151416);
          border: 1px solid #554139;
          border-radius: 9px;
        }

        .contact-bottom h2 {
          margin: 13px 0 0;
          font-size: clamp(19px, 3vw, 27px);
        }

        .bottom-button {
          flex-shrink: 0;
        }

        @media (max-width: 850px) {
          .contact-hero {
            grid-template-columns: 1fr;
            padding: 65px 7%;
          }

          .hero-decoration {
            width: 260px;
            margin-top: 35px;
          }

          .decoration-center > span {
            font-size: 70px;
          }

          .contact-grid {
            grid-template-columns: 1fr;
          }

          .contact-bottom {
            margin: 0 20px 55px;
          }
        }

        @media (max-width: 550px) {
          .contact-content {
            padding: 65px 17px;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .contact-form-card {
            padding: 23px 17px;
          }

          .contact-bottom {
            flex-direction: column;
            align-items: stretch;
            padding: 27px 20px;
          }

          .bottom-button {
            width: 100%;
            box-sizing: border-box;
          }

          .hero-actions > a {
            flex: 1;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .ring-two {
            animation: none;
          }

          * {
            scroll-behavior: auto !important;
            transition: none !important;
          }
        }
      `}</style>
    </main>
  );
}
