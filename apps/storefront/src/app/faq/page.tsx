
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type FAQItem = {
  id: number;
  category: string;
  question: string;
  answer: string;
};

const categories = [
  "همه سؤالات",
  "خرید و سفارش",
  "قیمت و پرداخت",
  "همکاری تجاری",
  "ارسال و پیگیری",
  "حساب کاربری",
];

const questions: FAQItem[] = [
  {
    id: 1,
    category: "خرید و سفارش",
    question: "چطور می‌توانم از سایت سفارش ثبت کنم؟",
    answer:
      "ابتدا محصولات موردنظر خود را از بخش محصولات انتخاب کنید و به سبد خرید اضافه کنید. سپس وارد سبد خرید شوید و مراحل تسویه‌حساب را تکمیل کنید. ثبت نهایی سفارش پس از اتصال سرویس سفارش‌دهی سرور فعال خواهد شد.",
  },
  {
    id: 2,
    category: "خرید و سفارش",
    question: "آیا فروش محصولات به‌صورت عمده انجام می‌شود؟",
    answer:
      "این فروشگاه با رویکرد عمده‌فروشی طراحی شده است. شرایط حداقل سفارش، تعداد در هر بسته و ضوابط فروش هر محصول باید در صفحه همان محصول یا هنگام ثبت سفارش مشخص شود.",
  },
  {
    id: 3,
    category: "خرید و سفارش",
    question: "آیا امکان سفارش تعداد بالا وجود دارد؟",
    answer:
      "برای سفارش‌های با تعداد بالا می‌توانید درخواست خود را از طریق صفحه تماس با ما ارسال کنید تا شرایط سفارش بررسی شود.",
  },
  {
    id: 4,
    category: "خرید و سفارش",
    question: "چطور محصول موردنظرم را پیدا کنم؟",
    answer:
      "از بخش محصولات می‌توانید با استفاده از جستجو، دسته‌بندی‌ها و فیلترهای موجود محصولات موردنظر خود را پیدا کنید.",
  },
  {
    id: 5,
    category: "قیمت و پرداخت",
    question: "قیمت همکاران چگونه نمایش داده می‌شود؟",
    answer:
      "قیمت اختصاصی همکاران برای حساب‌های تجاری تأییدشده در نظر گرفته شده است. نمایش و محاسبه نهایی این قیمت‌ها پس از اتصال سیستم حساب کاربری و قیمت‌گذاری سرور انجام می‌شود.",
  },
  {
    id: 6,
    category: "قیمت و پرداخت",
    question: "آیا قیمت‌های سایت همیشه به‌روز هستند؟",
    answer:
      "قیمت نهایی باید از اطلاعات سرور دریافت شود. تا زمان تکمیل اتصال API، اطلاعات نمایشی سایت ممکن است نمونه باشند و نباید مبنای پرداخت یا ثبت سفارش واقعی قرار گیرند.",
  },
  {
    id: 7,
    category: "قیمت و پرداخت",
    question: "چه روش‌هایی برای پرداخت وجود دارد؟",
    answer:
      "روش پرداخت نهایی پس از انتخاب و راه‌اندازی درگاه پرداخت معتبر توسط مالک فروشگاه مشخص خواهد شد. تا قبل از اتصال و آزمایش درگاه، پرداخت آنلاین فعال محسوب نمی‌شود.",
  },
  {
    id: 8,
    category: "همکاری تجاری",
    question: "چطور می‌توانم همکار تجاری پخش جلالی شوم؟",
    answer:
      "از صفحه درخواست همکاری وارد فرم مربوطه شوید و اطلاعات کسب‌وکار خود را ثبت کنید. درخواست پس از اتصال API در پنل مدیریت قابل بررسی و تأیید خواهد بود.",
  },
  {
    id: 9,
    category: "همکاری تجاری",
    question: "بعد از ارسال درخواست همکاری چه اتفاقی می‌افتد؟",
    answer:
      "اطلاعات درخواست باید توسط مدیریت بررسی شود. پس از تأیید حساب، دسترسی‌های مربوط به قیمت‌گذاری و امکانات همکاران مطابق سیاست فروشگاه فعال می‌شود.",
  },
  {
    id: 10,
    category: "همکاری تجاری",
    question: "آیا همه حساب‌ها به قیمت همکاران دسترسی دارند؟",
    answer:
      "خیر. دسترسی به قیمت اختصاصی باید به تأیید مدیریت وابسته باشد و برای حساب‌های تأییدنشده فعال نشود.",
  },
  {
    id: 11,
    category: "ارسال و پیگیری",
    question: "ارسال سفارش‌ها چگونه انجام می‌شود؟",
    answer:
      "روش‌های ارسال، هزینه و زمان تحویل باید در زمان نهایی‌سازی سفارش و بر اساس محدوده مقصد و سیاست ارسال فروشگاه مشخص شوند.",
  },
  {
    id: 12,
    category: "ارسال و پیگیری",
    question: "چطور سفارش خود را پیگیری کنم؟",
    answer:
      "پس از راه‌اندازی سیستم سفارش و پنل مشتری، وضعیت سفارش در حساب کاربری نمایش داده خواهد شد. اطلاعات رهگیری نیز در صورت ثبت توسط مدیریت قابل ارائه است.",
  },
  {
    id: 13,
    category: "ارسال و پیگیری",
    question: "اگر محصولی موجود نباشد چه می‌شود؟",
    answer:
      "وضعیت موجودی باید از سرور دریافت شود. محصول ناموجود نباید به‌عنوان کالای قابل سفارش نمایش داده شود. برای اطلاع از تأمین مجدد می‌توانید با مجموعه ارتباط بگیرید.",
  },
  {
    id: 14,
    category: "حساب کاربری",
    question: "چرا باید حساب کاربری ایجاد کنم؟",
    answer:
      "حساب کاربری می‌تواند برای مدیریت اطلاعات مشتری، مشاهده سفارش‌ها، پیگیری خریدها و استفاده از امکانات ویژه همکاران مورد استفاده قرار گیرد.",
  },
  {
    id: 15,
    category: "حساب کاربری",
    question: "چطور اطلاعات حساب خود را تغییر دهم؟",
    answer:
      "پس از فعال شدن بخش حساب کاربری، ویرایش اطلاعات از داخل پروفایل انجام می‌شود. تغییر اطلاعات حساس ممکن است به تأیید هویت نیاز داشته باشد.",
  },
  {
    id: 16,
    category: "حساب کاربری",
    question: "اگر برای سفارش یا حسابم مشکلی پیش بیاید چه کنم؟",
    answer:
      "از طریق صفحه تماس با ما موضوع درخواست، شماره تماس و توضیحات لازم را ارسال کنید تا امکان بررسی درخواست فراهم شود.",
  },
];

export default function FAQPage() {
  const [activeCategory, setActiveCategory] =
    useState("همه سؤالات");

  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<number | null>(1);

  const filteredQuestions = useMemo(() => {
    const term = search.trim().toLowerCase();

    return questions.filter((item) => {
      const categoryMatch =
        activeCategory === "همه سؤالات" ||
        item.category === activeCategory;

      const searchMatch =
        !term ||
        item.question.toLowerCase().includes(term) ||
        item.answer.toLowerCase().includes(term);

      return categoryMatch && searchMatch;
    });
  }, [activeCategory, search]);

  const groupedQuestions = useMemo(() => {
    return categories
      .filter((category) => category !== "همه سؤالات")
      .map((category) => ({
        category,
        items: filteredQuestions.filter(
          (item) => item.category === category
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [filteredQuestions]);

  function toggleQuestion(id: number) {
    setOpenId((current) => (current === id ? null : id));
  }

  return (
    <main className="faq-page" dir="rtl">
      <section className="faq-hero">
        <div className="hero-inner">
          <span className="eyebrow">
            JALALI COSMETICS · HELP CENTER
          </span>

          <h1>
            پاسخ پرسش‌های شما،
            <br />
            در یک مسیر روشن.
          </h1>

          <p>
            پاسخ پرسش‌های متداول درباره خرید عمده، ثبت سفارش،
            همکاری تجاری و خدمات پخش جلالی را اینجا پیدا کنید.
          </p>

          <div className="search-box">
            <span>⌕</span>
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setOpenId(null);
              }}
              placeholder="سؤال یا عبارت موردنظر را جستجو کنید..."
              aria-label="جستجوی سؤالات متداول"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="پاک کردن جستجو"
              >
                ×
              </button>
            )}
          </div>

          <div className="hero-meta">
            <span>{questions.length} پرسش متداول</span>
            <span className="meta-dot" />
            <span>۶ موضوع اصلی</span>
          </div>
        </div>

        <div className="hero-mark">
          <div className="mark-circle">
            <span>?</span>
          </div>
          <span className="mark-caption">JALALI SUPPORT</span>
        </div>
      </section>

      <section className="faq-content">
        <div className="section-title">
          <span>FREQUENTLY ASKED QUESTIONS</span>
          <h2>چه چیزی می‌خواهید بدانید؟</h2>
          <p>
            موضوع موردنظر را انتخاب کنید یا در میان پرسش‌ها جستجو کنید.
          </p>
        </div>

        <div className="category-list">
          {categories.map((category) => {
            const active = activeCategory === category;

            return (
              <button
                key={category}
                type="button"
                className={active ? "category active" : "category"}
                onClick={() => {
                  setActiveCategory(category);
                  setOpenId(null);
                }}
              >
                {category}
              </button>
            );
          })}
        </div>

        <div className="results-header">
          <div>
            <span className="results-label">HELP ARTICLES</span>
            <h3>
              {activeCategory === "همه سؤالات"
                ? "تمام پرسش‌ها"
                : activeCategory}
            </h3>
          </div>

          <span className="results-count">
            {filteredQuestions.length} نتیجه
          </span>
        </div>

        {filteredQuestions.length === 0 ? (
          <div className="empty-state">
            <span>⌕</span>
            <h3>پرسشی پیدا نشد</h3>
            <p>
              عبارت جستجو یا دسته‌بندی انتخاب‌شده را تغییر دهید.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setActiveCategory("همه سؤالات");
              }}
            >
              نمایش همه پرسش‌ها
            </button>
          </div>
        ) : (
          <div className="faq-groups">
            {groupedQuestions.map((group) => (
              <section
                className="faq-group"
                key={group.category}
              >
                {activeCategory === "همه سؤالات" && (
                  <div className="group-heading">
                    <span />
                    <h3>{group.category}</h3>
                    <small>{group.items.length} پرسش</small>
                  </div>
                )}

                <div className="question-list">
                  {group.items.map((item) => {
                    const isOpen = openId === item.id;

                    return (
                      <article
                        className={
                          isOpen
                            ? "question-card opened"
                            : "question-card"
                        }
                        key={item.id}
                      >
                        <button
                          type="button"
                          className="question-trigger"
                          aria-expanded={isOpen}
                          aria-controls={`answer-${item.id}`}
                          onClick={() => toggleQuestion(item.id)}
                        >
                          <span className="question-number">
                            {String(item.id).padStart(2, "0")}
                          </span>

                          <span className="question-text">
                            {item.question}
                          </span>

                          <span className="question-toggle">
                            {isOpen ? "−" : "+"}
                          </span>
                        </button>

                        {isOpen && (
                          <div
                            className="answer"
                            id={`answer-${item.id}`}
                          >
                            <p>{item.answer}</p>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>

      <section className="faq-contact">
        <div className="contact-symbol">J</div>

        <div className="contact-copy">
          <span>NEED MORE HELP?</span>
          <h2>پاسخ پرسش خود را پیدا نکردید؟</h2>
          <p>
            درخواست یا سؤال خود را برای مجموعه ارسال کنید.
          </p>
        </div>

        <Link href="/contact" className="contact-button">
          ارتباط با ما
          <span>←</span>
        </Link>
      </section>

      <style jsx>{`
        .faq-page {
          min-height: 100vh;
          background: #0b0b0d;
          color: #f5f1ee;
          overflow: hidden;
        }

        .faq-hero {
          position: relative;
          display: flex;
          align-items: center;
          min-height: 440px;
          padding: 65px max(7%, calc((100% - 1160px) / 2));
          background:
            radial-gradient(
              circle at 82% 50%,
              rgba(201, 154, 134, 0.13),
              transparent 31%
            ),
            linear-gradient(125deg, #141214, #09090b);
          border-bottom: 1px solid #30282a;
        }

        .hero-inner {
          position: relative;
          z-index: 2;
          width: min(650px, 75%);
        }

        .eyebrow,
        .section-title > span,
        .results-label,
        .contact-copy > span {
          color: #c99a86;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 3px;
        }

        .hero-inner h1 {
          margin: 24px 0 15px;
          font-size: clamp(34px, 5vw, 57px);
          line-height: 1.6;
          font-weight: 900;
          letter-spacing: -1.5px;
        }

        .hero-inner > p {
          max-width: 550px;
          color: #aaa19e;
          font-size: 13px;
          line-height: 2.4;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 13px;
          max-width: 560px;
          height: 58px;
          margin-top: 27px;
          padding: 0 18px;
          background: #19181b;
          border: 1px solid #51403a;
          border-radius: 6px;
        }

        .search-box > span {
          color: #c99a86;
          font-size: 28px;
        }

        .search-box input {
          flex: 1;
          min-width: 0;
          height: 100%;
          border: none;
          outline: none;
          background: transparent;
          color: #f5f1ee;
          font: inherit;
          font-size: 12px;
        }

        .search-box input::placeholder {
          color: #817a77;
        }

        .search-box button {
          border: none;
          background: transparent;
          color: #c99a86;
          font-size: 23px;
          cursor: pointer;
        }

        .hero-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 18px;
          color: #938b88;
          font-size: 10px;
        }

        .meta-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #c99a86;
        }

        .hero-mark {
          position: absolute;
          left: 10%;
          top: 50%;
          transform: translateY(-50%);
          width: 260px;
          height: 260px;
          display: grid;
          place-items: center;
        }

        .mark-circle {
          width: 190px;
          height: 190px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(201, 154, 134, 0.5);
          border-radius: 50%;
          box-shadow:
            0 0 0 18px rgba(201, 154, 134, 0.035),
            0 0 0 38px rgba(201, 154, 134, 0.025);
          background: radial-gradient(circle, #28201e, #100f10);
        }

        .mark-circle span {
          color: #c99a86;
          font-family: Georgia, serif;
          font-size: 125px;
        }

        .mark-caption {
          position: absolute;
          bottom: 0;
          color: #a78374;
          font-size: 9px;
          letter-spacing: 4px;
        }

        .faq-content {
          max-width: 1000px;
          width: 88%;
          margin: auto;
          padding: 85px 0 95px;
        }

        .section-title {
          text-align: center;
          margin-bottom: 35px;
        }

        .section-title h2 {
          margin: 14px 0 9px;
          font-size: clamp(25px, 3.5vw, 36px);
        }

        .section-title p {
          color: #99918e;
          font-size: 12px;
          line-height: 2;
        }

        .category-list {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 9px;
          margin-bottom: 55px;
        }

        .category {
          min-height: 42px;
          padding: 0 17px;
          border: 1px solid #343034;
          border-radius: 4px;
          background: #151518;
          color: #aaa19e;
          font: inherit;
          font-size: 11px;
          cursor: pointer;
          transition: 0.2s;
        }

        .category:hover,
        .category.active {
          color: #e4c1b1;
          border-color: #a47b6b;
          background: #241c1b;
        }

        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 20px;
          border-bottom: 1px solid #302a2c;
        }

        .results-header h3 {
          margin: 8px 0 0;
          font-size: 19px;
        }

        .results-count {
          color: #c99a86;
          font-size: 11px;
        }

        .faq-group {
          margin-top: 30px;
        }

        .group-heading {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 13px;
        }

        .group-heading > span {
          width: 4px;
          height: 22px;
          background: #c99a86;
        }

        .group-heading h3 {
          margin: 0;
          font-size: 15px;
        }

        .group-heading small {
          margin-right: auto;
          color: #827a77;
          font-size: 10px;
        }

        .question-list {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .question-card {
          background: #151518;
          border: 1px solid #302c2e;
          border-radius: 6px;
          overflow: hidden;
          transition: border-color 0.2s;
        }

        .question-card.opened {
          border-color: #846456;
          background: #191719;
        }

        .question-trigger {
          width: 100%;
          min-height: 68px;
          display: flex;
          align-items: center;
          gap: 17px;
          padding: 14px 19px;
          border: none;
          background: transparent;
          color: #f5f1ee;
          text-align: right;
          cursor: pointer;
          font: inherit;
        }

        .question-number {
          flex: 0 0 30px;
          color: #b48c7b;
          font-size: 10px;
          letter-spacing: 1px;
        }

        .question-text {
          flex: 1;
          font-size: 13px;
          font-weight: 700;
          line-height: 2;
        }

        .question-toggle {
          flex: 0 0 30px;
          width: 30px;
          height: 30px;
          display: grid;
          place-items: center;
          border: 1px solid #55423b;
          border-radius: 50%;
          color: #c99a86;
          font-size: 20px;
        }

        .answer {
          padding: 0 66px 22px;
        }

        .answer p {
          margin: 0;
          color: #aaa19e;
          font-size: 12px;
          line-height: 2.5;
        }

        .empty-state {
          padding: 60px 20px;
          text-align: center;
          border: 1px dashed #51413b;
          border-radius: 8px;
          margin-top: 25px;
        }

        .empty-state > span {
          color: #c99a86;
          font-size: 42px;
        }

        .empty-state h3 {
          font-size: 18px;
        }

        .empty-state p {
          color: #99918e;
          font-size: 12px;
        }

        .empty-state button {
          margin-top: 15px;
          padding: 12px 18px;
          border: 1px solid #987464;
          background: #211a19;
          color: #e3b7a5;
          border-radius: 4px;
          cursor: pointer;
        }

        .faq-contact {
          width: min(1000px, 88%);
          margin: 0 auto 85px;
          padding: 34px;
          display: flex;
          align-items: center;
          gap: 25px;
          background: linear-gradient(110deg, #211a18, #151416);
          border: 1px solid #554139;
          border-radius: 8px;
        }

        .contact-symbol {
          flex: 0 0 68px;
          height: 68px;
          display: grid;
          place-items: center;
          border: 1px solid #9b7566;
          border-radius: 50%;
          color: #c99a86;
          font-family: Georgia, serif;
          font-size: 43px;
        }

        .contact-copy {
          flex: 1;
        }

        .contact-copy h2 {
          margin: 9px 0;
          font-size: 20px;
        }

        .contact-copy p {
          margin: 0;
          color: #a69d99;
          font-size: 11px;
        }

        .contact-button {
          flex-shrink: 0;
          min-height: 47px;
          padding: 0 19px;
          display: flex;
          align-items: center;
          gap: 15px;
          background: #c99a86;
          color: #15100e;
          text-decoration: none;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 900;
        }

        @media (max-width: 850px) {
          .hero-mark {
            left: 3%;
            opacity: 0.45;
            transform: translateY(-50%) scale(0.8);
          }

          .hero-inner {
            width: 90%;
          }

          .faq-contact {
            flex-wrap: wrap;
          }

          .contact-copy {
            min-width: 65%;
          }

          .contact-button {
            margin-right: 93px;
          }
        }

        @media (max-width: 550px) {
          .faq-hero {
            min-height: 410px;
            padding: 55px 6%;
          }

          .hero-mark {
            left: -80px;
            opacity: 0.16;
            transform: translateY(-50%) scale(0.75);
          }

          .hero-inner {
            width: 100%;
          }

          .hero-inner h1 {
            font-size: 36px;
          }

          .hero-inner > p {
            font-size: 12px;
          }

          .search-box {
            height: 53px;
          }

          .faq-content {
            padding: 65px 0;
          }

          .category-list {
            justify-content: flex-start;
            margin-bottom: 38px;
          }

          .category {
            padding: 0 12px;
            font-size: 10px;
          }

          .question-trigger {
            gap: 10px;
            padding: 12px;
          }

          .question-text {
            font-size: 11px;
          }

          .answer {
            padding: 0 52px 18px;
          }

          .answer p {
            font-size: 11px;
          }

          .faq-contact {
            padding: 23px 18px;
            margin-bottom: 55px;
            gap: 15px;
          }

          .contact-symbol {
            flex-basis: 48px;
            height: 48px;
            font-size: 30px;
          }

          .contact-copy {
            min-width: 65%;
          }

          .contact-copy h2 {
            font-size: 15px;
          }

          .contact-button {
            width: 100%;
            justify-content: center;
            margin: 5px 0 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            transition: none !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>
    </main>
  );
}
