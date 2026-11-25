
"use client";

import { useState } from "react";

type AccountMode = "login" | "register";

export default function AccountPage() {
  const [mode, setMode] = useState<AccountMode>("login");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function submitAccount(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!/^09\d{9}$/.test(phone)) {
      setMessage("شماره موبایل معتبر وارد کنید.");
      return;
    }

    if (mode === "register" && fullName.trim().length < 3) {
      setMessage("نام و نام خانوادگی را کامل وارد کنید.");
      return;
    }

    setLoading(true);
    setMessage("");

    // TODO: Connect to the real authentication API.
    // Login: POST /api/store/auth/login/
    // Register: POST /api/store/auth/register/
    // OTP verification must be handled by the backend.

    window.setTimeout(() => {
      setLoading(false);
      setMessage(
        "زیرساخت ورود و ثبت‌نام آماده اتصال است؛ برای ارسال کد تأیید باید API احراز هویت سرور فعال شود."
      );
    }, 500);
  }

  return (
    <main className="account-page" dir="rtl">
      <section className="account-shell">
        <div className="account-brand">
          <div className="brand-mark">J</div>
          <span>JALALI COSMETICS</span>
          <small>BEAUTY. BUSINESS. TRUST.</small>
        </div>

        <div className="account-heading">
          <span className="eyebrow">CUSTOMER ACCOUNT</span>
          <h1>حساب کاربری شما</h1>
          <p>
            برای مدیریت سفارش‌ها، پیگیری خریدها و دسترسی به خدمات مشتریان
            وارد حساب خود شوید.
          </p>
        </div>

        <div className="account-card">
          <div className="account-tabs">
            <button
              type="button"
              className={mode === "login" ? "active" : ""}
              onClick={() => {
                setMode("login");
                setMessage("");
              }}
            >
              ورود به حساب
            </button>

            <button
              type="button"
              className={mode === "register" ? "active" : ""}
              onClick={() => {
                setMode("register");
                setMessage("");
              }}
            >
              ایجاد حساب
            </button>
          </div>

          <form onSubmit={submitAccount}>
            {mode === "register" && (
              <label>
                نام و نام خانوادگی
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="نام کامل شما"
                  autoComplete="name"
                />
              </label>
            )}

            <label>
              شماره موبایل
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))
                }
                placeholder="09xxxxxxxxx"
                autoComplete="tel"
                maxLength={11}
              />
            </label>

            <div className="security-note">
              <span className="security-icon">◇</span>
              <div>
                <strong>ورود امن با شماره موبایل</strong>
                <p>
                  کد تأیید باید پس از اتصال سرویس پیامکی و API سرور ارسال شود.
                </p>
              </div>
            </div>

            <button className="submit-button" type="submit" disabled={loading}>
              {loading
                ? "در حال بررسی..."
                : mode === "login"
                ? "ادامه و ورود"
                : "ایجاد حساب کاربری"}
              <span>←</span>
            </button>

            {message && (
              <div className="form-message" role="status">
                {message}
              </div>
            )}
          </form>

          <div className="account-privacy">
            اطلاعات حساب شما باید به‌صورت امن در سرور نگهداری شود.
            هیچ رمز یا کد تأییدی در این صفحه ذخیره نمی‌شود.
          </div>
        </div>

        <div className="account-benefits">
          <div>
            <span>01</span>
            <strong>مدیریت سفارش‌ها</strong>
            <p>مشاهده و پیگیری سفارش‌های ثبت‌شده</p>
          </div>
          <div>
            <span>02</span>
            <strong>اطلاعات مشتری</strong>
            <p>مدیریت مشخصات و نشانی‌های ارسال</p>
          </div>
          <div>
            <span>03</span>
            <strong>خدمات همکاران</strong>
            <p>دسترسی به امکانات ویژه پس از تأیید همکاری</p>
          </div>
        </div>

        <footer>
          <span>JALALI COSMETICS</span>
          <span>© تمامی حقوق محفوظ است.</span>
        </footer>
      </section>

      <style jsx>{`
        .account-page {
          min-height: 100vh;
          padding: 55px 18px;
          background:
            radial-gradient(ellipse at 50% 0%, #30221f 0%, transparent 48%),
            #0b0b0d;
          color: #f5f1ee;
          font-family: inherit;
        }

        .account-shell {
          width: 100%;
          max-width: 760px;
          margin: auto;
        }

        .account-brand {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 9px;
          margin-bottom: 48px;
          color: #c99a86;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 3px;
        }

        .brand-mark {
          width: 57px;
          height: 57px;
          display: grid;
          place-items: center;
          border: 1px solid #c99a86;
          transform: rotate(45deg);
          font-family: Georgia, serif;
          font-size: 35px;
          font-weight: 400;
        }

        .brand-mark::first-letter {
          transform: rotate(-45deg);
        }

        .account-brand small {
          color: #8e817c;
          font-size: 9px;
          letter-spacing: 2px;
        }

        .account-heading {
          text-align: center;
          margin-bottom: 28px;
        }

        .eyebrow {
          color: #c99a86;
          font-size: 10px;
          letter-spacing: 3px;
        }

        .account-heading h1 {
          font-size: clamp(25px, 5vw, 36px);
          margin: 13px 0;
          font-weight: 800;
        }

        .account-heading p {
          max-width: 480px;
          margin: auto;
          color: #a9a1a0;
          line-height: 2;
          font-size: 13px;
        }

        .account-card {
          background: #151518;
          border: 1px solid #302a29;
          border-radius: 19px;
          padding: 25px;
          box-shadow: 0 20px 65px #0007;
        }

        .account-tabs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: #0d0d10;
          border-radius: 12px;
          padding: 5px;
          margin-bottom: 28px;
        }

        .account-tabs button {
          border: 0;
          border-radius: 9px;
          padding: 13px 8px;
          background: transparent;
          color: #999;
          cursor: pointer;
          font-family: inherit;
          font-size: 13px;
        }

        .account-tabs button.active {
          background: #c99a86;
          color: #171110;
          font-weight: 800;
        }

        form label {
          display: block;
          margin-bottom: 20px;
          font-size: 12px;
          color: #e4d8d3;
        }

        form input {
          display: block;
          width: 100%;
          box-sizing: border-box;
          margin-top: 10px;
          padding: 15px;
          border: 1px solid #383337;
          border-radius: 10px;
          outline: none;
          background: #0e0e11;
          color: white;
          font-family: inherit;
          font-size: 14px;
          transition: border-color .2s;
        }

        form input:focus {
          border-color: #c99a86;
        }

        form input::placeholder {
          color: #71696a;
        }

        .security-note {
          display: flex;
          align-items: center;
          gap: 13px;
          background: #211b1a;
          border: 1px solid #49352e;
          border-radius: 11px;
          padding: 14px;
          margin: 24px 0;
        }

        .security-icon {
          color: #c99a86;
          font-size: 27px;
        }

        .security-note strong {
          font-size: 12px;
          color: #e4c5b7;
        }

        .security-note p {
          margin: 6px 0 0;
          font-size: 11px;
          line-height: 1.9;
          color: #a89b96;
        }

        .submit-button {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 16px 19px;
          border: none;
          border-radius: 10px;
          background: #c99a86;
          color: #171110;
          font-family: inherit;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          transition: .2s;
        }

        .submit-button:hover {
          background: #e0b3a0;
          transform: translateY(-1px);
        }

        .submit-button:disabled {
          opacity: .6;
          cursor: wait;
          transform: none;
        }

        .form-message {
          margin-top: 16px;
          padding: 13px;
          border: 1px solid #745747;
          border-radius: 9px;
          background: #241c19;
          color: #e7c2ae;
          font-size: 12px;
          line-height: 2;
        }

        .account-privacy {
          margin-top: 23px;
          padding-top: 17px;
          border-top: 1px solid #302a29;
          color: #827b7b;
          text-align: center;
          font-size: 10px;
          line-height: 2;
        }

        .account-benefits {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-top: 24px;
        }

        .account-benefits > div {
          padding: 17px 13px;
          border: 1px solid #292528;
          border-radius: 12px;
          background: #121215;
        }

        .account-benefits span {
          display: block;
          margin-bottom: 12px;
          color: #c99a86;
          font-size: 11px;
          letter-spacing: 2px;
        }

        .account-benefits strong {
          font-size: 12px;
        }

        .account-benefits p {
          color: #8e8888;
          font-size: 10px;
          line-height: 1.9;
          margin-bottom: 0;
        }

        footer {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-top: 42px;
          padding-top: 20px;
          border-top: 1px solid #282427;
          color: #777071;
          font-size: 10px;
        }

        @media (max-width: 560px) {
          .account-page {
            padding: 35px 13px;
          }

          .account-card {
            padding: 18px;
          }

          .account-benefits {
            grid-template-columns: 1fr;
          }

          .account-benefits > div {
            display: grid;
            grid-template-columns: 38px 1fr;
            column-gap: 10px;
          }

          .account-benefits span {
            grid-row: span 2;
          }
        }
      `}</style>
    </main>
  );
}
