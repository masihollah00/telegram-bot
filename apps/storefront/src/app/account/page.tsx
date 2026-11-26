
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: Record<string, string | number | boolean>
          ) => void;
        };
      };
    };
  }
}

type AccountStatus = "idle" | "loading" | "success" | "error";

const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

const GOOGLE_AUTH_ENDPOINT =
  process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENDPOINT || "";

export default function AccountPage() {
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<AccountStatus>("idle");
  const [message, setMessage] = useState("");
  const [googleReady, setGoogleReady] = useState(false);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_AUTH_ENDPOINT) return;

    let mounted = true;

    const renderGoogleButton = () => {
      if (!mounted || !window.google || !googleButtonRef.current) return;

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        cancel_on_tap_outside: true,
        callback: async (response) => {
          if (!response.credential) {
            setStatus("error");
            setMessage("تأیید حساب گوگل انجام نشد. دوباره تلاش کنید.");
            return;
          }

          setStatus("loading");
          setMessage("در حال تأیید امن حساب گوگل شما...");

          try {
            const result = await fetch(GOOGLE_AUTH_ENDPOINT, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
              body: JSON.stringify({
                credential: response.credential,
              }),
            });

            const data = await result.json().catch(() => ({}));

            if (!result.ok) {
              throw new Error(
                data?.detail ||
                data?.message ||
                "ورود به حساب انجام نشد."
              );
            }

            setStatus("success");
            setMessage(
              "حساب گوگل شما تأیید شد. وضعیت ورود از سرور دریافت شد."
            );

            window.location.reload();
          } catch (error) {
            setStatus("error");
            setMessage(
              error instanceof Error
                ? error.message
                : "ارتباط با سرور برقرار نشد."
            );
          }
        },
      });

      googleButtonRef.current.innerHTML = "";

      window.google.accounts.id.renderButton(
        googleButtonRef.current,
        {
          theme: "filled_black",
          size: "large",
          shape: "rectangular",
          text: "continue_with",
          locale: "fa",
          width: Math.min(
            360,
            googleButtonRef.current.clientWidth || 360
          ),
        }
      );

      setGoogleReady(true);
    };

    if (window.google) {
      renderGoogleButton();
    } else {
      const existing = document.querySelector(
        'script[data-google-identity="true"]'
      );

      if (existing) {
        existing.addEventListener("load", renderGoogleButton);
      } else {
        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.dataset.googleIdentity = "true";
        script.onload = renderGoogleButton;
        script.onerror = () => {
          if (mounted) {
            setStatus("error");
            setMessage("بارگذاری سرویس ورود گوگل ناموفق بود.");
          }
        };
        document.head.appendChild(script);
      }
    }

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="account-page" dir="rtl">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="topbar">
        <Link href="/" className="brand">
          <span className="brand-symbol">J</span>
          <span className="brand-name">
            <strong>JALALI</strong>
            <small>COSMETICS</small>
          </span>
        </Link>

        <nav className="top-links">
          <Link href="/">صفحه اصلی</Link>
          <Link href="/products">فروشگاه</Link>
          <Link href="/categories">دسته‌بندی محصولات</Link>
        </nav>

        <Link href="/cart" className="cart-link">
          <span>سبد خرید</span>
          <span className="cart-icon">♧</span>
        </Link>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="hero-label">
            <span className="live-dot" />
            تجربه اختصاصی مشتریان جلالی
          </div>

          <h1>
            دنیای زیبایی
            <br />
            <span>از اینجا آغاز می‌شود.</span>
          </h1>

          <p>
            به فضای اختصاصی مشتریان جلالی خوش آمدید.
            خرید کنید، سفارش‌هایتان را دنبال کنید و در صورت تمایل
            با حساب گوگل خود وارد شوید.
          </p>

          <div className="hero-actions">
            <Link href="/products" className="primary-action">
              مشاهده محصولات
              <span>←</span>
            </Link>

            <Link href="/cart" className="secondary-action">
              مشاهده سبد خرید
            </Link>
          </div>

          <div className="hero-trust">
            <span>✦</span>
            خرید بدون نیاز به ساخت حساب کاربری
          </div>
        </div>

        <div className="hero-art">
          <div className="art-orbit orbit-one" />
          <div className="art-orbit orbit-two" />

          <div className="art-center">
            <div className="art-monogram">J</div>
            <span>JALALI</span>
            <small>BEAUTY · BUSINESS · TRUST</small>
          </div>

          <div className="floating-card floating-top">
            <span className="floating-icon">✧</span>
            <div>
              <strong>انتخاب هوشمندانه</strong>
              <small>تجربه خرید اختصاصی</small>
            </div>
          </div>

          <div className="floating-card floating-bottom">
            <span className="floating-icon">◇</span>
            <div>
              <strong>خرید مطمئن</strong>
              <small>همراه شما در تمام مراحل</small>
            </div>
          </div>
        </div>
      </section>

      <section className="account-layout">
        <div className="login-panel">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">PERSONAL SPACE</span>
              <h2>ورود به حساب مشتریان</h2>
              <p>
                برای دسترسی به سفارش‌ها و امکانات حساب،
                از حساب گوگل خود استفاده کنید.
              </p>
            </div>

            <div className="heading-icon">♙</div>
          </div>

          <div className="google-area">
            <div className="google-heading">
              <span className="google-mark">G</span>
              <div>
                <strong>ورود با حساب گوگل</strong>
                <small>ورود امن با حساب Google شما</small>
              </div>
            </div>

            {GOOGLE_CLIENT_ID && GOOGLE_AUTH_ENDPOINT ? (
              <div className="google-button-wrap">
                <div
                  ref={googleButtonRef}
                  className="google-button"
                />
                {!googleReady && (
                  <div className="google-loading">
                    در حال آماده‌سازی ورود گوگل...
                  </div>
                )}
              </div>
            ) : (
              <div className="google-setup">
                <span className="setup-icon">◇</span>
                <div>
                  <strong>اتصال ورود گوگل در انتظار تنظیمات سرور</strong>
                  <p>
                    برای فعال شدن ورود واقعی، شناسه کلاینت گوگل و
                    نشانی API تأیید توکن باید در تنظیمات پروژه قرار بگیرند.
                  </p>
                </div>
              </div>
            )}

            {status === "loading" && (
              <div className="status-message loading-message">
                <span className="spinner" />
                {message}
              </div>
            )}

            {status === "success" && (
              <div className="status-message success-message">
                {message}
              </div>
            )}

            {status === "error" && (
              <div className="status-message error-message">
                {message}
              </div>
            )}
          </div>

          <div className="divider-text">
            <span />
            <small>یا بدون ورود ادامه دهید</small>
            <span />
          </div>

          <Link href="/products" className="guest-action">
            <span className="guest-icon">↗</span>
            <span>
              <strong>ادامه خرید به‌صورت مهمان</strong>
              <small>
                بدون ثبت‌نام، مستقیم وارد فروشگاه شوید.
              </small>
            </span>
            <b>←</b>
          </Link>

          <div className="privacy-note">
            <span>♧</span>
            <p>
              ما رمز عبور حساب گوگل شما را دریافت یا ذخیره نمی‌کنیم.
              تأیید هویت باید توسط گوگل و سرور امن فروشگاه انجام شود.
            </p>
          </div>
        </div>

        <aside className="side-panel">
          <div className="side-top">
            <span className="section-kicker">CUSTOMER BENEFITS</span>
            <h3>امکانات فضای مشتریان</h3>
            <p>
              تجربه‌ای فراتر از یک خرید معمولی؛
              خدماتی برای مدیریت بهتر خریدهای شما.
            </p>
          </div>

          <div className="benefit-list">
            <div className="benefit-item">
              <span className="benefit-number">۰۱</span>
              <span className="benefit-icon">▤</span>
              <div>
                <strong>مدیریت سفارش‌ها</strong>
                <small>
                  مشاهده جزئیات و وضعیت سفارش‌های ثبت‌شده
                </small>
              </div>
            </div>

            <div className="benefit-item">
              <span className="benefit-number">۰۲</span>
              <span className="benefit-icon">⌖</span>
              <div>
                <strong>پیگیری خرید</strong>
                <small>
                  اطلاع از مراحل آماده‌سازی و ارسال سفارش
                </small>
              </div>
            </div>

            <div className="benefit-item">
              <span className="benefit-number">۰۳</span>
              <span className="benefit-icon">♡</span>
              <div>
                <strong>علاقه‌مندی‌ها</strong>
                <small>
                  نگهداری محصولات منتخب برای خریدهای بعدی
                </small>
              </div>
            </div>

            <div className="benefit-item">
              <span className="benefit-number">۰۴</span>
              <span className="benefit-icon">✧</span>
              <div>
                <strong>خدمات ویژه همکاران</strong>
                <small>
                  درخواست همکاری و دسترسی به شرایط عمده‌فروشی
                </small>
              </div>
            </div>
          </div>

          <div className="wholesale-box">
            <div className="wholesale-decoration">J</div>
            <span>BUSINESS PARTNERSHIP</span>
            <h3>همکاری تجاری با جلالی</h3>
            <p>
              برای دریافت شرایط همکاری، قیمت‌های ویژه و خدمات
              فروش عمده، درخواست همکاری خود را ثبت کنید.
            </p>
            <Link href="/wholesale">
              آشنایی با همکاری عمده
              <span>←</span>
            </Link>
          </div>
        </aside>
      </section>

      <section className="service-strip">
        <div>
          <span>✧</span>
          <strong>تنوع محصولات آرایشی و بهداشتی</strong>
          <small>انتخاب از میان محصولات متنوع</small>
        </div>
        <div>
          <span>◇</span>
          <strong>تجربه خرید آسان</strong>
          <small>بدون اجبار به ثبت‌نام</small>
        </div>
        <div>
          <span>⌖</span>
          <strong>خدمات مشتریان</strong>
          <small>همراهی در مسیر خرید</small>
        </div>
      </section>

      <footer className="footer">
        <Link href="/" className="footer-brand">
          JALALI COSMETICS
        </Link>
        <span>زیبایی، اعتماد و تجربه‌ای متفاوت</span>
        <span>© تمامی حقوق محفوظ است.</span>
      </footer>

      <style jsx>{`
        .account-page {
          position: relative;
          isolation: isolate;
          overflow: hidden;
          min-height: 100vh;
          padding: 0 5.5%;
          background:
            radial-gradient(ellipse at 85% 15%, #38231e 0, transparent 33%),
            radial-gradient(ellipse at 8% 65%, #21191a 0, transparent 32%),
            #0b0b0d;
          color: #f5f1ee;
          font-family: inherit;
        }

        .ambient {
          position: absolute;
          z-index: -1;
          width: 340px;
          height: 340px;
          border-radius: 50%;
          filter: blur(110px);
          opacity: .13;
          pointer-events: none;
        }

        .ambient-one {
          top: 280px;
          right: -180px;
          background: #c99a86;
        }

        .ambient-two {
          top: 850px;
          left: -200px;
          background: #986c61;
        }

        .topbar {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 88px;
          border-bottom: 1px solid #ffffff12;
          gap: 20px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 13px;
          color: #c99a86;
          text-decoration: none;
        }

        .brand-symbol {
          width: 43px;
          height: 43px;
          display: grid;
          place-items: center;
          border: 1px solid #c99a86;
          transform: rotate(45deg);
          font-family: Georgia, serif;
          font-size: 27px;
        }

        .brand-name {
          display: flex;
          flex-direction: column;
          gap: 3px;
          letter-spacing: 2px;
        }

        .brand-name strong {
          font-size: 15px;
        }

        .brand-name small {
          font-size: 9px;
          letter-spacing: 3px;
        }

        .top-links {
          display: flex;
          align-items: center;
          gap: 32px;
        }

        .top-links a,
        .cart-link {
          color: #c7bdb9;
          text-decoration: none;
          font-size: 12px;
          transition: color .2s;
        }

        .top-links a:hover,
        .cart-link:hover {
          color: #d7aa96;
        }

        .cart-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 17px;
          border: 1px solid #49342f;
          border-radius: 8px;
        }

        .cart-icon {
          color: #d2a18d;
          font-size: 20px;
        }

        .hero {
          display: grid;
          grid-template-columns: 1.1fr .9fr;
          align-items: center;
          gap: 35px;
          min-height: 445px;
          padding: 45px 0 55px;
        }

        .hero-copy {
          max-width: 590px;
        }

        .hero-label {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 10px 15px;
          border: 1px solid #5c4038;
          border-radius: 30px;
          color: #d8b3a4;
          background: #291d1a88;
          font-size: 11px;
        }

        .live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #c99a86;
          box-shadow: 0 0 12px #c99a86;
        }

        .hero h1 {
          margin: 25px 0 17px;
          font-size: clamp(35px, 5vw, 61px);
          line-height: 1.55;
          font-weight: 900;
          letter-spacing: -2px;
        }

        .hero h1 span {
          color: #d1a18d;
        }

        .hero-copy > p {
          max-width: 510px;
          color: #aaa09d;
          font-size: 14px;
          line-height: 2.5;
        }

        .hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 29px;
        }

        .primary-action,
        .secondary-action {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 24px;
          padding: 15px 20px;
          border-radius: 8px;
          text-decoration: none;
          font-size: 12px;
          font-weight: 800;
          transition: .2s;
        }

        .primary-action {
          color: #171110;
          background: #c99a86;
        }

        .primary-action:hover {
          background: #e2b9a7;
          transform: translateY(-2px);
        }

        .secondary-action {
          border: 1px solid #493a36;
          color: #e3d5cf;
          background: #171416;
        }

        .secondary-action:hover {
          border-color: #c99a86;
        }

        .hero-trust {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 25px;
          color: #a99b96;
          font-size: 11px;
        }

        .hero-trust span {
          color: #c99a86;
          font-size: 18px;
        }

        .hero-art {
          position: relative;
          display: grid;
          place-items: center;
          min-height: 355px;
        }

        .art-orbit {
          position: absolute;
          border: 1px solid #c99a8635;
          border-radius: 50%;
          transform: rotate(-25deg);
        }

        .orbit-one {
          width: 280px;
          height: 280px;
        }

        .orbit-two {
          width: 350px;
          height: 210px;
          border-color: #c99a8620;
          transform: rotate(35deg);
        }

        .art-center {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 215px;
          height: 215px;
          border: 1px solid #c99a8666;
          border-radius: 50%;
          background:
            radial-gradient(circle, #3a2824 0%, #1c1717 60%, #101012 100%);
          box-shadow:
            0 0 80px #c99a8619,
            inset 0 0 40px #c99a8615;
        }

        .art-monogram {
          color: #d6aa97;
          font-family: Georgia, serif;
          font-size: 100px;
          line-height: 1;
        }

        .art-center > span {
          color: #e1c0b1;
          font-size: 12px;
          letter-spacing: 5px;
        }

        .art-center small {
          margin-top: 9px;
          color: #9e8981;
          font-size: 7px;
          letter-spacing: 2px;
        }

        .floating-card {
          position: absolute;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 13px 15px;
          border: 1px solid #55413a;
          border-radius: 10px;
          background: #191618eF;
          box-shadow: 0 12px 35px #0006;
        }

        .floating-top {
          top: 38px;
          right: 0;
        }

        .floating-bottom {
          bottom: 35px;
          left: 0;
        }

        .floating-icon {
          color: #d3a18c;
          font-size: 25px;
        }

        .floating-card div {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .floating-card strong {
          font-size: 10px;
        }

        .floating-card small {
          color: #9c9290;
          font-size: 9px;
        }

        .account-layout {
          display: grid;
          grid-template-columns: 1.05fr .95fr;
          gap: 23px;
          align-items: stretch;
          margin: 20px 0 55px;
        }

        .login-panel,
        .side-panel {
          border: 1px solid #3b302e;
          border-radius: 16px;
          background: linear-gradient(145deg, #191719, #111113);
          box-shadow: 0 22px 65px #0004;
        }

        .login-panel {
          padding: clamp(22px, 4vw, 39px);
        }

        .panel-heading {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          align-items: flex-start;
          padding-bottom: 25px;
          border-bottom: 1px solid #ffffff12;
        }

        .section-kicker {
          color: #c99a86;
          font-size: 9px;
          letter-spacing: 2.5px;
        }

        .panel-heading h2 {
          margin: 10px 0;
          font-size: 22px;
          font-weight: 850;
        }

        .panel-heading p,
        .side-top p {
          color: #a89e9a;
          font-size: 12px;
          line-height: 2.2;
        }

        .heading-icon {
          display: grid;
          place-items: center;
          flex: 0 0 47px;
          height: 47px;
          border: 1px solid #6a4a40;
          border-radius: 12px;
          color: #d0a08c;
          background: #2a1e1b;
          font-size: 25px;
        }

        .google-area {
          padding: 25px 0 19px;
        }

        .google-heading {
          display: flex;
          align-items: center;
          gap: 13px;
          margin-bottom: 20px;
        }

        .google-mark {
          display: grid;
          place-items: center;
          width: 42px;
          height: 42px;
          border-radius: 10px;
          background: #f5f1ee;
          color: #4285f4;
          font-family: Arial, sans-serif;
          font-size: 25px;
          font-weight: 900;
        }

        .google-heading div {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .google-heading strong {
          font-size: 13px;
        }

        .google-heading small {
          color: #9b9290;
          font-size: 10px;
        }

        .google-button-wrap {
          position: relative;
          min-height: 44px;
        }

        .google-button {
          display: flex;
          justify-content: center;
          width: 100%;
          min-height: 44px;
        }

        .google-loading {
          padding: 12px;
          color: #b9a49a;
          text-align: center;
          font-size: 11px;
        }

        .google-setup {
          display: flex;
          gap: 13px;
          align-items: flex-start;
          padding: 17px;
          border: 1px solid #554039;
          border-radius: 10px;
          background: #241b19;
        }

        .setup-icon {
          color: #d5a28d;
          font-size: 24px;
        }

        .google-setup strong {
          display: block;
          color: #e5c6b8;
          font-size: 12px;
          line-height: 2;
        }

        .google-setup p {
          margin: 5px 0 0;
          color: #a99a94;
          font-size: 10px;
          line-height: 2;
        }

        .status-message {
          margin-top: 15px;
          padding: 12px 14px;
          border-radius: 8px;
          font-size: 11px;
          line-height: 2;
        }

        .loading-message {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #25201e;
          color: #e0c2b4;
        }

        .success-message {
          border: 1px solid #3b7351;
          background: #14251b;
          color: #a6dbb8;
        }

        .error-message {
          border: 1px solid #75403e;
          background: #2a1818;
          color: #e5aaa5;
        }

        .spinner {
          width: 14px;
          height: 14px;
          border: 2px solid #82695e;
          border-top-color: #e2b8a6;
          border-radius: 50%;
          animation: spin .8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .divider-text {
          display: flex;
          align-items: center;
          gap: 13px;
          margin: 5px 0 21px;
        }

        .divider-text span {
          height: 1px;
          flex: 1;
          background: #ffffff16;
        }

        .divider-text small {
          color: #9c9290;
          font-size: 10px;
        }

        .guest-action {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 17px;
          border: 1px solid #5a433b;
          border-radius: 10px;
          background: linear-gradient(100deg, #30211d, #20191a);
          color: #f3e5de;
          text-decoration: none;
          transition: .2s;
        }

        .guest-action:hover {
          border-color: #c99a86;
          transform: translateY(-2px);
        }

        .guest-icon {
          display: grid;
          place-items: center;
          width: 38px;
          height: 38px;
          border-radius: 9px;
          background: #c99a86;
          color: #211613;
          font-size: 22px;
        }

        .guest-action > span:nth-child(2) {
          display: flex;
          flex: 1;
          flex-direction: column;
          gap: 6px;
        }

        .guest-action strong {
          font-size: 12px;
        }

        .guest-action small {
          color: #b5a6a0;
          font-size: 10px;
        }

        .guest-action b {
          color: #d4a38e;
          font-size: 19px;
        }

        .privacy-note {
          display: flex;
          align-items: flex-start;
          gap: 11px;
          margin-top: 22px;
          padding-top: 18px;
          border-top: 1px solid #ffffff12;
        }

        .privacy-note span {
          color: #c99a86;
          font-size: 19px;
        }

        .privacy-note p {
          margin: 0;
          color: #918987;
          font-size: 10px;
          line-height: 2.2;
        }

        .side-panel {
          padding: clamp(22px, 4vw, 34px);
        }

        .side-top h3 {
          margin: 11px 0;
          font-size: 21px;
        }

        .benefit-list {
          margin-top: 23px;
        }

        .benefit-item {
          display: grid;
          grid-template-columns: 30px 43px 1fr;
          align-items: center;
          gap: 12px;
          padding: 15px 0;
          border-bottom: 1px solid #ffffff10;
        }

        .benefit-number {
          color: #b28a79;
          font-size: 10px;
          letter-spacing: 1px;
        }

        .benefit-icon {
          display: grid;
          place-items: center;
          width: 42px;
          height: 42px;
          border: 1px solid #594239;
          border-radius: 11px;
          background: #261c1a;
          color: #d0a18c;
          font-size: 20px;
        }

        .benefit-item div {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .benefit-item strong {
          font-size: 12px;
        }

        .benefit-item small {
          color: #9c9290;
          font-size: 10px;
          line-height: 1.8;
        }

        .wholesale-box {
          position: relative;
          overflow: hidden;
          margin-top: 25px;
          padding: 22px;
          border: 1px solid #745344;
          border-radius: 12px;
          background:
            radial-gradient(circle at 100% 0%, #744d3c66, transparent 55%),
            #211918;
        }

        .wholesale-decoration {
          position: absolute;
          left: 12px;
          top: -33px;
          color: #c99a86;
          opacity: .09;
          font-family: Georgia, serif;
          font-size: 150px;
        }

        .wholesale-box > span {
          color: #c99a86;
          font-size: 9px;
          letter-spacing: 2px;
        }

        .wholesale-box h3 {
          position: relative;
          margin: 12px 0;
          font-size: 17px;
        }

        .wholesale-box p {
          position: relative;
          color: #b0a09a;
          font-size: 11px;
          line-height: 2.2;
        }

        .wholesale-box a {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 20px;
          margin-top: 9px;
          color: #e0b29e;
          text-decoration: none;
          font-size: 11px;
          font-weight: 800;
        }

        .service-strip {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin-bottom: 55px;
          padding: 25px;
          border: 1px solid #352b29;
          border-radius: 13px;
          background: #151315;
        }

        .service-strip > div {
          display: grid;
          grid-template-columns: 38px 1fr;
          align-items: center;
          column-gap: 12px;
        }

        .service-strip > div > span {
          grid-row: span 2;
          display: grid;
          place-items: center;
          width: 37px;
          height: 37px;
          border-radius: 10px;
          background: #30211e;
          color: #d1a08b;
          font-size: 20px;
        }

        .service-strip strong {
          font-size: 11px;
        }

        .service-strip small {
          margin-top: 6px;
          color: #958b89;
          font-size: 9px;
        }

        .footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          min-height: 75px;
          border-top: 1px solid #ffffff14;
          color: #8f8583;
          font-size: 10px;
        }

        .footer-brand {
          color: #c99a86;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 2px;
          text-decoration: none;
        }

        @media (max-width: 850px) {
          .account-page {
            padding: 0 4%;
          }

          .hero {
            grid-template-columns: 1fr .8fr;
          }

          .account-layout {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 620px) {
          .topbar {
            min-height: 72px;
          }

          .top-links {
            display: none;
          }

          .brand-symbol {
            width: 36px;
            height: 36px;
            font-size: 23px;
          }

          .brand-name strong {
            font-size: 12px;
          }

          .cart-link {
            padding: 10px 12px;
            font-size: 10px;
          }

          .hero {
            grid-template-columns: 1fr;
            padding: 45px 0 30px;
            gap: 5px;
          }

          .hero h1 {
            font-size: 39px;
          }

          .hero-copy > p {
            font-size: 12px;
          }

          .hero-art {
            min-height: 290px;
          }

          .art-center {
            width: 175px;
            height: 175px;
          }

          .art-monogram {
            font-size: 77px;
          }

          .orbit-one {
            width: 235px;
            height: 235px;
          }

          .orbit-two {
            width: 290px;
            height: 180px;
          }

          .floating-top {
            top: 20px;
          }

          .floating-bottom {
            bottom: 15px;
          }

          .floating-card {
            padding: 10px;
          }

          .floating-card strong {
            font-size: 9px;
          }

          .floating-card small {
            font-size: 8px;
          }

          .account-layout {
            margin-top: 10px;
          }

          .service-strip {
            grid-template-columns: 1fr;
            gap: 22px;
          }

          .footer {
            flex-direction: column;
            justify-content: center;
            padding: 22px 0;
            text-align: center;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: .01ms !important;
            transition-duration: .01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>
    </main>
  );
}
