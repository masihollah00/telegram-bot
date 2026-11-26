
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
} from "lucide-react";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main dir="rtl" className="min-h-screen bg-[#090909] text-white flex items-center justify-center px-5 py-12 relative overflow-hidden">
      <div className="absolute w-80 h-80 bg-[#bd8b55]/10 blur-[120px] rounded-full top-0 right-0" />
      <div className="absolute w-80 h-80 bg-[#bd8b55]/10 blur-[120px] rounded-full bottom-0 left-0" />

      <section className="relative w-full max-w-md">
        <header className="text-center mb-9">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#f0d1a0] via-[#b98750] to-[#684326] flex items-center justify-center mx-auto shadow-2xl shadow-[#bd8b55]/20 mb-5">
            <span className="text-5xl font-serif text-black">J</span>
          </div>

          <h1 className="text-3xl font-bold tracking-[5px] text-[#e4bd8c]">
            JALALI
          </h1>

          <p className="text-white/50 mt-3 text-sm">
            مرکز مدیریت هوشمند فروشگاه
          </p>
        </header>

        <div className="rounded-[30px] border border-[#bd9568]/25 bg-[#151412]/95 p-7 shadow-2xl">
          <div className="flex items-center gap-3 mb-7">
            <div className="w-11 h-11 rounded-2xl bg-[#bd9568]/15 flex items-center justify-center text-[#e4bd8c]">
              <ShieldCheck size={23} />
            </div>
            <div>
              <h2 className="font-bold text-lg">ورود مدیر</h2>
              <p className="text-xs text-white/40 mt-1">
                به فضای اختصاصی مدیریت وارد شو
              </p>
            </div>
          </div>

          <form onSubmit={(event) => event.preventDefault()} className="space-y-5">
            <div>
              <label className="block text-sm text-white/70 mb-2">
                نام کاربری مدیر
              </label>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/40 px-4">
                <UserRound size={19} className="text-[#c49a6c]" />
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="نام کاربری"
                  autoComplete="username"
                  className="w-full bg-transparent py-4 outline-none text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-2">
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
                  className="w-full bg-transparent py-4 outline-none text-sm"
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

            <button
              type="submit"
              className="w-full rounded-2xl bg-gradient-to-l from-[#e5c18e] to-[#a97845] text-black font-bold py-4 flex items-center justify-center gap-3 shadow-lg shadow-[#bd9568]/10"
            >
              ورود به پنل مدیریت
              <ArrowLeft size={19} />
            </button>
          </form>

          <div className="mt-6 rounded-2xl bg-[#bd9568]/10 border border-[#bd9568]/15 p-4">
            <div className="flex items-center gap-2 text-[#e4bd8c] text-xs font-bold mb-2">
              <Sparkles size={15} />
              امنیت حساب مدیر
            </div>
            <p className="text-[11px] text-white/50 leading-6">
              ورود واقعی پس از اتصال این صفحه به احراز هویت امن سرور فعال می‌شود.
              اطلاعات ورود در این مرحله ارسال یا ذخیره نمی‌شوند.
            </p>
          </div>
        </div>

        <footer className="text-center text-[11px] text-white/30 mt-7 tracking-widest">
          JALALI ADMIN · PRIVATE MANAGEMENT
        </footer>
      </section>
    </main>
  );
}
