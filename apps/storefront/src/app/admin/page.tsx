
"use client";

import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";

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
  Store,
  RefreshCw,
  LogOut,
  CheckCircle2,
  LoaderCircle,
  Package,
  ShoppingBag,
  Wallet,
  Users,
  AlertTriangle,
  Save,
  Phone,
  Send,
  TrendingUp,
} from "lucide-react";

// =========================================================
// TYPES
// =========================================================

type Step = "website" | "login";

type AdminUser = {
  id: number;
  username: string;
  isStaff: boolean;
  isSuperuser: boolean;
};

type StoreConfiguration = {
  seller_phone: string;
  seller_telegram: string;
  store_name?: string;
  slogan?: string;
};

type DashboardData = {
  success: boolean;

  dashboard?: {
    generated_at?: string;
    timezone?: string;
    currency?: string;
  };

  overview?: {
    total_products?: number;
    active_products?: number;
    inactive_products?: number;

    total_orders?: number;
    today_orders?: number;
    last_seven_days_orders?: number;
    last_thirty_days_orders?: number;

    total_paid_revenue?: number | string;
    today_revenue?: number | string;
    monthly_revenue?: number | string;
    last_thirty_days_revenue?: number | string;

    total_partner_applications?: number;
    pending_partner_applications?: number;
  };

  products?: {
    total?: number;
    active?: number;
    inactive?: number;
    in_stock?: number;
    out_of_stock?: number;
    low_stock?: number;
  };

  orders?: {
    total?: number;
    today?: number;
    last_seven_days?: number;
    last_thirty_days?: number;

    pending?: number;
    processing?: number;
    shipped?: number;
    delivered?: number;
    cancelled?: number;
  };

  payments?: {
    paid_orders?: number;
    unpaid_orders?: number;
    pending_orders?: number;
    failed_orders?: number;
    refunded_orders?: number;

    total_paid_revenue?: number | string;
    today_revenue?: number | string;
    monthly_revenue?: number | string;
    last_thirty_days_revenue?: number | string;
  };

  wholesale?: {
    total?: number;
    pending?: number;
    approved?: number;
    rejected?: number;
  };

  recent_orders?: Array<{
    id: string;
    order_number: string;
    customer_name: string;
    customer_type: string;
    status: string;
    status_label: string;
    payment_status: string;
    payment_status_label: string;
    total_amount: number | string;
    currency: string;
    created_at: string;
  }>;

  low_stock_products?: Array<{
    id: string;
    name: string;
    sku: string;
    stock_quantity: number;
    public_price: number | string;
    availability: string;
  }>;
};

type ApiResponse<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
};

// =========================================================
// API CONFIGURATION
// =========================================================

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL || ""
).replace(/\/+$/, "");

const AUTH_PATH = "/api/store/admin/auth";
const DASHBOARD_PATH = "/api/store/admin/dashboard/";
const CONFIG_PATH = "/api/store/admin/configuration/";

const WEBSITE_STORAGE_KEY = "jalali_admin_website";

// =========================================================
// API HELPERS
// =========================================================

async function readResponse<T = any>(
  response: Response
): Promise<T> {
  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.success) {
    throw new Error(
      data?.message || `خطای سرور (${response.status})`
    );
  }

  return data as T;
}

function formatNumber(
  value: number | string | undefined | null
) {
  const number = Number(value || 0);

  return new Intl.NumberFormat("fa-IR").format(
    Number.isFinite(number) ? number : 0
  );
}

function formatMoney(
  value: number | string | undefined | null
) {
  return `${formatNumber(value)} تومان`;
}

function formatDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function normalizeWebsite(value: string) {
  let result = value.trim();

  if (!result) return "";

  if (!/^https?:\/\//i.test(result)) {
    result = "https://" + result;
  }

  try {
    const parsed = new URL(result);

    if (
      parsed.protocol !== "https:" &&
      parsed.protocol !== "http:"
    ) {
      return "";
    }

    return parsed.origin;
  } catch {
    return "";
  }
}

// =========================================================
// MAIN ADMIN PAGE
// =========================================================

export default function AdminPage() {
  const [step, setStep] = useState<Step>("website");
  const [website, setWebsite] = useState("");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [successMessage, setSuccessMessage] = useState("");

  const [sessionChecking, setSessionChecking] = useState(true);

  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [dashboardLoading, setDashboardLoading] =
    useState(false);

  const [dashboardError, setDashboardError] = useState("");

  const [configuration, setConfiguration] =
    useState<StoreConfiguration>({
      seller_phone: "",
      seller_telegram: "",
    });

  const [configurationLoading, setConfigurationLoading] =
    useState(false);

  const [configurationSaving, setConfigurationSaving] =
    useState(false);

  const [configurationError, setConfigurationError] =
    useState("");

  const [configurationSuccess, setConfigurationSuccess] =
    useState("");

  // -------------------------------------------------------
  // RESTORE WEBSITE AND ADMIN SESSION
  // -------------------------------------------------------

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        const savedWebsite = localStorage.getItem(
          WEBSITE_STORAGE_KEY
        );

        if (savedWebsite && active) {
          setWebsite(savedWebsite);
          setStep("login");
        }

        if (!API_BASE) {
          return;
        }

        const response = await fetch(
          `${API_BASE}${AUTH_PATH}/me/`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
            headers: {
              Accept: "application/json",
            },
          }
        );

        const data = await response.json().catch(() => null);

        if (
          active &&
          response.ok &&
          data?.success &&
          data?.user
        ) {
          setAdmin(data.user as AdminUser);
          setSuccessMessage(
            "نشست مدیریتی قبلی بازیابی شد."
          );

          await Promise.all([
            loadDashboardInternal(active),
            loadConfigurationInternal(active),
          ]);
        }
      } catch {
        // نبود نشست فعال به معنی خطای غیرعادی نیست.
      } finally {
        if (active) {
          setSessionChecking(false);
        }
      }
    }

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  // -------------------------------------------------------
  // CSRF
  // -------------------------------------------------------

  async function getCsrfToken() {
    if (!API_BASE) {
      throw new Error(
        "آدرس API بک‌اند تنظیم نشده است."
      );
    }

    const response = await fetch(
      `${API_BASE}${AUTH_PATH}/csrf/`,
      {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      }
    );

    const data = await readResponse<{
      success: boolean;
      csrfToken?: string;
    }>(response);

    if (!data.csrfToken) {
      throw new Error(
        "دریافت توکن امنیتی ناموفق بود."
      );
    }

    return data.csrfToken;
  }

  // -------------------------------------------------------
  // DASHBOARD
  // -------------------------------------------------------

  async function loadDashboardInternal(
    active = true
  ) {
    if (!API_BASE) return;

    if (active) {
      setDashboardLoading(true);
      setDashboardError("");
    }

    try {
      const response = await fetch(
        `${API_BASE}${DASHBOARD_PATH}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data = await readResponse<DashboardData>(
        response
      );

      if (active) {
        setDashboard(data);
      }
    } catch (err) {
      if (active) {
        setDashboard(null);

        setDashboardError(
          err instanceof Error
            ? err.message
            : "دریافت اطلاعات داشبورد ناموفق بود."
        );
      }
    } finally {
      if (active) {
        setDashboardLoading(false);
      }
    }
  }

  async function loadDashboard() {
    await loadDashboardInternal(true);
  }

  // -------------------------------------------------------
  // STORE CONFIGURATION
  // -------------------------------------------------------

  async function loadConfigurationInternal(
    active = true
  ) {
    if (!API_BASE) return;

    if (active) {
      setConfigurationLoading(true);
      setConfigurationError("");
    }

    try {
      const response = await fetch(
        `${API_BASE}${CONFIG_PATH}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data = await readResponse<{
        success: boolean;
        data?: StoreConfiguration;
      }>(response);

      if (active) {
        setConfiguration({
          seller_phone:
            data.data?.seller_phone || "",
          seller_telegram:
            data.data?.seller_telegram || "",
          store_name:
            data.data?.store_name || "",
          slogan:
            data.data?.slogan || "",
        });
      }
    } catch (err) {
      if (active) {
        setConfigurationError(
          err instanceof Error
            ? err.message
            : "دریافت تنظیمات فروشگاه ناموفق بود."
        );
      }
    } finally {
      if (active) {
        setConfigurationLoading(false);
      }
    }
  }

  async function loadConfiguration() {
    await loadConfigurationInternal(true);
  }

  async function loadAdminPanel() {
    if (!API_BASE) return;

    await Promise.all([
      loadDashboard(),
      loadConfiguration(),
    ]);
  }

  // -------------------------------------------------------
  // WEBSITE FORM
  // -------------------------------------------------------

  function submitWebsite(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const normalized = normalizeWebsite(website);

    if (!normalized) {
      setError("آدرس سایت معتبر نیست.");
      return;
    }

    setError("");
    setWebsite(normalized);

    localStorage.setItem(
      WEBSITE_STORAGE_KEY,
      normalized
    );

    setStep("login");
  }

  function changeWebsite() {
    setStep("website");
    setPassword("");
    setError("");
    setSuccessMessage("");
  }

  // -------------------------------------------------------
  // ADMIN LOGIN
  // -------------------------------------------------------

  async function submitLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    if (!API_BASE) {
      setError(
        "آدرس API بک‌اند تنظیم نشده است. متغیر NEXT_PUBLIC_API_BASE_URL را در تنظیمات محیطی فرانت‌اند ثبت کن."
      );
      return;
    }

    if (!username.trim() || !password) {
      setError(
        "نام کاربری و رمز عبور را وارد کن."
      );
      return;
    }

    setLoading(true);

    try {
      const csrfToken = await getCsrfToken();

      const loginResponse = await fetch(
        `${API_BASE}${AUTH_PATH}/login/`,
        {
          method: "POST",
          credentials: "include",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-CSRFToken": csrfToken,
          },
          body: JSON.stringify({
            username: username.trim(),
            password,
          }),
        }
      );

      const loginData = await readResponse<{
        success: boolean;
        user: AdminUser;
        message?: string;
      }>(loginResponse);

      if (!loginData.user) {
        throw new Error(
          "اطلاعات حساب مدیر از سرور دریافت نشد."
        );
      }

      setAdmin(loginData.user);
      setPassword("");

      setSuccessMessage(
        "ورود مدیر توسط سرور تأیید شد."
      );

      await loadAdminPanel();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "ارتباط با سرور برقرار نشد."
      );
    } finally {
      setLoading(false);
    }
  }

  // -------------------------------------------------------
  // SAVE SELLER CONFIGURATION
  // -------------------------------------------------------

  async function saveConfiguration(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setConfigurationError("");
    setConfigurationSuccess("");

    const phone = configuration.seller_phone.trim();
    const telegram =
      configuration.seller_telegram.trim();

    if (!phone || !telegram) {
      setConfigurationError(
        "شماره تماس و آیدی تلگرام فروشنده الزامی هستند."
      );
      return;
    }

    if (!API_BASE) {
      setConfigurationError(
        "آدرس API بک‌اند تنظیم نشده است."
      );
      return;
    }

    setConfigurationSaving(true);

    try {
      const csrfToken = await getCsrfToken();

      const response = await fetch(
        `${API_BASE}${CONFIG_PATH}`,
        {
          method: "PATCH",
          credentials: "include",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-CSRFToken": csrfToken,
          },
          body: JSON.stringify({
            seller_phone: phone,
            seller_telegram: telegram,
          }),
        }
      );

      const data = await readResponse<{
        success: boolean;
        message?: string;
        data?: StoreConfiguration;
      }>(response);

      setConfiguration((previous) => ({
        ...previous,
        seller_phone:
          data.data?.seller_phone || phone,
        seller_telegram:
          data.data?.seller_telegram || telegram,
      }));

      setConfigurationSuccess(
        data.message ||
          "اطلاعات فروشنده ذخیره شد."
      );
    } catch (err) {
      setConfigurationError(
        err instanceof Error
          ? err.message
          : "ذخیره تنظیمات ناموفق بود."
      );
    } finally {
      setConfigurationSaving(false);
    }
  }

  // -------------------------------------------------------
  // LOGOUT
  // -------------------------------------------------------

  async function logoutAdmin() {
    if (!API_BASE) return;

    setLoading(true);
    setError("");

    try {
      const csrfToken = await getCsrfToken();

      const response = await fetch(
        `${API_BASE}${AUTH_PATH}/logout/`,
        {
          method: "POST",
          credentials: "include",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-CSRFToken": csrfToken,
          },
          body: JSON.stringify({}),
        }
      );

      await readResponse(response);

      setAdmin(null);
      setDashboard(null);
      setDashboardError("");

      setConfigurationError("");
      setConfigurationSuccess("");

      setSuccessMessage("");
      setError("");
      setPassword("");
      setStep("login");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "خروج از حساب انجام نشد."
      );
    } finally {
      setLoading(false);
    }
  }

  // -------------------------------------------------------
  // DERIVED DATA
  // -------------------------------------------------------

  const overview = dashboard?.overview;
  const products = dashboard?.products;
  const orders = dashboard?.orders;
  const wholesale = dashboard?.wholesale;
  const payments = dashboard?.payments;

  // -------------------------------------------------------
  // LOADING SCREEN
  // -------------------------------------------------------

  if (sessionChecking) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#080808] text-white"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#bd9568]/30 bg-[#bd9568]/10">
            <LoaderCircle
              size={30}
              className="animate-spin text-[#e4bd8c]"
            />
          </div>

          <p className="text-sm text-white/55">
            در حال بررسی نشست مدیریتی...
          </p>

          <span className="text-xs tracking-[4px] text-[#e4bd8c]">
            JALALI
          </span>
        </div>
      </main>
    );
  }

  // =======================================================
  // PAGE
  // =======================================================

  return (
    <main
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-[#080808] px-4 py-8 text-white sm:px-6"
    >
      <div className="pointer-events-none fixed -right-32 -top-32 h-96 w-96 rounded-full bg-[#bd9568]/10 blur-[110px]" />

      <div className="pointer-events-none fixed -bottom-32 -left-32 h-96 w-96 rounded-full bg-[#bd9568]/10 blur-[110px]" />

      <div className="relative mx-auto w-full max-w-6xl">

        {/* HEADER */}

        <header className="mb-8 flex flex-col items-center justify-between gap-5 sm:flex-row">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-[22px] border border-[#e4bd8c]/30 bg-gradient-to-br from-[#f0d1a0] via-[#b98750] to-[#684326] shadow-xl shadow-[#bd9568]/20">
              <span className="font-serif text-4xl font-bold text-black">
                J
              </span>
            </div>

            <div>
              <h1 className="text-3xl font-black tracking-[5px] text-[#e4bd8c]">
                JALALI
              </h1>

              <p className="mt-2 text-xs text-white/45">
                مرکز مدیریت هوشمند فروشگاه
              </p>
            </div>
          </div>

          {admin && (
            <div className="flex flex-wrap items-center justify-center gap-3">
              <div className="rounded-xl border border-[#bd9568]/20 bg-[#141311] px-4 py-3 text-xs">
                <span className="text-white/40">
                  مدیر فعال:
                </span>

                <span className="mr-2 font-bold text-[#e4bd8c]">
                  {admin.username}
                </span>
              </div>

              <button
                type="button"
                onClick={loadAdminPanel}
                disabled={
                  dashboardLoading ||
                  configurationLoading
                }
                className="flex items-center gap-2 rounded-xl border border-[#bd9568]/30 px-4 py-3 text-xs text-[#e4bd8c] transition hover:bg-[#bd9568]/10 disabled:opacity-50"
              >
                <RefreshCw
                  size={15}
                  className={
                    dashboardLoading ||
                    configurationLoading
                      ? "animate-spin"
                      : ""
                  }
                />

                بروزرسانی اطلاعات
              </button>

              <button
                type="button"
                onClick={logoutAdmin}
                disabled={loading}
                className="flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-xs text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
              >
                <LogOut size={15} />
                خروج
              </button>
            </div>
          )}
        </header>

        {/* LOGIN AREA */}

        {!admin ? (
          <section className="mx-auto max-w-lg rounded-[30px] border border-[#bd9568]/25 bg-[#141311]/95 p-6 shadow-2xl shadow-black/50 sm:p-8">

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
                      آدرس سایت مورد مدیریت را وارد کن
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={submitWebsite}
                  className="space-y-5"
                >
                  <div>
                    <label className="mb-2 block text-sm text-white/75">
                      آدرس سایت
                    </label>

                    <div className="flex items-center gap-3 rounded-2xl border border-[#bd9568]/25 bg-black/40 px-4">
                      <Globe
                        size={19}
                        className="shrink-0 text-[#c49a6c]"
                      />

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
                  </div>

                  {error && (
                    <ErrorMessage message={error} />
                  )}

                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-l from-[#e5c18e] to-[#a97845] py-4 font-bold text-black transition hover:brightness-110"
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
                    آدرس API بک‌اند باید جداگانه در متغیر
                    NEXT_PUBLIC_API_BASE_URL تنظیم شده باشد.
                    آدرس واردشده در این مرحله برای شناسایی
                    سایت مورد مدیریت نگهداری می‌شود.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="mb-6 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <ShieldCheck
                      size={25}
                      className="text-[#e4bd8c]"
                    />

                    <div>
                      <h2 className="font-bold">
                        ورود مدیر
                      </h2>

                      <p className="mt-1 text-xs text-white/45">
                        ورود امن به مرکز مدیریت JALALI
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={changeWebsite}
                    className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-white/60 hover:text-[#e4bd8c]"
                  >
                    <RefreshCw size={14} />
                    تغییر سایت
                  </button>
                </div>

                <div className="mb-6 flex items-center gap-3 rounded-2xl border border-[#bd9568]/20 bg-[#bd9568]/[0.07] p-3">
                  <Store
                    size={19}
                    className="shrink-0 text-[#e4bd8c]"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-white/40">
                      سایت انتخاب‌شده
                    </p>

                    <p
                      dir="ltr"
                      className="truncate text-left text-xs text-[#e4bd8c]"
                    >
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

                <form
                  onSubmit={submitLogin}
                  className="space-y-5"
                >
                  <div>
                    <label className="mb-2 block text-sm text-white/70">
                      نام کاربری مدیر
                    </label>

                    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/40 px-4">
                      <UserRound
                        size={19}
                        className="text-[#c49a6c]"
                      />

                      <input
                        value={username}
                        onChange={(event) =>
                          setUsername(event.target.value)
                        }
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
                      <LockKeyhole
                        size={19}
                        className="text-[#c49a6c]"
                      />

                      <input
                        value={password}
                        onChange={(event) =>
                          setPassword(event.target.value)
                        }
                        type={
                          showPassword
                            ? "text"
                            : "password"
                        }
                        placeholder="رمز عبور مدیر"
                        autoComplete="current-password"
                        className="w-full bg-transparent py-4 text-sm outline-none"
                        required
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(!showPassword)
                        }
                        className="text-white/40"
                        aria-label="نمایش یا مخفی کردن رمز"
                      >
                        {showPassword ? (
                          <EyeOff size={19} />
                        ) : (
                          <Eye size={19} />
                        )}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <ErrorMessage message={error} />
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-l from-[#e5c18e] to-[#a97845] py-4 font-bold text-black transition hover:brightness-110 disabled:opacity-60"
                  >
                    {loading ? (
                      <LoaderCircle
                        className="animate-spin"
                        size={19}
                      />
                    ) : (
                      <ArrowLeft size={19} />
                    )}

                    {loading
                      ? "در حال بررسی..."
                      : "ورود به پنل مدیریت"}
                  </button>
                </form>

                <div className="mt-6 rounded-2xl border border-[#bd9568]/15 bg-[#bd9568]/10 p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs font-bold text-[#e4bd8c]">
                    <LockKeyhole size={15} />
                    امنیت حساب مدیر
                  </div>

                  <p className="text-[11px] leading-6 text-white/50">
                    نشست مدیریتی با کوکی سرور نگهداری می‌شود
                    و رمز عبور در مرورگر ذخیره نمی‌شود.
                  </p>
                </div>
              </>
            )}
          </section>
        ) : (

          // =================================================
          // AUTHENTICATED ADMIN PANEL
          // =================================================

          <div className="space-y-7">

            {/* DASHBOARD */}

            <section className="rounded-[26px] border border-[#bd9568]/25 bg-[#141311]/95 p-5 sm:p-7">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <div className="flex items-center gap-2 text-emerald-300">
                    <CheckCircle2 size={20} />

                    <span className="text-sm font-bold">
                      ورود مدیر تأیید شده
                    </span>
                  </div>

                  <h2 className="mt-3 text-xl font-black text-[#e4bd8c]">
                    داشبورد مدیریت JALALI
                  </h2>

                  <p className="mt-2 text-xs text-white/45">
                    {admin.isSuperuser
                      ? "دسترسی مدیر ارشد"
                      : "دسترسی مدیر فروشگاه"}

                    {" · "}

                    {dashboard?.dashboard?.generated_at
                      ? `آخرین بروزرسانی: ${formatDate(
                          dashboard.dashboard.generated_at
                        )}`
                      : "اطلاعات داشبورد هنوز دریافت نشده است."}
                  </p>

                  {dashboard?.dashboard?.timezone && (
                    <p className="mt-1 text-[10px] text-white/30">
                      منطقه زمانی سرور:{" "}
                      {dashboard.dashboard.timezone}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={loadDashboard}
                  disabled={dashboardLoading}
                  className="flex items-center justify-center gap-2 rounded-xl border border-[#bd9568]/30 px-4 py-3 text-xs text-[#e4bd8c] hover:bg-[#bd9568]/10 disabled:opacity-50"
                >
                  <RefreshCw
                    size={15}
                    className={
                      dashboardLoading
                        ? "animate-spin"
                        : ""
                    }
                  />

                  بروزرسانی داشبورد
                </button>
              </div>

              {dashboardError && (
                <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs leading-6 text-red-300">
                  <AlertTriangle
                    size={18}
                    className="mt-0.5 shrink-0"
                  />

                  <div>
                    <p className="font-bold">
                      دریافت داشبورد ناموفق بود
                    </p>

                    <p>{dashboardError}</p>

                    <p className="mt-1 text-red-200/70">
                      مسیر API، نشست مدیر و مجوز دسترسی را بررسی کن.
                    </p>
                  </div>
                </div>
              )}

              {dashboardLoading && !dashboard && (
                <div className="flex items-center justify-center gap-3 py-12 text-sm text-white/50">
                  <LoaderCircle
                    className="animate-spin text-[#e4bd8c]"
                    size={22}
                  />

                  در حال دریافت آمار واقعی فروشگاه...
                </div>
              )}

              {dashboard && (
                <>
                  {/* OVERVIEW CARDS */}

                  <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                      icon={<Package size={21} />}
                      title="کل محصولات"
                      value={formatNumber(
                        overview?.total_products
                      )}
                      detail={`فعال: ${formatNumber(
                        overview?.active_products
                      )}`}
                    />

                    <StatCard
                      icon={<ShoppingBag size={21} />}
                      title="کل سفارش‌ها"
                      value={formatNumber(
                        overview?.total_orders
                      )}
                      detail={`امروز: ${formatNumber(
                        overview?.today_orders
                      )}`}
                    />

                    <StatCard
                      icon={<Wallet size={21} />}
                      title="درآمد پرداخت‌شده"
                      value={formatMoney(
                        overview?.total_paid_revenue
                      )}
                      detail={`امروز: ${formatMoney(
                        overview?.today_revenue
                      )}`}
                    />

                    <StatCard
                      icon={<Users size={21} />}
                      title="درخواست همکاری"
                      value={formatNumber(
                        overview?.total_partner_applications
                      )}
                      detail={`در انتظار: ${formatNumber(
                        overview?.pending_partner_applications
                      )}`}
                    />
                  </div>

                  {/* REVENUE PERIODS */}

                  <div className="mt-6 rounded-2xl border border-[#bd9568]/15 bg-black/20 p-5">
                    <div className="mb-4 flex items-center gap-2 text-[#e4bd8c]">
                      <TrendingUp size={19} />

                      <h3 className="font-bold">
                        گزارش درآمد
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <MiniStat
                        label="درآمد امروز"
                        value={formatMoney(
                          overview?.today_revenue
                        )}
                      />

                      <MiniStat
                        label="درآمد ماه جاری"
                        value={formatMoney(
                          overview?.monthly_revenue
                        )}
                      />

                      <MiniStat
                        label="درآمد ۳۰ روز اخیر"
                        value={formatMoney(
                          overview?.last_thirty_days_revenue
                        )}
                      />
                    </div>
                  </div>

                  {/* ACTIVITY PERIODS */}

                  <div className="mt-6 rounded-2xl border border-[#bd9568]/15 bg-black/20 p-5">
                    <h3 className="mb-4 font-bold text-[#e4bd8c]">
                      روند فعالیت فروشگاه
                    </h3>

                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <MiniStat
                        label="سفارش‌های امروز"
                        value={formatNumber(
                          overview?.today_orders
                        )}
                      />

                      <MiniStat
                        label="سفارش‌های ۷ روز اخیر"
                        value={formatNumber(
                          overview?.last_seven_days_orders
                        )}
                      />

                      <MiniStat
                        label="سفارش‌های ۳۰ روز اخیر"
                        value={formatNumber(
                          overview?.last_thirty_days_orders
                        )}
                      />

                      <MiniStat
                        label="کل سفارش‌ها"
                        value={formatNumber(
                          overview?.total_orders
                        )}
                      />
                    </div>
                  </div>

                  {/* STATUS PANELS */}

                  <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <InfoPanel title="وضعیت محصولات">
                      <InfoLine
                        label="کل محصولات"
                        value={products?.total}
                      />

                      <InfoLine
                        label="فعال"
                        value={products?.active}
                      />

                      <InfoLine
                        label="غیرفعال"
                        value={products?.inactive}
                      />

                      <InfoLine
                        label="موجود در انبار"
                        value={products?.in_stock}
                      />

                      <InfoLine
                        label="ناموجود"
                        value={products?.out_of_stock}
                      />

                      <InfoLine
                        label="موجودی کم"
                        value={products?.low_stock}
                      />
                    </InfoPanel>

                    <InfoPanel title="وضعیت سفارش‌ها">
                      <InfoLine
                        label="کل سفارش‌ها"
                        value={orders?.total}
                      />

                      <InfoLine
                        label="امروز"
                        value={orders?.today}
                      />

                      <InfoLine
                        label="در انتظار"
                        value={orders?.pending}
                      />

                      <InfoLine
                        label="در حال پردازش"
                        value={orders?.processing}
                      />

                      <InfoLine
                        label="ارسال‌شده"
                        value={orders?.shipped}
                      />

                      <InfoLine
                        label="تحویل‌شده"
                        value={orders?.delivered}
                      />

                      <InfoLine
                        label="لغوشده"
                        value={orders?.cancelled}
                      />
                    </InfoPanel>

                    <InfoPanel title="همکاران عمده">
                      <InfoLine
                        label="کل درخواست‌ها"
                        value={wholesale?.total}
                      />

                      <InfoLine
                        label="در انتظار بررسی"
                        value={wholesale?.pending}
                      />

                      <InfoLine
                        label="تأییدشده"
                        value={wholesale?.approved}
                      />

                      <InfoLine
                        label="ردشده"
                        value={wholesale?.rejected}
                      />
                    </InfoPanel>
                  </div>

                  {/* PAYMENTS */}

                  <div className="mt-6 rounded-2xl border border-[#bd9568]/15 bg-black/20 p-5">
                    <div className="mb-4 flex items-center gap-2 text-[#e4bd8c]">
                      <TrendingUp size={19} />

                      <h3 className="font-bold">
                        وضعیت پرداخت‌ها
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                      <MiniStat
                        label="پرداخت‌شده"
                        value={formatNumber(
                          payments?.paid_orders
                        )}
                      />

                      <MiniStat
                        label="پرداخت‌نشده"
                        value={formatNumber(
                          payments?.unpaid_orders
                        )}
                      />

                      <MiniStat
                        label="در انتظار پرداخت"
                        value={formatNumber(
                          payments?.pending_orders
                        )}
                      />

                      <MiniStat
                        label="ناموفق"
                        value={formatNumber(
                          payments?.failed_orders
                        )}
                      />

                      <MiniStat
                        label="مرجوع‌شده"
                        value={formatNumber(
                          payments?.refunded_orders
                        )}
                      />
                    </div>
                  </div>
                </>
              )}
            </section>

            {/* SELLER CONFIGURATION */}

            <section className="rounded-[26px] border border-[#bd9568]/25 bg-[#141311]/95 p-5 sm:p-7">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#bd9568]/20 bg-[#bd9568]/10 text-[#e4bd8c]">
                  <Store size={23} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-[#e4bd8c]">
                    اطلاعات فروشنده
                  </h2>

                  <p className="mt-1 text-xs text-white/45">
                    اطلاعات تماس عمومی فروشگاه
                  </p>
                </div>
              </div>

              {configurationLoading ? (
                <div className="flex items-center gap-3 py-8 text-sm text-white/50">
                  <LoaderCircle
                    className="animate-spin"
                    size={20}
                  />

                  در حال دریافت تنظیمات فروشگاه...
                </div>
              ) : (
                <form
                  onSubmit={saveConfiguration}
                  className="space-y-5"
                >
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 flex items-center gap-2 text-sm text-white/70">
                        <Phone
                          size={16}
                          className="text-[#e4bd8c]"
                        />

                        شماره تماس فروشنده
                      </label>

                      <input
                        value={configuration.seller_phone}
                        onChange={(event) =>
                          setConfiguration({
                            ...configuration,
                            seller_phone:
                              event.target.value,
                          })
                        }
                        type="tel"
                        dir="ltr"
                        placeholder="09194516434"
                        autoComplete="tel"
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-4 text-left text-sm outline-none transition focus:border-[#bd9568]"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-2 flex items-center gap-2 text-sm text-white/70">
                        <Send
                          size={16}
                          className="text-[#e4bd8c]"
                        />

                        آیدی تلگرام فروشنده
                      </label>

                      <input
                        value={configuration.seller_telegram}
                        onChange={(event) =>
                          setConfiguration({
                            ...configuration,
                            seller_telegram:
                              event.target.value,
                          })
                        }
                        type="text"
                        dir="ltr"
                        placeholder="@Amir_jalali110"
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-4 text-left text-sm outline-none transition focus:border-[#bd9568]"
                        required
                      />
                    </div>
                  </div>

                  {configurationError && (
                    <ErrorMessage
                      message={configurationError}
                    />
                  )}

                  {configurationSuccess && (
                    <SuccessMessage
                      message={configurationSuccess}
                    />
                  )}

                  <button
                    type="submit"
                    disabled={configurationSaving}
                    className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-l from-[#e5c18e] to-[#a97845] py-4 font-bold text-black transition hover:brightness-110 disabled:opacity-50 sm:w-auto sm:px-8"
                  >
                    {configurationSaving ? (
                      <LoaderCircle
                        className="animate-spin"
                        size={19}
                      />
                    ) : (
                      <Save size={19} />
                    )}

                    {configurationSaving
                      ? "در حال ذخیره..."
                      : "ذخیره اطلاعات فروشنده"}
                  </button>
                </form>
              )}
            </section>

            {/* RECENT ORDERS */}

            <section className="rounded-[26px] border border-[#bd9568]/25 bg-[#141311]/95 p-5 sm:p-7">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-[#e4bd8c]">
                  آخرین سفارش‌ها
                </h2>

                <span className="text-[10px] text-white/35">
                  حداکثر ۱۰ سفارش اخیر
                </span>
              </div>

              {!dashboard ? (
                <p className="text-sm text-white/40">
                  اطلاعات سفارش‌ها در دسترس نیست.
                </p>
              ) : dashboard.recent_orders?.length ? (
                <div className="space-y-3">
                  {dashboard.recent_orders.map((order) => (
                    <div
                      key={order.id}
                      className="grid grid-cols-1 gap-3 rounded-xl border border-white/10 bg-black/25 p-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-center"
                    >
                      <div>
                        <p className="text-xs text-white/40">
                          شماره سفارش
                        </p>

                        <p className="mt-1 font-bold text-[#e4bd8c]">
                          {order.order_number}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-white/40">
                          مشتری
                        </p>

                        <p className="mt-1 text-sm">
                          {order.customer_name}
                        </p>

                        <p className="mt-1 text-[10px] text-white/35">
                          نوع مشتری:{" "}
                          {order.customer_type || "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-white/40">
                          وضعیت سفارش
                        </p>

                        <p className="mt-1 text-sm">
                          {order.status_label || order.status || "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-white/40">
                          وضعیت پرداخت
                        </p>

                        <p className="mt-1 text-sm">
                          {order.payment_status_label ||
                            order.payment_status ||
                            "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-white/40">
                          مبلغ و تاریخ
                        </p>

                        <p className="mt-1 text-sm font-bold">
                          {formatNumber(order.total_amount)}{" "}
                          {order.currency || "تومان"}
                        </p>

                        <p className="mt-1 text-[10px] text-white/35">
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-white/40">
                  هنوز سفارشی در دیتابیس ثبت نشده است.
                </p>
              )}
            </section>

            {/* LOW STOCK PRODUCTS */}

            <section className="rounded-[26px] border border-[#bd9568]/25 bg-[#141311]/95 p-5 sm:p-7">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-[#e4bd8c]">
                  محصولات با موجودی کم
                </h2>

                <span className="text-[10px] text-white/35">
                  بررسی موجودی انبار
                </span>
              </div>

              {!dashboard ? (
                <p className="text-sm text-white/40">
                  اطلاعات محصولات در دسترس نیست.
                </p>
              ) : dashboard.low_stock_products?.length ? (
                <div className="space-y-3">
                  {dashboard.low_stock_products.map(
                    (product) => (
                      <div
                        key={product.id}
                        className="flex flex-col justify-between gap-3 rounded-xl border border-amber-500/15 bg-amber-500/[0.04] p-4 sm:flex-row sm:items-center"
                      >
                        <div>
                          <p className="font-bold">
                            {product.name}
                          </p>

                          <p className="mt-1 text-xs text-white/40">
                            کد محصول: {product.sku || "—"}
                          </p>

                          <p className="mt-1 text-[10px] text-white/30">
                            وضعیت: {product.availability || "—"}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                          <span className="text-xs text-amber-300">
                            موجودی:{" "}
                            {formatNumber(
                              product.stock_quantity
                            )}
                          </span>

                          <span className="text-xs text-white/60">
                            {formatMoney(
                              product.public_price
                            )}
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="text-sm text-white/40">
                  محصولی با موجودی کم گزارش نشده است.
                </p>
              )}
            </section>

            {error && (
              <ErrorMessage message={error} />
            )}

            {successMessage && (
              <SuccessMessage
                message={successMessage}
              />
            )}
          </div>
        )}

        <footer className="mt-8 text-center text-[10px] tracking-[3px] text-white/25">
          JALALI ADMIN · PRIVATE MANAGEMENT SYSTEM
        </footer>
      </div>
    </main>
  );
}

// =========================================================
// REUSABLE UI COMPONENTS
// =========================================================

function ErrorMessage({
  message,
}: {
  message: string;
}) {
  return (
    <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs leading-6 text-red-300">
      <div className="flex items-start gap-2">
        <AlertTriangle
          size={16}
          className="mt-1 shrink-0"
        />

        <span>{message}</span>
      </div>
    </div>
  );
}

function SuccessMessage({
  message,
}: {
  message: string;
}) {
  return (
    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs leading-6 text-emerald-300">
      <div className="flex items-start gap-2">
        <CheckCircle2
          size={16}
          className="mt-1 shrink-0"
        />

        <span>{message}</span>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  detail,
}: {
  icon: ReactNode;
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-[#bd9568]/20 bg-black/25 p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-white/45">
          {title}
        </span>

        <span className="text-[#e4bd8c]">
          {icon}
        </span>
      </div>

      <p className="mt-4 break-words text-xl font-black text-white">
        {value}
      </p>

      <p className="mt-2 text-[11px] text-white/40">
        {detail}
      </p>
    </div>
  );
}

function InfoPanel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#bd9568]/15 bg-black/20 p-5">
      <h3 className="mb-4 font-bold text-[#e4bd8c]">
        {title}
      </h3>

      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}

function InfoLine({
  label,
  value,
}: {
  label: string;
  value?: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-white/50">
        {label}
      </span>

      <span className="font-bold text-white">
        {formatNumber(value)}
      </span>
    </div>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/25 p-3">
      <p className="text-[10px] leading-5 text-white/40">
        {label}
      </p>

      <p className="mt-2 break-words text-lg font-black text-[#e4bd8c]">
        {value}
      </p>
    </div>
  );
}
