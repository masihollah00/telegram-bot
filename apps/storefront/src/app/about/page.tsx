
import Link from "next/link";
import "./about.css";

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

          <div
            className="brand-art"
            aria-label="Jalali Cosmetics"
          >
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
              <article
                className="value-card"
                key={value.number}
              >
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
            <article
              className="service-card"
              key={service.icon}
            >
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

          <Link
            href="/contact"
            className="promise-button"
          >
            ارتباط با پخش جلالی
            <span>←</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
