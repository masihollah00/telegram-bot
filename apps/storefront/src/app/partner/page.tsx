
"use client";

import Link from "next/link";
import { useState } from "react";

type PartnerForm = {
  fullName: string;
  businessName: string;
  phone: string;
  email: string;
  province: string;
  city: string;
  businessType: string;
  monthlyVolume: string;
  description: string;
};

const initialForm: PartnerForm = {
  fullName: "",
  businessName: "",
  phone: "",
  email: "",
  province: "",
  city: "",
  businessType: "فروشگاه لوازم آرایشی",
  monthlyVolume: "کمتر از ۵۰ میلیون تومان",
  description: "",
};

export default function PartnerPage() {
  const [form, setForm] = useState<PartnerForm>(initialForm);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const update = (key: keyof PartnerForm, value: string) => {
    setForm((old) => ({ ...old, [key]: value }));
    setMessage("");
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.fullName.trim() || !form.businessName.trim()) {
      setMessage("نام و نام کسب‌وکار را وارد کنید.");
      return;
    }

    if (!/^09\d{9}$/.test(form.phone.trim())) {
      setMessage("شماره موبایل معتبر وارد کنید.");
      return;
    }

    if (!form.province.trim() || !form.city.trim()) {
      setMessage("استان و شهر محل فعالیت را وارد کنید.");
      return;
    }

    const draft = {
      ...form,
      status: "pending_connection",
      createdAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(
        "jalali_partner_application",
        JSON.stringify(draft)
      );

      setSubmitted(true);
      setMessage(
        "پیش‌نویس درخواست شما ذخیره شد. ارسال و بررسی نهایی پس از اتصال سامانه به سرور انجام می‌شود."
      );
    } catch {
      setMessage("ذخیره اطلاعات انجام نشد. دوباره تلاش کنید.");
    }
  };

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
          <Link href="/categories">دسته‌بندی‌ها</Link>
          <Link href="/cart">سبد خرید</Link>
        </nav>
      </header>

      <section className="hero">
        <div className="heroText">
          <span className="eyebrow">BUSINESS PARTNERSHIP</span>
          <h1>
            همکاری تجاری
            <br />
            <span>با پخش جلالی</span>
          </h1>
          <p>
            برای دریافت شرایط همکاری، دسترسی به قیمت‌های ویژه
            همکاران و خرید عمده، درخواست خود را ثبت کنید.
          </p>

          <div className="benefits">
            <div>
              <span>01</span>
              <strong>قیمت‌گذاری همکاری</strong>
              <small>شرایط اختصاصی پس از تأیید حساب</small>
            </div>
            <div>
              <span>02</span>
              <strong>مدیریت سفارش عمده</strong>
              <small>پیگیری سفارش‌های تجاری</small>
            </div>
            <div>
              <span>03</span>
              <strong>ارتباط با فروش</strong>
              <small>بررسی درخواست توسط مدیریت</small>
            </div>
          </div>
        </div>

        <div className="heroVisual">
          <div className="visualRing">
            <span>J</span>
          </div>
          <div className="visualCaption">
            <strong>JALALI BUSINESS</strong>
            <small>WHOLESALE PARTNERSHIP</small>
          </div>
        </div>
      </section>

      <section className="formSection">
        <div className="sectionTitle">
          <span className="eyebrow">PARTNER APPLICATION</span>
          <h2>فرم درخواست همکاری</h2>
          <p>
            اطلاعات کسب‌وکار خود را وارد کنید تا درخواست برای
            بررسی آماده شود.
          </p>
        </div>

        <div className="formLayout">
          <form className="partnerForm" onSubmit={submit}>
            <div className="formHeading">
              <span>01</span>
              <div>
                <h3>اطلاعات متقاضی</h3>
                <p>مشخصات فرد مسئول همکاری</p>
              </div>
            </div>

            <div className="grid">
              <label className="field">
                <span>نام و نام خانوادگی *</span>
                <input
                  required
                  value={form.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                  placeholder="نام کامل"
                />
              </label>

              <label className="field">
                <span>شماره موبایل *</span>
                <input
                  required
                  inputMode="numeric"
                  maxLength={11}
                  value={form.phone}
                  onChange={(e) =>
                    update(
                      "phone",
                      e.target.value.replace(/\D/g, "").slice(0, 11)
                    )
                  }
                  placeholder="09123456789"
                />
              </label>

              <label className="field full">
                <span>ایمیل کاری</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="name@example.com"
                />
              </label>
            </div>

            <div className="formHeading second">
              <span>02</span>
              <div>
                <h3>اطلاعات کسب‌وکار</h3>
                <p>مشخصات محل و نوع فعالیت تجاری</p>
              </div>
            </div>

            <div className="grid">
              <label className="field full">
                <span>نام فروشگاه یا مجموعه *</span>
                <input
                  required
                  value={form.businessName}
                  onChange={(e) =>
                    update("businessName", e.target.value)
                  }
                  placeholder="نام کسب‌وکار"
                />
              </label>

              <label className="field">
                <span>نوع فعالیت *</span>
                <select
                  value={form.businessType}
                  onChange={(e) =>
                    update("businessType", e.target.value)
                  }
                >
                  <option>فروشگاه لوازم آرایشی</option>
                  <option>فروشگاه اینترنتی</option>
                  <option>سالن زیبایی</option>
                  <option>پخش و عمده‌فروشی</option>
                  <option>داروخانه یا مرکز بهداشتی</option>
                  <option>سایر کسب‌وکارها</option>
                </select>
              </label>

              <label className="field">
                <span>حجم خرید ماهانه تخمینی</span>
                <select
                  value={form.monthlyVolume}
                  onChange={(e) =>
                    update("monthlyVolume", e.target.value)
                  }
                >
                  <option>کمتر از ۵۰ میلیون تومان</option>
                  <option>۵۰ تا ۱۰۰ میلیون تومان</option>
                  <option>۱۰۰ تا ۳۰۰ میلیون تومان</option>
                  <option>۳۰۰ تا ۵۰۰ میلیون تومان</option>
                  <option>بیشتر از ۵۰۰ میلیون تومان</option>
                  <option>هنوز مشخص نیست</option>
                </select>
              </label>

              <label className="field">
                <span>استان *</span>
                <input
                  required
                  value={form.province}
                  onChange={(e) => update("province", e.target.value)}
                  placeholder="استان محل فعالیت"
                />
              </label>

              <label className="field">
                <span>شهر *</span>
                <input
                  required
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                  placeholder="شهر محل فعالیت"
                />
              </label>

              <label className="field full">
                <span>توضیحات تکمیلی</span>
                <textarea
                  rows={5}
                  value={form.description}
                  onChange={(e) =>
                    update("description", e.target.value)
                  }
                  placeholder="درباره کسب‌وکار و نوع همکاری موردنظر توضیح دهید..."
                />
              </label>
            </div>

            {message && (
              <div className="message" role="status">
                {message}
              </div>
            )}

            <button
              type="submit"
              className="submitButton"
              disabled={submitted}
            >
              {submitted
                ? "پیش‌نویس ذخیره شده"
                : "ذخیره پیش‌نویس درخواست همکاری"}
              <span>←</span>
            </button>

            <p className="privacy">
              اطلاعات واردشده در این مرحله در مرورگر ذخیره می‌شود.
              ارسال واقعی درخواست و بررسی مدیریت پس از اتصال API
              فعال خواهد شد.
            </p>
          </form>

          <aside className="sideCard">
            <span className="sideEyebrow">JALALI COSMETICS</span>
            <h3>مسیر همکاری تجاری</h3>
            <p>
              درخواست همکاری پس از اتصال سامانه به سرور، در پنل
              مدیریت قابل مشاهده و بررسی خواهد بود.
            </p>

            <div className="process">
              <div>
                <span>01</span>
                <section>
                  <strong>ثبت درخواست</strong>
                  <small>تکمیل اطلاعات کسب‌وکار</small>
                </section>
              </div>
              <div>
                <span>02</span>
                <section>
                  <strong>بررسی مدیریت</strong>
                  <small>ارزیابی اطلاعات متقاضی</small>
                </section>
              </div>
              <div>
                <span>03</span>
                <section>
                  <strong>تعیین شرایط همکاری</strong>
                  <small>بررسی قیمت و شرایط خرید</small>
                </section>
              </div>
              <div>
                <span>04</span>
                <section>
                  <strong>فعال‌سازی حساب همکار</strong>
                  <small>پس از تأیید مدیر فروشگاه</small>
                </section>
              </div>
            </div>

            <div className="sideFooter">
              <span>BEAUTY.</span>
              <span>BUSINESS.</span>
              <span>TRUST.</span>
            </div>
          </aside>
        </div>
      </section>

      <footer className="footer">
        <strong>JALALI COSMETICS</strong>
        <span>BEAUTY. BUSINESS. TRUST.</span>
        <Link href="/">بازگشت به صفحه اصلی</Link>
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
          font-size: 29px;
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
          gap: 24px;
        }

        nav a,
        .footer a {
          color: #c7bbb6;
          font-size: 11px;
          text-decoration: none;
        }

        nav a:hover,
        .footer a:hover {
          color: #c99a86;
        }

        .hero {
          min-height: 430px;
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
          margin: 15px 0;
          font-size: clamp(32px, 5vw, 52px);
          line-height: 1.6;
        }

        .hero h1 span {
          color: #c99a86;
        }

        .heroText > p {
          max-width: 480px;
          color: #aa9c97;
          font-size: 13px;
          line-height: 2.2;
        }

        .benefits {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin-top: 34px;
        }

        .benefits div {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .benefits div > span {
          color: #c99a86;
          font-size: 11px;
        }

        .benefits strong {
          font-size: 11px;
        }

        .benefits small {
          color: #948680;
          font-size: 9px;
          line-height: 1.8;
        }

        .heroVisual {
          min-height: 320px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .visualRing {
          width: 220px;
          height: 220px;
          display: grid;
          place-items: center;
          border: 1px solid #8c6758;
          border-radius: 50%;
          box-shadow: 0 0 0 16px #171315,
            0 0 0 17px #49352f,
            0 0 70px #513a32;
        }

        .visualRing span {
          color: #c99a86;
          font-family: Georgia, serif;
          font-size: 120px;
        }

        .visualCaption {
          position: absolute;
          bottom: 20px;
          display: flex;
          flex-direction: column;
          gap: 7px;
          text-align: center;
        }

        .visualCaption strong {
          color: #c99a86;
          letter-spacing: 3px;
          font-size: 12px;
        }

        .visualCaption small {
          color: #a99b96;
          letter-spacing: 2px;
          font-size: 9px;
        }

        .formSection {
          padding: 65px 0;
        }

        .sectionTitle {
          margin-bottom: 30px;
        }

        .sectionTitle h2 {
          font-size: 30px;
          margin: 12px 0;
        }

        .sectionTitle p {
          color: #a99b96;
          font-size: 12px;
        }

        .formLayout {
          display: grid;
          grid-template-columns: minmax(0, 1.5fr) minmax(260px, 0.7fr);
          gap: 22px;
          align-items: start;
        }

        .partnerForm,
        .sideCard {
          padding: 27px;
          border: 1px solid #30282a;
          border-radius: 11px;
          background: #151416;
        }

        .formHeading {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 24px;
        }

        .formHeading > span {
          padding: 10px;
          border: 1px solid #76594e;
          color: #c99a86;
          font-size: 12px;
        }

        .formHeading h3 {
          margin: 0;
          font-size: 16px;
        }

        .formHeading p {
          margin: 6px 0 0;
          color: #a99b96;
          font-size: 10px;
        }

        .second {
          margin-top: 36px;
        }

        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 9px;
          min-width: 0;
        }

        .field.full {
          grid-column: 1 / -1;
        }

        .field > span {
          color: #d7c8c1;
          font-size: 11px;
        }

        .field input,
        .field select,
        .field textarea {
          box-sizing: border-box;
          width: 100%;
          min-height: 46px;
          padding: 12px;
          border: 1px solid #393033;
          border-radius: 6px;
          outline: none;
          background: #0d0c0e;
          color: #f5f1ee;
          font: inherit;
          font-size: 12px;
        }

        .field textarea {
          min-height: 110px;
          resize: vertical;
        }

        .field input:focus,
        .field select:focus,
        .field textarea:focus {
          border-color: #c99a86;
        }

        .field input::placeholder,
        .field textarea::placeholder {
          color: #74696b;
        }

        .submitButton {
          width: 100%;
          min-height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
          margin-top: 25px;
          border: 1px solid #c99a86;
          border-radius: 6px;
          background: #c99a86;
          color: #171113;
          font: inherit;
          font-size: 12px;
          font-weight: bold;
          cursor: pointer;
        }

        .submitButton:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .privacy {
          color: #948680;
          font-size: 10px;
          line-height: 2;
          text-align: center;
        }

        .message {
          margin-top: 20px;
          padding: 14px;
          border: 1px solid #76594e;
          border-radius: 6px;
          background: #211a1b;
          color: #e4c5b6;
          font-size: 11px;
          line-height: 2;
        }

        .sideCard {
          background: linear-gradient(145deg, #21191a, #151416);
          border-color: #554038;
        }

        .sideEyebrow {
          color: #c99a86;
          font-size: 9px;
          letter-spacing: 2px;
        }

        .sideCard h3 {
          margin: 14px 0;
          font-size: 22px;
        }

        .sideCard > p {
          color: #b3a39d;
          font-size: 11px;
          line-height: 2.2;
        }

        .process {
          margin-top: 30px;
        }

        .process > div {
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 17px 0;
          border-bottom: 1px solid #403031;
        }

        .process > div > span {
          color: #c99a86;
          font-family: Georgia, serif;
          font-size: 18px;
        }

        .process section strong,
        .process section small {
          display: block;
        }

        .process section strong {
          font-size: 11px;
        }

        .process section small {
          margin-top: 6px;
          color: #a99b96;
          font-size: 9px;
        }

        .sideFooter {
          display: flex;
          justify-content: space-between;
          margin-top: 30px;
          color: #c99a86;
          font-size: 9px;
          letter-spacing: 2px;
        }

        .footer {
          display: flex;
          align-items: center;
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

        @media (max-width: 850px) {
          .formLayout {
            grid-template-columns: 1fr;
          }

          .sideCard {
            order: -1;
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
            font-size: 10px;
          }

          .hero {
            grid-template-columns: 1fr;
            padding: 35px 0;
          }

          .heroVisual {
            min-height: 250px;
          }

          .visualRing {
            width: 170px;
            height: 170px;
          }

          .visualRing span {
            font-size: 90px;
          }

          .benefits {
            gap: 9px;
          }

          .benefits strong {
            font-size: 10px;
          }

          .partnerForm,
          .sideCard {
            padding: 18px;
          }

          .grid {
            grid-template-columns: 1fr;
          }

          .field.full {
            grid-column: auto;
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
