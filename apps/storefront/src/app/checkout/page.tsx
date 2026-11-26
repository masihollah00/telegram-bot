
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";

type CartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
};

type CheckoutForm = {
  fullName: string;
  phone: string;
  province: string;
  city: string;
  address: string;
  postalCode: string;
  description: string;
  delivery: "standard" | "express";
  invoice: "personal" | "business";
  businessName: string;
  nationalId: string;
};

const STORAGE_KEY = "jalali_cart";

const money = (value: number) =>
  new Intl.NumberFormat("fa-IR").format(value) + " تومان";

const digits = (value: string) =>
  value.replace(/[۰-۹]/g, (d) =>
    String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))
  ).replace(/[٠-٩]/g, (d) =>
    String("٠١٢٣٤٥٦٧٨٩".indexOf(d))
  );

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "info">("info");

  const [form, setForm] = useState<CheckoutForm>({
    fullName: "",
    phone: "",
    province: "",
    city: "",
    address: "",
    postalCode: "",
    description: "",
    delivery: "standard",
    invoice: "personal",
    businessName: "",
    nationalId: "",
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);

        if (Array.isArray(parsed)) {
          const valid = parsed.filter((item) =>
            Number.isInteger(item.id) &&
            typeof item.name === "string" &&
            Number.isFinite(item.price) &&
            item.price >= 0 &&
            Number.isInteger(item.quantity) &&
            item.quantity > 0
          );

          setCart(valid);
        }
      }
    } catch {
      setCart([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  const totalQuantity = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const subtotal = useMemo(
    () => cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    ),
    [cart]
  );

  const update = <K extends keyof CheckoutForm>(
    key: K,
    value: CheckoutForm[K]
  ) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
    setMessage("");
  };

  const validateCustomer = () => {
    if (form.fullName.trim().length < 3) {
      return "نام و نام خانوادگی را کامل وارد کنید.";
    }

    if (!/^09\d{9}$/.test(digits(form.phone.trim()))) {
      return "شماره موبایل معتبر وارد کنید.";
    }

    return "";
  };

  const validateAddress = () => {
    if (!form.province.trim() || !form.city.trim()) {
      return "استان و شهر محل تحویل را مشخص کنید.";
    }

    if (form.address.trim().length < 10) {
      return "نشانی کامل‌تری وارد کنید.";
    }

    if (!/^\d{10}$/.test(digits(form.postalCode))) {
      return "کد پستی باید دقیقاً ۱۰ رقم باشد.";
    }

    if (
      form.invoice === "business" &&
      !form.businessName.trim()
    ) {
      return "نام مجموعه یا شرکت را وارد کنید.";
    }

    return "";
  };

  const showError = (text: string) => {
    setMessageType("error");
    setMessage(text);
  };

  const nextStep = () => {
    const error = step === 1
      ? validateCustomer()
      : validateAddress();

    if (error) {
      showError(error);
      return;
    }

    setMessage("");
    setStep((previous) => Math.min(3, previous + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const previousStep = () => {
    setMessage("");
    setStep((previous) => Math.max(1, previous - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitOrder = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const customerError = validateCustomer();
    const addressError = validateAddress();

    if (customerError) {
      setStep(1);
      showError(customerError);
      return;
    }

    if (addressError) {
      setStep(2);
      showError(addressError);
      return;
    }

    if (!cart.length) {
      showError("سبد خرید شما خالی است.");
      return;
    }

    /*
      در نسخه فعلی بک‌اند پروژه، API ثبت سفارش مهمان
      هنوز تعریف نشده است.

      عمداً سفارش ساختگی یا پیش‌نویس حاوی اطلاعات شخصی
      در localStorage ذخیره نمی‌شود.
    */

    setMessageType("info");
    setMessage(
      "اطلاعات شما بررسی شد. برای ثبت قطعی سفارش باید API سفارش مهمان، کنترل موجودی و اتصال درگاه پرداخت در سرور فعال شود. هنوز هیچ سفارش یا پرداختی ثبت نشده است."
    );
  };

  if (!loaded) {
    return (
      <main className="loading" dir="rtl">
        <span className="spinner" />
        <p>در حال آماده‌سازی فرایند خرید...</p>
        <style jsx>{`
          .loading {
            min-height: 80vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 18px;
            background: #0b0b0d;
            color: #d5aa96;
          }
          .spinner {
            width: 37px;
            height: 37px;
            border: 2px solid #46332e;
            border-top-color: #d1a18c;
            border-radius: 50%;
            animation: spin .8s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </main>
    );
  }

  if (!cart.length) {
    return (
      <main className="empty" dir="rtl">
        <span className="empty-icon">◇</span>
        <span className="eyebrow">JALALI CHECKOUT</span>
        <h1>سبد خرید شما خالی است</h1>
        <p>
          برای شروع خرید، محصولات موردنظرتان را انتخاب کنید.
        </p>
        <Link href="/products">مشاهده فروشگاه ←</Link>
        <style jsx>{`
          .empty {
            min-height: 85vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 15px;
            padding: 25px;
            background: #0b0b0d;
            color: #f5f1ee;
            text-align: center;
          }
          .empty-icon {
            color: #d1a18c;
            font-size: 70px;
          }
          .eyebrow {
            color: #c99a86;
            font-size: 10px;
            letter-spacing: 3px;
          }
          .empty h1 { font-size: 25px; }
          .empty p { color: #a99b96; font-size: 12px; }
          .empty a {
            margin-top: 15px;
            padding: 14px 24px;
            border-radius: 7px;
            background: #c99a86;
            color: #171113;
            text-decoration: none;
            font-size: 12px;
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="checkout" dir="rtl">
      <header className="header">
        <Link href="/" className="brand">
          <span className="brand-mark">J</span>
          <span className="brand-text">
            <strong>JALALI</strong>
            <small>COSMETICS</small>
          </span>
        </Link>

        <div className="header-center">
          <span className="secure-icon">♧</span>
          <span>فرایند خرید مشتریان</span>
        </div>

        <Link href="/cart" className="back-link">
          بازگشت به سبد خرید ←
        </Link>
      </header>

      <section className="hero">
        <div>
          <span className="eyebrow">SECURE CHECKOUT EXPERIENCE</span>
          <h1>
            تکمیل سفارش
            <span> شما</span>
          </h1>
          <p>
            چند مرحله تا تکمیل اطلاعات خرید شما باقی مانده است.
            بدون نیاز به ثبت‌نام، سفارش خود را آماده کنید.
          </p>
        </div>

        <div className="hero-seal">
          <span>J</span>
          <small>JALALI</small>
        </div>
      </section>

      <section className="steps">
        {[
          { id: 1, title: "اطلاعات خریدار", subtitle: "مشخصات تماس" },
          { id: 2, title: "نشانی تحویل", subtitle: "اطلاعات ارسال" },
          { id: 3, title: "بررسی سفارش", subtitle: "تأیید اطلاعات" },
        ].map((item) => (
          <div
            key={item.id}
            className={`step ${step === item.id ? "active" : ""} ${
              step > item.id ? "completed" : ""
            }`}
          >
            <span className="step-number">
              {step > item.id ? "✓" : item.id}
            </span>
            <span className="step-text">
              <strong>{item.title}</strong>
              <small>{item.subtitle}</small>
            </span>
          </div>
        ))}
      </section>

      <div className="main-layout">
        <form className="form-column" onSubmit={submitOrder}>
          {step === 1 && (
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <span className="panel-kicker">STEP 01 / CUSTOMER</span>
                  <h2>اطلاعات خریدار</h2>
                  <p>
                    برای هماهنگی تحویل سفارش، مشخصات تماس خود را وارد کنید.
                  </p>
                </div>
                <span className="panel-symbol">♙</span>
              </div>

              <div className="fields">
                <label className="field full">
                  <span>نام و نام خانوادگی <b>*</b></span>
                  <input
                    value={form.fullName}
                    onChange={(e) => update("fullName", e.target.value)}
                    placeholder="نام کامل خریدار"
                    autoComplete="name"
                    required
                  />
                </label>

                <label className="field full">
                  <span>شماره موبایل <b>*</b></span>
                  <input
                    value={form.phone}
                    onChange={(e) =>
                      update("phone", digits(e.target.value).replace(/\D/g, "").slice(0, 11))
                    }
                    placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                    inputMode="numeric"
                    autoComplete="tel"
                    maxLength={11}
                    required
                  />
                  <small>
                    شماره تماس برای هماهنگی ارسال و اطلاع‌رسانی سفارش استفاده می‌شود.
                  </small>
                </label>
              </div>

              <div className="info-card">
                <span>✧</span>
                <p>
                  برای خرید از فروشگاه نیازی به حساب کاربری یا ورود با گوگل ندارید.
                </p>
              </div>

              <button type="button" className="primary-button" onClick={nextStep}>
                ادامه: نشانی تحویل
                <span>←</span>
              </button>
            </section>
          )}

          {step === 2 && (
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <span className="panel-kicker">STEP 02 / DELIVERY</span>
                  <h2>نشانی و روش تحویل</h2>
                  <p>
                    اطلاعات دقیق مقصد را وارد کنید تا سفارش به نشانی صحیح ارسال شود.
                  </p>
                </div>
                <span className="panel-symbol">⌖</span>
              </div>

              <div className="fields">
                <label className="field">
                  <span>استان <b>*</b></span>
                  <input
                    value={form.province}
                    onChange={(e) => update("province", e.target.value)}
                    placeholder="نام استان"
                    required
                  />
                </label>

                <label className="field">
                  <span>شهر <b>*</b></span>
                  <input
                    value={form.city}
                    onChange={(e) => update("city", e.target.value)}
                    placeholder="نام شهر"
                    required
                  />
                </label>

                <label className="field full">
                  <span>نشانی کامل <b>*</b></span>
                  <textarea
                    value={form.address}
                    onChange={(e) => update("address", e.target.value)}
                    placeholder="خیابان، کوچه، پلاک، طبقه و واحد..."
                    rows={4}
                    required
                  />
                </label>

                <label className="field full">
                  <span>کد پستی <b>*</b></span>
                  <input
                    value={form.postalCode}
                    onChange={(e) =>
                      update(
                        "postalCode",
                        digits(e.target.value).replace(/\D/g, "").slice(0, 10)
                      )
                    }
                    placeholder="کد پستی ۱۰ رقمی"
                    inputMode="numeric"
                    maxLength={10}
                    required
                  />
                </label>
              </div>

              <div className="subheading">
                <h3>روش تحویل سفارش</h3>
                <span>DELIVERY PREFERENCE</span>
              </div>

              <div className="choice-grid">
                <label className={`choice ${form.delivery === "standard" ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="delivery"
                    checked={form.delivery === "standard"}
                    onChange={() => update("delivery", "standard")}
                  />
                  <span className="choice-icon">◇</span>
                  <strong>ارسال معمولی</strong>
                  <small>هزینه و زمان پس از اتصال سرویس ارسال مشخص می‌شود.</small>
                </label>

                <label className={`choice ${form.delivery === "express" ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="delivery"
                    checked={form.delivery === "express"}
                    onChange={() => update("delivery", "express")}
                  />
                  <span className="choice-icon">✧</span>
                  <strong>ارسال سریع</strong>
                  <small>در صورت ارائه این خدمت در شهر مقصد.</small>
                </label>
              </div>

              <div className="subheading">
                <h3>نوع فاکتور</h3>
                <span>INVOICE DETAILS</span>
              </div>

              <div className="choice-grid">
                <label className={`choice compact ${form.invoice === "personal" ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="invoice"
                    checked={form.invoice === "personal"}
                    onChange={() => update("invoice", "personal")}
                  />
                  <strong>خرید شخصی</strong>
                  <small>فاکتور به نام خریدار</small>
                </label>

                <label className={`choice compact ${form.invoice === "business" ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="invoice"
                    checked={form.invoice === "business"}
                    onChange={() => update("invoice", "business")}
                  />
                  <strong>خرید شرکتی یا تجاری</strong>
                  <small>اطلاعات مجموعه خریدار</small>
                </label>
              </div>

              {form.invoice === "business" && (
                <div className="fields business-fields">
                  <label className="field full">
                    <span>نام شرکت یا مجموعه <b>*</b></span>
                    <input
                      value={form.businessName}
                      onChange={(e) => update("businessName", e.target.value)}
                      placeholder="نام مجموعه"
                    />
                  </label>

                  <label className="field full">
                    <span>شناسه ملی یا کد اقتصادی</span>
                    <input
                      value={form.nationalId}
                      onChange={(e) => update("nationalId", e.target.value)}
                      placeholder="در صورت نیاز"
                    />
                  </label>
                </div>
              )}

              <label className="field description-field">
                <span>توضیحات تکمیلی سفارش</span>
                <textarea
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder="توضیحات لازم برای تحویل سفارش (اختیاری)"
                  rows={3}
                />
              </label>

              <div className="button-row">
                <button type="button" className="secondary-button" onClick={previousStep}>
                  مرحله قبل
                </button>
                <button type="button" className="primary-button" onClick={nextStep}>
                  ادامه: بررسی سفارش
                  <span>←</span>
                </button>
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <span className="panel-kicker">STEP 03 / REVIEW</span>
                  <h2>بررسی نهایی اطلاعات</h2>
                  <p>
                    پیش از ثبت سفارش، اطلاعات خریدار و مقصد را بررسی کنید.
                  </p>
                </div>
                <span className="panel-symbol">✓</span>
              </div>

              <div className="review-section">
                <div className="review-title">
                  <h3>اطلاعات خریدار</h3>
                  <button type="button" onClick={() => setStep(1)}>ویرایش</button>
                </div>
                <div className="review-row">
                  <span>نام خریدار</span>
                  <strong>{form.fullName}</strong>
                </div>
                <div className="review-row">
                  <span>شماره تماس</span>
                  <strong>{form.phone}</strong>
                </div>
              </div>

              <div className="review-section">
                <div className="review-title">
                  <h3>اطلاعات تحویل</h3>
                  <button type="button" onClick={() => setStep(2)}>ویرایش</button>
                </div>
                <div className="review-row">
                  <span>استان و شهر</span>
                  <strong>{form.province}، {form.city}</strong>
                </div>
                <div className="review-row">
                  <span>کد پستی</span>
                  <strong>{form.postalCode}</strong>
                </div>
                <div className="review-address">
                  {form.address}
                </div>
                <div className="review-row">
                  <span>روش تحویل</span>
                  <strong>
                    {form.delivery === "standard" ? "ارسال معمولی" : "ارسال سریع"}
                  </strong>
                </div>
                <div className="review-row">
                  <span>نوع فاکتور</span>
                  <strong>
                    {form.invoice === "personal" ? "شخصی" : "شرکتی یا تجاری"}
                  </strong>
                </div>
                {form.invoice === "business" && (
                  <div className="review-row">
                    <span>نام مجموعه</span>
                    <strong>{form.businessName}</strong>
                  </div>
                )}
              </div>

              {form.description && (
                <div className="review-section">
                  <h3>توضیحات سفارش</h3>
                  <p className="review-address">{form.description}</p>
                </div>
              )}

              <div className="final-notice">
                <span>!</span>
                <p>
                  در حال حاضر API ثبت سفارش و درگاه پرداخت در بک‌اند این پروژه
                  وجود ندارد. این مرحله اطلاعات را بررسی می‌کند، اما سفارش
                  قطعی یا پرداخت ایجاد نمی‌کند.
                </p>
              </div>

              <div className="button-row">
                <button type="button" className="secondary-button" onClick={previousStep}>
                  بازگشت و ویرایش
                </button>
                <button type="submit" className="primary-button">
                  بررسی و ادامه فرایند ثبت سفارش
                  <span>←</span>
                </button>
              </div>
            </section>
          )}

          {message && (
            <div className={`message ${messageType}`} role="status">
              <span>{messageType === "error" ? "!" : "◇"}</span>
              <p>{message}</p>
            </div>
          )}
        </form>

        <aside className="summary">
          <div className="summary-header">
            <div>
              <span className="panel-kicker">YOUR ORDER</span>
              <h2>خلاصه خرید</h2>
            </div>
            <span className="item-count">
              {new Intl.NumberFormat("fa-IR").format(cart.length)} محصول
            </span>
          </div>

          <div className="products">
            {cart.map((item) => (
              <div className="product" key={item.id}>
                <div className="product-image">
                  {item.image ? (
                    <img src={item.image} alt={item.name} />
                  ) : (
                    <span>✧</span>
                  )}
                </div>
                <div className="product-detail">
                  <strong>{item.name}</strong>
                  <small>
                    تعداد: {new Intl.NumberFormat("fa-IR").format(item.quantity)}
                  </small>
                  <b>{money(item.price * item.quantity)}</b>
                </div>
              </div>
            ))}
          </div>

          <div className="summary-line">
            <span>تعداد کل کالاها</span>
            <strong>{new Intl.NumberFormat("fa-IR").format(totalQuantity)}</strong>
          </div>

          <div className="summary-line">
            <span>جمع قیمت محصولات</span>
            <strong>{money(subtotal)}</strong>
          </div>

          <div className="summary-line">
            <span>هزینه ارسال</span>
            <strong>در انتظار محاسبه</strong>
          </div>

          <div className="summary-line">
            <span>تخفیف</span>
            <strong>هنوز اعمال نشده</strong>
          </div>

          <div className="grand-total">
            <span>جمع اولیه محصولات</span>
            <strong>{money(subtotal)}</strong>
            <small>مبلغ نهایی پس از محاسبه ارسال و تخفیف مشخص می‌شود.</small>
          </div>

          <div className="summary-security">
            <span>♧</span>
            <p>
              خرید مهمان فعال است. برای تکمیل خرید نیازی به ساخت حساب کاربری نیست.
            </p>
          </div>

          <Link href="/cart" className="edit-cart">
            ویرایش سبد خرید
            <span>←</span>
          </Link>

          <div className="brand-signature">
            <strong>JALALI COSMETICS</strong>
            <small>BEAUTY. BUSINESS. TRUST.</small>
          </div>
        </aside>
      </div>

      <footer className="footer">
        <strong>JALALI COSMETICS</strong>
        <span>زیبایی، اعتماد و تجربه‌ای متفاوت</span>
        <span>© تمامی حقوق محفوظ است.</span>
      </footer>

      <style jsx>{`
        .checkout {
          min-height: 100vh;
          padding: 0 5%;
          color: #f5f1ee;
          background:
            radial-gradient(ellipse at 90% 10%, #3a241f55, transparent 32%),
            #0b0b0d;
        }

        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          min-height: 84px;
          border-bottom: 1px solid #ffffff13;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 13px;
          color: #d1a18c;
          text-decoration: none;
        }

        .brand-mark {
          display: grid;
          place-items: center;
          width: 42px;
          height: 42px;
          border: 1px solid #c99a86;
          font-family: Georgia, serif;
          font-size: 27px;
          transform: rotate(45deg);
        }

        .brand-text {
          display: flex;
          flex-direction: column;
          gap: 4px;
          letter-spacing: 2px;
        }

        .brand-text strong { font-size: 14px; }
        .brand-text small { font-size: 9px; }

        .header-center {
          display: flex;
          align-items: center;
          gap: 9px;
          color: #b7a9a3;
          font-size: 11px;
        }

        .secure-icon { color: #d1a18c; font-size: 19px; }

        .back-link {
          color: #d2a28e;
          text-decoration: none;
          font-size: 11px;
        }

        .hero {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 48px 0 35px;
        }

        .eyebrow,
        .panel-kicker {
          color: #c99a86;
          font-size: 9px;
          letter-spacing: 2.4px;
        }

        .hero h1 {
          margin: 13px 0;
          font-size: clamp(30px, 4.5vw, 48px);
          font-weight: 900;
        }

        .hero h1 span { color: #d2a18d; }

        .hero p {
          max-width: 570px;
          color: #a99e99;
          font-size: 12px;
          line-height: 2.4;
        }

        .hero-seal {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 112px;
          height: 112px;
          flex-shrink: 0;
          border: 1px solid #79594b;
          border-radius: 50%;
          background: radial-gradient(circle, #3b2822, #151214);
          color: #d5a590;
        }

        .hero-seal span {
          font-family: Georgia, serif;
          font-size: 54px;
        }

        .hero-seal small {
          font-size: 8px;
          letter-spacing: 3px;
        }

        .steps {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin: 8px 0 28px;
          padding: 17px;
          border: 1px solid #ffffff13;
          border-radius: 12px;
          background: #151416;
        }

        .step {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px;
          opacity: .5;
        }

        .step.active,
        .step.completed { opacity: 1; }

        .step-number {
          display: grid;
          place-items: center;
          width: 37px;
          height: 37px;
          flex-shrink: 0;
          border: 1px solid #59423a;
          border-radius: 50%;
          color: #c99a86;
          font-size: 12px;
        }

        .step.active .step-number {
          border-color: #d2a18d;
          background: #3a2721;
          box-shadow: 0 0 22px #c99a8620;
        }

        .step.completed .step-number {
          background: #c99a86;
          color: #171113;
        }

        .step-text {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .step-text strong { font-size: 11px; }
        .step-text small { color: #9c918c; font-size: 9px; }

        .main-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.4fr) minmax(290px, .8fr);
          align-items: start;
          gap: 23px;
          padding-bottom: 55px;
        }

        .form-column {
          display: flex;
          flex-direction: column;
          gap: 17px;
          min-width: 0;
        }

        .panel,
        .summary {
          border: 1px solid #39302e;
          border-radius: 13px;
          background: linear-gradient(145deg, #191719, #111113);
          box-shadow: 0 20px 55px #0004;
        }

        .panel { padding: clamp(20px, 3vw, 32px); }

        .panel-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 15px;
          padding-bottom: 23px;
          border-bottom: 1px solid #ffffff13;
          margin-bottom: 25px;
        }

        .panel-heading h2 {
          margin: 10px 0;
          font-size: 20px;
        }

        .panel-heading p {
          margin: 0;
          color: #a79b96;
          font-size: 11px;
          line-height: 2;
        }

        .panel-symbol {
          display: grid;
          place-items: center;
          width: 45px;
          height: 45px;
          flex-shrink: 0;
          border: 1px solid #63483d;
          border-radius: 11px;
          color: #d1a18d;
          background: #2b1f1c;
          font-size: 22px;
        }

        .fields {
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

        .field.full { grid-column: 1 / -1; }

        .field > span {
          color: #ded0ca;
          font-size: 11px;
        }

        .field b { color: #d39a83; }

        .field input,
        .field textarea {
          box-sizing: border-box;
          width: 100%;
          padding: 14px;
          border: 1px solid #423638;
          border-radius: 7px;
          outline: none;
          background: #0d0c0e;
          color: #f5f1ee;
          font: inherit;
          font-size: 12px;
          transition: border-color .2s, box-shadow .2s;
        }

        .field input:focus,
        .field textarea:focus {
          border-color: #c99a86;
          box-shadow: 0 0 0 3px #c99a8613;
        }

        .field input::placeholder,
        .field textarea::placeholder { color: #746a68; }

        .field textarea {
          resize: vertical;
          line-height: 2;
        }

        .field > small {
          color: #8f8581;
          font-size: 9px;
          line-height: 2;
        }

        .info-card,
        .final-notice {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-top: 22px;
          padding: 15px;
          border: 1px solid #554039;
          border-radius: 8px;
          background: #261d1b;
        }

        .info-card span {
          color: #d1a18d;
          font-size: 20px;
        }

        .info-card p,
        .final-notice p {
          margin: 0;
          color: #c2b2aa;
          font-size: 10px;
          line-height: 2.2;
        }

        .primary-button,
        .secondary-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 18px;
          min-height: 49px;
          padding: 0 19px;
          border-radius: 7px;
          font: inherit;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
          transition: .2s;
        }

        .primary-button {
          border: 1px solid #c99a86;
          background: linear-gradient(100deg, #d6aa96, #bd8977);
          color: #1a1110;
        }

        .primary-button:hover {
          background: transparent;
          color: #d6aa96;
        }

        .primary-button span { font-size: 18px; }

        .panel > .primary-button { width: 100%; margin-top: 23px; }

        .subheading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin: 28px 0 14px;
          padding-top: 19px;
          border-top: 1px solid #ffffff12;
        }

        .subheading h3 {
          margin: 0;
          font-size: 13px;
        }

        .subheading > span {
          color: #a17f70;
          font-size: 8px;
          letter-spacing: 1.5px;
        }

        .choice-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .choice {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 9px;
          min-height: 125px;
          padding: 16px;
          border: 1px solid #443637;
          border-radius: 9px;
          background: #111012;
          cursor: pointer;
          transition: .2s;
        }

        .choice.selected {
          border-color: #c99a86;
          background: #2b201d;
        }

        .choice input {
          position: absolute;
          top: 14px;
          left: 14px;
          accent-color: #c99a86;
        }

        .choice-icon {
          color: #d1a18d;
          font-size: 23px;
        }

        .choice strong { font-size: 11px; }

        .choice small {
          color: #9e928d;
          font-size: 9px;
          line-height: 1.9;
        }

        .choice.compact { min-height: 90px; }

        .business-fields { margin-top: 18px; }

        .description-field { margin-top: 20px; }

        .button-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-top: 25px;
        }

        .button-row .primary-button { flex: 1; }

        .secondary-button {
          border: 1px solid #59463e;
          background: transparent;
          color: #d4ad9c;
        }

        .secondary-button:hover { border-color: #c99a86; }

        .review-section {
          padding: 18px 0;
          border-bottom: 1px solid #ffffff12;
        }

        .review-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 13px;
        }

        .review-title h3,
        .review-section > h3 {
          margin: 0;
          font-size: 12px;
        }

        .review-title button {
          border: 0;
          background: transparent;
          color: #d0a18c;
          font: inherit;
          font-size: 10px;
          cursor: pointer;
        }

        .review-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 10px 0;
          font-size: 10px;
        }

        .review-row span { color: #a89b96; }

        .review-row strong {
          color: #eadbd4;
          text-align: left;
        }

        .review-address {
          margin: 9px 0;
          padding: 13px;
          border-radius: 7px;
          background: #0e0d0f;
          color: #c9b8b0;
          font-size: 10px;
          line-height: 2.2;
        }

        .final-notice {
          border-color: #725444;
          background: #30231d;
        }

        .final-notice > span {
          display: grid;
          place-items: center;
          width: 22px;
          height: 22px;
          flex-shrink: 0;
          border: 1px solid #c99a86;
          border-radius: 50%;
          color: #d4a28b;
        }

        .message {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 15px;
          border-radius: 8px;
          font-size: 11px;
        }

        .message p {
          margin: 0;
          line-height: 2.2;
        }

        .message.error {
          border: 1px solid #824b48;
          background: #2a191a;
          color: #edb4ad;
        }

        .message.info {
          border: 1px solid #725444;
          background: #2a211d;
          color: #e0c1ae;
        }

        .summary {
          position: sticky;
          top: 18px;
          padding: 23px;
        }

        .summary-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding-bottom: 19px;
          border-bottom: 1px solid #ffffff14;
        }

        .summary-header h2 {
          margin: 8px 0 0;
          font-size: 18px;
        }

        .item-count {
          padding: 8px 11px;
          border: 1px solid #644a3f;
          border-radius: 20px;
          color: #d4aa97;
          background: #2a1e1b;
          font-size: 9px;
        }

        .products {
          max-height: 340px;
          overflow-y: auto;
        }

        .product {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 15px 0;
          border-bottom: 1px solid #ffffff10;
        }

        .product-image {
          display: grid;
          place-items: center;
          width: 62px;
          height: 67px;
          flex-shrink: 0;
          overflow: hidden;
          border: 1px solid #584139;
          border-radius: 7px;
          background: #211a1a;
          color: #d1a18d;
          font-size: 24px;
        }

        .product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .product-detail {
          display: flex;
          flex-direction: column;
          gap: 7px;
          min-width: 0;
        }

        .product-detail strong {
          font-size: 10px;
          line-height: 1.8;
        }

        .product-detail small {
          color: #a19691;
          font-size: 9px;
        }

        .product-detail b {
          color: #d4a18c;
          font-size: 10px;
        }

        .summary-line {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          padding: 13px 0;
          color: #aaa09a;
          font-size: 10px;
        }

        .summary-line strong {
          color: #e5d4cc;
          text-align: left;
          font-size: 10px;
        }

        .grand-total {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 8px;
          padding: 19px 0;
          border-top: 1px solid #5b4238;
        }

        .grand-total span {
          color: #c9b9b1;
          font-size: 11px;
        }

        .grand-total strong {
          color: #e0b49f;
          font-size: 21px;
        }

        .grand-total small {
          color: #938782;
          font-size: 9px;
          line-height: 2;
        }

        .summary-security {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 13px;
          border-radius: 8px;
          background: #251d1c;
        }

        .summary-security span {
          color: #d1a18c;
          font-size: 18px;
        }

        .summary-security p {
          margin: 0;
          color: #b7a8a1;
          font-size: 9px;
          line-height: 2;
        }

        .edit-cart {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 15px;
          padding: 13px;
          border: 1px solid #63483d;
          border-radius: 7px;
          color: #d4aa96;
          text-decoration: none;
          font-size: 10px;
        }

        .brand-signature {
          display: flex;
          flex-direction: column;
          gap: 5px;
          align-items: center;
          margin-top: 22px;
          padding-top: 17px;
          border-top: 1px solid #ffffff12;
          color: #c99a86;
        }

        .brand-signature strong {
          font-size: 10px;
          letter-spacing: 2px;
        }

        .brand-signature small {
          color: #95837b;
          font-size: 8px;
          letter-spacing: 1px;
        }

        .footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          min-height: 75px;
          border-top: 1px solid #ffffff13;
          color: #8f8581;
          font-size: 9px;
        }

        .footer strong {
          color: #c99a86;
          letter-spacing: 2px;
        }

        @media (max-width: 850px) {
          .main-layout { grid-template-columns: 1fr; }
          .summary { position: static; grid-row: 1; }
        }

        @media (max-width: 600px) {
          .checkout { padding: 0 4%; }
          .header { min-height: 72px; }
          .header-center { display: none; }
          .brand-mark { width: 34px; height: 34px; }
          .brand-text strong { font-size: 11px; }
          .brand-text small { font-size: 7px; }
          .back-link { font-size: 9px; }
          .hero { padding: 35px 0 25px; }
          .hero-seal { width: 78px; height: 78px; }
          .hero-seal span { font-size: 38px; }
          .steps { padding: 9px; gap: 4px; }
          .step { flex-direction: column; text-align: center; gap: 6px; }
          .step-text strong { font-size: 9px; }
          .step-text small { font-size: 8px; }
          .step-number { width: 29px; height: 29px; }
          .panel, .summary { padding: 17px; }
          .fields { grid-template-columns: 1fr; }
          .field.full { grid-column: auto; }
          .choice-grid { grid-template-columns: 1fr; }
          .choice { min-height: 105px; }
          .button-row { flex-direction: column-reverse; }
          .button-row button { width: 100%; }
          .footer { flex-direction: column; justify-content: center; padding: 22px 0; }
        }
      `}</style>
    </main>
  );
}
