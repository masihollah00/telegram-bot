import Link from "next/link";

const categories = [
  { title: "آرایش صورت", subtitle: "کرم پودر، کانسیلر و پنکک", icon: "✦" },
  { title: "آرایش چشم", subtitle: "ریمل، خط چشم و سایه", icon: "◈" },
  { title: "آرایش لب", subtitle: "رژ لب و محصولات مراقبتی", icon: "❋" },
  { title: "مراقبت پوست", subtitle: "آبرسان و محصولات پوستی", icon: "◇" },
  { title: "مراقبت مو", subtitle: "شامپو و محصولات مو", icon: "✧" },
  { title: "عطر و خوشبوکننده", subtitle: "رایحه‌های متنوع", icon: "♢" },
];

const benefits = [
  {
    title: "تأمین عمده",
    description: "امکان ثبت سفارش عمده برای فروشگاه‌ها و همکاران",
    icon: "▤",
  },
  {
    title: "همکاری تجاری",
    description: "ثبت درخواست همکاری و دریافت شرایط ویژه همکاران",
    icon: "◇",
  },
  {
    title: "مدیریت سفارش",
    description: "پیگیری وضعیت سفارش‌ها از حساب کاربری",
    icon: "↗",
  },
  {
    title: "ارسال سراسری",
    description: "امکان برنامه‌ریزی ارسال سفارش به سراسر ایران",
    icon: "⌖",
  },
];

export default function HomePage() {
  return (
    <main>
      <div className="topbar">
        <div className="container topbar-inner">
          <span>مرکز تخصصی پخش محصولات آرایشی و زیبایی</span>
          <span>BEAUTY. BUSINESS. TRUST.</span>
        </div>
      </div>

      <header className="site-header">
        <div className="container header-inner">
          <Link href="/" className="brand">
            <span className="brand-symbol">J</span>
            <span>
              <strong>JALALI COSMETICS</strong>
              <small>BEAUTY. BUSINESS. TRUST.</small>
            </span>
          </Link>

          <nav className="main-nav">
            <Link href="/">صفحه اصلی</Link>
            <Link href="/products">محصولات</Link>
            <Link href="/categories">دسته‌بندی‌ها</Link>
            <Link href="/brands">برندها</Link>
            <Link href="/cooperation">همکاری با ما</Link>
            <Link href="/contact">تماس با ما</Link>
          </nav>

          <div className="header-actions">
            <Link href="/account" className="account-link">
              حساب کاربری
            </Link>
            <Link href="/cart" className="cart-link">
              سبد خرید
              <span>۰</span>
            </Link>
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="hero-glow" />
        <div className="container hero-grid">
          <div className="hero-content">
            <span className="eyebrow">JALALI COSMETICS COLLECTION</span>

            <h1>
              زیبایی،
              <br />
              <span>آغاز یک تجارت</span>
              <br />
              حرفه‌ای است.
            </h1>

            <p>
              مجموعه‌ای تخصصی برای تأمین محصولات آرایشی، بهداشتی و زیبایی؛
              همراه با امکانات حرفه‌ای سفارش عمده، همکاری تجاری و مدیریت خرید.
            </p>

            <div className="hero-actions">
              <Link href="/products" className="btn btn-primary">
                مشاهده محصولات
                <span>←</span>
              </Link>

              <Link href="/cooperation" className="btn btn-outline">
                درخواست همکاری
              </Link>
            </div>

            <div className="hero-note">
              <span className="note-line" />
              BEAUTY. BUSINESS. TRUST.
            </div>
          </div>

          <div className="hero-art">
            <div className="hero-art-frame">
              <div className="hero-art-inner">
                <span className="art-caption">THE BEAUTY COLLECTION</span>
                <div className="art-monogram">J</div>
                <span className="art-bottom">JALALI COSMETICS</span>
              </div>
            </div>
            <div className="floating-label">
              <span>J</span>
              <div>
                <strong>JALALI</strong>
                <small>BEAUTY DISTRIBUTION</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="benefits-section">
        <div className="container benefits-grid">
          {benefits.map((item) => (
            <article className="benefit" key={item.title}>
              <span className="benefit-icon">{item.icon}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">EXPLORE CATEGORIES</span>
            <h2>دسته‌بندی محصولات</h2>
            <p>
              محصولات موردنیاز کسب‌وکار خود را از دسته‌بندی‌های تخصصی پیدا کنید.
            </p>
          </div>

          <div className="category-grid">
            {categories.map((category, index) => (
              <Link
                href="/products"
                className="category-card"
                key={category.title}
              >
                <span className="category-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="category-icon">{category.icon}</span>
                <h3>{category.title}</h3>
                <p>{category.subtitle}</p>
                <span className="category-arrow">←</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="collection-banner">
        <div className="container collection-content">
          <span className="eyebrow">FOR BUSINESS PARTNERS</span>
          <h2>تجارت زیبایی را حرفه‌ای‌تر آغاز کنید.</h2>
          <p>
            برای دریافت شرایط همکاری، قیمت‌گذاری ویژه و امکانات سفارش عمده،
            درخواست همکاری خود را ثبت کنید.
          </p>
          <Link href="/cooperation" className="btn btn-primary">
            شروع همکاری
            <span>←</span>
          </Link>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">SHOPPING EXPERIENCE</span>
            <h2>تجربه خرید حرفه‌ای</h2>
            <p>
              از انتخاب محصولات تا ثبت سفارش و پیگیری، همه مراحل در یک فضای
              یکپارچه مدیریت می‌شوند.
            </p>
          </div>

          <div className="experience-grid">
            <article className="experience-card">
              <span>01</span>
              <h3>انتخاب محصولات</h3>
              <p>مشاهده محصولات و بررسی مشخصات و وضعیت موجودی.</p>
            </article>

            <article className="experience-card">
              <span>02</span>
              <h3>ثبت سفارش</h3>
              <p>افزودن محصولات به سبد خرید و تکمیل اطلاعات سفارش.</p>
            </article>

            <article className="experience-card">
              <span>03</span>
              <h3>پیگیری سفارش</h3>
              <p>دسترسی به وضعیت سفارش‌ها از پنل حساب کاربری.</p>
            </article>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="container footer-grid">
          <div className="footer-brand">
            <div className="brand">
              <span className="brand-symbol">J</span>
              <span>
                <strong>JALALI COSMETICS</strong>
                <small>BEAUTY. BUSINESS. TRUST.</small>
              </span>
            </div>
            <p>
              پخش جلالی؛ همراه کسب‌وکارهای فعال در حوزه زیبایی و محصولات آرایشی.
            </p>
          </div>

          <div className="footer-column">
            <h3>دسترسی سریع</h3>
            <Link href="/products">محصولات</Link>
            <Link href="/categories">دسته‌بندی‌ها</Link>
            <Link href="/brands">برندها</Link>
          </div>

          <div className="footer-column">
            <h3>خدمات مشتریان</h3>
            <Link href="/account">حساب کاربری</Link>
            <Link href="/orders">پیگیری سفارش</Link>
            <Link href="/cooperation">همکاری تجاری</Link>
          </div>

          <div className="footer-column">
            <h3>اطلاعات</h3>
            <Link href="/about">درباره ما</Link>
            <Link href="/contact">تماس با ما</Link>
            <Link href="/terms">قوانین و مقررات</Link>
          </div>
        </div>

        <div className="container footer-bottom">
          <span>© JALALI COSMETICS — تمامی حقوق محفوظ است.</span>
          <span>BEAUTY. BUSINESS. TRUST.</span>
        </div>
      </footer>

      <style jsx>{`
        .topbar {
          background: #151316;
          border-bottom: 1px solid var(--border);
          color: var(--muted);
          font-size: 11px;
        }

        .topbar-inner {
          min-height: 36px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
        }

        .header-inner {
          min-height: 88px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 25px;
        }

        .brand {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }

        .brand-symbol {
          width: 43px;
          height: 43px;
          display: grid;
          place-items: center;
          border: 1px solid var(--rose-gold);
          color: var(--rose-gold);
          font-family: Georgia, serif;
          font-size: 30px;
        }

        .brand strong,
        .brand small {
          display: block;
        }

        .brand strong {
          font-size: 14px;
          letter-spacing: 1px;
        }

        .brand small {
          margin-top: 5px;
          color: var(--rose-gold);
          font-size: 8px;
          letter-spacing: 1.5px;
        }

        .main-nav {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 22px;
          font-size: 12px;
          color: #d2cbca;
        }

        .main-nav a:hover,
        .footer-column a:hover {
          color: var(--rose-gold);
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 12px;
          white-space: nowrap;
        }

        .account-link {
          color: var(--muted);
        }

        .cart-link {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 13px;
          border: 1px solid var(--border);
          border-radius: 10px;
        }

        .cart-link span {
          color: var(--rose-gold);
        }

        .hero {
          position: relative;
          overflow: hidden;
          padding: 90px 0 105px;
          border-bottom: 1px solid var(--border);
        }

        .hero-glow {
          position: absolute;
          width: 550px;
          height: 550px;
          top: -200px;
          left: -120px;
          background: radial-gradient(
            circle,
            rgba(201, 154, 134, 0.12),
            transparent 68%
          );
          pointer-events: none;
        }

        .hero-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          align-items: center;
          gap: 70px;
        }

        .hero-content h1 {
          margin: 25px 0;
          font-size: clamp(42px, 6vw, 74px);
          line-height: 1.55;
          letter-spacing: -2px;
        }

        .hero-content h1 span {
          color: var(--rose-gold);
        }

        .hero-content > p {
          max-width: 580px;
          color: var(--muted);
          font-size: 15px;
          line-height: 2.5;
        }

        .hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 30px;
        }

        .hero-note {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 48px;
          color: var(--rose-gold);
          font-size: 10px;
          letter-spacing: 2px;
        }

        .note-line {
          width: 38px;
          height: 1px;
          background: var(--rose-gold);
        }

        .hero-art {
          position: relative;
          padding: 20px;
        }

        .hero-art-frame {
          aspect-ratio: 0.88;
          padding: 15px;
          border: 1px solid rgba(201, 154, 134, 0.5);
          transform: rotate(-2deg);
        }

        .hero-art-inner {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: 35px 15px;
          background:
            radial-gradient(
              circle at 50% 45%,
              rgba(201, 154, 134, 0.2),
              transparent 45%
            ),
            linear-gradient(145deg, #252024, #100e11 70%);
          border: 1px solid rgba(201, 154, 134, 0.18);
        }

        .art-caption,
        .art-bottom {
          color: var(--rose-gold);
          font-size: 10px;
          letter-spacing: 3px;
          text-align: center;
        }

        .art-monogram {
          color: var(--rose-gold);
          font-family: Georgia, serif;
          font-size: clamp(150px, 25vw, 280px);
          font-weight: 400;
          line-height: 1;
          text-shadow: 0 0 55px rgba(201, 154, 134, 0.2);
        }

        .floating-label {
          position: absolute;
          right: -15px;
          bottom: 45px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 15px 20px;
          background: #1b181b;
          border: 1px solid var(--border);
          box-shadow: 0 15px 50px #0008;
        }

        .floating-label > span {
          color: var(--rose-gold);
          font-family: Georgia, serif;
          font-size: 30px;
        }

        .floating-label strong,
        .floating-label small {
          display: block;
        }

        .floating-label strong {
          font-size: 12px;
        }

        .floating-label small {
          margin-top: 5px;
          color: var(--muted);
          font-size: 8px;
        }

        .benefits-section {
          background: #111013;
          border-bottom: 1px solid var(--border);
        }

        .benefits-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          padding-block: 30px;
          gap: 25px;
        }

        .benefit {
          display: flex;
          align-items: center;
          gap: 13px;
        }

        .benefit-icon {
          color: var(--rose-gold);
          font-size: 27px;
        }

        .benefit h3 {
          margin: 0 0 7px;
          font-size: 13px;
        }

        .benefit p {
          margin: 0;
          color: var(--muted);
          font-size: 10px;
          line-height: 1.9;
        }

        .category-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .category-card {
          position: relative;
          min-height: 185px;
          padding: 25px;
          overflow: hidden;
          background: linear-gradient(145deg, #1c191d, #111013);
          border: 1px solid var(--border);
          border-radius: 16px;
          transition: 0.25s;
        }

        .category-card:hover {
          transform: translateY(-5px);
          border-color: var(--rose-gold);
        }

        .category-number {
          position: absolute;
          left: 20px;
          top: 18px;
          color: #ffffff22;
          font-size: 30px;
          font-weight: 800;
        }

        .category-icon {
          display: block;
          margin-bottom: 20px;
          color: var(--rose-gold);
          font-size: 28px;
        }

        .category-card h3 {
          margin: 0 0 9px;
          font-size: 16px;
        }

        .category-card p {
          margin: 0;
          color: var(--muted);
          font-size: 12px;
        }

        .category-arrow {
          position: absolute;
          left: 22px;
          bottom: 20px;
          color: var(--rose-gold);
        }

        .collection-banner {
          position: relative;
          overflow: hidden;
          padding: 75px 0;
          background:
            radial-gradient(
              ellipse at 10% 50%,
              rgba(201, 154, 134, 0.16),
              transparent 50%
            ),
            #171317;
          border-block: 1px solid var(--border);
        }

        .collection-content {
          text-align: center;
        }

        .collection-content h2 {
          margin: 20px 0;
          font-size: clamp(26px, 4vw, 43px);
        }

        .collection-content p {
          max-width: 650px;
          margin: 0 auto 28px;
          color: var(--muted);
          line-height: 2.3;
          font-size: 14px;
        }

        .experience-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }

        .experience-card {
          padding: 28px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
        }

        .experience-card > span {
          color: var(--rose-gold);
          font-family: Georgia, serif;
          font-size: 30px;
        }

        .experience-card h3 {
          margin: 20px 0 10px;
          font-size: 16px;
        }

        .experience-card p {
          margin: 0;
          color: var(--muted);
          font-size: 13px;
          line-height: 2.2;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 35px;
          padding-bottom: 45px;
        }

        .footer-brand p {
          max-width: 300px;
          color: var(--muted);
          font-size: 12px;
          line-height: 2.4;
        }

        .footer-column {
          display: flex;
          flex-direction: column;
          gap: 15px;
          font-size: 12px;
          color: var(--muted);
        }

        .footer-column h3 {
          margin: 0 0 8px;
          color: var(--foreground);
          font-size: 14px;
        }

        .footer-bottom {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          padding-top: 22px;
          border-top: 1px solid var(--border);
          color: var(--muted);
          font-size: 10px;
        }

        @media (max-width: 1100px) {
          .main-nav {
            gap: 12px;
            font-size: 11px;
          }

          .header-inner {
            flex-wrap: wrap;
            padding-block: 15px;
          }
        }

        @media (max-width: 800px) {
          .main-nav {
            order: 3;
            width: 100%;
            overflow-x: auto;
            justify-content: flex-start;
            padding: 12px 0;
          }

          .hero {
            padding: 55px 0;
          }

          .hero-grid {
            grid-template-columns: 1fr;
            gap: 35px;
          }

          .hero-art {
            max-width: 430px;
            margin-inline: auto;
            width: 100%;
          }

          .benefits-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .footer-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 520px) {
          .topbar-inner {
            font-size: 9px;
          }

          .header-inner {
            gap: 12px;
          }

          .brand strong {
            font-size: 11px;
          }

          .header-actions {
            font-size: 10px;
          }

          .hero-content h1 {
            font-size: 43px;
          }

          .category-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }

          .category-card {
            min-height: 165px;
            padding: 17px;
          }

          .category-card h3 {
            font-size: 13px;
          }

          .category-card p {
            font-size: 10px;
            line-height: 1.8;
          }

          .experience-grid {
            grid-template-columns: 1fr;
          }

          .footer-grid {
            gap: 25px;
          }

          .footer-bottom {
            flex-direction: column;
            line-height: 2;
          }
        }
      `}</style>
    </main>
  );
}
