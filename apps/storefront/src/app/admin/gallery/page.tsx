
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
  Images,
  ImagePlus,
  Search,
  RefreshCw,
  Upload,
  Trash2,
  Pencil,
  X,
  Check,
  Star,
  LoaderCircle,
  AlertCircle,
  CheckCircle2,
  FolderOpen,
  Package,
  Filter,
  ArrowUpDown,
} from "lucide-react";

const IMAGES_API = "/api/admin/store/products/product-images/";
const PRODUCTS_API = "/api/admin/store/products/products/";
const AUTH_API = "/api/store/admin/auth/";

type Product = {
  id: string;
  name: string;
  sku: string;
};

type ProductImage = {
  id: number;
  product: string;
  image: string;
  alt_text: string;
  sort_order: number;
  is_primary: boolean;
  created_at?: string;
};

type ImageForm = {
  product: string;
  image: File | null;
  alt_text: string;
  sort_order: string;
  is_primary: boolean;
};

type Notice = {
  type: "success" | "error";
  message: string;
};

const EMPTY_FORM: ImageForm = {
  product: "",
  image: null,
  alt_text: "",
  sort_order: "0",
  is_primary: false,
};

async function responseData(response: Response): Promise<any> {
  const raw = await response.text();

  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch {
    return { detail: raw };
  }
}

function getError(data: any): string {
  if (!data) return "خطایی در ارتباط با سرور رخ داد.";

  if (data.detail) return String(data.detail);
  if (data.message) return String(data.message);

  return Object.entries(data)
    .map(([key, value]) => {
      const message = Array.isArray(value)
        ? value.join("، ")
        : String(value);

      return `${key}: ${message}`;
    })
    .join(" | ") || "عملیات ناموفق بود.";
}

function getItems(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function getImageUrl(value?: string | null): string {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return value.startsWith("/") ? value : `/${value}`;
}

function formatDate(value?: string): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
  }).format(date);
}

export default function AdminGalleryPage() {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [notice, setNotice] = useState<Notice | null>(null);

  const [search, setSearch] = useState("");
  const [productFilter, setProductFilter] = useState("all");
  const [primaryFilter, setPrimaryFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProductImage | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductImage | null>(null);

  const [form, setForm] = useState<ImageForm>(EMPTY_FORM);
  const [preview, setPreview] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const showNotice = useCallback(
    (type: Notice["type"], message: string) => {
      setNotice({ type, message });
    },
    []
  );

  const getCookie = useCallback((name: string) => {
    if (typeof document === "undefined") return "";

    const match = document.cookie.match(
      new RegExp("(?:^|; )" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "=([^;]*)")
    );

    return match ? decodeURIComponent(match[1]) : "";
  }, []);

  const csrf = useCallback(async () => {
    const response = await fetch(AUTH_API + "csrf/", {
      credentials: "include",
      cache: "no-store",
    });

    const data = await responseData(response);

    if (!response.ok) {
      throw new Error(getError(data));
    }

    return data.csrfToken || data.csrf_token || getCookie("csrftoken");
  }, [getCookie]);

  const request = useCallback(
    async (
      url: string,
      options: RequestInit = {},
      protectedRequest = false
    ) => {
      const headers = new Headers(options.headers || {});

      headers.set("Accept", "application/json");

      if (protectedRequest) {
        const token = await csrf();
        if (token) headers.set("X-CSRFToken", token);
      }

      const response = await fetch(url, {
        ...options,
        headers,
        credentials: "include",
        cache: "no-store",
      });

      const data = await responseData(response);

      if (!response.ok) {
        throw new Error(getError(data));
      }

      return data;
    },
    [csrf]
  );

  const checkAuth = useCallback(async () => {
    setCheckingAuth(true);

    try {
      const data = await request(AUTH_API + "me/");
      const user = data.user || data.admin || data;

      const valid =
        data.success === true ||
        data.authenticated === true ||
        user?.is_staff === true ||
        user?.is_superuser === true;

      setAuthenticated(Boolean(valid));

      if (!valid) {
        showNotice("error", "برای دسترسی به این صفحه باید مدیر وارد شده باشد.");
      }
    } catch {
      setAuthenticated(false);
      showNotice("error", "نشست مدیریت معتبر نیست.");
    } finally {
      setCheckingAuth(false);
    }
  }, [request, showNotice]);

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const [imageData, productData] = await Promise.all([
        request(IMAGES_API),
        request(PRODUCTS_API),
      ]);

      setImages(getItems(imageData) as ProductImage[]);
      setProducts(getItems(productData) as Product[]);
    } catch (error) {
      showNotice(
        "error",
        error instanceof Error ? error.message : "دریافت اطلاعات ناموفق بود."
      );
    } finally {
      setLoading(false);
    }
  }, [request, showNotice]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (authenticated) loadData();
  }, [authenticated, loadData]);

  const productMap = useMemo(() => {
    return new Map(products.map((product) => [product.id, product]));
  }, [products]);

  const filteredImages = useMemo(() => {
    let result = [...images];

    if (productFilter !== "all") {
      result = result.filter(
        (item) => String(item.product) === productFilter
      );
    }

    if (primaryFilter === "primary") {
      result = result.filter((item) => item.is_primary);
    } else if (primaryFilter === "normal") {
      result = result.filter((item) => !item.is_primary);
    }

    const query = search.trim().toLowerCase();

    if (query) {
      result = result.filter((item) => {
        const product = productMap.get(String(item.product));

        return [
          item.alt_text,
          item.id,
          product?.name,
          product?.sku,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      });
    }

    return result.sort(
      (a, b) => Number(a.sort_order) - Number(b.sort_order)
    );
  }, [images, productFilter, primaryFilter, search, productMap]);

  const stats = useMemo(() => ({
    total: images.length,
    primary: images.filter((item) => item.is_primary).length,
    products: new Set(images.map((item) => String(item.product))).size,
    withoutAlt: images.filter((item) => !item.alt_text?.trim()).length,
  }), [images]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setPreview("");
    setModalOpen(true);
    setNotice(null);
  }

  function openEdit(item: ProductImage) {
    setEditing(item);

    setForm({
      product: String(item.product),
      image: null,
      alt_text: item.alt_text || "",
      sort_order: String(item.sort_order ?? 0),
      is_primary: Boolean(item.is_primary),
    });

    setPreview(getImageUrl(item.image));
    setModalOpen(true);
    setNotice(null);
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setPreview("");
  }

  function update<K extends keyof ImageForm>(
    key: K,
    value: ImageForm[K]
  ) {
    setForm((old) => ({ ...old, [key]: value }));
  }

  function selectImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showNotice("error", "فایل انتخاب‌شده باید تصویر باشد.");
      event.target.value = "";
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      showNotice("error", "حجم تصویر نباید بیشتر از ۱۲ مگابایت باشد.");
      event.target.value = "";
      return;
    }

    update("image", file);
    setPreview(URL.createObjectURL(file));
  }

  async function saveImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.product) {
      showNotice("error", "ابتدا محصول موردنظر را انتخاب کنید.");
      return;
    }

    if (!editing && !form.image) {
      showNotice("error", "انتخاب تصویر الزامی است.");
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

      body.append("product", form.product);
      body.append("alt_text", form.alt_text.trim());
      body.append("sort_order", String(order));
      body.append("is_primary", String(form.is_primary));

      if (form.image) {
        body.append("image", form.image);
      }

      const url = editing
        ? `${IMAGES_API}${editing.id}/`
        : IMAGES_API;

      await request(
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

      showNotice(
        "success",
        editing
          ? "اطلاعات تصویر بروزرسانی شد."
          : "تصویر جدید ثبت شد."
      );

      await loadData();
    } catch (error) {
      showNotice(
        "error",
        error instanceof Error ? error.message : "ذخیره تصویر ناموفق بود."
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeImage() {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      await request(
        `${IMAGES_API}${deleteTarget.id}/`,
        { method: "DELETE" },
        true
      );

      setDeleteTarget(null);
      showNotice("success", "تصویر حذف شد.");
      await loadData();
    } catch (error) {
      showNotice(
        "error",
        error instanceof Error ? error.message : "حذف تصویر ناموفق بود."
      );
    } finally {
      setDeleting(false);
    }
  }

  async function setPrimary(item: ProductImage) {
    try {
      await request(
        `${IMAGES_API}${item.id}/`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_primary: !item.is_primary }),
        },
        true
      );

      showNotice(
        "success",
        item.is_primary
          ? "تصویر از حالت اصلی خارج شد."
          : "تصویر به‌عنوان تصویر اصلی علامت‌گذاری شد."
      );

      await loadData();
    } catch (error) {
      showNotice(
        "error",
        error instanceof Error ? error.message : "تغییر تصویر اصلی ناموفق بود."
      );
    }
  }

  if (checkingAuth) {
    return (
      <main className="loading-page" dir="rtl">
        <LoaderCircle className="spin" size={34} />
        <p>در حال بررسی دسترسی مدیریت...</p>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="loading-page" dir="rtl">
        <FolderOpen size={42} />
        <h2>دسترسی مدیریت</h2>
        <p>برای مشاهده گالری تصاویر وارد پنل مدیریت شوید.</p>
        <a href="/admin" className="gold-button">بازگشت به مدیریت</a>
      </main>
    );
  }

  return (
    <main className="gallery-page" dir="rtl">
      <div className="glow glow-a" />
      <div className="glow glow-b" />

      <div className="container">
        <header className="header">
          <div className="brand">
            <div className="brand-mark">J</div>
            <div>
              <div className="brand-name">JALALI</div>
              <div className="brand-caption">MEDIA MANAGEMENT</div>
            </div>
          </div>

          <a href="/admin" className="back-link">بازگشت به مدیریت</a>
        </header>

        <section className="heading">
          <div>
            <div className="eyebrow">
              <Images size={15} />
              PRODUCT MEDIA CENTER
            </div>
            <h1>گالری تصاویر محصولات</h1>
            <p>
              تصاویر محصولات، تصویر اصلی، متن جایگزین و ترتیب نمایش را مدیریت کنید.
            </p>
          </div>

          <button className="primary-button" onClick={openCreate}>
            <ImagePlus size={19} />
            افزودن تصویر
          </button>
        </section>

        {notice && (
          <div className={`notice ${notice.type}`}>
            {notice.type === "success"
              ? <CheckCircle2 size={19} />
              : <AlertCircle size={19} />}
            <span>{notice.message}</span>
            <button onClick={() => setNotice(null)}><X size={17} /></button>
          </div>
        )}

        <section className="stats">
          <Stat icon={<Images size={21} />} label="کل تصاویر" value={stats.total} />
          <Stat icon={<Star size={21} />} label="تصاویر اصلی" value={stats.primary} />
          <Stat icon={<Package size={21} />} label="محصولات دارای تصویر" value={stats.products} />
          <Stat icon={<AlertCircle size={21} />} label="بدون متن جایگزین" value={stats.withoutAlt} />
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>مدیریت فایل‌های تصویری</h2>
              <p>فهرست تصاویر ثبت‌شده در گالری محصولات</p>
            </div>

            <button
              className="icon-button"
              onClick={loadData}
              disabled={loading}
              title="بروزرسانی"
            >
              <RefreshCw size={18} className={loading ? "spin" : ""} />
            </button>
          </div>

          <div className="filters">
            <div className="search">
              <Search size={18} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="جست‌وجوی محصول، کد یا متن تصویر..."
              />
              {search && (
                <button onClick={() => setSearch("")}><X size={16} /></button>
              )}
            </div>

            <select
              value={productFilter}
              onChange={(event) => setProductFilter(event.target.value)}
            >
              <option value="all">تمام محصولات</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>

            <select
              value={primaryFilter}
              onChange={(event) => setPrimaryFilter(event.target.value)}
            >
              <option value="all">تمام تصاویر</option>
              <option value="primary">تصاویر اصلی</option>
              <option value="normal">تصاویر معمولی</option>
            </select>
          </div>

          <div className="result-count">
            <span><Filter size={14} /> {filteredImages.length.toLocaleString("fa-IR")} تصویر</span>
            <span><ArrowUpDown size={14} /> مرتب‌سازی بر اساس ترتیب نمایش</span>
          </div>

          {loading ? (
            <div className="empty">
              <LoaderCircle size={32} className="spin" />
              <p>در حال دریافت گالری...</p>
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="empty">
              <Images size={42} />
              <h3>تصویری پیدا نشد</h3>
              <p>می‌توانید اولین تصویر گالری را ثبت کنید.</p>
              <button className="primary-button" onClick={openCreate}>
                <PlusIcon />
                افزودن تصویر
              </button>
            </div>
          ) : (
            <div className="image-grid">
              {filteredImages.map((item) => {
                const product = productMap.get(String(item.product));

                return (
                  <article className="image-card" key={item.id}>
                    <div className="image-cover">
                      {item.image ? (
                        <img src={getImageUrl(item.image)} alt={item.alt_text || "تصویر محصول"} />
                      ) : (
                        <Images size={35} />
                      )}

                      {item.is_primary && (
                        <span className="primary-label">
                          <Star size={13} fill="currentColor" />
                          تصویر اصلی
                        </span>
                      )}

                      <span className="image-id">#{item.id}</span>
                    </div>

                    <div className="image-info">
                      <h3>{product?.name || "محصول نامشخص"}</h3>
                      <div className="sku">
                        {product?.sku || String(item.product)}
                      </div>

                      <p className="alt-text">
                        {item.alt_text || "متن جایگزین ثبت نشده است"}
                      </p>

                      <div className="image-meta">
                        <span>ترتیب: {Number(item.sort_order).toLocaleString("fa-IR")}</span>
                        <span>{formatDate(item.created_at)}</span>
                      </div>

                      <div className="card-actions">
                        <button
                          className="action primary-action"
                          onClick={() => setPrimary(item)}
                          title="تغییر وضعیت تصویر اصلی"
                        >
                          <Star size={16} />
                        </button>

                        <button
                          className="action edit-action"
                          onClick={() => openEdit(item)}
                          title="ویرایش"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          className="action delete-action"
                          onClick={() => setDeleteTarget(item)}
                          title="حذف"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <footer className="footer">
          <span>JALALI MEDIA MANAGEMENT</span>
          <span>PRODUCT GALLERY</span>
        </footer>
      </div>

      {modalOpen && (
        <div className="backdrop" onMouseDown={closeModal}>
          <section
            className="modal"
            onMouseDown={(event) => event.stopPropagation()}
            dir="rtl"
          >
            <div className="modal-heading">
              <div>
                <span className="eyebrow">IMAGE CONFIGURATION</span>
                <h2>{editing ? "ویرایش تصویر" : "ثبت تصویر جدید"}</h2>
                <p>اطلاعات تصویر محصول را تکمیل کنید.</p>
              </div>
              <button className="icon-button" onClick={closeModal} disabled={saving}>
                <X size={19} />
              </button>
            </div>

            <form onSubmit={saveImage}>
              <div className="form-fields">
                <label className="field full">
                  <span>محصول موردنظر *</span>
                  <select
                    value={form.product}
                    onChange={(event) => update("product", event.target.value)}
                    required
                  >
                    <option value="">انتخاب محصول</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} — {product.sku}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field full">
                  <span>متن جایگزین تصویر (Alt Text)</span>
                  <input
                    value={form.alt_text}
                    onChange={(event) => update("alt_text", event.target.value)}
                    placeholder="توضیح دقیق تصویر برای دسترس‌پذیری و سئو"
                    maxLength={220}
                  />
                </label>

                <label className="field">
                  <span>ترتیب نمایش</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.sort_order}
                    onChange={(event) => update("sort_order", event.target.value)}
                  />
                </label>

                <div className="field">
                  <span>نقش تصویر</span>
                  <button
                    type="button"
                    className={`primary-toggle ${form.is_primary ? "selected" : ""}`}
                    onClick={() => update("is_primary", !form.is_primary)}
                  >
                    <Star size={16} />
                    {form.is_primary ? "تصویر اصلی" : "تصویر معمولی"}
                  </button>
                </div>

                <div className="field full">
                  <span>فایل تصویر {editing ? "(اختیاری برای جایگزینی)" : "*"}</span>

                  <div className="upload-area">
                    {preview ? (
                      <div className="preview">
                        <img src={preview} alt="پیش‌نمایش تصویر" />
                        <div>
                          <strong>پیش‌نمایش تصویر</strong>
                          <button
                            type="button"
                            className="replace-button"
                            onClick={() => fileRef.current?.click()}
                          >
                            <Upload size={15} />
                            انتخاب تصویر دیگر
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="upload-placeholder"
                        onClick={() => fileRef.current?.click()}
                      >
                        <Upload size={27} />
                        <strong>انتخاب فایل تصویر</strong>
                        <span>JPG، PNG، WEBP یا GIF - حداکثر ۱۲ مگابایت</span>
                      </button>
                    )}

                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={selectImage}
                      hidden
                    />
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

                <button className="primary-button" type="submit" disabled={saving}>
                  {saving
                    ? <LoaderCircle size={18} className="spin" />
                    : <Check size={18} />}
                  {saving ? "در حال ذخیره..." : editing ? "ذخیره تغییرات" : "ثبت تصویر"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {deleteTarget && (
        <div className="backdrop" onMouseDown={() => !deleting && setDeleteTarget(null)}>
          <section
            className="confirm-modal"
            onMouseDown={(event) => event.stopPropagation()}
            dir="rtl"
          >
            <div className="confirm-icon"><Trash2 size={27} /></div>
            <h2>حذف تصویر</h2>
            <p>آیا از حذف این تصویر از گالری مطمئن هستید؟</p>
            <p className="warning">این عملیات پس از تأیید به سرور ارسال می‌شود.</p>

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
                onClick={removeImage}
                disabled={deleting}
              >
                {deleting ? <LoaderCircle size={17} className="spin" /> : <Trash2 size={17} />}
                {deleting ? "در حال حذف..." : "تأیید حذف"}
              </button>
            </div>
          </section>
        </div>
      )}

      <style jsx>{`
        .gallery-page {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          background: #090909;
          color: #f5eee4;
          padding: 28px 22px 50px;
        }

        .glow {
          position: absolute;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          filter: blur(130px);
          opacity: .09;
          pointer-events: none;
        }

        .glow-a { background: #d6a35c; top: -220px; right: -120px; }
        .glow-b { background: #926b43; bottom: 5%; left: -250px; }

        .container { max-width: 1450px; margin: auto; position: relative; z-index: 1; }

        .header, .brand, .heading, .panel-heading, .modal-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .header { padding-bottom: 22px; border-bottom: 1px solid #30291f; }

        .brand { justify-content: flex-start; gap: 12px; }

        .brand-mark {
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          border: 1px solid #d9ad68;
          color: #d9ad68;
          border-radius: 12px;
          font-family: Georgia, serif;
          font-size: 27px;
          font-weight: bold;
        }

        .brand-name { color: #e6c38e; letter-spacing: 4px; font: bold 17px Georgia, serif; }
        .brand-caption { color: #756c60; font-size: 9px; letter-spacing: 2px; margin-top: 5px; }

        .back-link { color: #c3b8a8; text-decoration: none; font-size: 12px; }
        .back-link:hover { color: #d9ad68; }

        .heading { gap: 20px; padding: 38px 0 27px; }
        .eyebrow { display: flex; align-items: center; gap: 7px; color: #d9ad68; font-size: 10px; letter-spacing: 2px; }
        .heading h1 { font-size: clamp(22px, 3vw, 31px); margin: 12px 0 8px; }
        .heading p, .panel-heading p { color: #92887b; font-size: 12px; margin: 0; line-height: 1.9; }

        button { font-family: inherit; cursor: pointer; }
        button:disabled { opacity: .55; cursor: not-allowed; }

        .primary-button, .gold-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          padding: 12px 18px;
          border: 1px solid #e2bc7d;
          border-radius: 10px;
          background: linear-gradient(135deg, #e5c58f, #b9894e);
          color: #17120c;
          font-size: 12px;
          font-weight: 800;
          text-decoration: none;
        }

        .notice {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 13px;
          margin-bottom: 18px;
          border: 1px solid;
          border-radius: 10px;
          font-size: 12px;
        }

        .notice span { flex: 1; }
        .notice button { border: 0; background: transparent; color: inherit; display: grid; place-items: center; }
        .notice.success { background: #14251a; color: #a5ddb2; border-color: #31583a; }
        .notice.error { background: #281715; color: #efb5a9; border-color: #663a33; }

        .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 22px; }

        .panel {
          padding: 22px;
          background: #13120f;
          border: 1px solid #332c22;
          border-radius: 16px;
        }

        .panel-heading { padding-bottom: 18px; border-bottom: 1px solid #30291f; }
        .panel-heading h2 { margin: 0 0 7px; font-size: 17px; }

        .icon-button {
          width: 39px;
          height: 39px;
          display: grid;
          place-items: center;
          border: 1px solid #443727;
          border-radius: 10px;
          background: #211c15;
          color: #d9ad68;
        }

        .filters {
          display: grid;
          grid-template-columns: minmax(180px, 1fr) 220px 170px;
          gap: 10px;
          margin: 19px 0 12px;
        }

        .search {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 0 12px;
          background: #0d0d0c;
          border: 1px solid #39332b;
          border-radius: 9px;
          color: #b8955e;
        }

        .search input {
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

        .search button { border: 0; background: transparent; color: #b6a48a; }

        .filters select, .field input, .field select {
          width: 100%;
          min-width: 0;
          padding: 12px;
          border: 1px solid #39332b;
          border-radius: 9px;
          outline: none;
          background: #0d0d0c;
          color: #e8dfd2;
          font-family: inherit;
          font-size: 11px;
        }

        .filters select:focus, .field input:focus, .field select:focus { border-color: #b58a50; }

        .result-count {
          display: flex;
          justify-content: space-between;
          color: #82786b;
          font-size: 10px;
          padding: 5px 0 17px;
        }

        .result-count span { display: flex; align-items: center; gap: 6px; }

        .image-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }

        .image-card {
          overflow: hidden;
          border: 1px solid #393126;
          border-radius: 13px;
          background: #191713;
          transition: .2s;
        }

        .image-card:hover { border-color: #85643e; transform: translateY(-2px); }

        .image-cover {
          position: relative;
          height: 205px;
          display: grid;
          place-items: center;
          overflow: hidden;
          background: #211e19;
          color: #b99b6a;
        }

        .image-cover img { width: 100%; height: 100%; object-fit: cover; }

        .primary-label {
          position: absolute;
          top: 10px;
          right: 10px;
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 6px 9px;
          border-radius: 20px;
          background: #d9ad68;
          color: #1a140c;
          font-size: 9px;
          font-weight: 800;
        }

        .image-id {
          position: absolute;
          bottom: 9px;
          left: 9px;
          padding: 4px 7px;
          border-radius: 6px;
          background: #000b;
          color: #ddd;
          font-size: 9px;
        }

        .image-info { padding: 13px; }
        .image-info h3 { margin: 0; font-size: 13px; color: #e9d9bf; }
        .sku { color: #b18b57; font-size: 10px; margin-top: 6px; }
        .alt-text { color: #8e8579; font-size: 10px; min-height: 30px; line-height: 1.8; margin: 9px 0; }
        .image-meta { display: flex; justify-content: space-between; gap: 7px; color: #82796e; font-size: 9px; padding-bottom: 11px; border-bottom: 1px solid #302a22; }

        .card-actions { display: flex; gap: 7px; padding-top: 11px; }

        .action {
          flex: 1;
          height: 34px;
          display: grid;
          place-items: center;
          border: 1px solid #443a2e;
          border-radius: 8px;
          background: #242019;
          color: #c5b18f;
        }

        .action:hover { border-color: #987447; color: #e9c58c; }
        .edit-action { color: #d9b77e; }
        .delete-action { color: #db8e83; border-color: #56332d; }

        .empty {
          min-height: 250px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: #b99b6a;
          text-align: center;
        }

        .empty h3 { margin: 0; color: #e6d9c7; font-size: 15px; }
        .empty p { margin: 0 0 7px; color: #8d8478; font-size: 11px; }

        .footer { display: flex; justify-content: space-between; padding-top: 24px; color: #62594d; letter-spacing: 2px; font: 9px Georgia, serif; }

        .backdrop {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
          overflow-y: auto;
          background: #000c;
          backdrop-filter: blur(8px);
        }

        .modal, .confirm-modal {
          width: 100%;
          max-width: 650px;
          max-height: calc(100vh - 36px);
          overflow-y: auto;
          padding: 24px;
          border: 1px solid #5a462e;
          border-radius: 16px;
          background: #171512;
          box-shadow: 0 25px 90px #0009;
        }

        .modal-heading { align-items: flex-start; margin-bottom: 22px; }
        .modal-heading h2, .confirm-modal h2 { margin: 9px 0 6px; font-size: 19px; }
        .modal-heading p { margin: 0; color: #92887b; font-size: 11px; }

        .form-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 17px; }
        .field { display: flex; flex-direction: column; gap: 9px; min-width: 0; color: #c7bba8; font-size: 11px; }
        .full { grid-column: 1 / -1; }

        .primary-toggle {
          height: 42px;
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 0 12px;
          border: 1px solid #493a29;
          border-radius: 9px;
          background: #0d0d0c;
          color: #a99a81;
          font-size: 11px;
        }

        .primary-toggle.selected { border-color: #8b693d; color: #e5bf80; background: #292014; }

        .upload-area { display: flex; flex-direction: column; gap: 10px; }

        .upload-placeholder {
          min-height: 135px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 9px;
          border: 1px dashed #806542;
          border-radius: 11px;
          background: #12110e;
          color: #d1ad73;
        }

        .upload-placeholder strong { font-size: 12px; }
        .upload-placeholder span { color: #81776a; font-size: 10px; }

        .preview { display: flex; align-items: center; gap: 15px; flex-wrap: wrap; }
        .preview img { width: 125px; height: 105px; object-fit: cover; border-radius: 10px; border: 1px solid #5a4831; }
        .preview strong { display: block; margin-bottom: 10px; font-size: 11px; color: #e5d3b6; }

        .replace-button {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 9px 11px;
          border: 1px solid #5c4a30;
          border-radius: 8px;
          background: #211c14;
          color: #d9b87f;
          font-size: 10px;
        }

        .modal-actions { display: flex; justify-content: flex-end; gap: 9px; margin-top: 23px; padding-top: 18px; border-top: 1px solid #302a22; }

        .secondary-button, .danger-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 11px 17px;
          border: 1px solid #494137;
          border-radius: 9px;
          background: #25211b;
          color: #c9bdab;
          font-family: inherit;
          font-size: 11px;
        }

        .danger-button { border-color: #733c35; background: #57251f; color: #ffe0d8; }

        .confirm-modal { max-width: 420px; text-align: center; }
        .confirm-icon { width: 57px; height: 57px; margin: 0 auto 15px; display: grid; place-items: center; border-radius: 15px; color: #e4a096; background: #38201d; border: 1px solid #71423a; }
        .confirm-modal p { color: #aaa093; font-size: 12px; line-height: 1.9; }
        .confirm-modal .warning { color: #d5a17d; font-size: 10px; }
        .confirm-modal .modal-actions { justify-content: center; }

        .loading-page {
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

        .loading-page p { color: #a79b88; font-size: 12px; }

        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 1100px) {
          .image-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }

        @media (max-width: 800px) {
          .stats { grid-template-columns: repeat(2, 1fr); }
          .image-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .filters { grid-template-columns: 1fr 1fr; }
          .search { grid-column: 1 / -1; }
        }

        @media (max-width: 520px) {
          .gallery-page { padding: 17px 11px 35px; }
          .heading { align-items: flex-start; flex-direction: column; }
          .heading .primary-button { width: 100%; }
          .panel { padding: 13px; }
          .image-grid { grid-template-columns: 1fr; }
          .image-cover { height: 230px; }
          .form-fields { grid-template-columns: 1fr; }
          .full { grid-column: auto; }
          .modal { padding: 17px; }
          .footer { font-size: 7px; }
        }
      `}</style>
    </main>
  );
}

function PlusIcon() {
  return <ImagePlus size={17} />;
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value.toLocaleString("fa-IR")}</div>

      <style jsx>{`
        .stat-card {
          min-height: 115px;
          padding: 17px;
          border: 1px solid #342c21;
          border-radius: 13px;
          background: linear-gradient(145deg, #1b1915, #11100e);
        }

        .stat-icon {
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: #302619;
          color: #d9ad68;
          margin-bottom: 11px;
        }

        .stat-label { color: #aaa093; font-size: 10px; }
        .stat-value { color: #f0d5a7; font-size: 25px; font-weight: 800; margin-top: 5px; }
      `}</style>
    </div>
  );
}
