
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type CartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  available?: boolean;
};

type CheckoutForm = {
  fullName: string;
  phone: string;
  province: string;
  city: string;
  address: string;
  postalCode: string;
  description: string;
};

const STORAGE_KEY = "jalali_cart";

const money = (value: number) =>
  new Intl.NumberFormat("fa-IR").format(value) + " تومان";

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState<CheckoutForm>({
    fullName: "",
    phone: "",
    province: "",
    city: "",
    address: "",
    postalCode: "",
    description: "",
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setCart(parsed);
        }
      }
    } catch {
      setCart([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const totalQuantity = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      ),
    [cart]
  );

  const updateField = (
    field: keyof CheckoutForm,
    value: string
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
    setMessage("");
  };

  const validate = () => {
    if (!cart.length) {
      return "سبد خرید شما خالی است.";
    }

    if (!form.fullName.trim()) {
      return "نام و نام خانوادگی را وارد کنید.";
    }

    if (!/^09\d{9}$/.test(form.phone.trim())) {
      return "شماره موبایل معتبر وارد کنید.";
    }

    if (!form.province.trim() || !form.city.trim()) {
      return "استان و شهر را وارد کنید.";
    }

    if (form.address.trim().length < 10) {
      return "نشانی کامل‌تری وارد کنید.";
    }

    if (!/^\d{10}$/.test(form.postalCode.trim())) {
      return "کد پستی باید ۱۰ رقم باشد.";
    }

    return "";
  };

  const submitOrder = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const error = validate();

    if (error) {
      setMessage(error);
      return;
    }

    const draft = {
      customer: form,
      items: cart,
      subtotal,
      totalQuantity,
      createdAt: new Date().toISOString(),
      status: "draft",
    };

    try {
      localStorage.setItem(
        "jalali_checkout_draft",
        JSON.stringify(draft)
      );

      setMessage(
        "اطلاعات سفارش بررسی شد و پیش‌نویس آن ذخیره شد. ثبت نهایی سفارش پس از اتصال سامانه به سرور انجام می‌شود."
      );
    } catch {
      setMessage("ذخیره اطلاعات انجام نشد. دوباره تلاش کنید.");
    }
  };

  if (loading) {
    return (
      <main className="loading">
        <span className="loader" />
        <p>در حال آماده‌سازی تسویه‌حساب...</p>
      </main>
    );
  }

  if (!cart.length) {
    return (
      <main className="empty">
        <div className="emptyIcon">🛍</div>
        <h1>سبد خرید خالی است</h1>
        <p>برای ادامه، ابتدا محصولات موردنظر خود را انتخاب کنید.</p>
        <Link href="/products" className="primaryButton">
          مشاهده محصولات
        </Link>
      </main>
    );
  }

  return (
    <main className="checkoutPage" dir="rtl">
      <header className="topHeader">
        <Link href="/" className="brand">
          <span className="brandMark">J</span>
          <span>
            <strong>JALALI COSMETICS</strong>
            <small>BEAUTY. BUSINESS. TRUST.</small>
          </span>
        </Link>

        <Link href="/cart" className="backLink">
          بازگشت به سبد خرید ←
        </Link>
      </header>

      <section className="intro">
        <span className="eyebrow">ORDER MANAGEMENT</span>
        <h1>تکمیل اطلاعات سفارش</h1>
        <p>
          اطلاعات تحویل سفارش خود را با دقت وارد کنید.
        </p>
      </section>

      <div className="checkoutLayout">
        <form className="checkoutForm" onSubmit={submitOrder}>
          <section className="formCard">
            <div className="sectionHeading">
              <span className="step">01</span>
              <div>
                <h2>اطلاعات خریدار</h2>
                <p>مشخصات تماس سفارش‌دهنده</p>
              </div>
            </div>

            <div className="fieldGrid">
              <label className="field full">
                <span>نام و نام خانوادگی *</span>
                <input
                  value={form.fullName}
                  onChange={(e) =>
                    updateField("fullName", e.target.value)
                  }
                  placeholder="نام خریدار"
                  autoComplete="name"
                  required
                />
              </label>

              <label className="field full">
                <span>شماره موبایل *</span>
                <input
                  value={form.phone}
                  onChange={(e) =>
                    updateField("phone", e.target.value)
                  }
                  placeholder="09123456789"
                  inputMode="numeric"
                  autoComplete="tel"
                  maxLength={11}
                  required
                />
              </label>
            </div>
          </section>

          <section className="formCard">
            <div className="sectionHeading">
              <span className="step">02</span>
              <div>
                <h2>نشانی تحویل</h2>
                <p>محل دریافت سفارش را مشخص کنید</p>
              </div>
            </div>

            <div className="fieldGrid">
              <label className="field">
                <span>استان *</span>
                <input
                  value={form.province}
                  onChange={(e) =>
                    updateField("province", e.target.value)
                  }
                  placeholder="مثلاً تهران"
                  required
                />
              </label>

              <label className="field">
                <span>شهر *</span>
                <input
                  value={form.city}
                  onChange={(e) =>
                    updateField("city", e.target.value)
                  }
                  placeholder="نام شهر"
                  required
                />
              </label>

              <label className="field full">
                <span>نشانی کامل *</span>
                <textarea
                  value={form.address}
                  onChange={(e) =>
                    updateField("address", e.target.value)
                  }
                  placeholder="خیابان، کوچه، پلاک و واحد..."
                  rows={4}
                  required
                />
              </label>

              <label className="field full">
                <span>کد پستی *</span>
                <input
                  value={form.postalCode}
                  onChange={(e) =>
                    updateField(
                      "postalCode",
                      e.target.value.replace(/\D/g, "").slice(0, 10)
                    )
                  }
                  placeholder="کد پستی ۱۰ رقمی"
                  inputMode="numeric"
                  maxLength={10}
                  required
                />
              </label>

              <label className="field full">
                <span>توضیحات سفارش</span>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    updateField("description", e.target.value)
                  }
                  placeholder="توضیحات تکمیلی برای فروشگاه (اختیاری)"
                  rows={3}
                />
              </label>
            </div>
          </section>

          {message && (
            <div className="message" role="status">
              {message}
            </div>
          )}

          <button type="submit" className="submitButton">
            بررسی و ذخیره پیش‌نویس سفارش
            <span>←</span>
          </button>

          <p className="secureNote">
            اطلاعات این مرحله فقط به‌صورت پیش‌نویس در مرورگر ذخیره
            می‌شود؛ ثبت واقعی سفارش و پرداخت، پس از اتصال API و
            درگاه پرداخت فعال خواهد شد.
          </p>
        </form>

        <aside className="summaryCard">
          <div className="summaryTitle">
            <h2>خلاصه سفارش</h2>
            <span>{cart.length} محصول</span>
          </div>

          <div className="productList">
            {cart.map((item) => (
              <div className="productRow" key={item.id}>
                <div className="productInfo">
                  <strong>{item.name}</strong>
                  <small>
                    تعداد: {item.quantity.toLocaleString("fa-IR")}
                  </small>
                </div>
                <strong className="productPrice">
                  {money(item.price * item.quantity)}
                </strong>
              </div>
            ))}
          </div>

          <div className="summaryLine">
            <span>تعداد کل کالاها</span>
            <strong>{totalQuantity.toLocaleString("fa-IR")}</strong>
          </div>

          <div className="summaryLine">
            <span>جمع محصولات</span>
            <strong>{money(subtotal)}</strong>
          </div>

          <div className="summaryLine">
            <span>هزینه ارسال</span>
            <strong>پس از تعیین روش ارسال</strong>
          </div>

          <div className="totalLine">
            <span>جمع کل محصولات</span>
            <strong>{money(subtotal)}</strong>
          </div>

          <div className="businessNote">
            <span>✦</span>
            <p>
              قیمت نهایی، هزینه ارسال و شرایط خرید عمده پس از اتصال
              سامانه سفارش‌گیری و تأیید فروشگاه محاسبه خواهد شد.
            </p>
          </div>

          <Link href="/products" className="continueLink">
            ادامه خرید
          </Link>
        </aside>
      </div>

      <footer className="footer">
        <span>JALALI COSMETICS</span>
        <span>BEAUTY. BUSINESS. TRUST.</span>
      </footer>

      <style jsx>{`
        .checkoutPage {
          min-height: 100vh;
          padding: 0 6%;
          background: #0b0b0d;
          color: #f5f1ee;
          font-family: inherit;
        }

        .topHeader {
          min-height: 90px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #292326;
          gap: 20px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 13px;
          color: inherit;
          text-decoration: none;
        }

        .brandMark {
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
          font-size: 14px;
          letter-spacing: 2px;
        }

        .brand small {
          margin-top: 5px;
          color: #a99b96;
          font-size: 9px;
          letter-spacing: 1.4px;
        }

        .backLink,
        .continueLink {
          color: #c99a86;
          text-decoration: none;
          font-size: 13px;
        }

        .intro {
          padding: 48px 0 34px;
        }

        .eyebrow {
          color: #c99a86;
          font-size: 10px;
          letter-spacing: 3px;
        }

        .intro h1 {
          margin: 13px 0;
          font-size: clamp(25px, 4vw, 38px);
        }

        .intro p,
        .sectionHeading p {
          color: #a99b96;
          font-size: 13px;
        }

        .checkoutLayout {
          display: grid;
          grid-template-columns: minmax(0, 1.55fr) minmax(280px, 0.85fr);
          gap: 25px;
          align-items: start;
          padding-bottom: 65px;
        }

        .checkoutForm {
          display: grid;
          gap: 20px;
        }

        .formCard,
        .summaryCard {
          background: #151416;
          border: 1px solid #30282a;
          border-radius: 13px;
          padding: 25px;
        }

        .sectionHeading {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 25px;
        }

        .step {
          color: #c99a86;
          border: 1px solid #76594e;
          padding: 9px;
          font-size: 12px;
        }

        .sectionHeading h2,
        .summaryTitle h2 {
          margin: 0;
          font-size: 17px;
        }

        .sectionHeading p {
          margin: 6px 0 0;
          font-size: 11px;
        }

        .fieldGrid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 19px;
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

        .field span {
          font-size: 12px;
          color: #d8c9c2;
        }

        .field input,
        .field textarea {
          width: 100%;
          box-sizing: border-box;
          background: #0d0c0e;
          border: 1px solid #393033;
          border-radius: 7px;
          color: #fff;
          padding: 13px;
          outline: none;
          font: inherit;
          font-size: 13px;
          transition: border-color 0.2s;
        }

        .field input:focus,
        .field textarea:focus {
          border-color: #c99a86;
        }

        .field textarea {
          resize: vertical;
          min-height: 85px;
        }

        .field input::placeholder,
        .field textarea::placeholder {
          color: #71676a;
        }

        .summaryCard {
          position: sticky;
          top: 20px;
        }

        .summaryTitle {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 20px;
          border-bottom: 1px solid #393033;
        }

        .summaryTitle span {
          color: #c99a86;
          font-size: 11px;
        }

        .productList {
          padding: 12px 0;
        }

        .productRow {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 0;
          border-bottom: 1px solid #292326;
        }

        .productInfo strong,
        .productInfo small {
          display: block;
        }

        .productInfo strong {
          font-size: 12px;
        }

        .productInfo small {
          color: #a99b96;
          margin-top: 7px;
          font-size: 11px;
        }

        .productPrice {
          color: #c99a86;
          font-size: 11px;
          white-space: nowrap;
        }

        .summaryLine,
        .totalLine {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 13px 0;
          font-size: 11px;
          color: #b7aaa5;
        }

        .summaryLine strong {
          color: #f5f1ee;
          text-align: left;
        }

        .totalLine {
          border-top: 1px solid #4b3935;
          margin-top: 8px;
          padding-top: 20px;
          color: #fff;
          font-size: 13px;
        }

        .totalLine strong {
          color: #c99a86;
          font-size: 17px;
        }

        .businessNote {
          display: flex;
          gap: 12px;
          margin-top: 18px;
          padding: 14px;
          background: #211a1b;
          border-radius: 7px;
        }

        .businessNote span {
          color: #c99a86;
        }

        .businessNote p {
          margin: 0;
          color: #c2b2ac;
          font-size: 10px;
          line-height: 2;
        }

        .submitButton,
        .primaryButton {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          min-height: 53px;
          border: 1px solid #c99a86;
          border-radius: 7px;
          background: #c99a86;
          color: #171113;
          font: inherit;
          font-weight: bold;
          font-size: 13px;
          text-decoration: none;
          cursor: pointer;
          transition: 0.2s;
        }

        .submitButton:hover,
        .primaryButton:hover {
          background: transparent;
          color: #c99a86;
        }

        .secureNote {
          color: #9b8d88;
          font-size: 10px;
          line-height: 2;
          text-align: center;
          margin: 0;
        }

        .message {
          padding: 14px;
          border: 1px solid #8a695b;
          background: #211a1b;
          border-radius: 7px;
          color: #e7c8b9;
          font-size: 12px;
          line-height: 2;
        }

        .footer {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          border-top: 1px solid #292326;
          padding: 25px 0;
          color: #a99b96;
          font-size: 10px;
          letter-spacing: 1.5px;
        }

        .loading,
        .empty {
          min-height: 70vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 18px;
          background: #0b0b0d;
          color: #f5f1ee;
          text-align: center;
          padding: 25px;
        }

        .empty p {
          color: #a99b96;
          font-size: 13px;
        }

        .emptyIcon {
          font-size: 45px;
        }

        .primaryButton {
          padding: 0 28px;
        }

        .loader {
          width: 30px;
          height: 30px;
          border: 3px solid #393033;
          border-top-color: #c99a86;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 800px) {
          .checkoutLayout {
            grid-template-columns: 1fr;
          }

          .summaryCard {
            position: static;
            grid-row: 1;
          }
        }

        @media (max-width: 520px) {
          .checkoutPage {
            padding: 0 17px;
          }

          .topHeader {
            min-height: 75px;
          }

          .brand strong {
            font-size: 11px;
          }

          .brand small {
            font-size: 7px;
          }

          .backLink {
            font-size: 10px;
          }

          .formCard,
          .summaryCard {
            padding: 17px;
          }

          .fieldGrid {
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
