
"use client";

import { useEffect, useState } from "react";

type OrderItem = {
  id: number;
  sku: string;
  quantity: number;
  note: string;
};

export default function QuickOrderPage() {
  const [items, setItems] = useState<OrderItem[]>([
    { id: 1, sku: "", quantity: 1, note: "" },
  ]);

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [requestType, setRequestType] = useState("quotation");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [prefilledProduct, setPrefilledProduct] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const sku = (params.get("sku") || "").trim().toUpperCase();
    const productName = (params.get("product") || "").trim();

    const requestedQuantity = Number(params.get("quantity") || 1);
    const quantity =
      Number.isFinite(requestedQuantity) && requestedQuantity > 0
        ? Math.floor(requestedQuantity)
        : 1;

    if (!sku) return;

    setItems([
      {
        id: 1,
        sku,
        quantity,
        note: productName,
      },
    ]);

    setPrefilledProduct(productName || sku);
  }, []);

  function updateItem(
    id: number,
    field: keyof OrderItem,
    value: string | number
  ) {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  }

  function addItem() {
    setItems((current) => [
      ...current,
      {
        id: Date.now(),
        sku: "",
        quantity: 1,
        note: "",
      },
    ]);
  }

  function removeItem(id: number) {
    if (items.length === 1) {
      setMessage("حداقل یک ردیف محصول باید باقی بماند.");
      return;
    }

    setItems((current) => current.filter((item) => item.id !== id));
    setMessage("");
  }

  function submitRequest(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (customerName.trim().length < 3) {
      setMessage("نام و نام خانوادگی را وارد کنید.");
      return;
    }

    if (!/^09\d{9}$/.test(phone)) {
      setMessage("شماره موبایل معتبر وارد کنید.");
      return;
    }

    if (items.some((item) => !item.sku.trim())) {
      setMessage("کد کالای تمام ردیف‌ها را وارد کنید.");
      return;
    }

    if (items.some((item) => item.quantity < 1)) {
      setMessage("تعداد هر محصول باید حداقل یک عدد باشد.");
      return;
    }

    setLoading(true);
    setMessage("");

    const payload = {
      customer_name: customerName.trim(),
      phone,
      company: company.trim(),
      request_type: requestType,
      items: items.map((item) => ({
        sku: item.sku.trim().toUpperCase(),
        quantity: item.quantity,
        note: item.note.trim(),
      })),
      description: description.trim(),
    };

    // این نسخه فقط اطلاعات فرم را آماده و اعتبارسنجی می‌کند.
    // اتصال API و ثبت واقعی درخواست در مرحله اتصال نهایی انجام می‌شود.
    // قیمت، موجودی و حداقل سفارش باید همیشه در سرور بررسی شوند.

    console.info("Quotation request prepared:", payload);

    window.setTimeout(() => {
      setLoading(false);
      setMessage(
        "اطلاعات فرم بررسی شد؛ ثبت نهایی درخواست پس از اتصال API سرور فعال خواهد شد."
      );
    }, 500);
  }

  return (
    <main className="quick-page" dir="rtl">
      <section className="quick-container">
        <header className="hero">
          <span className="eyebrow">WHOLESALE ORDER CENTER</span>
          <h1>مرکز سفارش سریع</h1>
          <p>
            محصولات موردنظر خود را با کد کالا وارد کنید و درخواست
            پیش‌فاکتور یا بررسی سفارش عمده را ارسال کنید.
          </p>

          <div className="hero-tags">
            <span>سفارش بر اساس SKU</span>
            <span>درخواست پیش‌فاکتور</span>
            <span>خرید عمده</span>
          </div>
        </header>

        <form onSubmit={submitRequest}>
          <section className="panel">
            <div className="section-heading">
              <div>
                <span className="section-number">01</span>
                <h2>اطلاعات مشتری</h2>
              </div>
              <span className="required">فیلدهای ضروری را تکمیل کنید</span>
            </div>

            <div className="form-grid">
              <label>
                نام و نام خانوادگی *
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="نام کامل"
                  required
                />
              </label>

              <label>
                شماره موبایل *
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))
                  }
                  placeholder="09xxxxxxxxx"
                  maxLength={11}
                  required
                />
              </label>

              <label className="full-width">
                نام فروشگاه یا مجموعه
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="نام فروشگاه، شرکت یا مجموعه شما"
                />
              </label>
            </div>
          </section>

          <section className="panel">
            <div className="section-heading">
              <div>
                <span className="section-number">02</span>
                <h2>فهرست محصولات</h2>
              </div>
              <span className="required">حداقل یک محصول</span>
            </div>

            {prefilledProduct && (
              <div className="prefilled-notice">
                <span className="notice-icon">✓</span>
                <div>
                  <strong>محصول انتخاب‌شده دریافت شد</strong>
                  <p>{prefilledProduct}</p>
                  <small>
                    کد کالا و تعداد اولیه از صفحه محصول وارد شده‌اند.
                    می‌توانید اطلاعات را تغییر دهید.
                  </small>
                </div>
              </div>
            )}

            <div className="product-intro">
              <strong>اطلاعات کالا را وارد کنید</strong>
              <p>
                کد SKU باید با کد ثبت‌شده محصول در سامانه مطابقت داشته باشد.
                قیمت و موجودی نهایی در سرور بررسی خواهد شد.
              </p>
            </div>

            <div className="items-list">
              {items.map((item, index) => (
                <div className="item-card" key={item.id}>
                  <div className="item-top">
                    <strong>محصول شماره {index + 1}</strong>
                    <button
                      type="button"
                      className="remove-button"
                      onClick={() => removeItem(item.id)}
                    >
                      حذف ردیف
                    </button>
                  </div>

                  <div className="item-fields">
                    <label>
                      کد کالا (SKU) *
                      <input
                        value={item.sku}
                        onChange={(e) =>
                          updateItem(item.id, "sku", e.target.value)
                        }
                        placeholder="مثلاً JAL-1001"
                        required
                      />
                    </label>

                    <label>
                      تعداد درخواستی *
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(
                            item.id,
                            "quantity",
                            Math.max(1, Number(e.target.value) || 1)
                          )
                        }
                        required
                      />
                    </label>

                    <label className="item-note">
                      توضیح محصول
                      <input
                        value={item.note}
                        onChange={(e) =>
                          updateItem(item.id, "note", e.target.value)
                        }
                        placeholder="رنگ، مدل یا توضیحات تکمیلی"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="add-button"
              onClick={addItem}
            >
              <span>＋</span>
              افزودن محصول دیگر
            </button>
          </section>

          <section className="panel">
            <div className="section-heading">
              <div>
                <span className="section-number">03</span>
                <h2>نوع درخواست</h2>
              </div>
            </div>

            <div className="request-options">
              <label
                className={requestType === "quotation" ? "selected" : ""}
              >
                <input
                  type="radio"
                  name="requestType"
                  value="quotation"
                  checked={requestType === "quotation"}
                  onChange={(e) => setRequestType(e.target.value)}
                />
                <span className="option-icon">▤</span>
                <strong>درخواست پیش‌فاکتور</strong>
                <small>بررسی محصولات و دریافت پیش‌فاکتور</small>
              </label>

              <label
                className={requestType === "availability" ? "selected" : ""}
              >
                <input
                  type="radio"
                  name="requestType"
                  value="availability"
                  checked={requestType === "availability"}
                  onChange={(e) => setRequestType(e.target.value)}
                />
                <span className="option-icon">◇</span>
                <strong>استعلام موجودی</strong>
                <small>بررسی موجودی و شرایط تأمین کالا</small>
              </label>

              <label
                className={requestType === "bulk_order" ? "selected" : ""}
              >
                <input
                  type="radio"
                  name="requestType"
                  value="bulk_order"
                  checked={requestType === "bulk_order"}
                  onChange={(e) => setRequestType(e.target.value)}
                />
                <span className="option-icon">▦</span>
                <strong>سفارش عمده</strong>
                <small>درخواست بررسی خرید در حجم عمده</small>
              </label>
            </div>

            <label className="description-label">
              توضیحات تکمیلی
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="توضیحات، شرایط تحویل یا درخواست‌های دیگر..."
              />
            </label>
          </section>

          <section className="submit-panel">
            <div>
              <strong>آماده بررسی درخواست شما هستیم</strong>
              <p>
                قیمت نهایی، حداقل سفارش و موجودی باید توسط سامانه مرکزی
                تأیید شوند.
              </p>
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "در حال بررسی..." : "ثبت درخواست"}
              <span>←</span>
            </button>
          </section>

          {message && (
            <div className="feedback" role="status">
              {message}
            </div>
          )}
        </form>

        <footer>
          <strong>JALALI COSMETICS</strong>
          <span>BEAUTY. BUSINESS. TRUST.</span>
        </footer>
      </section>

      <style jsx>{`
        .quick-page {
          min-height: 100vh;
          padding: 45px 16px 70px;
          background:
            radial-gradient(ellipse at 50% 0%, #30221e 0%, transparent 45%),
            #0b0b0d;
          color: #f5f1ee;
        }

        .quick-container {
          max-width: 900px;
          margin: auto;
        }

        .hero {
          text-align: center;
          padding: 30px 10px 38px;
        }

        .eyebrow {
          color: #c99a86;
          font-size: 10px;
          letter-spacing: 3px;
          font-weight: 800;
        }

        .hero h1 {
          font-size: clamp(28px, 5vw, 43px);
          margin: 16px 0;
          font-weight: 900;
        }

        .hero p {
          max-width: 570px;
          margin: auto;
          color: #aaa0a0;
          line-height: 2.1;
          font-size: 13px;
        }

        .hero-tags {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 9px;
          margin-top: 23px;
        }

        .hero-tags span {
          border: 1px solid #574138;
          border-radius: 30px;
          padding: 8px 14px;
          color: #d7b5a5;
          background: #1b1514;
          font-size: 10px;
        }

        .panel {
          background: #151518;
          border: 1px solid #302a29;
          border-radius: 16px;
          padding: 25px;
          margin-bottom: 17px;
        }

        .section-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding-bottom: 19px;
          margin-bottom: 21px;
          border-bottom: 1px solid #302a29;
        }

        .section-heading > div {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .section-number {
          color: #c99a86;
          font-size: 12px;
          letter-spacing: 2px;
        }

        .section-heading h2 {
          margin: 0;
          font-size: 17px;
        }

        .required {
          color: #938582;
          font-size: 10px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        label {
          display: block;
          color: #e4d8d3;
          font-size: 12px;
        }

        input:not([type="radio"]),
        textarea {
          width: 100%;
          box-sizing: border-box;
          margin-top: 10px;
          padding: 14px;
          border: 1px solid #393337;
          border-radius: 9px;
          background: #0e0e11;
          color: white;
          outline: none;
          font-family: inherit;
          font-size: 13px;
        }

        input:focus,
        textarea:focus {
          border-color: #c99a86;
        }

        input::placeholder,
        textarea::placeholder {
          color: #72696a;
        }

        .full-width {
          grid-column: 1 / -1;
        }

        .prefilled-notice {
          display: flex;
          align-items: flex-start;
          gap: 13px;
          margin-bottom: 20px;
          padding: 16px;
          border: 1px solid #657b61;
          border-radius: 10px;
          background: #172019;
        }

        .notice-icon {
          width: 29px;
          height: 29px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #304b35;
          color: #c5e2c1;
          font-size: 15px;
        }

        .prefilled-notice strong {
          display: block;
          color: #d7e5d1;
          font-size: 12px;
        }

        .prefilled-notice p {
          margin: 7px 0;
          color: #d5b5a5;
          font-size: 12px;
        }

        .prefilled-notice small {
          color: #a5b5a0;
          font-size: 10px;
          line-height: 1.9;
        }

        .product-intro {
          margin-bottom: 20px;
        }

        .product-intro strong {
          font-size: 13px;
        }

        .product-intro p {
          color: #968d8d;
          font-size: 11px;
          line-height: 2;
        }

        .item-card {
          padding: 18px;
          margin-bottom: 12px;
          border: 1px solid #38302e;
          border-radius: 12px;
          background: #101013;
        }

        .item-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 18px;
        }

        .item-top strong {
          font-size: 12px;
          color: #d6b5a6;
        }

        .remove-button {
          border: 1px solid #593c3a;
          border-radius: 7px;
          padding: 7px 11px;
          background: transparent;
          color: #d69b91;
          font-family: inherit;
          font-size: 10px;
          cursor: pointer;
        }

        .item-fields {
          display: grid;
          grid-template-columns: 1fr 150px;
          gap: 15px;
        }

        .item-note {
          grid-column: 1 / -1;
        }

        .add-button {
          width: 100%;
          margin-top: 8px;
          padding: 14px;
          border: 1px dashed #76594c;
          border-radius: 10px;
          background: #1d1716;
          color: #d5ad9b;
          font-family: inherit;
          font-size: 12px;
          cursor: pointer;
        }

        .add-button span {
          font-size: 17px;
          margin-left: 7px;
        }

        .request-options {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .request-options label {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 9px;
          min-height: 130px;
          padding: 16px;
          border: 1px solid #373034;
          border-radius: 11px;
          background: #101013;
          cursor: pointer;
        }

        .request-options label.selected {
          border-color: #c99a86;
          background: #241c19;
        }

        .request-options input {
          position: absolute;
          top: 14px;
          left: 14px;
          accent-color: #c99a86;
        }

        .option-icon {
          color: #c99a86;
          font-size: 25px;
        }

        .request-options strong {
          font-size: 12px;
        }

        .request-options small {
          color: #999091;
          font-size: 10px;
          line-height: 1.9;
        }

        .description-label {
          margin-top: 25px;
        }

        textarea {
          resize: vertical;
          line-height: 2;
        }

        .submit-panel {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          padding: 22px;
          border: 1px solid #5b4138;
          border-radius: 14px;
          background: linear-gradient(120deg, #211816, #151315);
        }

        .submit-panel strong {
          font-size: 14px;
        }

        .submit-panel p {
          margin-bottom: 0;
          color: #a99b96;
          font-size: 11px;
          line-height: 1.9;
        }

        .submit-panel button {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 25px;
          padding: 15px 20px;
          border: 0;
          border-radius: 9px;
          background: #c99a86;
          color: #171110;
          font-family: inherit;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
        }

        .submit-panel button:disabled {
          opacity: .6;
          cursor: wait;
        }

        .feedback {
          margin-top: 17px;
          padding: 15px;
          border: 1px solid #745747;
          border-radius: 10px;
          background: #241c19;
          color: #e7c2ae;
          font-size: 12px;
          line-height: 2;
        }

        footer {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #302a29;
          color: #918482;
          font-size: 10px;
          letter-spacing: 1px;
        }

        footer strong {
          color: #c99a86;
        }

        @media (max-width: 650px) {
          .panel {
            padding: 18px;
          }

          .form-grid,
          .request-options {
            grid-template-columns: 1fr;
          }

          .item-fields {
            grid-template-columns: 1fr 110px;
          }

          .submit-panel {
            align-items: stretch;
            flex-direction: column;
          }

          .submit-panel button {
            width: 100%;
          }
        }

        @media (max-width: 390px) {
          .item-fields {
            grid-template-columns: 1fr;
          }

          .item-note {
            grid-column: auto;
          }

          .section-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          footer {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </main>
  );
}
