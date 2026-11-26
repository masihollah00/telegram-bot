
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  ImagePlus,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  X,
  Save,
  AlertTriangle,
  Globe,
} from "lucide-react";

type Brand = {
  id: number | string;
  name: string;
  slug: string;
  description: string;
  logo: string | null;
  website: string;
  is_active: boolean;
  created_at?: string;
};

type BrandForm = {
  name: string;
  slug: string;
  description: string;
  website: string;
  is_active: boolean;
};

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL || ""
).replace(/\/+$/, "");

const AUTH_PATH = "/api/store/admin/auth";
const BRANDS_PATH = "/api/admin/store/products/brands/";

const EMPTY_FORM: BrandForm = {
  name: "",
  slug: "",
  description: "",
  website: "",
  is_active: true,
};

async function parseResponse(response: Response): Promise<any> {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const detail =
      data?.detail ||
      data?.message ||
      data?.error ||
      (data && typeof data === "object"
        ? Object.values(data).flat().join(" ")
        : "");

    throw new Error(
      String(detail || `خطای سرور (${response.status})`)
    );
  }

  return data;
}

function extractList(data: any): Brand[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.results)) return data.data.results;
  return [];
}

function imageUrl(value: string | null) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;

  return `${API_BASE}${value.startsWith("/") ? "" : "/"}${value}`;
}

function normalizeWebsite(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  return /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
}

function validWebsite(value: string) {
  if (!value.trim()) return true;

  try {
    const url = new URL(normalizeWebsite(value));
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function faNumber(value: number) {
  return new Intl.NumberFormat("fa-IR").format(value || 0);
}

export default function AdminBrandsPage() {
  const [admin, setAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [form, setForm] = useState<BrandForm>(EMPTY_FORM);

  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deletingId, setDeletingId] = useState<string | number | null>(
    null
  );

  const getCsrfToken = useCallback(async () => {
    if (!API_BASE) {
      throw new Error("آدرس API بک‌اند تنظیم نشده است.");
    }

    const response = await fetch(
      `${API_BASE}${AUTH_PATH}/csrf/`,
      {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: { Accept: "application/json" },
      }
    );

    const data = await parseResponse(response);

    if (!data?.success || !data?.csrfToken) {
      throw new Error("دریافت توکن امنیتی ناموفق بود.");
    }

    return data.csrfToken as string;
  }, []);

  const loadBrands = useCallback(async () => {
    if (!API_BASE) {
      setError("آدرس API بک‌اند تنظیم نشده است.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE}${BRANDS_PATH}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          headers: { Accept: "application/json" },
        }
      );

      const data = await parseResponse(response);
      setBrands(extractList(data));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "دریافت برندها ناموفق بود."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        if (!API_BASE) {
          throw new Error("آدرس API بک‌اند تنظیم نشده است.");
        }

        const response = await fetch(
          `${API_BASE}${AUTH_PATH}/me/`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
            headers: { Accept: "application/json" },
          }
        );

        const data = await parseResponse(response);

        if (!data?.success || !data?.user) {
          throw new Error("نشست مدیریتی معتبر نیست.");
        }

        if (active) setAdmin(true);
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "دسترسی مدیریتی تأیید نشد."
          );
        }
      } finally {
        if (active) setChecking(false);
      }
    }

    checkSession();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (admin) loadBrands();
  }, [admin, loadBrands]);

  useEffect(() => {
    return () => {
      if (logoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  const activeCount = brands.filter((brand) => brand.is_active).length;
  const inactiveCount = brands.length - activeCount;

  const filteredBrands = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();

    return brands.filter((brand) => {
      const matchesSearch =
        !query ||
        brand.name.toLocaleLowerCase().includes(query) ||
        brand.slug.toLocaleLowerCase().includes(query) ||
        (brand.description || "").toLocaleLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && brand.is_active) ||
        (statusFilter === "inactive" && !brand.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [brands, search, statusFilter]);

  function updateForm<K extends keyof BrandForm>(
    key: K,
    value: BrandForm[K]
  ) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  function clearLogo() {
    setLogoPreview((previous) => {
      if (previous.startsWith("blob:")) {
        URL.revokeObjectURL(previous);
      }
      return "";
    });

    setSelectedLogo(null);
  }

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    clearLogo();
    setError("");
    setModalOpen(true);
  }

  function openEdit(brand: Brand) {
    setEditing(brand);

    setForm({
      name: brand.name || "",
      slug: brand.slug || "",
      description: brand.description || "",
      website: brand.website || "",
      is_active: brand.is_active,
    });

    clearLogo();

    if (brand.logo) {
      setLogoPreview(imageUrl(brand.logo));
    }

    setError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    clearLogo();
  }

  function handleLogoSelection(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("فایل انتخاب‌شده باید تصویر باشد.");
      event.target.value = "";
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError("حجم لوگو نباید بیشتر از ۸ مگابایت باشد.");
      event.target.value = "";
      return;
    }

    clearLogo();
    setSelectedLogo(file);
    setLogoPreview(URL.createObjectURL(file));
    setError("");
  }

  async function saveBrand(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("نام برند الزامی است.");
      return;
    }

    if (!form.slug.trim()) {
      setError("شناسه آدرس برند الزامی است.");
      return;
    }

    if (!validWebsite(form.website)) {
      setError("آدرس وب‌سایت معتبر نیست.");
      return;
    }

    setSaving(true);

    try {
      const csrfToken = await getCsrfToken();
      const body = new FormData();

      body.append("name", form.name.trim());
      body.append("slug", form.slug.trim());
      body.append("description", form.description.trim());
      body.append("website", normalizeWebsite(form.website));
      body.append("is_active", String(form.is_active));

      if (selectedLogo) {
        body.append("logo", selectedLogo);
      }

      const endpoint = editing
        ? `${BRANDS_PATH}${editing.id}/`
        : BRANDS_PATH;

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: editing ? "PATCH" : "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "X-CSRFToken": csrfToken,
        },
        body,
      });

      await parseResponse(response);

      setModalOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      clearLogo();

      setSuccess(
        editing
          ? "اطلاعات برند با موفقیت ویرایش شد."
          : "برند جدید با موفقیت ثبت شد."
      );

      await loadBrands();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "ذخیره اطلاعات برند ناموفق بود."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteBrand(brand: Brand) {
    const confirmed = window.confirm(
      `آیا از حذف برند «${brand.name}» مطمئن هستی؟`
    );

    if (!confirmed) return;

    setDeletingId(brand.id);
    setError("");
    setSuccess("");

    try {
      const csrfToken = await getCsrfToken();

      const response = await fetch(
        `${API_BASE}${BRANDS_PATH}${brand.id}/`,
        {
          method: "DELETE",
          credentials: "include",
          cache: "no-store",
          headers: {
            Accept: "application/json",
            "X-CSRFToken": csrfToken,
          },
        }
      );

      if (!response.ok) {
        await parseResponse(response);
      }

      setSuccess("برند حذف شد.");
      await loadBrands();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "حذف برند انجام نشد."
      );
    } finally {
      setDeletingId(null);
    }
  }

  if (checking) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#080808] text-white"
      >
        <div className="flex flex-col items-center gap-4">
          <LoaderCircle
            size={34}
            className="animate-spin text-[#e4bd8c]"
          />
          <p className="text-sm text-white/45">
            در حال بررسی دسترسی مدیریتی...
          </p>
          <span className="text-xs tracking-[5px] text-[#e4bd8c]">
            JALALI
          </span>
        </div>
      </main>
    );
  }

  if (!admin) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#080808] px-5 text-white"
      >
        <div className="w-full max-w-md rounded-3xl border border-red-500/20 bg-[#141311] p-7 text-center">
          <ShieldCheck
            size={38}
            className="mx-auto mb-4 text-red-300"
          />
          <h1 className="text-lg font-bold">
            دسترسی مدیریتی تأیید نشد
          </h1>
          <p className="mt-3 text-sm leading-7 text-white/50">
            برای مشاهده این صفحه ابتدا وارد پنل مدیریت شو.
          </p>
          {error && (
            <p className="mt-4 text-xs leading-6 text-red-300">
              {error}
            </p>
          )}
          <a
            href="/admin"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#bd9568] px-6 py-3 text-sm font-bold text-black"
          >
            <ArrowRight size={17} />
            بازگشت به مدیریت
          </a>
        </div>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-[#080808] px-4 py-7 text-white sm:px-6 lg:px-9"
    >
      <div className="pointer-events-none fixed -right-32 -top-32 h-96 w-96 rounded-full bg-[#bd9568]/10 blur-[110px]" />
      <div className="pointer-events-none fixed -bottom-32 -left-32 h-96 w-96 rounded-full bg-[#bd9568]/10 blur-[110px]" />

      <div className="relative mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col justify-between gap-5 border-b border-white/10 pb-7 sm:flex-row sm:items-center">
          <div>
            <a
              href="/admin"
              className="mb-4 inline-flex items-center gap-2 text-xs text-white/45 transition hover:text-[#e4bd8c]"
            >
              <ArrowRight size={15} />
              بازگشت به داشبورد مدیریت
            </a>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#bd9568]/30 bg-[#bd9568]/10 text-[#e4bd8c]">
                <Award size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-black sm:text-3xl">
                  مدیریت برندها
                </h1>
                <p className="mt-1 text-xs text-white/40">
                  مدیریت هویت و اطلاعات برندهای فروشگاه JALALI
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={loadBrands}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-white/70 transition hover:bg-white/[0.07] disabled:opacity-40"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              بروزرسانی
            </button>

            <button
              type="button"
              onClick={openCreate}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-l from-[#e5c18e] to-[#a97845] px-5 py-3 text-xs font-black text-black transition hover:brightness-110"
            >
              <Plus size={17} />
              افزودن برند جدید
            </button>
          </div>
        </header>

        {error && !modalOpen && (
          <Notice
            type="error"
            message={error}
            onClose={() => setError("")}
          />
        )}

        {success && (
          <Notice
            type="success"
            message={success}
            onClose={() => setSuccess("")}
          />
        )}

        <section className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard
            icon={<Award size={20} />}
            title="کل برندها"
            value={faNumber(brands.length)}
          />
          <SummaryCard
            icon={<Eye size={20} />}
            title="برندهای فعال"
            value={faNumber(activeCount)}
          />
          <SummaryCard
            icon={<EyeOff size={20} />}
            title="برندهای غیرفعال"
            value={faNumber(inactiveCount)}
          />
        </section>

        <section className="rounded-3xl border border-[#bd9568]/15 bg-[#12110f] p-4 sm:p-6">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-bold">
                فهرست برندها
              </h2>
              <p className="mt-1 text-xs text-white/35">
                جست‌وجو، بررسی و مدیریت برندهای ثبت‌شده
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="relative">
                <Search
                  size={17}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/35"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="جست‌وجوی نام یا شناسه برند..."
                  className="admin-input pr-10"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="admin-input"
              >
                <option value="all">تمام وضعیت‌ها</option>
                <option value="active">فقط فعال</option>
                <option value="inactive">فقط غیرفعال</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-56 flex-col items-center justify-center gap-4">
              <LoaderCircle
                size={30}
                className="animate-spin text-[#e4bd8c]"
              />
              <p className="text-xs text-white/40">
                در حال دریافت برندها...
              </p>
            </div>
          ) : filteredBrands.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 px-5 text-center">
              <Award
                size={38}
                className="mb-4 text-[#bd9568]/60"
              />
              <h3 className="text-sm font-bold">
                برندی پیدا نشد
              </h3>
              <p className="mt-2 max-w-sm text-xs leading-6 text-white/35">
                جست‌وجو یا فیلتر را تغییر بده یا یک برند جدید ثبت کن.
              </p>
              <button
                type="button"
                onClick={openCreate}
                className="mt-5 rounded-xl border border-[#bd9568]/30 px-5 py-3 text-xs text-[#e4bd8c] transition hover:bg-[#bd9568]/10"
              >
                افزودن برند
              </button>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[760px] border-collapse text-right">
                  <thead>
                    <tr className="border-b border-white/10 text-[11px] text-white/40">
                      <th className="px-3 py-4 font-medium">برند</th>
                      <th className="px-3 py-4 font-medium">شناسه آدرس</th>
                      <th className="px-3 py-4 font-medium">وب‌سایت</th>
                      <th className="px-3 py-4 font-medium">وضعیت</th>
                      <th className="px-3 py-4 text-left font-medium">عملیات</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredBrands.map((brand) => (
                      <tr
                        key={brand.id}
                        className="border-b border-white/[0.06] transition hover:bg-white/[0.025]"
                      >
                        <td className="px-3 py-4">
                          <div className="flex items-center gap-3">
                            <BrandLogo
                              logo={brand.logo}
                              name={brand.name}
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-white/85">
                                {brand.name}
                              </p>
                              <p className="mt-1 max-w-xs truncate text-[10px] text-white/35">
                                {brand.description || "بدون توضیحات"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-4">
                          <span className="rounded-lg bg-black/30 px-3 py-2 text-[11px] text-white/50">
                            {brand.slug}
                          </span>
                        </td>

                        <td className="px-3 py-4">
                          {brand.website ? (
                            <a
                              href={normalizeWebsite(brand.website)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-[#e4bd8c] hover:underline"
                            >
                              <Globe size={13} />
                              مشاهده وب‌سایت
                              <ExternalLink size={11} />
                            </a>
                          ) : (
                            <span className="text-[11px] text-white/30">
                              ثبت نشده
                            </span>
                          )}
                        </td>

                        <td className="px-3 py-4">
                          <StatusBadge active={brand.is_active} />
                        </td>

                        <td className="px-3 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEdit(brand)}
                              title="ویرایش برند"
                              className="rounded-lg border border-[#bd9568]/20 p-2.5 text-[#e4bd8c] transition hover:bg-[#bd9568]/10"
                            >
                              <Edit3 size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() => deleteBrand(brand)}
                              disabled={deletingId === brand.id}
                              title="حذف برند"
                              className="rounded-lg border border-red-500/20 p-2.5 text-red-300 transition hover:bg-red-500/10 disabled:opacity-40"
                            >
                              {deletingId === brand.id ? (
                                <LoaderCircle
                                  size={16}
                                  className="animate-spin"
                                />
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 gap-3 lg:hidden">
                {filteredBrands.map((brand) => (
                  <article
                    key={brand.id}
                    className="rounded-2xl border border-white/[0.08] bg-black/20 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <BrandLogo
                        logo={brand.logo}
                        name={brand.name}
                        large
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold">
                            {brand.name}
                          </h3>
                          <StatusBadge active={brand.is_active} />
                        </div>

                        <p className="mt-2 break-all text-[10px] text-white/35">
                          {brand.slug}
                        </p>

                        <p className="mt-2 text-xs leading-6 text-white/45">
                          {brand.description || "بدون توضیحات"}
                        </p>

                        {brand.website && (
                          <a
                            href={normalizeWebsite(brand.website)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-flex items-center gap-2 text-[11px] text-[#e4bd8c]"
                          >
                            <Globe size={13} />
                            وب‌سایت رسمی
                            <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2 border-t border-white/[0.07] pt-3">
                      <button
                        type="button"
                        onClick={() => openEdit(brand)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#bd9568]/25 py-3 text-xs text-[#e4bd8c]"
                      >
                        <Edit3 size={15} />
                        ویرایش
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteBrand(brand)}
                        disabled={deletingId === brand.id}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/20 py-3 text-xs text-red-300 disabled:opacity-40"
                      >
                        <Trash2 size={15} />
                        حذف
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-4">
            <p className="text-[11px] text-white/35">
              نمایش {faNumber(filteredBrands.length)} مورد از{" "}
              {faNumber(brands.length)} برند
            </p>

            <button
              type="button"
              onClick={loadBrands}
              disabled={loading}
              className="inline-flex items-center gap-2 text-[11px] text-[#e4bd8c] disabled:opacity-40"
            >
              <RefreshCw size={14} />
              دریافت آخرین اطلاعات
            </button>
          </div>
        </section>

        <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 text-[10px] text-white/25">
          <span>JALALI · ADMINISTRATION</span>
          <span>مدیریت برندهای محصولات</span>
        </footer>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 px-3 py-6 backdrop-blur-sm sm:items-center"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div className="my-auto w-full max-w-3xl overflow-hidden rounded-3xl border border-[#bd9568]/25 bg-[#141311] shadow-2xl shadow-black/60">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-5 sm:px-7">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#bd9568]/10 text-[#e4bd8c]">
                  {editing ? <Edit3 size={20} /> : <Award size={20} />}
                </div>

                <div>
                  <h2 className="text-base font-black">
                    {editing ? "ویرایش برند" : "ثبت برند جدید"}
                  </h2>
                  <p className="mt-1 text-[10px] text-white/35">
                    اطلاعات هویتی و رسانه‌ای برند
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-xl border border-white/10 p-2 text-white/50 transition hover:bg-white/5"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={saveBrand} className="space-y-7 p-5 sm:p-7">
              {error && (
                <Notice
                  type="error"
                  message={error}
                  onClose={() => setError("")}
                />
              )}

              <FormSection
                title="اطلاعات اصلی برند"
                icon={<Award size={18} />}
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="نام برند" required>
                    <input
                      value={form.name}
                      onChange={(event) =>
                        updateForm("name", event.target.value)
                      }
                      className="admin-input"
                      placeholder="نام برند"
                      maxLength={150}
                      required
                    />
                  </Field>

                  <Field label="شناسه آدرس (Slug)" required>
                    <input
                      value={form.slug}
                      onChange={(event) =>
                        updateForm("slug", event.target.value)
                      }
                      className="admin-input text-left"
                      dir="ltr"
                      placeholder="brand-name"
                      maxLength={180}
                      required
                    />
                  </Field>
                </div>

                <div className="mt-4">
                  <Field label="توضیحات برند">
                    <textarea
                      value={form.description}
                      onChange={(event) =>
                        updateForm("description", event.target.value)
                      }
                      className="admin-input min-h-28 resize-y"
                      placeholder="معرفی و توضیحات برند..."
                    />
                  </Field>
                </div>

                <div className="mt-4">
                  <Field label="وب‌سایت رسمی">
                    <input
                      value={form.website}
                      onChange={(event) =>
                        updateForm("website", event.target.value)
                      }
                      className="admin-input text-left"
                      dir="ltr"
                      placeholder="https://example.com"
                      type="text"
                    />
                  </Field>
                  <p className="mt-2 text-[10px] text-white/30">
                    در صورت وارد نکردن پروتکل، HTTPS به‌صورت خودکار اضافه می‌شود.
                  </p>
                </div>

                <label className="mt-5 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3.5">
                  <span>
                    <span className="block text-xs font-bold">
                      فعال در فروشگاه
                    </span>
                    <span className="mt-1 block text-[10px] text-white/35">
                      اجازه نمایش برند در بخش عمومی سایت
                    </span>
                  </span>

                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(event) =>
                      updateForm("is_active", event.target.checked)
                    }
                    className="h-5 w-5 accent-[#bd9568]"
                  />
                </label>
              </FormSection>

              <FormSection
                title="لوگوی برند"
                icon={<ImagePlus size={18} />}
              >
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-[180px_1fr]">
                  <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/30 p-3">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="پیش‌نمایش لوگو"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-white/25">
                        <Award size={38} />
                        <span className="text-[10px]">
                          بدون لوگو
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col justify-center gap-3">
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#bd9568]/40 bg-[#bd9568]/[0.05] px-4 py-5 text-sm text-[#e4bd8c] transition hover:bg-[#bd9568]/10">
                      <Upload size={18} />
                      انتخاب لوگو
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoSelection}
                        className="hidden"
                      />
                    </label>

                    <p className="text-[10px] leading-6 text-white/35">
                      فایل لوگو باید تصویر و حداکثر ۸ مگابایت باشد.
                      فرمت‌های رایج تصویر قابل انتخاب هستند.
                    </p>

                    {selectedLogo && (
                      <p className="break-all text-[10px] text-emerald-300">
                        فایل انتخاب‌شده: {selectedLogo.name}
                      </p>
                    )}

                    {logoPreview && (
                      <button
                        type="button"
                        onClick={clearLogo}
                        className="self-start text-[11px] text-red-300"
                      >
                        پاک‌کردن لوگو
                      </button>
                    )}
                  </div>
                </div>
              </FormSection>

              <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-white/10 px-7 py-4 text-sm text-white/65 transition hover:bg-white/5 disabled:opacity-40"
                >
                  انصراف
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center gap-3 rounded-xl bg-gradient-to-l from-[#e5c18e] to-[#a97845] px-8 py-4 text-sm font-bold text-black transition hover:brightness-110 disabled:opacity-50"
                >
                  {saving ? (
                    <LoaderCircle
                      size={19}
                      className="animate-spin"
                    />
                  ) : (
                    <Save size={19} />
                  )}

                  {saving
                    ? "در حال ذخیره..."
                    : editing
                      ? "ذخیره تغییرات"
                      : "ثبت برند"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        .admin-input {
          width: 100%;
          min-width: 0;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.3);
          padding: 13px 14px;
          color: white;
          font-size: 12px;
          outline: none;
          transition: border-color 150ms ease;
        }

        .admin-input:focus {
          border-color: rgba(189, 149, 104, 0.75);
        }

        .admin-input::placeholder {
          color: rgba(255, 255, 255, 0.25);
        }
      `}</style>
    </main>
  );
}

function SummaryCard({
  icon,
  title,
  value,
}: {
  icon: ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[#bd9568]/20 bg-[#141311] p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-white/45">{title}</span>
        <span className="text-[#e4bd8c]">{icon}</span>
      </div>
      <p className="mt-4 text-2xl font-black text-[#e4bd8c]">
        {value}
      </p>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-xs text-white/60">
        {label}
        {required && (
          <span className="mr-1 text-red-300">*</span>
        )}
      </span>
      {children}
    </label>
  );
}

function FormSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-2 text-[#e4bd8c]">
        {icon}
        <h3 className="text-sm font-bold">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] " +
        (active
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
          : "border-white/10 bg-white/5 text-white/40")
      }
    >
      <span
        className={
          "h-1.5 w-1.5 rounded-full " +
          (active ? "bg-emerald-400" : "bg-white/30")
        }
      />
      {active ? "فعال" : "غیرفعال"}
    </span>
  );
}

function BrandLogo({
  logo,
  name,
  large = false,
}: {
  logo: string | null;
  name: string;
  large?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const url = imageUrl(logo);

  return (
    <div
      className={
        "flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#bd9568]/20 bg-[#bd9568]/[0.07] " +
        (large ? "h-16 w-16" : "h-12 w-12")
      }
    >
      {url && !failed ? (
        <img
          src={url}
          alt={name}
          className="h-full w-full object-contain p-1"
          onError={() => setFailed(true)}
        />
      ) : (
        <Award
          size={large ? 27 : 20}
          className="text-[#bd9568]/70"
        />
      )}
    </div>
  );
}

function Notice({
  type,
  message,
  onClose,
}: {
  type: "error" | "success";
  message: string;
  onClose?: () => void;
}) {
  const isError = type === "error";

  return (
    <div
      className={
        "mb-5 flex items-start justify-between gap-3 rounded-xl border p-4 text-xs leading-6 " +
        (isError
          ? "border-red-500/20 bg-red-500/10 text-red-300"
          : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300")
      }
    >
      <div className="flex items-start gap-2">
        {isError ? (
          <AlertTriangle size={17} className="mt-1 shrink-0" />
        ) : (
          <CheckCircle2 size={17} className="mt-1 shrink-0" />
        )}
        <span>{message}</span>
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 opacity-60 hover:opacity-100"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
