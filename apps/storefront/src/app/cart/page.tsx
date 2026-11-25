
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type CartItem = {
  id: number;
  name: string;
  sku: string;
  price: number;
  quantity: number;
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("fa-IR").format(price) + " تومان";
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");

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

  function saveCart(updated: CartItem[]) {
    setItems(updated);
    localStorage.setItem("jalali_cart", JSON.stringify(updated));
    setMessage("");
  }

  function changeQuantity(id: number, amount: number) {
    const updated = items.map((item) =>
      item.id === id
        ? { ...item, quantity: Math.max(1, item.quantity + amount) }
        : item
    );

    saveCart(updated);
  }

  function removeItem(id: number) {
    saveCart(items.filter((item) => item.id !== id));
    setMessage("محصول از سبد خرید حذف شد.");
  }

  function clearCart() {
    saveCart([]);
    setMessage("سبد خرید خالی شد.");
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
        در حال بارگذاری سبد خرید...
        <style jsx>{`
          .loading {
            min-height: 70vh;
            display: grid;
            place-items: center;
            background: #0b0b0d;
            color: #c99a86;
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="cart-page" dir="rtl">
      <header className="cart-hero">
        <span>JALALI COSMETICS</span>
        <h1>سبد خرید شما</h1>
        <p>مدیریت سفارش‌ها و بررسی اقلام انتخاب‌شده</p>
      </header>

      <nav className="breadcrumb">
        <Link href="/">صفحه اصلی</Link>
        <span>/</span>
        <span>سبد خرید</span>
      </nav>

      <section className="cart-container">
        <div className="cart-main">
          <div className="section-heading">
            <div>
              <span className="eyebrow">YOUR SELECTION</span>
              <h2>محصولات انتخاب‌شده</h2>
            </div>

            <span className="item-count">
              {new Intl.NumberFormat("fa-IR").format(totalQuantity)} عدد
            </span>
          </div>

          {items.length > 0 ? (
            <>
              <div className="cart-list">
                {items.map((item) => (
                  <article className="cart-item" key={item.id}>
                    <div className="item-symbol">✧</div>

                    <div className="item-information">
                      <Link
                        href={`/products/${item.id}`}
                        className="item-name"
                      >
                        {item.name}
                      </Link>

                      <span className="item-sku">
                        کد کالا: {item.sku}
                      </span>

                      <strong className="unit-price">
                        {formatPrice(item.price)}
                      </strong>
                    </div>

                    <div className="item-actions">
                      <div className="quantity-control">
                        <button
                          type="button"
                          aria-label="افزایش تعداد"
                          onClick={() => changeQuantity(item.id, 1)}
                        >
                          +
                        </button>

                        <strong>
                          {new Intl.NumberFormat("fa-IR").format(
                            item.quantity
                          )}
                        </strong>

                        <button
                          type="button"
                          aria-label="کاهش تعداد"
                          disabled={item.quantity <= 1}
                          onClick={() => changeQuantity(item.id, -1)}
                        >
                          −
                        </button>
                      </div>

                      <strong className="line-total">
                        {formatPrice(item.price * item.quantity)}
                      </strong>

                      <button
                        type="button"
                        className="remove-button"
                        onClick={() => removeItem(item.id)}
                      >
                        حذف محصول
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              <div className="cart-footer">
                <Link href="/products" className="continue-shopping">
                  ← ادامه خرید
                </Link>

                <button
                  type="button"
                  className="clear-button"
                  onClick={clearCart}
                >
                  خالی کردن سبد
                </button>
              </div>
            </>
          ) : (
            <div className="empty-cart">
              <span className="empty-icon">◇</span>
              <h3>سبد خرید شما خالی است</h3>
              <p>
                هنوز محصولی انتخاب نکرده‌اید. محصولات فروشگاه را
                مشاهده کنید و اقلام موردنظر را به سبد خرید اضافه کنید.
              </p>
              <Link href="/products">مشاهده محصولات</Link>
            </div>
          )}

          {message && (
            <div className="message" role="status">
              {message}
            </div>
          )}
        </div>

        <aside className="summary">
          <span className="eyebrow">ORDER SUMMARY</span>
          <h2>خلاصه سفارش</h2>

          <div className="summary-row">
            <span>تعداد کل اقلام</span>
            <strong>
              {new Intl.NumberFormat("fa-IR").format(totalQuantity)}
            </strong>
          </div>

          <div className="summary-row">
            <span>تعداد محصولات</span>
            <strong>
              {new Intl.NumberFormat("fa-IR").format(items.length)}
            </strong>
          </div>

          <div className="summary-row">
            <span>جمع محصولات</span>
            <strong>{formatPrice(subtotal)}</strong>
          </div>

          <div className="summary-row">
            <span>هزینه ارسال</span>
            <strong>پس از تعیین مقصد</strong>
          </div>

          <div className="summary-divider" />

          <div className="total-row">
            <span>مجموع اولیه</span>
            <strong>{formatPrice(subtotal)}</strong>
          </div>

          <p className="summary-note">
            هزینه ارسال، تخفیف‌های همکاری و شرایط سفارش عمده
            در مرحله نهایی سفارش محاسبه می‌شوند.
          </p>

          <Link
            href={items.length > 0 ? "/checkout" : "/products"}
            className={`checkout-button ${items.length === 0 ? "disabled" : ""}`}
            aria-disabled={items.length === 0}
            onClick={(event) => {
              if (items.length === 0) event.preventDefault();
            }}
          >
            ادامه و ثبت سفارش
            <span>←</span>
          </Link>

          <div className="secure-note">
            <span>✦</span>
            خرید و سفارش در سامانه JALALI COSMETICS
          </div>
        </aside>
      </section>

      <footer className="cart-bottom">
        JALALI COSMETICS — BEAUTY. BUSINESS. TRUST.
      </footer>

      <style jsx>{`
        .cart-page {
          min-height: 100vh;
          background: #0b0b0d;
          color: #f5f1ee;
          padding-bottom: 60px;
        }

        .cart-hero {
          padding: 55px 7%;
          background:
            radial-gradient(circle at 80% 50%, #c99a8622, transparent 35%),
            linear-gradient(120deg, #201817, #0b0b0d);
          border-bottom: 1px solid #c99a862c;
        }

        .cart-hero > span,
        .eyebrow {
          color: #c99a86;
          font-size: 10px;
          letter-spacing: 3px;
        }

        .cart-hero h1 {
          font-size: clamp(29px, 5vw, 44px);
          margin: 15px 0 8px;
        }

        .cart-hero p {
          color: #b1a29c;
          font-size: 13px;
          line-height: 2;
        }

        .breadcrumb {
          max-width: 1200px;
          margin: 25px auto;
          padding: 0 22px;
          display: flex;
          gap: 12px;
          color: #8e8581;
          font-size: 12px;
        }

        .breadcrumb a {
          color: #c99a86;
          text-decoration: none;
        }

        .cart-container {
          max-width: 1200px;
          margin: 35px auto;
          padding: 0 22px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 340px;
          gap: 25px;
          align-items: start;
        }

        .cart-main,
        .summary {
          background: #141416;
          border: 1px solid #ffffff13;
          border-radius: 12px;
          padding: 24px;
        }

        .section-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding-bottom: 22px;
          border-bottom: 1px solid #ffffff15;
        }

        .section-heading h2,
        .summary h2 {
          font-size: 19px;
          margin: 10px 0 0;
        }

        .item-count {
          color: #c99a86;
          background: #c99a8615;
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 11px;
        }

        .cart-item {
          display: grid;
          grid-template-columns: 85px minmax(0, 1fr) auto;
          gap: 17px;
          align-items: center;
          padding: 22px 0;
          border-bottom: 1px solid #ffffff12;
        }

        .item-symbol {
          width: 85px;
          height: 95px;
          display: grid;
          place-items: center;
          background:
            radial-gradient(circle, #c99a8630, transparent 70%),
            #201b1b;
          border: 1px solid #c99a8628;
          border-radius: 8px;
          color: #c99a86;
          font-size: 42px;
        }

        .item-information {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
          min-width: 0;
        }

        .item-name {
          color: #f5f1ee;
          font-size: 14px;
          line-height: 1.8;
          text-decoration: none;
        }

        .item-sku {
          color: #918783;
          font-size: 10px;
        }

        .unit-price {
          color: #d5b5a7;
          font-size: 12px;
        }

        .item-actions {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 12px;
        }

        .quantity-control {
          display: flex;
          align-items: center;
          gap: 13px;
          background: #0c0c0e;
          border: 1px solid #ffffff20;
          border-radius: 7px;
          padding: 5px 9px;
        }

        .quantity-control button {
          background: transparent;
          border: 0;
          color: #c99a86;
          font-size: 21px;
          cursor: pointer;
        }

        .quantity-control button:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .quantity-control strong {
          font-size: 12px;
          min-width: 15px;
          text-align: center;
        }

        .line-total {
          color: #e0c0b2;
          font-size: 12px;
        }

        .remove-button {
          background: none;
          border: 0;
          color: #d28c8c;
          font: inherit;
          font-size: 10px;
          cursor: pointer;
        }

        .cart-footer {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          margin-top: 22px;
        }

        .continue-shopping,
        .clear-button {
          background: transparent;
          border: 1px solid #c99a8650;
          color: #c99a86;
          border-radius: 7px;
          padding: 11px 14px;
          text-decoration: none;
          font: inherit;
          font-size: 11px;
          cursor: pointer;
        }

        .empty-cart {
          min-height: 330px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          text-align: center;
          padding: 25px;
        }

        .empty-icon {
          color: #c99a86;
          font-size: 65px;
        }

        .empty-cart h3 {
          font-size: 19px;
        }

        .empty-cart p {
          max-width: 440px;
          color: #a79c97;
          font-size: 12px;
          line-height: 2.2;
        }

        .empty-cart a {
          margin-top: 15px;
          background: #c99a86;
          color: #171112;
          padding: 12px 20px;
          border-radius: 7px;
          text-decoration: none;
          font-size: 12px;
        }

        .summary {
          position: sticky;
          top: 20px;
        }

        .summary h2 {
          margin: 12px 0 25px;
        }

        .summary-row,
        .total-row {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          margin: 19px 0;
          font-size: 11px;
        }

        .summary-row span,
        .total-row span {
          color: #aaa09b;
        }

        .summary-row strong {
          color: #e0c0b2;
          text-align: left;
          font-size: 11px;
        }

        .summary-divider {
          height: 1px;
          background: #ffffff19;
          margin: 23px 0;
        }

        .total-row {
          font-size: 14px;
        }

        .total-row strong {
          color: #e5bda9;
          font-size: 16px;
        }

        .summary-note {
          color: #918783;
          font-size: 10px;
          line-height: 2.2;
          margin: 20px 0;
        }

        .checkout-button {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 15px;
          background: #c99a86;
          color: #171112;
          border-radius: 7px;
          text-decoration: none;
          font-size: 12px;
          font-weight: 700;
        }

        .checkout-button.disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .checkout-button span {
          font-size: 19px;
        }

        .secure-note {
          margin-top: 20px;
          color: #9b8e87;
          font-size: 10px;
          line-height: 2;
        }

        .secure-note span {
          color: #c99a86;
          margin-left: 7px;
        }

        .message {
          margin-top: 18px;
          padding: 12px;
          background: #c99a8615;
          color: #d9b9aa;
          border-radius: 7px;
          font-size: 12px;
        }

        .cart-bottom {
          text-align: center;
          padding: 35px 15px;
          color: #76645e;
          font-size: 9px;
          letter-spacing: 2px;
        }

        @media (max-width: 850px) {
          .cart-container {
            grid-template-columns: 1fr;
          }

          .summary {
            position: static;
          }
        }

        @media (max-width: 550px) {
          .cart-main,
          .summary {
            padding: 16px;
          }

          .cart-item {
            grid-template-columns: 65px minmax(0, 1fr);
            gap: 12px;
          }

          .item-symbol {
            width: 65px;
            height: 75px;
            font-size: 32px;
          }

          .item-actions {
            grid-column: 2;
            align-items: flex-start;
          }

          .cart-footer {
            flex-direction: column;
          }

          .cart-footer > * {
            text-align: center;
          }
        }
      `}</style>
    </main>
  );
}
