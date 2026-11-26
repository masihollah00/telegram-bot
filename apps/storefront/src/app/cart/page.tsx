
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type CartItem = {
  id: number;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  image?: string;
};

const number = (value: number) =>
  new Intl.NumberFormat("fa-IR").format(value);

const money = (value: number) => number(value) + " تومان";

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const [coupon, setCoupon] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("jalali_cart");
      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          setItems(
            parsed.filter(
              (item) =>
                Number.isInteger(item.id) &&
                typeof item.name === "string" &&
                Number.isFinite(item.price) &&
                item.price >= 0 &&
                Number.isInteger(item.quantity) &&
                item.quantity > 0
            )
          );
        }
      }
    } catch {
      setMessage("اطلاعات سبد خرید قابل خواندن نیست.");
    }
    setLoaded(true);
  }, []);

  function save(updated: CartItem[]) {
    setItems(updated);
    try {
      localStorage.setItem("jalali_cart", JSON.stringify(updated));
    } catch {
      setMessage("ذخیره سبد خرید در این دستگاه امکان‌پذیر نیست.");
    }
  }

  function changeQuantity(id: number, amount: number) {
    save(
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: Math.max(1, Math.min(99, item.quantity + amount)),
            }
          : item
      )
    );
    setMessage("");
  }

  function removeItem(id: number) {
    save(items.filter((item) => item.id !== id));
    setMessage("محصول از سبد خرید حذف شد.");
  }

  function clearCart() {
    save([]);
    setCoupon("");
    setMessage("تمام محصولات از سبد خرید حذف شدند.");
  }

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const totalQuantity = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  if (!loaded) {
    return (
      <main className="loading" dir="rtl">
        <div className="loader" />
        <p>در حال آماده‌سازی سبد خرید شما...</p>
        <style jsx>{`
          .loading {
            min-height: 75vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            background: #0b0b0d;
            color: #d2a38f;
          }
          .loader {
            width: 38px;
            height: 38px;
            border: 2px solid #49332d;
            border-top-color: #c99a86;
            border-radius: 50%;
            animation: spin .8s linear infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </main>
    );
  }

  return (
    <main className="cart-page" dir="rtl">
      <div className="background-glow" />

      <header className="topbar">
        <Link href="/" className="brand">
          <span className="brand-mark">J</span>
          <span>
            <strong>JALALI</strong>
            <small>COSMETICS</small>
          </span>
        </Link>

        <nav>
          <Link href="/">صفحه اصلی</Link>
          <Link href="/products">فروشگاه</Link>
          <Link href="/categories">دسته‌بندی‌ها</Link>
        </nav>

        <Link href="/products" className="back-store">
          بازگشت به فروشگاه ←
        </Link>
      </header>

      <section className="hero">
        <div>
          <span className="eyebrow">YOUR SHOPPING EXPERIENCE</span>
          <h1>
            سبد خرید
            <span> شما</span>
          </h1>
          <p>
            انتخاب‌های شما در یک نگاه؛ محصولات را بررسی کنید،
            تعداد را تغییر دهید و برای ثبت سفارش ادامه دهید.
          </p>
        </div>

        <div className="hero-stat">
          <span className="stat-icon">♧</span>
          <strong>{number(totalQuantity)}</strong>
          <small>تعداد اقلام انتخاب‌شده</small>
        </div>
      </section>

      <div className="breadcrumb">
        <Link href="/">صفحه اصلی</Link>
        <span>←</span>
        <span>سبد خرید</span>
      </div>

      <section className="cart-layout">
        <div className="cart-content">
          <div className="section-heading">
            <div>
              <span className="eyebrow">SELECTED PRODUCTS</span>
              <h2>محصولات انتخاب‌شده</h2>
            </div>
            <span className="count-pill">
              {number(items.length)} محصول
            </span>
          </div>

          {items.length > 0 ? (
            <>
              <div className="product-list">
                {items.map((item) => (
                  <article className="product-card" key={item.id}>
                    <div className="product-image">
                      {item.image ? (
                        <img src={item.image} alt={item.name} />
                      ) : (
                        <span>✧</span>
                      )}
                    </div>

                    <div className="product-details">
                      <Link
                        href={`/products/${item.id}`}
                        className="product-name"
                      >
                        {item.name}
                      </Link>

                      <span className="sku">
                        شناسه محصول: {item.sku || number(item.id)}
                      </span>

                      <span className="unit-price">
                        قیمت هر عدد: {money(item.price)}
                      </span>

                      <button
                        className="remove"
                        onClick={() => removeItem(item.id)}
                        type="button"
                      >
                        حذف از سبد خرید
                      </button>
                    </div>

                    <div className="product-total">
                      <strong>
                        {money(item.price * item.quantity)}
                      </strong>

                      <div className="quantity">
                        <button
                          type="button"
                          onClick={() => changeQuantity(item.id, 1)}
                          aria-label="افزایش تعداد"
                        >
                          +
                        </button>

                        <span>{number(item.quantity)}</span>

                        <button
                          type="button"
                          disabled={item.quantity <= 1}
                          onClick={() => changeQuantity(item.id, -1)}
                          aria-label="کاهش تعداد"
                        >
                          −
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="list-actions">
                <Link href="/products">← ادامه خرید محصولات</Link>
                <button type="button" onClick={clearCart}>
                  خالی کردن سبد
                </button>
              </div>
            </>
          ) : (
            <div className="empty">
              <span className="empty-symbol">◇</span>
              <h3>هنوز محصولی انتخاب نکرده‌اید</h3>
              <p>
                فروشگاه جلالی را ببینید و محصولات مورد علاقه‌تان
                را به سبد خرید اضافه کنید.
              </p>
              <Link href="/products">ورود به فروشگاه</Link>
            </div>
          )}

          {message && <div className="message">{message}</div>}
        </div>

        <aside className="summary">
          <span className="eyebrow">ORDER DETAILS</span>
          <h2>جزئیات سفارش</h2>

          <div className="summary-stat">
            <span>تعداد کل اقلام</span>
            <strong>{number(totalQuantity)}</strong>
          </div>

          <div className="summary-stat">
            <span>تعداد محصولات متفاوت</span>
            <strong>{number(items.length)}</strong>
          </div>

          <div className="summary-stat">
            <span>جمع قیمت محصولات</span>
            <strong>{money(subtotal)}</strong>
          </div>

          <div className="summary-stat">
            <span>هزینه ارسال</span>
            <strong>در مرحله بعد محاسبه می‌شود</strong>
          </div>

          <div className="coupon">
            <label htmlFor="coupon">کد تخفیف</label>
            <div>
              <input
                id="coupon"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                placeholder="کد تخفیف را وارد کنید"
                maxLength={40}
              />
              <button
                type="button"
                onClick={() =>
                  setMessage(
                    "اعتبارسنجی کد تخفیف پس از اتصال سرویس تخفیف سرور فعال می‌شود."
                  )
                }
              >
                بررسی
              </button>
            </div>
          </div>

          <div className="total">
            <span>مجموع اولیه سفارش</span>
            <strong>{money(subtotal)}</strong>
          </div>

          <p className="summary-note">
            مبلغ نهایی پس از تعیین نشانی، روش ارسال و تخفیف‌های
            معتبر در مرحله تسویه‌حساب مشخص خواهد شد.
          </p>

          <Link
            href={items.length ? "/checkout" : "/products"}
            className={`checkout ${!items.length ? "disabled" : ""}`}
            aria-disabled={!items.length}
            onClick={(event) => {
              if (!items.length) event.preventDefault();
            }}
          >
            ادامه و ثبت سفارش
            <span>←</span>
          </Link>

          <div className="guest-note">
            <span>✦</span>
            برای خرید نیازی به ثبت‌نام یا ورود ندارید.
          </div>

          <div className="summary-footer">
            <span>JALALI COSMETICS</span>
            <small>تجربه خرید متفاوت</small>
          </div>
        </aside>
      </section>

      <section className="trust-section">
        <div>
          <span>◇</span>
          <strong>خرید آسان</strong>
          <small>فرایند خرید روان و سریع</small>
        </div>
        <div>
          <span>✧</span>
          <strong>تنوع انتخاب</strong>
          <small>محصولات متنوع آرایشی و بهداشتی</small>
        </div>
        <div>
          <span>♧</span>
          <strong>همراهی مشتریان</strong>
          <small>پشتیبانی در مسیر خرید</small>
        </div>
      </section>

      <footer>
        <strong>JALALI COSMETICS</strong>
        <span>زیبایی، اعتماد و تجربه‌ای متفاوت</span>
        <span>© تمامی حقوق محفوظ است.</span>
      </footer>

      <style jsx>{`
        .cart-page {
          position: relative;
          overflow: hidden;
          min-height: 100vh;
          padding: 0 5%;
          background: #0b0b0d;
          color: #f5f1ee;
        }

        .background-glow {
          position: absolute;
          z-index: 0;
          pointer-events: none;
          top: 120px;
          right: -200px;
          width: 480px;
          height: 480px;
          border-radius: 50%;
          background: #a36b5720;
          filter: blur(100px);
        }

        .topbar,
        .hero,
        .breadcrumb,
        .cart-layout,
        .trust-section,
        footer {
          position: relative;
          z-index: 1;
        }

        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 82px;
          border-bottom: 1px solid #ffffff14;
          gap: 20px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #d1a18d;
          text-decoration: none;
        }

        .brand-mark {
          display: grid;
          place-items: center;
          width: 40px;
          height: 40px;
          border: 1px solid #c99a86;
          transform: rotate(45deg);
          font-family: Georgia, serif;
          font-size: 25px;
        }

        .brand > span:last-child {
          display: flex;
          flex-direction: column;
          gap: 4px;
          letter-spacing: 2px;
        }

        .brand strong { font-size: 14px; }
        .brand small { font-size: 9px; }

        nav {
          display: flex;
          gap: 28px;
        }

        nav a,
        .back-store {
          color: #b9aeaa;
          font-size: 11px;
          text-decoration: none;
        }

        nav a:hover,
        .back-store:hover {
          color: #d6aa96;
        }

        .back-store {
          border: 1px solid #594238;
          border-radius: 7px;
          padding: 11px 15px;
        }

        .hero {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          padding: 60px 0 40px;
        }

        .eyebrow {
          color: #c99a86;
          font-size: 9px;
          letter-spacing: 2px;
        }

        .hero h1 {
          margin: 15px 0;
          font-size: clamp(33px, 5vw, 52px);
          font-weight: 900;
        }

        .hero h1 span { color: #d0a18d; }

        .hero p {
          max-width: 570px;
          color: #aaa09b;
          font-size: 12px;
          line-height: 2.4;
        }

        .hero-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 155px;
          height: 155px;
          flex-shrink: 0;
          border: 1px solid #775348;
          border-radius: 50%;
          background: radial-gradient(circle, #392520, #171315);
          box-shadow: 0 0 55px #c99a8617;
        }

        .stat-icon {
          color: #d0a18c;
          font-size: 25px;
        }

        .hero-stat strong {
          margin: 5px 0;
          font-size: 28px;
          color: #e2bdac;
        }

        .hero-stat small {
          color: #b4a39b;
          font-size: 9px;
        }

        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 10px 0 24px;
          color: #8e8581;
          font-size: 10px;
        }

        .breadcrumb a {
          color: #c99a86;
          text-decoration: none;
        }

        .cart-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 355px;
          gap: 22px;
          align-items: start;
          margin-bottom: 50px;
        }

        .cart-content,
        .summary {
          border: 1px solid #ffffff15;
          border-radius: 13px;
          background: linear-gradient(145deg, #191719, #111113);
          box-shadow: 0 18px 55px #0004;
        }

        .cart-content { padding: 25px; }

        .section-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 20px;
          border-bottom: 1px solid #ffffff15;
        }

        .section-heading h2,
        .summary h2 {
          margin: 10px 0 0;
          font-size: 18px;
        }

        .count-pill {
          padding: 9px 13px;
          border: 1px solid #63483e;
          border-radius: 20px;
          color: #d6ad9a;
          background: #38241f;
          font-size: 10px;
        }

        .product-card {
          display: grid;
          grid-template-columns: 100px minmax(0, 1fr) auto;
          gap: 18px;
          align-items: center;
          padding: 22px 0;
          border-bottom: 1px solid #ffffff12;
        }

        .product-image {
          display: grid;
          place-items: center;
          overflow: hidden;
          width: 100px;
          height: 110px;
          border: 1px solid #61463b;
          border-radius: 9px;
          background:
            radial-gradient(circle, #9e68512b, transparent 70%),
            #211b1c;
          color: #d2a18d;
          font-size: 42px;
        }

        .product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .product-details {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
          min-width: 0;
        }

        .product-name {
          color: #f2e9e4;
          font-size: 13px;
          font-weight: 800;
          line-height: 1.9;
          text-decoration: none;
        }

        .sku {
          color: #918581;
          font-size: 9px;
        }

        .unit-price {
          color: #d4ae9e;
          font-size: 11px;
        }

        .remove {
          padding: 0;
          border: 0;
          background: transparent;
          color: #d38f8b;
          font: inherit;
          font-size: 10px;
          cursor: pointer;
        }

        .product-total {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 16px;
        }

        .product-total > strong {
          color: #e2c0b1;
          font-size: 12px;
          white-space: nowrap;
        }

        .quantity {
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 6px 10px;
          border: 1px solid #534039;
          border-radius: 8px;
          background: #0c0c0e;
        }

        .quantity button {
          border: 0;
          background: none;
          color: #d0a08c;
          font-size: 20px;
          cursor: pointer;
        }

        .quantity button:disabled {
          opacity: .35;
          cursor: not-allowed;
        }

        .quantity span {
          min-width: 17px;
          text-align: center;
          font-size: 11px;
        }

        .list-actions {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          margin-top: 22px;
        }

        .list-actions a,
        .list-actions button {
          padding: 11px 15px;
          border: 1px solid #5d443a;
          border-radius: 7px;
          background: transparent;
          color: #d0a08c;
          font: inherit;
          font-size: 10px;
          text-decoration: none;
          cursor: pointer;
        }

        .empty {
          display: flex;
          align-items: center;
          flex-direction: column;
          justify-content: center;
          min-height: 350px;
          text-align: center;
        }

        .empty-symbol {
          color: #c99a86;
          font-size: 65px;
        }

        .empty h3 { font-size: 18px; }

        .empty p {
          max-width: 420px;
          color: #a99e99;
          font-size: 11px;
          line-height: 2.3;
        }

        .empty a {
          margin-top: 15px;
          padding: 13px 23px;
          border-radius: 7px;
          background: #c99a86;
          color: #171112;
          font-size: 11px;
          text-decoration: none;
        }

        .summary {
          position: sticky;
          top: 20px;
          padding: 25px;
        }

        .summary h2 { margin-bottom: 25px; }

        .summary-stat {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin: 19px 0;
          font-size: 10px;
        }

        .summary-stat span { color: #aaa09b; }

        .summary-stat strong {
          color: #e0bdae;
          text-align: left;
          font-size: 10px;
        }

        .coupon {
          padding: 19px 0;
          border-top: 1px solid #ffffff16;
          border-bottom: 1px solid #ffffff16;
        }

        .coupon label {
          display: block;
          margin-bottom: 11px;
          color: #cdb9ae;
          font-size: 11px;
        }

        .coupon div {
          display: flex;
          gap: 7px;
        }

        .coupon input {
          width: 100%;
          min-width: 0;
          padding: 12px;
          border: 1px solid #493b37;
          border-radius: 6px;
          outline: none;
          background: #0c0c0e;
          color: white;
          font: inherit;
          font-size: 10px;
        }

        .coupon input:focus { border-color: #c99a86; }

        .coupon button {
          padding: 0 13px;
          border: 1px solid #785749;
          border-radius: 6px;
          background: #34221e;
          color: #e1b8a6;
          font: inherit;
          font-size: 10px;
          cursor: pointer;
          white-space: nowrap;
        }

        .total {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin: 23px 0;
        }

        .total span {
          color: #aaa09b;
          font-size: 11px;
        }

        .total strong {
          color: #e4bca8;
          font-size: 20px;
        }

        .summary-note {
          color: #948985;
          font-size: 10px;
          line-height: 2.2;
        }

        .checkout {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 20px;
          padding: 16px;
          border-radius: 7px;
          background: linear-gradient(100deg, #d9ad99, #bd8977);
          color: #1b1110;
          text-decoration: none;
          font-size: 12px;
          font-weight: 900;
          transition: .2s;
        }

        .checkout:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px #c99a8630;
        }

        .checkout.disabled {
          opacity: .4;
          cursor: not-allowed;
        }

        .checkout span { font-size: 20px; }

        .guest-note {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-top: 18px;
          color: #bca69c;
          font-size: 10px;
        }

        .guest-note span {
          color: #c99a86;
          font-size: 18px;
        }

        .summary-footer {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          margin-top: 24px;
          padding-top: 18px;
          border-top: 1px solid #ffffff13;
          color: #a18b82;
          font-size: 9px;
        }

        .summary-footer small { color: #817875; }

        .message {
          margin-top: 18px;
          padding: 13px;
          border: 1px solid #604b40;
          border-radius: 8px;
          background: #2a1f1b;
          color: #e0b8a4;
          font-size: 11px;
          line-height: 2;
        }

        .trust-section {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin-bottom: 45px;
          padding: 23px;
          border: 1px solid #ffffff14;
          border-radius: 12px;
          background: #151315;
        }

        .trust-section > div {
          display: grid;
          grid-template-columns: 43px 1fr;
          align-items: center;
          gap: 5px 12px;
        }

        .trust-section > div > span {
          display: grid;
          grid-row: span 2;
          place-items: center;
          width: 42px;
          height: 42px;
          border-radius: 10px;
          background: #34241f;
          color: #d0a08b;
          font-size: 21px;
        }

        .trust-section strong { font-size: 10px; }
        .trust-section small { color: #958a85; font-size: 9px; }

        footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          min-height: 75px;
          border-top: 1px solid #ffffff14;
          color: #8e817b;
          font-size: 9px;
        }

        footer strong {
          color: #c99a86;
          letter-spacing: 2px;
        }

        @media (max-width: 900px) {
          .cart-layout { grid-template-columns: 1fr; }
          .summary { position: static; }
        }

        @media (max-width: 620px) {
          .cart-page { padding: 0 4%; }
          .topbar { min-height: 72px; }
          nav { display: none; }
          .brand-mark { width: 34px; height: 34px; }
          .brand strong { font-size: 11px; }
          .back-store { font-size: 9px; padding: 9px; }
          .hero { padding: 40px 0 28px; }
          .hero-stat { width: 105px; height: 105px; }
          .hero-stat strong { font-size: 22px; }
          .hero-stat small { font-size: 8px; }
          .cart-content, .summary { padding: 16px; }
          .product-card {
            grid-template-columns: 68px minmax(0, 1fr);
            gap: 12px;
          }
          .product-image { width: 68px; height: 82px; }
          .product-total {
            grid-column: 2;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
          .product-total > strong { font-size: 10px; }
          .list-actions { flex-direction: column; }
          .list-actions > * { text-align: center; }
          .trust-section { grid-template-columns: 1fr; }
          footer {
            flex-direction: column;
            justify-content: center;
            padding: 22px 0;
          }
        }
      `}</style>
    </main>
  );
}
