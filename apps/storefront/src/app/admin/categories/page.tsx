
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";

import {
  ArrowRight,
  CheckCircle2,
  Edit3,
  FolderTree,
  ImagePlus,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  X,
  AlertTriangle,
  Eye,
  EyeOff,
  Package,
  Save,
  Layers3,
} from "lucide-react";

type Category = {
  id: number | string;
  name: string;
  slug: string;
  description: string;
  image: string | null;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
};

type CategoryForm = {
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
  sort_order: string;
};

type AdminUser = {
  id: number;
  username: string;
  isStaff: boolean;
  isSuperuser: boolean;
};

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL || ""
).replace(/\/+$/, "");

const AUTH_PATH = "/api/store/admin/auth";
const CATEGORY_PATH = "/api/admin/store/products/categories/";

const EMPTY_FORM: CategoryForm = {
  name: "",
  slug: "",
  description: "",
  is_active: true,
  sort_order: "0",
};

async function parseResponse(response: Response): Promise<any> {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const detail =
      data?.detail ||
      data?.message ||
      data?.error ||
      (typeof data === "object" && data
        ? Object.values(data).flat().join(" ")
        : "");

    throw new Error(
      String(detail || `خطای سرور (${response.status})`)
    );
  }

  return data;
}

function extractList(data: any): Category[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.results)) return data.data.results;

  return [];
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("fa-IR").format(value || 0);
}

function getImageUrl(value: string | null) {
  if (!value) return "";

  if (/^https?:\/\//i.test(value)) return value;

  return `${API_BASE}${value.startsWith("/") ? "" : "/"}${value}`;
}

export default function AdminCategoriesPage() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<Category | null>(null);

  const [form, setForm] = useState<CategoryForm>(EMPTY_FORM);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");

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

  const loadCategories = useCallback(async () => {
    if (!API_BASE) {
      setError("آدرس API بک‌اند تنظیم نشده است.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE}${CATEGORY_PATH}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          headers: { Accept: "application/json" },
        }
      );

      const data = await parseResponse(response);
      setCategories(extractList(data));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "دریافت دسته‌بندی‌ها ناموفق بود."
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
          throw new Error("برای مشاهده این صفحه باید وارد پنل مدیریت شوی.");
        }

        if (active) {
          setAdmin(data.user as AdminUser);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "نشست مدیریتی معتبر نیست."
          );
        }
      } finally {
        if (active) setCheckingSession(false);
      }
    }

    checkSession();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (admin) loadCategories();
  }, [admin, loadCategories]);

  useEffect(() => {
    return () => {
      if (imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();

    return categories.filter((category) => {
      const matchesSearch =
        !query ||
        category.name.toLocaleLowerCase().includes(query) ||
        category.slug.toLocaleLowerCase().includes(query) ||
        (category.description || "").toLocaleLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && category.is_active) ||
        (statusFilter === "inactive" && !category.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [categories, search, statusFilter]);

  const activeCount = categories.filter(
    (item) => item.is_active
  ).length;

  const inactiveCount = categories.length - activeCount;

  function updateField<K extends keyof CategoryForm>(
    key: K,
    value: CategoryForm[K]
  ) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  function clearImagePreview() {
    if (imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    setImagePreview("");
    setSelectedImage(null);
  }

  function openCreateModal() {
    setEditingCategory(null);
    setForm(EMPTY_FORM);
    clearImagePreview();
    setError("");
    setModalOpen(true);
  }

  function openEditModal(category: Category) {
    setEditingCategory(category);

    setForm({
      name: category.name || "",
      slug: category.slug || "",
      description: category.description || "",
      is_active: category.is_active,
      sort_order: String(category.sort_order ?? 0),
    });

    clearImagePreview();

    if (category.image) {
      setImagePreview(getImageUrl(category.image));
    }

    setError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditingCategory(null);
    setForm(EMPTY_FORM);
    clearImagePreview();
  }

  function handleImageSelection(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("فایل انتخاب‌شده باید تصویر باشد.");
      event.target.value = "";
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError("حجم تصویر نباید بیشتر از ۸ مگابایت باشد.");
      event.target.value = "";
      return;
    }

    clearImagePreview();
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
    setError("");
  }

  async function submitCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("نام دسته‌بندی را وارد کن.");
      return;
    }

    if (!form.slug.trim()) {
      setError("شناسه آدرس دسته‌بندی الزامی است.");
      return;
    }

    const sortOrder = Number(form.sort_order);

    if (
      !Number.isInteger(sortOrder) ||
      sortOrder < 0
    ) {
      setError("ترتیب نمایش باید یک عدد صحیح و غیرمنفی باشد.");
      return;
    }

    setSaving(true);

    try {
      const csrfToken = await getCsrfToken();
      const body = new FormData();

      body.append("name", form.name.trim());
      body.append("slug", form.slug.trim());
      body.append("description", form.description.trim());
      body.append("is_active", String(form.is_active));
      body.append("sort_order", String(sortOrder));

      if (selectedImage) {
        body.append("image", selectedImage);
      }

      const endpoint = editingCategory
        ? `${CATEGORY_PATH}${editingCategory.id}/`
        : CATEGORY_PATH;

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: editingCategory ? "PATCH" : "POST",
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
      setEditingCategory(null);
      setForm(EMPTY_FORM);
      clearImagePreview();

      setSuccess(
        editingCategory
          ? "دسته‌بندی با موفقیت ویرایش شد."
          : "دسته‌بندی جدید ثبت شد."
      );

      await loadCategories();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "ذخیره دسته‌بندی انجام نشد."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory(category: Category) {
    const confirmed = window.confirm(
      `دسته‌بندی «${category.name}» حذف شود؟ اگر محصولی به این دسته‌بندی متصل باشد، بک‌اند حذف را رد می‌کند.`
    );

    if (!confirmed) return;

    setDeletingId(category.id);
    setError("");
    setSuccess("");

    try {
      const csrfToken = await getCsrfToken();

      const response = await fetch(
        `${API_BASE}${CATEGORY_PATH}${category.id}/`,
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

      setSuccess("دسته‌بندی حذف شد.");
      await loadCategories();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "حذف دسته‌بندی انجام نشد."
      );
    } finally {
      setDeletingId(null);
    }
  }

  if (checkingSession) {
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
          <p className="text-sm text-white/50">
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
            ابتدا از طریق صفحه اصلی مدیریت وارد حساب مدیر شو.
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
                <FolderTree size={24} />
              </div>

              <div>
                <h1 className="text-2xl font-black sm:text-3xl">
                  مدیریت دسته‌بندی‌ها
                </h1>
                <p className="mt-1 text-xs text-white/40">
                  ساختاردهی و سازمان‌دهی محصولات فروشگاه JALALI
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={loadCategories}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-white/70 transition hover:bg-white/[0.07] disabled:opacity-40"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              بروزرسانی
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-[#e5c18e] to-[#a97845] px-5 py-3 text-xs font-black text-black transition hover:brightness-110"
            >
              <Plus size={17} />
              دسته‌بندی جدید
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
            icon={<Layers3 size={20} />}
            title="کل دسته‌بندی‌ها"
            value={formatNumber(categories.length)}
          />
          <SummaryCard
            icon={<Eye size={20} />}
            title="دسته‌بندی‌های فعال"
            value={formatNumber(activeCount)}
          />
          <SummaryCard
            icon={<EyeOff size={20} />}
            title="دسته‌بندی‌های غیرفعال"
            value={formatNumber(inactiveCount)}
          />
        </section>

        <section className="rounded-3xl border border-[#bd9568]/15 bg-[#12110f] p-4 sm:p-6">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-bold">
                فهرست دسته‌بندی‌ها
              </h2>
              <p className="mt-1 text-xs text-white/35">
                مدیریت اطلاعات و وضعیت نمایش هر دسته‌بندی
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
                  placeholder="جست‌وجوی نام، شناسه یا توضیحات..."
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
                در حال دریافت دسته‌بندی‌ها...
              </p>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 px-5 text-center">
              <FolderTree
                size={38}
                className="mb-4 text-[#bd9568]/60"
              />
              <h3 className="text-sm font-bold">
                دسته‌بندی‌ای پیدا نشد
              </h3>
              <p className="mt-2 max-w-sm text-xs leading-6 text-white/35">
                عبارت جست‌وجو یا فیلتر را تغییر بده، یا دسته‌بندی جدیدی ثبت کن.
              </p>
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-5 rounded-xl border border-[#bd9568]/30 px-5 py-3 text-xs text-[#e4bd8c] transition hover:bg-[#bd9568]/10"
              >
                ایجاد دسته‌بندی
              </button>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[760px] border-collapse text-right">
                  <thead>
                    <tr className="border-b border-white/10 text-[11px] text-white/40">
                      <th className="px-3 py-4 font-medium">دسته‌بندی</th>
                      <th className="px-3 py-4 font-medium">شناسه آدرس</th>
                      <th className="px-3 py-4 font-medium">ترتیب</th>
                      <th className="px-3 py-4 font-medium">وضعیت</th>
                      <th className="px-3 py-4 text-left font-medium">عملیات</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredCategories.map((category) => (
                      <tr
                        key={category.id}
                        className="border-b border-white/[0.06] transition hover:bg-white/[0.025]"
                      >
                        <td className="px-3 py-4">
                          <div className="flex items-center gap-3">
                            <CategoryImage
                              image={category.image}
                              name={category.name}
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-white/85">
                                {category.name}
                              </p>
                              <p className="mt-1 max-w-xs truncate text-[10px] text-white/35">
                                {category.description || "بدون توضیحات"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-4">
                          <span className="rounded-lg bg-black/30 px-3 py-2 text-[11px] text-white/50">
                            {category.slug}
                          </span>
                        </td>

                        <td className="px-3 py-4 text-xs tabular-nums text-white/60">
                          {formatNumber(category.sort_order)}
                        </td>

                        <td className="px-3 py-4">
                          <StatusBadge active={category.is_active} />
                        </td>

                        <td className="px-3 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(category)}
                              title="ویرایش دسته‌بندی"
                              className="rounded-lg border border-[#bd9568]/20 p-2.5 text-[#e4bd8c] transition hover:bg-[#bd9568]/10"
                            >
                              <Edit3 size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() => deleteCategory(category)}
                              disabled={deletingId === category.id}
                              title="حذف دسته‌بندی"
                              className="rounded-lg border border-red-500/20 p-2.5 text-red-300 transition hover:bg-red-500/10 disabled:opacity-40"
                            >
                              {deletingId === category.id ? (
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
                {filteredCategories.map((category) => (
                  <article
                    key={category.id}
                    className="rounded-2xl border border-white/[0.08] bg-black/20 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <CategoryImage
                        image={category.image}
                        name={category.name}
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold">
                            {category.name}
                          </h3>
                          <StatusBadge active={category.is_active} />
                        </div>

                        <p className="mt-2 break-all text-[10px] text-white/35">
                          {category.slug}
                        </p>

                        <p className="mt-2 text-xs leading-6 text-white/45">
                          {category.description || "بدون توضیحات"}
                        </p>

                        <p className="mt-2 text-[10px] text-white/35">
                          ترتیب نمایش: {formatNumber(category.sort_order)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2 border-t border-white/[0.07] pt-3">
                      <button
                        type="button"
                        onClick={() => openEditModal(category)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#bd9568]/25 py-3 text-xs text-[#e4bd8c]"
                      >
                        <Edit3 size={15} />
                        ویرایش
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteCategory(category)}
                        disabled={deletingId === category.id}
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
              نمایش {formatNumber(filteredCategories.length)} مورد از{" "}
              {formatNumber(categories.length)} دسته‌بندی
            </p>

            <button
              type="button"
              onClick={loadCategories}
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
          <span>مدیریت ساختار دسته‌بندی محصولات</span>
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
                  {editingCategory ? (
                    <Edit3 size={20} />
                  ) : (
                    <FolderTree size={20} />
                  )}
                </div>

                <div>
                  <h2 className="text-base font-black">
                    {editingCategory
                      ? "ویرایش دسته‌بندی"
                      : "ثبت دسته‌بندی جدید"}
                  </h2>
                  <p className="mt-1 text-[10px] text-white/35">
                    اطلاعات دسته‌بندی فروشگاه JALALI
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

            <form
              onSubmit={submitCategory}
              className="space-y-7 p-5 sm:p-7"
            >
              {error && (
                <Notice
                  type="error"
                  message={error}
                  onClose={() => setError("")}
                />
              )}

              <FormSection
                title="اطلاعات اصلی دسته‌بندی"
                icon={<FolderTree size={18} />}
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="نام دسته‌بندی" required>
                    <input
                      value={form.name}
                      onChange={(event) =>
                        updateField("name", event.target.value)
                      }
                      className="admin-input"
                      placeholder="مثلاً محصولات مراقبت پوست"
                      maxLength={150}
                      required
                    />
                  </Field>

                  <Field label="شناسه آدرس (Slug)" required>
                    <input
                      value={form.slug}
                      onChange={(event) =>
                        updateField("slug", event.target.value)
                      }
                      className="admin-input text-left"
                      dir="ltr"
                      placeholder="skin-care"
                      maxLength={180}
                      required
                    />
                  </Field>

                  <Field label="ترتیب نمایش">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={form.sort_order}
                      onChange={(event) =>
                        updateField("sort_order", event.target.value)
                      }
                      className="admin-input"
                    />
                  </Field>

                  <div className="flex items-end">
                    <label className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3.5">
                      <span>
                        <span className="block text-xs font-bold">
                          فعال در فروشگاه
                        </span>
                        <span className="mt-1 block text-[10px] text-white/35">
                          نمایش دسته‌بندی در بخش عمومی
                        </span>
                      </span>

                      <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(event) =>
                          updateField("is_active", event.target.checked)
                        }
                        className="h-5 w-5 accent-[#bd9568]"
                      />
                    </label>
                  </div>
                </div>

                <div className="mt-4">
                  <Field label="توضیحات دسته‌بندی">
                    <textarea
                      value={form.description}
                      onChange={(event) =>
                        updateField("description", event.target.value)
                      }
                      className="admin-input min-h-28 resize-y"
                      placeholder="توضیحات مربوط به این دسته‌بندی..."
                    />
                  </Field>
                </div>
              </FormSection>

              <FormSection
                title="تصویر دسته‌بندی"
                icon={<ImagePlus size={18} />}
              >
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-[180px_1fr]">
                  <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="پیش‌نمایش دسته‌بندی"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-white/25">
                        <ImagePlus size={34} />
                        <span className="text-[10px]">
                          بدون تصویر
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col justify-center gap-3">
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#bd9568]/40 bg-[#bd9568]/[0.05] px-4 py-5 text-sm text-[#e4bd8c] transition hover:bg-[#bd9568]/10">
                      <Upload size={18} />
                      انتخاب تصویر

                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelection}
                        className="hidden"
                      />
                    </label>

                    <p className="text-[10px] leading-6 text-white/35">
                      تصویر باید از نوع عکس و حداکثر ۸ مگابایت باشد.
                      برای حفظ تصویر قبلی، هنگام ویرایش فایل جدید انتخاب نکن.
                    </p>

                    {selectedImage && (
                      <p className="break-all text-[10px] text-emerald-300">
                        فایل انتخاب‌شده: {selectedImage.name}
                      </p>
                    )}

                    {imagePreview && (
                      <button
                        type="button"
                        onClick={clearImagePreview}
                        className="self-start text-[11px] text-red-300"
                      >
                        پاک‌کردن پیش‌نمایش
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
                    : editingCategory
                      ? "ذخیره تغییرات"
                      : "ثبت دسته‌بندی"}
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

        .admin-input option {
          color: white;
          background: #141311;
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

function CategoryImage({
  image,
  name,
}: {
  image: string | null;
  name: string;
}) {
  const [failed, setFailed] = useState(false);

  const imageUrl = getImageUrl(image);

  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#bd9568]/20 bg-[#bd9568]/[0.07]">
      {imageUrl && !failed ? (
        <img
          src={imageUrl}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <FolderTree size={20} className="text-[#bd9568]/70" />
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
