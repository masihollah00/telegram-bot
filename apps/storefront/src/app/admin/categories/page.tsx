
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  Activity,
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FolderTree,
  ImagePlus,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from "lucide-react";

const API = "/api/admin/store/products/categories/";
const AUTH = "/api/store/admin/auth/";
const GOLD = "#d9ad68";

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
  image: File | null;
};

type Notice = {
  type: "success" | "error" | "info";
  text: string;
};

const EMPTY_FORM: CategoryForm = {
  name: "",
  slug: "",
  description: "",
  is_active: true,
  sort_order: "0",
  image: null,
};

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "=([^;]*)")
  );
  return match ? decodeURIComponent(match[1]) : "";
}

function mediaUrl(value?: string | null): string {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return value;
  return "/" + value;
}

function extractList(data: any): Category[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.categories)) return data.categories;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function errorMessage(data: any): string {
  if (!data) return "در ارتباط با سرور خطایی رخ داد.";

  if (typeof data === "string") return data;

  if (data.detail) return String(data.detail);
  if (data.message) return String(data.message);

  const values = Object.entries(data)
    .map(([key, value]) => {
      const label: Record<string, string> = {
        name: "نام",
        slug: "شناسه آدرس",
        description: "توضیحات",
        image: "تصویر",
        sort_order: "ترتیب نمایش",
        is_active: "وضعیت",
      };

      const message = Array.isArray(value)
        ? value.join("، ")
        : typeof value === "object"
          ? JSON.stringify(value)
          : String(value);

      return `${label[key] || key}: ${message}`;
    })
    .join(" | ");

  return values || "عملیات انجام نشد.";
}

function formatDate(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

async function readResponse(response: Response): Promise<any> {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { detail: text };
  }
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [notice, setNotice] = useState<Notice | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortMode, setSortMode] = useState("order");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryForm>(EMPTY_FORM);
  const [preview, setPreview] = useState("");
  const [removeImage, setRemoveImage] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fileInput = useRef<HTMLInputElement>(null);

  const showNotice = useCallback(
    (type: Notice["type"], text: string) => {
      setNotice({ type, text });
    },
    []
  );

  const csrfToken = useCallback(async (): Promise<string> => {
    const response = await fetch(AUTH + "csrf/", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    const data = await readResponse(response);

    if (!response.ok) {
      throw new Error(errorMessage(data));
    }

    return (
      data.csrfToken ||
      data.csrf_token ||
      getCookie("csrftoken") ||
      ""
    );
  }, []);

  const apiRequest = useCallback(
    async (
      url: string,
      options: RequestInit = {},
      needsCsrf = false
    ) => {
      const headers = new Headers(options.headers || {});
      headers.set("Accept", "application/json");

      if (needsCsrf) {
        const token = await csrfToken();
        if (token) headers.set("X-CSRFToken", token);
      }

      const response = await fetch(url, {
        ...options,
        headers,
        credentials: "include",
        cache: "no-store",
      });

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(errorMessage(data));
      }

      return data;
    },
    [csrfToken]
  );

  const checkSession = useCallback(async () => {
    setCheckingAuth(true);

    try {
      const data = await apiRequest(AUTH + "me/");
      const user = data.user || data.admin || data;

      const valid =
        data.success === true ||
        data.authenticated === true ||
        user?.is_staff === true ||
        user?.is_superuser === true;

      setAuthenticated(Boolean(valid));

      if (!valid) {
        showNotice("error", "برای مشاهده این بخش باید با حساب مدیر وارد شوید.");
      }
    } catch {
      setAuthenticated(false);
      showNotice("error", "نشست مدیریت معتبر نیست. ابتدا وارد پنل مدیریت شوید.");
    } finally {
      setCheckingAuth(false);
    }
  }, [apiRequest, showNotice]);

  const loadCategories = useCallback(async () => {
    setLoading(true);

    try {
      const data = await apiRequest(API);
      setCategories(extractList(data));
    } catch (error) {
      showNotice(
        "error",
        error instanceof Error ? error.message : "دریافت دسته‌بندی‌ها ناموفق بود."
      );
    } finally {
      setLoading(false);
    }
  }, [apiRequest, showNotice]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (authenticated) loadCategories();
  }, [authenticated, loadCategories]);

  const filteredCategories = useMemo(() => {
    let result = [...categories];

    const query = search.trim().toLocaleLowerCase("fa");

    if (query) {
      result = result.filter((category) =>
        [
          category.name,
          category.slug,
          category.description,
          String(category.id),
        ]
          .join(" ")
          .toLocaleLowerCase("fa")
          .includes(query)
      );
    }

    if (statusFilter === "active") {
      result = result.filter((item) => item.is_active);
    } else if (statusFilter === "inactive") {
      result = result.filter((item) => !item.is_active);
    }

    if (sortMode === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name, "fa"));
    } else if (sortMode === "newest") {
      result.sort((a, b) => Number(b.id) - Number(a.id));
    } else {
      result.sort(
        (a, b) =>
          Number(a.sort_order || 0) - Number(b.sort_order || 0)
      );
    }

    return result;
  }, [categories, search, statusFilter, sortMode]);

  const stats = useMemo(
    () => ({
      total: categories.length,
      active: categories.filter((item) => item.is_active).length,
      inactive: categories.filter((item) => !item.is_active).length,
      images: categories.filter((item) => Boolean(item.image)).length,
    }),
    [categories]
  );

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setPreview("");
    setRemoveImage(false);
    setModalOpen(true);
    setNotice(null);
  }

  function openEdit(category: Category) {
    setEditing(category);
    setForm({
      name: category.name || "",
      slug: category.slug || "",
      description: category.description || "",
      is_active: Boolean(category.is_active),
      sort_order: String(category.sort_order ?? 0),
      image: null,
    });
    setPreview(mediaUrl(category.image));
    setRemoveImage(false);
    setModalOpen(true);
    setNotice(null);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setPreview("");
    setRemoveImage(false);
  }

  function updateField<K extends keyof CategoryForm>(
    key: K,
    value: CategoryForm[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showNotice("error", "فایل انتخاب‌شده باید تصویر باشد.");
      event.target.value = "";
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      showNotice("error", "حجم تصویر نباید بیشتر از ۸ مگابایت باشد.");
      event.target.value = "";
      return;
    }

    updateField("image", file);
    setPreview(URL.createObjectURL(file));
    setRemoveImage(false);
  }

  function clearImage() {
    updateField("image", null);
    setPreview("");
    setRemoveImage(true);

    if (fileInput.current) fileInput.current.value = "";
  }

  async function saveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) {
      showNotice("error", "نام دسته‌بندی را وارد کنید.");
      return;
    }

    if (!form.slug.trim()) {
      showNotice("error", "شناسه آدرس دسته‌بندی را وارد کنید.");
      return;
    }

    const order = Number(form.sort_order);

    if (!Number.isInteger(order) || order < 0) {
      showNotice("error", "ترتیب نمایش باید عدد صحیح و غیرمنفی باشد.");
      return;
    }

    setSaving(true);

    try {
      const body = new FormData();

      body.append("name", form.name.trim());
      body.append("slug", form.slug.trim());
      body.append("description", form.description.trim());
      body.append("is_active", String(form.is_active));
      body.append("sort_order", String(order));

      if (form.image) {
        body.append("image", form.image);
      } else if (removeImage && editing) {
        body.append("image", "");
      }

      const url = editing ? `${API}${editing.id}/` : API;

      await apiRequest(
        url,
        {
          method: editing ? "PATCH" : "POST",
          body,
        },
        true
      );

      setModalOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      setPreview("");
      setRemoveImage(false);

      showNotice(
        "success",
        editing
          ? "دسته‌بندی با موفقیت بروزرسانی شد."
          : "دسته‌بندی جدید با موفقیت ثبت شد."
      );

      await loadCategories();
    } catch (error) {
      showNotice(
        "error",
        error instanceof Error ? error.message : "ذخیره دسته‌بندی ناموفق بود."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory() {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      await apiRequest(
        `${API}${deleteTarget.id}/`,
        { method: "DELETE" },
        true
      );

      setDeleteTarget(null);
      showNotice("success", "درخواست حذف دسته‌بندی با موفقیت انجام شد.");
      await loadCategories();
    } catch (error) {
      showNotice(
        "error",
        error instanceof Error
          ? error.message
          : "حذف دسته‌بندی انجام نشد. ممکن است محصولاتی به آن وابسته باشند."
      );
    } finally {
      setDeleting(false);
    }
  }

  async function changeStatus(category: Category) {
    try {
      await apiRequest(
        `${API}${category.id}/`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_active: !category.is_active }),
        },
        true
      );

      showNotice(
        "success",
        category.is_active
          ? "دسته‌بندی غیرفعال شد."
          : "دسته‌بندی فعال شد."
      );

      await loadCategories();
    } catch (error) {
      showNotice(
        "error",
        error instanceof Error ? error.message : "تغییر وضعیت انجام نشد."
      );
    }
  }

  async function changeOrder(category: Category, direction: -1 | 1) {
    const next = Math.max(0, Number(category.sort_order || 0) + direction);

    try {
      await apiRequest(
        `${API}${category.id}/`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sort_order: next }),
        },
        true
      );

      await loadCategories();
    } catch (error) {
      showNotice(
        "error",
        error instanceof Error ? error.message : "تغییر ترتیب انجام نشد."
      );
    }
  }

  if (checkingAuth) {
    return (
      <main className="jalali-admin-loading" dir="rtl">
        <LoaderCircle className="spin" size={34} />
        <p>در حال بررسی دسترسی مدیریت...</p>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="jalali-admin-loading" dir="rtl">
        <ShieldCheck size={42} />
        <h2>دسترسی مدیریت</h2>
        <p>برای دسترسی به مدیریت دسته‌بندی‌ها وارد حساب مدیر شوید.</p>
        <a href="/admin" className="gold-button">
          بازگشت به پنل مدیریت
        </a>
      </main>
    );
  }

  return (
    <main className="categories-page" dir="rtl">
      <div className="page-glow glow-one" />
      <div className="page-glow glow-two" />

      <div className="categories-container">
        <header className="top-header">
          <div className="brand-area">
            <div className="brand-symbol">J</div>
            <div>
              <div className="brand-name">JALALI</div>
              <div className="brand-caption">MANAGEMENT SYSTEM</div>
            </div>
          </div>

          <a href="/admin" className="back-link">
            <ChevronRight size={17} />
            بازگشت به مدیریت
          </a>
        </header>

        <section className="page-heading">
          <div>
            <div className="eyebrow">
              <FolderTree size={15} />
              STORE STRUCTURE
            </div>
            <h1>مدیریت دسته‌بندی محصولات</h1>
            <p>
              ساختار فروشگاه، تصاویر دسته‌بندی‌ها و ترتیب نمایش محصولات را
              مدیریت کنید.
            </p>
          </div>

          <button className="primary-button" onClick={openCreate}>
            <Plus size={19} />
            دسته‌بندی جدید
          </button>
        </section>

        {notice && (
          <div className={`notice ${notice.type}`}>
            {notice.type === "success" ? (
              <CheckCircle2 size={19} />
            ) : (
              <AlertCircle size={19} />
            )}
            <span>{notice.text}</span>
            <button onClick={() => setNotice(null)} aria-label="بستن پیام">
              <X size={17} />
            </button>
          </div>
        )}

        <section className="stats-grid">
          <StatCard
            icon={<FolderTree size={21} />}
            label="کل دسته‌بندی‌ها"
            value={stats.total}
            detail="تمام دسته‌بندی‌های ثبت‌شده"
          />
          <StatCard
            icon={<CheckCircle2 size={21} />}
            label="دسته‌بندی فعال"
            value={stats.active}
            detail="قابل نمایش در فروشگاه"
          />
          <StatCard
            icon={<Activity size={21} />}
            label="دسته‌بندی غیرفعال"
            value={stats.inactive}
            detail="خارج از نمایش عمومی"
          />
          <StatCard
            icon={<ImagePlus size={21} />}
            label="دارای تصویر"
            value={stats.images}
            detail="تصویر ثبت‌شده برای دسته‌بندی"
          />
        </section>

        <section className="management-panel">
          <div className="panel-header">
            <div>
              <h2>فهرست دسته‌بندی‌ها</h2>
              <p>مدیریت و کنترل اطلاعات دسته‌بندی‌های فروشگاه</p>
            </div>

            <button
              className="icon-button"
              onClick={loadCategories}
              disabled={loading}
              title="بروزرسانی"
            >
              <RefreshCw size={18} className={loading ? "spin" : ""} />
            </button>
          </div>

          <div className="filters">
            <div className="search-box">
              <Search size={18} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="جست‌وجوی نام، شناسه یا توضیحات..."
              />
              {search && (
                <button onClick={() => setSearch("")} aria-label="پاک کردن">
                  <X size={16} />
                </button>
              )}
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="فیلتر وضعیت"
            >
              <option value="all">تمام وضعیت‌ها</option>
              <option value="active">فقط فعال</option>
              <option value="inactive">فقط غیرفعال</option>
            </select>

            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value)}
              aria-label="مرتب‌سازی"
            >
              <option value="order">ترتیب نمایش</option>
              <option value="name">نام دسته‌بندی</option>
              <option value="newest">شناسه جدیدتر</option>
            </select>
          </div>

          <div className="result-line">
            <span>
              نمایش <strong>{filteredCategories.length}</strong> دسته‌بندی
            </span>
            <span>اطلاعات از سرور دریافت می‌شود</span>
          </div>

          {loading ? (
            <div className="empty-state">
              <LoaderCircle size={30} className="spin" />
              <p>در حال دریافت اطلاعات...</p>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="empty-state">
              <FolderTree size={38} />
              <h3>دسته‌بندی‌ای پیدا نشد</h3>
              <p>
                {search
                  ? "عبارت جست‌وجو را تغییر دهید."
                  : "برای شروع، اولین دسته‌بندی فروشگاه را ایجاد کنید."}
              </p>
              {!search && (
                <button className="primary-button" onClick={openCreate}>
                  <Plus size={17} />
                  ایجاد دسته‌بندی
                </button>
              )}
            </div>
          ) : (
            <div className="category-list">
              {filteredCategories.map((category) => (
                <article className="category-card" key={category.id}>
                  <div className="category-image">
                    {category.image ? (
                      <img
                        src={mediaUrl(category.image)}
                        alt={category.name}
                      />
                    ) : (
                      <FolderTree size={27} />
                    )}
                  </div>

                  <div className="category-main">
                    <div className="category-title-line">
                      <h3>{category.name}</h3>
                      <span
                        className={
                          category.is_active
                            ? "status-pill active"
                            : "status-pill inactive"
                        }
                      >
                        <span />
                        {category.is_active ? "فعال" : "غیرفعال"}
                      </span>
                    </div>

                    <div className="category-slug" dir="ltr">
                      /{category.slug}
                    </div>

                    <p className="category-description">
                      {category.description || "توضیحاتی ثبت نشده است."}
                    </p>

                    <div className="category-meta">
                      <span>
                        شناسه: <b>{category.id}</b>
                      </span>
                      <span>
                        ترتیب: <b>{category.sort_order ?? 0}</b>
                      </span>
                      <span>
                        بروزرسانی: <b>{formatDate(category.updated_at)}</b>
                      </span>
                    </div>
                  </div>

                  <div className="category-actions">
                    <button
                      className="action-button order-action"
                      title="افزایش ترتیب"
                      onClick={() => changeOrder(category, -1)}
                    >
                      <ArrowUp size={16} />
                    </button>

                    <button
                      className="action-button order-action"
                      title="کاهش ترتیب"
                      onClick={() => changeOrder(category, 1)}
                    >
                      <ArrowDown size={16} />
                    </button>

                    <button
                      className="action-button"
                      title="تغییر وضعیت"
                      onClick={() => changeStatus(category)}
                    >
                      {category.is_active ? (
                        <Activity size={16} />
                      ) : (
                        <Check size={16} />
                      )}
                    </button>

                    <button
                      className="action-button edit-action"
                      title="ویرایش"
                      onClick={() => openEdit(category)}
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      className="action-button delete-action"
                      title="حذف"
                      onClick={() => setDeleteTarget(category)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="page-footer">
          <span>JALALI MANAGEMENT SYSTEM</span>
          <span>PRODUCT CATEGORIES</span>
        </footer>
      </div>

      {modalOpen && (
        <div className="modal-backdrop" onMouseDown={closeModal}>
          <section
            className="category-modal"
            onMouseDown={(event) => event.stopPropagation()}
            dir="rtl"
          >
            <div className="modal-header">
              <div>
                <span className="eyebrow">CATEGORY CONFIGURATION</span>
                <h2>{editing ? "ویرایش دسته‌بندی" : "ایجاد دسته‌بندی جدید"}</h2>
                <p>اطلاعات دسته‌بندی را با دقت وارد کنید.</p>
              </div>
              <button
                className="icon-button"
                onClick={closeModal}
                disabled={saving}
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={saveCategory}>
              <div className="form-grid">
                <label className="field">
                  <span>نام دسته‌بندی *</span>
                  <input
                    value={form.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    placeholder="مثلاً مراقبت پوست"
                    required
                    maxLength={150}
                  />
                </label>

                <label className="field">
                  <span>شناسه آدرس (Slug) *</span>
                  <input
                    value={form.slug}
                    onChange={(event) => updateField("slug", event.target.value)}
                    placeholder="مثلاً skin-care"
                    dir="ltr"
                    required
                    maxLength={180}
                  />
                </label>

                <label className="field full-field">
                  <span>توضیحات دسته‌بندی</span>
                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      updateField("description", event.target.value)
                    }
                    placeholder="توضیحات مربوط به این دسته‌بندی..."
                    rows={4}
                  />
                </label>

                <label className="field">
                  <span>ترتیب نمایش</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.sort_order}
                    onChange={(event) =>
                      updateField("sort_order", event.target.value)
                    }
                  />
                  <small>عدد کمتر، اولویت نمایش بالاتری دارد.</small>
                </label>

                <div className="field">
                  <span>وضعیت دسته‌بندی</span>
                  <button
                    type="button"
                    className={`toggle-control ${form.is_active ? "enabled" : ""}`}
                    onClick={() => updateField("is_active", !form.is_active)}
                  >
                    <span className="toggle-dot" />
                    {form.is_active ? "فعال در فروشگاه" : "غیرفعال"}
                  </button>
                </div>

                <div className="field full-field">
                  <span>تصویر دسته‌بندی</span>
                  <div className="image-upload-area">
                    {preview ? (
                      <div className="image-preview">
                        <img src={preview} alt="پیش‌نمایش تصویر" />
                        <button
                          type="button"
                          className="remove-image"
                          onClick={clearImage}
                        >
                          <X size={16} />
                          حذف تصویر
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="upload-placeholder"
                        onClick={() => fileInput.current?.click()}
                      >
                        <Upload size={25} />
                        <strong>انتخاب تصویر</strong>
                        <span>PNG، JPG یا WEBP - حداکثر ۸ مگابایت</span>
                      </button>
                    )}

                    <input
                      ref={fileInput}
                      type="file"
                      accept="image/*"
                      onChange={handleImage}
                      hidden
                    />

                    {preview && (
                      <button
                        type="button"
                        className="replace-image"
                        onClick={() => fileInput.current?.click()}
                      >
                        <Upload size={15} />
                        انتخاب تصویر دیگر
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  انصراف
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving ? (
                    <LoaderCircle size={18} className="spin" />
                  ) : (
                    <Check size={18} />
                  )}
                  {saving
                    ? "در حال ذخیره..."
                    : editing
                      ? "ذخیره تغییرات"
                      : "ثبت دسته‌بندی"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {deleteTarget && (
        <div
          className="modal-backdrop"
          onMouseDown={() => !deleting && setDeleteTarget(null)}
        >
          <section
            className="confirm-modal"
            onMouseDown={(event) => event.stopPropagation()}
            dir="rtl"
          >
            <div className="confirm-icon">
              <Trash2 size={27} />
            </div>
            <h2>حذف دسته‌بندی</h2>
            <p>
              آیا از حذف دسته‌بندی <strong>{deleteTarget.name}</strong> مطمئن
              هستید؟
            </p>
            <p className="warning-text">
              اگر محصولاتی به این دسته‌بندی وابسته باشند، ممکن است سرور اجازه
              حذف ندهد.
            </p>
            <div className="modal-actions">
              <button
                className="secondary-button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                انصراف
              </button>
              <button
                className="danger-button"
                onClick={deleteCategory}
                disabled={deleting}
              >
                {deleting ? (
                  <LoaderCircle size={17} className="spin" />
                ) : (
                  <Trash2 size={17} />
                )}
                {deleting ? "در حال حذف..." : "تأیید حذف"}
              </button>
            </div>
          </section>
        </div>
      )}

      <style jsx>{`
        .categories-page {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          background: #090909;
          color: #f5f0e8;
          padding: 30px 22px 55px;
          font-family: inherit;
        }

        .page-glow {
          position: absolute;
          width: 420px;
          height: 420px;
          border-radius: 50%;
          filter: blur(130px);
          opacity: 0.09;
          pointer-events: none;
        }

        .glow-one {
          background: #c58b43;
          top: -200px;
          right: -100px;
        }

        .glow-two {
          background: #8d633b;
          bottom: 10%;
          left: -250px;
        }

        .categories-container {
          max-width: 1450px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        .top-header,
        .brand-area,
        .page-heading,
        .panel-header,
        .category-title-line,
        .result-line,
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .top-header {
          padding-bottom: 25px;
          border-bottom: 1px solid #29251f;
        }

        .brand-area {
          justify-content: flex-start;
          gap: 12px;
        }

        .brand-symbol {
          width: 43px;
          height: 43px;
          display: grid;
          place-items: center;
          border: 1px solid ${GOLD};
          color: ${GOLD};
          border-radius: 12px;
          font-family: Georgia, serif;
          font-size: 27px;
          font-weight: bold;
        }

        .brand-name {
          font-family: Georgia, serif;
          letter-spacing: 4px;
          font-size: 17px;
          color: #e4c28e;
          font-weight: 700;
        }

        .brand-caption {
          font-size: 9px;
          letter-spacing: 2px;
          color: #777067;
          margin-top: 4px;
        }

        .back-link {
          color: #bdb3a4;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 12px;
        }

        .back-link:hover {
          color: ${GOLD};
        }

        .page-heading {
          gap: 20px;
          padding: 38px 0 28px;
        }

        .eyebrow {
          color: ${GOLD};
          font-size: 10px;
          letter-spacing: 2px;
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .page-heading h1 {
          font-size: clamp(22px, 3vw, 31px);
          margin: 12px 0 8px;
          font-weight: 800;
        }

        .page-heading p,
        .panel-header p {
          color: #8f887e;
          font-size: 12px;
          margin: 0;
          line-height: 1.9;
        }

        button {
          font-family: inherit;
          cursor: pointer;
        }

        button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .primary-button,
        .gold-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          border: 1px solid #e2bc7d;
          border-radius: 10px;
          padding: 12px 19px;
          background: linear-gradient(135deg, #e5c58f, #b9894e);
          color: #17120c;
          font-size: 12px;
          font-weight: 800;
          text-decoration: none;
          transition: 0.2s;
        }

        .primary-button:hover,
        .gold-button:hover {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }

        .notice {
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid;
          border-radius: 11px;
          padding: 13px 15px;
          margin-bottom: 20px;
          font-size: 12px;
        }

        .notice.success {
          background: #122119;
          border-color: #285b3b;
          color: #a7e4b9;
        }

        .notice.error {
          background: #261515;
          border-color: #633333;
          color: #f0b1a7;
        }

        .notice.info {
          background: #171d26;
          border-color: #394d68;
          color: #b7d3f4;
        }

        .notice span {
          flex: 1;
        }

        .notice button,
        .search-box button {
          border: 0;
          background: transparent;
          color: inherit;
          display: grid;
          place-items: center;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 13px;
          margin-bottom: 22px;
        }

        .stat-card {
          background: linear-gradient(145deg, #191714, #11100e);
          border: 1px solid #30291f;
          border-radius: 14px;
          padding: 19px;
          min-height: 125px;
        }

        .stat-icon {
          width: 37px;
          height: 37px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: #302619;
          color: ${GOLD};
          margin-bottom: 13px;
        }

        .stat-label {
          color: #a9a095;
          font-size: 11px;
        }

        .stat-value {
          color: #f3d7aa;
          font-size: 27px;
          font-weight: 800;
          margin-top: 5px;
        }

        .stat-detail {
          color: #716b63;
          font-size: 10px;
          margin-top: 5px;
        }

        .management-panel {
          border: 1px solid #302a22;
          background: rgba(18, 17, 15, 0.96);
          border-radius: 17px;
          padding: 22px;
        }

        .panel-header {
          padding-bottom: 19px;
          border-bottom: 1px solid #29241e;
        }

        .panel-header h2 {
          font-size: 17px;
          margin: 0 0 7px;
        }

        .icon-button {
          width: 39px;
          height: 39px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          background: #211d17;
          border: 1px solid #393024;
          color: #d5b77e;
        }

        .filters {
          display: grid;
          grid-template-columns: minmax(180px, 1fr) 170px 170px;
          gap: 10px;
          margin: 19px 0 13px;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 9px;
          background: #0d0d0c;
          border: 1px solid #39332b;
          border-radius: 9px;
          padding: 0 12px;
          color: #a58b64;
        }

        .search-box input {
          flex: 1;
          min-width: 0;
          height: 43px;
          border: 0;
          outline: 0;
          background: transparent;
          color: #eee5d8;
          font-family: inherit;
          font-size: 11px;
        }

        .filters select,
        .field input,
        .field textarea {
          width: 100%;
          min-width: 0;
          color: #e8dfd2;
          background: #0d0d0c;
          border: 1px solid #39332b;
          border-radius: 9px;
          padding: 12px;
          outline: none;
          font-family: inherit;
          font-size: 12px;
        }

        .filters select:focus,
        .field input:focus,
        .field textarea:focus {
          border-color: #b58a50;
        }

        .result-line {
          color: #777168;
          font-size: 10px;
          padding: 5px 1px 14px;
        }

        .result-line strong {
          color: #e6c58f;
        }

        .category-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .category-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 15px;
          border: 1px solid #302b24;
          border-radius: 13px;
          background: #151411;
          transition: border-color 0.2s, transform 0.2s;
        }

        .category-card:hover {
          border-color: #665037;
          transform: translateY(-1px);
        }

        .category-image {
          width: 76px;
          height: 76px;
          flex: 0 0 76px;
          display: grid;
          place-items: center;
          border-radius: 11px;
          overflow: hidden;
          background: #262117;
          color: #b99b6a;
          border: 1px solid #3c3225;
        }

        .category-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .category-main {
          min-width: 0;
          flex: 1;
        }

        .category-title-line {
          justify-content: flex-start;
          gap: 12px;
          flex-wrap: wrap;
        }

        .category-title-line h3 {
          margin: 0;
          font-size: 15px;
          font-weight: 750;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 30px;
          padding: 5px 9px;
          font-size: 9px;
        }

        .status-pill span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
        }

        .status-pill.active {
          background: #193020;
          color: #8fd5a1;
        }

        .status-pill.inactive {
          background: #30201a;
          color: #d5a184;
        }

        .category-slug {
          font-size: 10px;
          color: #b58e5c;
          margin-top: 7px;
        }

        .category-description {
          color: #938a7e;
          font-size: 11px;
          margin: 8px 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .category-meta {
          display: flex;
          gap: 17px;
          flex-wrap: wrap;
          color: #6f6a61;
          font-size: 9px;
        }

        .category-meta b {
          color: #c7b99f;
          font-weight: 600;
        }

        .category-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .action-button {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border-radius: 8px;
          border: 1px solid #3a342b;
          background: #211e19;
          color: #b7a88e;
          transition: 0.2s;
        }

        .action-button:hover {
          color: ${GOLD};
          border-color: #8b6c40;
        }

        .action-button.edit-action {
          color: #e3c18a;
        }

        .action-button.delete-action {
          color: #d9877b;
          border-color: #54302c;
        }

        .empty-state {
          min-height: 245px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 11px;
          color: #9b8a70;
          text-align: center;
        }

        .empty-state h3 {
          margin: 3px 0 0;
          color: #e8ddcb;
          font-size: 15px;
        }

        .empty-state p {
          margin: 0 0 8px;
          color: #81796e;
          font-size: 11px;
        }

        .page-footer {
          display: flex;
          justify-content: space-between;
          color: #59534a;
          font-family: Georgia, serif;
          letter-spacing: 2px;
          font-size: 9px;
          padding-top: 25px;
        }

        .modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
          background: rgba(0, 0, 0, 0.78);
          backdrop-filter: blur(8px);
          overflow-y: auto;
        }

        .category-modal,
        .confirm-modal {
          width: 100%;
          max-width: 650px;
          max-height: calc(100vh - 36px);
          overflow-y: auto;
          background: #171512;
          border: 1px solid #55432b;
          border-radius: 17px;
          padding: 24px;
          box-shadow: 0 25px 90px rgba(0, 0, 0, 0.6);
        }

        .modal-header {
          align-items: flex-start;
          margin-bottom: 22px;
        }

        .modal-header h2,
        .confirm-modal h2 {
          margin: 9px 0 6px;
          font-size: 19px;
        }

        .modal-header p {
          margin: 0;
          color: #8d857a;
          font-size: 11px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 17px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 9px;
          min-width: 0;
          color: #c7bba8;
          font-size: 11px;
        }

        .full-field {
          grid-column: 1 / -1;
        }

        .field small {
          color: #777064;
          font-size: 9px;
        }

        .field textarea {
          resize: vertical;
          line-height: 1.9;
        }

        .toggle-control {
          height: 43px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 12px;
          border: 1px solid #39332b;
          border-radius: 9px;
          background: #0d0d0c;
          color: #a59b8c;
          font-size: 11px;
          text-align: right;
        }

        .toggle-dot {
          width: 11px;
          height: 11px;
          border-radius: 50%;
          background: #78675b;
        }

        .toggle-control.enabled {
          color: #b8d8b8;
          border-color: #426344;
        }

        .toggle-control.enabled .toggle-dot {
          background: #7ec78a;
          box-shadow: 0 0 10px #7ec78a77;
        }

        .image-upload-area {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .upload-placeholder {
          min-height: 135px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 9px;
          border: 1px dashed #756044;
          border-radius: 11px;
          background: #12110e;
          color: #c9a56d;
        }

        .upload-placeholder strong {
          font-size: 12px;
        }

        .upload-placeholder span {
          color: #777064;
          font-size: 10px;
        }

        .image-preview {
          display: flex;
          align-items: center;
          gap: 15px;
          flex-wrap: wrap;
        }

        .image-preview img {
          width: 115px;
          height: 95px;
          border-radius: 10px;
          border: 1px solid #5a4831;
          object-fit: cover;
        }

        .remove-image,
        .replace-image {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border: 1px solid #54312d;
          border-radius: 8px;
          padding: 9px 12px;
          background: #271715;
          color: #e19a8e;
          font-size: 10px;
        }

        .replace-image {
          width: fit-content;
          border-color: #5c4a30;
          background: #211c14;
          color: #d9b87f;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 9px;
          margin-top: 23px;
          padding-top: 18px;
          border-top: 1px solid #302a22;
        }

        .secondary-button,
        .danger-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 11px 17px;
          border-radius: 9px;
          border: 1px solid #494137;
          background: #25211b;
          color: #c9bdab;
          font-family: inherit;
          font-size: 11px;
        }

        .danger-button {
          border-color: #733c35;
          background: #57251f;
          color: #ffe0d8;
        }

        .confirm-modal {
          max-width: 420px;
          text-align: center;
        }

        .confirm-icon {
          width: 57px;
          height: 57px;
          margin: 0 auto 15px;
          display: grid;
          place-items: center;
          border-radius: 15px;
          color: #e4a096;
          background: #38201d;
          border: 1px solid #71423a;
        }

        .confirm-modal p {
          color: #aaa093;
          font-size: 12px;
          line-height: 1.9;
        }

        .confirm-modal strong {
          color: #e5c48f;
        }

        .warning-text {
          color: #d5a17d !important;
          font-size: 10px !important;
        }

        .confirm-modal .modal-actions {
          justify-content: center;
        }

        .jalali-admin-loading {
          min-height: 75vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 13px;
          background: #090909;
          color: #d8b67c;
          text-align: center;
          padding: 25px;
        }

        .jalali-admin-loading p {
          color: #a79b88;
          font-size: 12px;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 900px) {
          .stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .category-card {
            align-items: flex-start;
            flex-wrap: wrap;
          }

          .category-actions {
            width: 100%;
            justify-content: flex-end;
            padding-top: 10px;
            border-top: 1px solid #302a22;
          }
        }

        @media (max-width: 600px) {
          .categories-page {
            padding: 18px 12px 35px;
          }

          .page-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .page-heading .primary-button {
            width: 100%;
          }

          .stats-grid {
            gap: 8px;
          }

          .stat-card {
            padding: 13px;
            min-height: 115px;
          }

          .management-panel {
            padding: 13px;
          }

          .filters {
            grid-template-columns: 1fr 1fr;
          }

          .search-box {
            grid-column: 1 / -1;
          }

          .category-image {
            width: 58px;
            height: 58px;
            flex-basis: 58px;
          }

          .category-main {
            width: calc(100% - 75px);
          }

          .category-meta {
            gap: 8px 13px;
          }

          .category-description {
            white-space: normal;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .full-field {
            grid-column: auto;
          }

          .category-modal,
          .confirm-modal {
            padding: 17px;
          }

          .page-footer {
            font-size: 7px;
          }
        }
      `}</style>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value.toLocaleString("fa-IR")}</div>
      <div className="stat-detail">{detail}</div>

      <style jsx>{`
        .stat-card {
          background: linear-gradient(145deg, #191714, #11100e);
          border: 1px solid #30291f;
          border-radius: 14px;
          padding: 19px;
          min-height: 125px;
        }

        .stat-icon {
          width: 37px;
          height: 37px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: #302619;
          color: ${GOLD};
          margin-bottom: 13px;
        }

        .stat-label {
          color: #a9a095;
          font-size: 11px;
        }

        .stat-value {
          color: #f3d7aa;
          font-size: 27px;
          font-weight: 800;
          margin-top: 5px;
        }

        .stat-detail {
          color: #716b63;
          font-size: 10px;
          margin-top: 5px;
        }
      `}</style>
    </div>
  );
}
