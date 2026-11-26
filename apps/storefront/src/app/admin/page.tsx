
"use client";

import { useState } from "react";
import {
  ShieldCheck,
  LockKeyhole,
  UserRound,
  Eye,
  EyeOff,
  Sparkles,
  ArrowLeft,
  Globe,
  ExternalLink,
  CheckCircle2,
  Store,
  RefreshCw,
} from "lucide-react";

type Step = "website" | "login";

export default function AdminPage() {
  const [step, setStep] = useState<Step>("website");
  const [website, setWebsite] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  function normalizeWebsite(value: string) {
    let result = value.trim();

    if (!result) return "";

    if (!/^https?:\/\//i.test(result)) {
      result = "https://" + result;
    }

    try {
      const parsed = new URL(result);

      if (!["http:", "https:"].includes(parsed.protocol)) {
        return "";
      }

      return parsed.origin;
    } catch {
      return "";
    }
  }

  function submitWebsite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalized = normalizeWebsite(website);

    if (!normalized) {
      setError("آدرس سایت معتبر نیست. آدرس کامل سایت را وارد کن.");
      return;
    }

    setError("");
    setWebsite(normalized);
    localStorage.setItem("jalali_admin_website", normalized);
    setStep("login");
  }

  function changeWebsite() {
    setStep("website");
    setPassword("");
    setError("");
  }

  function submitLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(
      "احراز هویت سرور هنوز به این صفحه متصل نشده است. ورود مدیر تا زمان اتصال امن بک‌اند فعال نیست."
    );
  }

  return (
    <main
      dir="rtl"
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080808] px-4 py-10 text-white"
    >
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#bd9568]/10 blur-[110px]" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-[#bd9568]/10 blur-[110px]" />

      <section className="relative w-full max-w-lg">
        <header className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[26px] border border-[#e4bd8c]/30 bg-gradient-to-br from-[#f0d1a0] via-[#b98750] to-[#684326] shadow-2xl shadow-[#bd9568]/20">
            <span className="font-serif text-5xl font-bold text-black">
              J
            </span>
          </div>

          <h1 className="text-3xl font-black tracking-[6px] text-[#e4bd8c]">
            JALALI
          </h1>

          <p className="mt-3 text-sm text-white/45">
            مرکز مدیریت هوشمند فروشگاه
          </p>

          <div className="mx-auto mt-5 h-px w-24 bg-gradient-to-r from-transparent via-[#bd9568] to-transparent" />
        </header>

        <div className="rounded-[30px] border border-[#bd9568]/25 bg-[#141311]/95 p-6 shadow-2xl shadow-black/50 sm:p-8">
          {step === "website" ? (
            <>
              <div className="mb-7 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#bd9568]/20 bg-[#bd9568]/10 text-[#e4bd8c]">
                  <Globe size={24} />
                </div>

                <div>
                  <h2 className="text-lg font-bold">
                    اتصال فروشگاه
                  </h2>
                  <p className="mt-1 text-xs text-white/45">
                    ابتدا آدرس سایت مورد مدیریت را وارد کن
                  </p>
                </div>
              </div>

              <form onSubmit={submitWebsite} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm text-white/75">
                    آدرس جدید سایت
                  </label>

                  <div className="flex items-center gap-3 rounded-2xl border border-[#bd9568]/25 bg-black/40 px-4 transition focus-within:border-[#e4bd8c]">
                    <Globe size={19} className="shrink-0 text-[#c49a6c]" />

                    <input
                      value={website}
                      onChange={(event) => {
                        setWebsite(event.target.value);
                        setError("");
                      }}
                      type="text"
                      inputMode="url"
                      placeholder="https://example.com"
                      autoComplete="url"
                      className="w-full bg-transparent py-4 text-left text-sm outline-none placeholder:text-white/25"
                      dir="ltr"
                      required
                    />
                  </div>

                  <p className="mt-2 text-[11px] leading-6 text-white/40">
                    آدرس فروشگاه فعلی یا دامنه جدیدی را که می‌خواهی مدیریت کنی وارد کن.
                  </p>
                </div>

                {error && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs leading-6 text-red-300">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-l from-[#e5c18e] to-[#a97845] py-4 font-bold text-black shadow-lg shadow-[#bd9568]/10 transition hover:brightness-110"
                >
                  تأیید آدرس و ادامه
                  <ArrowLeft size={19} />
                </button>
              </form>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-bold text-[#e4bd8c]">
                  <Sparkles size={15} />
                  راهنمای اتصال
                </div>

                <p className="text-[11px] leading-6 text-white/45">
                  ثبت آدرس در این مرحله فقط برای نگهداری تنظیم اولیه پنل در همین مرورگر است. اتصال واقعی به سرور و اعمال تغییرات سایت در مراحل بعدی پیاده‌سازی می‌شود.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="mb-6 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#bd9568]/20 bg-[#bd9568]/10 text-[#e4bd8c]">
                    <ShieldCheck size={24} />
                  </div>

                  <div>
                    <h2 className="font-bold">ورود مدیر</h2>
                    <p className="mt-1 text-xs text-white/45">
                      ورود به مرکز مدیریت JALALI
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={changeWebsite}
                  className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-white/60 transition hover:border-[#bd9568]/40 hover:text-[#e4bd8c]"
                >
                  <RefreshCw size={14} />
                  تغییر سایت
                </button>
              </div>

              <div className="mb-6 flex items-center gap-3 rounded-2xl border border-[#bd9568]/20 bg-[#bd9568]/[0.07] p-3">
                <Store size={19} className="shrink-0 text-[#e4bd8c]" />

                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-white/40">
                    سایت انتخاب‌شده
                  </p>
                  <p dir="ltr" className="truncate text-left text-xs text-[#e4bd8c]">
                    {website}
                  </p>
                </div>

                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="باز کردن سایت"
                  className="text-white/50 hover:text-white"
                >
                  <ExternalLink size={17} />
                </a>
              </div>

              <form onSubmit={submitLogin} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm text-white/70">
                    نام کاربری مدیر
                  </label>

                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/40 px-4">
                    <UserRound size={19} className="text-[#c49a6c]" />

                    <input
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      placeholder="نام کاربری"
                      autoComplete="username"
                      className="w-full bg-transparent py-4 text-sm outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/70">
                    رمز عبور
                  </label>

                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/40 px-4">
                    <LockKeyhole size={19} className="text-[#c49a6c]" />

                    <input
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      type={showPassword ? "text" : "password"}
                      placeholder="رمز عبور مدیر"
                      autoComplete="current-password"
                      className="w-full bg-transparent py-4 text-sm outline-none"
                      required
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-white/40"
                      aria-label="نمایش یا مخفی کردن رمز"
                    >
                      {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs leading-6 text-amber-200">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-l from-[#e5c18e] to-[#a97845] py-4 font-bold text-black shadow-lg shadow-[#bd9568]/10 transition hover:brightness-110"
                >
                  ورود به پنل مدیریت
                  <ArrowLeft size={19} />
                </button>
              </form>

              <div className="mt-6 rounded-2xl border border-[#bd9568]/15 bg-[#bd9568]/10 p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-bold text-[#e4bd8c]">
                  <LockKeyhole size={15} />
                  امنیت حساب مدیر
                </div>

                <p className="text-[11px] leading-6 text-white/50">
                  ورود واقعی باید از طریق احراز هویت امن سرور انجام شود. این فرم هنوز به سیستم ورود بک‌اند متصل نیست و اطلاعات ورود را ارسال نمی‌کند.
                </p>
              </div>
            </>
          )}
        </div>

        <footer className="mt-7 text-center text-[10px] tracking-[3px] text-white/25">
          JALALI ADMIN · PRIVATE MANAGEMENT SYSTEM
        </footer>
      </section>
    </main>
  );
}
