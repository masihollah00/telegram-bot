
import Link from "next/link";

const values = [
  {
    number: "01",
    title: "اعتماد تجاری",
    description:
      "شفافیت در ارائه اطلاعات محصولات، شرایط خرید و ارتباط با مشتریان، پایه همکاری ماست.",
  },
  {
    number: "02",
    title: "تنوع محصولات",
    description:
      "تلاش می‌کنیم مجموعه‌ای متنوع از محصولات آرایشی و بهداشتی را در دسترس خریداران عمده قرار دهیم.",
  },
  {
    number: "03",
    title: "تجربه حرفه‌ای",
    description:
      "فرآیند انتخاب محصول، ثبت سفارش و پیگیری خرید باید برای مشتری روشن و قابل پیگیری باشد.",
  },
  {
    number: "04",
    title: "همکاری بلندمدت",
    description:
      "هدف ما ایجاد روابط تجاری پایدار با فروشگاه‌ها، تأمین‌کنندگان و فعالان بازار زیبایی است.",
  },
];

const services = [
  {
    title: "فروش عمده",
    description: "ارائه محصولات برای فروشگاه‌ها و خریداران تجاری",
    icon: "01",
  },
  {
    title: "همکاری فروشگاهی",
    description: "بررسی درخواست همکاری و شرایط ویژه همکاران",
    icon: "02",
  },
  {
    title: "تنوع دسته‌بندی",
    description: "دسترسی به گروه‌های مختلف محصولات آرایشی و بهداشتی",
    icon: "03",
  },
  {
    title: "پیگیری سفارش",
    description: "امکان توسعه فرآیند پیگیری و مدیریت سفارش‌ها",
    icon: "04",
  },
];

export default function AboutPage() {
  return (
    <main dir="rtl" className="about-page">
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <span className="eyebrow">
              ABOUT JALALI COSMETICS
            </span>

            <h1>
              زیبایی در انتخاب،
              <br />
              اعتماد در تجارت.
            </h1>

            <p>
              پخش جلالی با تمرکز بر بازار عمده‌فروشی محصولات
              آرایشی و بهداشتی، به دنبال ایجاد تجربه‌ای
              حرفه‌ای، شفاف و قابل اعتماد برای کسب‌وکارهاست.
            </p>

            <div className="hero-actions">
              <Link href="/products" className="primary-link">
                مشاهده محصولات
                <span>←</span>
              </Link>

              <Link href="/partner" className="outline-link">
                شروع همکاری
              </Link>
            </div>
          </div>

          <div className="brand-art" aria-label="Jalali Cosmetics">
            <div className="outer-circle" />
            <div className="middle-circle" />
            <div className="inner-circle">
              <span className="brand-letter">J</span>
              <span className="brand-name">JALALI</span>
              <span className="brand-type">COSMETICS</span>
            </div>
            <span className="art-caption">
              BEAUTY. BUSINESS. TRUST.
            </span>
          </div>
        </div>
      </section>

      <section className="intro section-container">
        <div className="intro-label">
          <span>OUR STORY</span>
          <div />
        </div>

        <div className="intro-content">
          <h2>
            یک نگاه حرفه‌ای
            <br />
            به بازار محصولات زیبایی
          </h2>

          <div className="intro-description">
            <p>
              بازار محصولات زیبایی به انتخاب دقیق، دسترسی به
              اطلاعات قابل اتکا و ارتباط تجاری منظم نیاز دارد.
              پخش جلالی با همین رویکرد، مسیر فعالیت خود را
              در حوزه عرضه عمده محصولات آرایشی و بهداشتی دنبال
              می‌کند.
            </p>

            <p>
              ما می‌خواهیم خریداران تجاری بتوانند محصولات را
              بررسی کنند، دسته‌بندی‌ها را بشناسند، درخواست
              همکاری خود را ثبت کنند و سفارش‌هایشان را در یک
              بستر یکپارچه مدیریت کنند.
            </p>

            <p>
              تجربه خرید حرفه‌ای فقط به محصول محدود نیست؛
              اطلاعات روشن، فرآیند منظم و پشتیبانی پاسخ‌گو
              نیز بخش مهمی از یک همکاری موفق هستند.
            </p>
          </div>
        </div>
      </section>

      <section className="values-section">
        <div className="section-container">
          <div className="section-heading">
            <span>OUR PRINCIPLES</span>
            <h2>اصولی که به آن پایبندیم</h2>
            <p>
              چهار اصل محوری در طراحی تجربه تجاری پخش جلالی
            </p>
          </div>

          <div className="values-grid">
            {values.map((value) => (
              <article className="value-card" key={value.number}>
                <span className="value-number">
                  {value.number}
                </span>

                <div className="value-line" />

                <h3>{value.title}</h3>
                <p>{value.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="services-section section-container">
        <div className="section-heading">
          <span>WHAT WE OFFER</span>
          <h2>حوزه‌های فعالیت</h2>
          <p>
            امکانات و خدماتی که برای توسعه ارتباط تجاری در نظر
            گرفته شده‌اند.
          </p>
        </div>

        <div className="services-grid">
          {services.map((service) => (
            <article className="service-card" key={service.icon}>
              <span>{service.icon}</span>
              <div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </div>
              <span className="service-arrow">↙</span>
            </article>
          ))}
        </div>
      </section>

      <section className="promise-section">
        <div className="promise-inner">
          <span className="eyebrow">OUR COMMITMENT</span>
          <h2>
            تجارت حرفه‌ای،
            <br />
            با ارتباطی شفاف و ماندگار.
          </h2>
          <p>
            ما به دنبال ساخت بستری هستیم که خرید عمده محصولات
            زیبایی را منظم‌تر، قابل پیگیری‌تر و مطمئن‌تر کند.
          </p>

          <Link href="/contact" className="promise-button">
            ارتباط با پخش جلالی
            <span>←</span>
          </Link>
        </div>
      </section>

      <style jsx>{`
        .about-page {
          background: #0b0b0d;
          color: #f5f1ee;
          min-height: 100vh;
          overflow: hidden;
        }

        .section-container {
          width: min(1160px, 88%);
          margin: 0 auto;
        }

        .hero {
          position: relative;
          background:
            radial-gradient(
              ellipse at 78% 45%,
              rgba(201, 154, 134, 0.13),
              transparent 35%
            ),
            linear-gradient(120deg, #111114, #09090b);
          border-bottom: 1px solid #292326;
        }

        .hero-inner {
          width: min(1160px, 88%);
          min-height: 570px;
          margin: auto;
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          align-items: center;
          gap: 50px;
          padding: 65px 0;
        }

        .eyebrow {
          color: #c99a86;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 3px;
        }

        .hero-copy h1 {
          margin: 24px 0;
          font-size: clamp(38px, 5.5vw, 65px);
          line-height: 1.55;
          font-weight: 900;
          letter-spacing: -2px;
        }

        .hero-copy p {
          max-width: 540px;
          color: #aaa19e;
          font-size: 14px;
          line-height: 2.5;
        }

        .hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 13px;
          margin-top: 32px;
        }

        .primary-link,
        .outline-link,
        .promise-button {
          min-height: 49px;
          padding: 0 22px;
          display: inline-flex;
          justify-content: center;
          align-items: center;
          gap: 18px;
          text-decoration: none;
          border-radius: 5px;
          font-size: 13px;
          font-weight: 800;
          transition: 0.2s;
        }

        .primary-link,
        .promise-button {
          background: #c99a86;
          color: #15100e;
        }

        .primary-link:hover,
        .promise-button:hover {
          background: #e0b5a2;
          transform: translateY(-2px);
        }

        .outline-link {
          color: #f5f1ee;
          border: 1px solid #55423b;
        }

        .outline-link:hover {
          border-color: #c99a86;
          color: #c99a86;
        }

        .brand-art {
          position: relative;
          width: min(100%, 390px);
          aspect-ratio: 1;
          margin: auto;
          display: grid;
          place-items: center;
        }

        .outer-circle,
        .middle-circle,
        .inner-circle {
          position: absolute;
          border-radius: 50%;
        }

        .outer-circle {
          width: 95%;
          height: 95%;
          border: 1px solid rgba(201, 154, 134, 0.24);
        }

        .middle-circle {
          width: 76%;
          height: 76%;
          border: 1px dashed rgba(201, 154, 134, 0.55);
        }

        .inner-circle {
          width: 54%;
          height: 54%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle, #2b211e, #100f10);
          border: 1px solid #c99a86;
          box-shadow: 0 0 75px rgba(201, 154, 134, 0.13);
        }

        .brand-letter {
          font-family: Georgia, serif;
          color: #d4a18d;
          font-size: 120px;
          line-height: 0.9;
        }

        .brand-name {
          margin-top: 13px;
          color: #f1ded4;
          font-size: 15px;
          font-weight: 900;
          letter-spacing: 6px;
        }

        .brand-type {
          margin-top: 5px;
          color: #b18c7d;
          font-size: 8px;
          letter-spacing: 5px;
        }

        .art-caption {
          position: absolute;
          bottom: -2px;
          color: #b28e80;
          font-size: 9px;
          letter-spacing: 4px;
          white-space: nowrap;
        }

        .intro {
          padding-top: 110px;
          padding-bottom: 110px;
        }

        .intro-label {
          display: flex;
          align-items: center;
          gap: 18px;
          color: #c99a86;
          font-size: 10px;
          letter-spacing: 3px;
          font-weight: 800;
        }

        .intro-label div {
          height: 1px;
          width: 65px;
          background: #795c50;
        }

        .intro-content {
          display: grid;
          grid-template-columns: 0.9fr 1.1fr;
          gap: 80px;
          margin-top: 30px;
        }

        .intro-content h2 {
          font-size: clamp(27px, 3.5vw, 43px);
          line-height: 1.8;
          margin: 0;
        }

        .intro-description p {
          margin: 0 0 17px;
          color: #aaa19e;
          font-size: 13px;
          line-height: 2.5;
        }

        .values-section {
          padding: 90px 0;
          background: #121214;
          border-top: 1px solid #292528;
          border-bottom: 1px solid #292528;
        }

        .section-heading {
          text-align: center;
          margin-bottom: 48px;
        }

        .section-heading > span {
          color: #c99a86;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 3px;
        }

        .section-heading h2 {
          margin: 14px 0 10px;
          font-size: clamp(25px, 3.5vw, 37px);
        }

        .section-heading p {
          color: #96908d;
          font-size: 12px;
          line-height: 2;
        }

        .values-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
        }

        .value-card {
          min-height: 230px;
          padding: 25px 21px;
          background: #19191d;
          border: 1px solid #302b2c;
          border-radius: 7px;
          transition: 0.25s;
        }

        .value-card:hover {
          transform: translateY(-5px);
          border-color: #8c695b;
        }

        .value-number {
          color: #c99a86;
          font-size: 12px;
          letter-spacing: 2px;
        }

        .value-line {
          width: 35px;
          height: 1px;
          margin: 24px 0;
          background: #a27b6b;
        }

        .value-card h3 {
          font-size: 16px;
          margin: 0 0 13px;
        }

        .value-card p {
          color: #a39b98;
          font-size: 11px;
          line-height: 2.3;
          margin: 0;
        }

        .services-section {
          padding-top: 100px;
          padding-bottom: 105px;
        }

        .services-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .service-card {
          display: flex;
          align-items: center;
          gap: 20px;
          min-height: 125px;
          padding: 22px;
          background: #151518;
          border: 1px solid #302c2e;
          border-radius: 7px;
          transition: 0.2s;
        }

        .service-card:hover {
          border-color: #9a7566;
          background: #1c191a;
        }

        .service-card > span:first-child {
          flex: 0 0 45px;
          height: 45px;
          display: grid;
          place-items: center;
          color: #c99a86;
          border: 1px solid #775b50;
          font-size: 11px;
        }

        .service-card h3 {
          margin: 0 0 9px;
          font-size: 15px;
        }

        .service-card p {
          margin: 0;
          color: #9d9693;
          font-size: 11px;
          line-height: 2;
        }

        .service-arrow {
          margin-right: auto;
          color: #c99a86;
          font-size: 21px;
        }

        .promise-section {
          padding: 85px 6%;
          text-align: center;
          background:
            radial-gradient(
              ellipse at center,
              rgba(201, 154, 134, 0.13),
              transparent 65%
            ),
            #151214;
          border-top: 1px solid #4a3732;
        }

        .promise-inner {
          max-width: 750px;
          margin: auto;
        }

        .promise-inner h2 {
          margin: 22px 0;
          font-size: clamp(30px, 4.5vw, 48px);
          line-height: 1.7;
        }

        .promise-inner p {
          color: #aaa19e;
          font-size: 13px;
          line-height: 2.4;
          margin-bottom: 28px;
        }

        @media (max-width: 900px) {
          .hero-inner {
            grid-template-columns: 1fr;
            gap: 35px;
          }

          .brand-art {
            width: 290px;
          }

          .brand-letter {
            font-size: 90px;
          }

          .intro-content {
            gap: 35px;
          }

          .values-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 600px) {
          .hero-inner {
            padding: 65px 0;
          }

          .hero-copy h1 {
            font-size: 39px;
          }

          .intro {
            padding-top: 70px;
            padding-bottom: 70px;
          }

          .intro-content {
            grid-template-columns: 1fr;
            gap: 18px;
          }

          .values-section,
          .services-section {
            padding-top: 70px;
            padding-bottom: 70px;
          }

          .values-grid,
          .services-grid {
            grid-template-columns: 1fr;
          }

          .value-card {
            min-height: auto;
          }

          .service-card {
            min-height: 110px;
          }

          .promise-section {
            padding: 65px 7%;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            scroll-behavior: auto !important;
            transition: none !important;
          }
        }
      `}</style>
    </main>
  );
}
