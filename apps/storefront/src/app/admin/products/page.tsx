
"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  ArrowRight,
  Package,
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  X,
  Save,
  ImagePlus,
  AlertTriangle,
  CheckCircle2,
  LoaderCircle,
  Filter,
  Boxes,
  Eye,
  EyeOff,
  Star,
  Tag,
  Barcode,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
} from "lucide-react";

// ============================================================
// CONFIGURATION
// ============================================================

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL || ""
).replace(/\/+$/, "");

const AUTH_CSRF_URL = "/api/store/admin/auth/csrf/";
const PRODUCTS_URL = "/api/admin/store/products/products/";
const CATEGORIES_URL = "/api/admin/store/products/categories/";
const BRANDS_URL = "/api/admin/store/products/brands/";

const PAGE_SIZE = 20;

// ============================================================
// TYPES
// ============================================================

type ProductCategory = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
};

type ProductBrand = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  barcode?: string;
  category: number | ProductCategory;
  brand?: number | ProductBrand | null;
  short_description?: string;
  description?: string;
  image?: string | null;
  public_price: number | string;
  cost_price: number | string;
  stock_quantity: number;
  minimum_order_quantity: number;
  units_per_carton: number;
  availability: string;
  is_active: boolean;
  is_featured: boolean;
  weight_grams: number;
  seo_title?: string;
  seo_description?: string;
  created_at?: string;
  updated_at?: string;
};

type ProductForm = {
  name: string;
  slug: string;
  sku: string;
  barcode: string;
  category: string;
  brand: string;
  short_description: string;
  description: string;
  public_price: string;
  cost_price: string;
  stock_quantity: string;
  minimum_order_quantity: string;
  units_per_carton: string;
  weight_grams: string;
  is_active: boolean;
  is_featured: boolean;
  seo_title: string;
  seo_description: string;
};

type ListResult<T> = {
  results?: T[];
  count?: number;
  next?: string | null;
  previous?: string | null;
};

const EMPTY_FORM: ProductForm = {
  name: "",
  slug: "",
  sku: "",
  barcode: "",
  category: "",
  brand: "",
  short_description: "",
  description: "",
  public_price: "0",
  cost_price: "0",
  stock_quantity: "0",
  minimum_order_quantity: "1",
  units_per_carton: "1",
  weight_grams: "0",
  is_active: true,
  is_featured: false,
  seo_title: "",
  seo_description: "",
};

// ============================================================
// HELPERS
// ============================================================

function formatNumber(value: number | string | undefined) {
  const number = Number(value || 0);

  return new Intl.NumberFormat("fa-IR").format(
    Number.isFinite(number) ? number : 0
  );
}

function formatMoney(value: number | string | undefined) {
  return `${formatNumber(value)} تومان`;
}

function getCategoryId(
  category: Product["category"]
): string {
  if (typeof category === "object" && category !== null) {
    return String(category.id);
  }

  return String(category || "");
}

function getBrandId(
  brand: Product["brand"]
): string {
  if (typeof brand === "object" && brand !== null) {
    return String(brand.id);
  }

  return String(brand || "");
}

function getImageUrl(
  value?: string | null
): string {
  if (!value) return "";

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  if (!API_BASE) return value;

  return `${API_BASE}${value.startsWith("/") ? "" : "/"}${value}`;
}

async function parseResponse<T>(
  response: Response
): Promise<T> {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.detail ||
      data?.message ||
      data?.error ||
      "درخواست ناموفق بود.";

    if (typeof message === "string") {
      throw new Error(message);
    }

    throw new Error(JSON.stringify(message));
  }

  return data as T;
}

function unwrapList<T>(
  data: T[] | ListResult<T> | { data?: T[] }
): {
  items: T[];
  count: number;
  hasNext: boolean;
  hasPrevious: boolean;
} {
  if (Array.isArray(data)) {
    return {
      items: data,
      count: data.length,
      hasNext: false,
      hasPrevious: false,
    };
  }

  const result = data as ListResult<T> & {
    data?: T[];
  };

  const items = Array.isArray(result.results)
    ? result.results
    : Array.isArray(result.data)
      ? result.data
      : [];

  return {
    items,
    count: Number(result.count ?? items.length),
    hasNext: Boolean(result.next),
    hasPrevious: Boolean(result.previous),
  };
}

function makeForm(product?: Product): ProductForm {
  if (!product) {
    return { ...EMPTY_FORM };
  }

  return {
    name: product.name || "",
    slug: product.slug || "",
    sku: product.sku || "",
    barcode: product.barcode || "",
    category: getCategoryId(product.category),
    brand: getBrandId(product.brand),
    short_description: product.short_description || "",
    description: product.description || "",
    public_price: String(product.public_price ?? 0),
    cost_price: String(product.cost_price ?? 0),
    stock_quantity: String(product.stock_quantity ?? 0),
    minimum_order_quantity: String(
      product.minimum_order_quantity ?? 1
    ),
    units_per_carton: String(
      product.units_per_carton ?? 1
    ),
    weight_grams: String(product.weight_grams ?? 0),
    is_active: Boolean(product.is_active),
    is_featured: Boolean(product.is_featured),
    seo_title: product.seo_title || "",
    seo_description: product.seo_description || "",
  };
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [brands, setBrands] = useState<ProductBrand[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  const [form, setForm] = useState<ProductForm>({
    ...EMPTY_FORM,
  });

  const [selectedImage, setSelectedImage] =
    useState<File | null>(null);

  const [imagePreview, setImagePreview] = useState("");

  // ----------------------------------------------------------
  // CSRF
  // ----------------------------------------------------------

  const getCsrfToken = useCallback(async () => {
    if (!API_BASE) {
      throw new Error(
        "آدرس API تنظیم نشده است. NEXT_PUBLIC_API_BASE_URL را بررسی کن."
      );
    }

    const response = await fetch(
      `${API_BASE}${AUTH_CSRF_URL}`,
      {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      }
    );

    const data = await parseResponse<{
      success?: boolean;
      csrfToken?: string;
    }>(response);

    if (!data.csrfToken) {
      throw new Error(
        "توکن امنیتی سرور دریافت نشد."
      );
    }

    return data.csrfToken;
  }, []);

  // ----------------------------------------------------------
  // SESSION CHECK
  // ----------------------------------------------------------

  const checkSession = useCallback(async () => {
    if (!API_BASE) {
      setAuthenticated(false);
      setLoading(false);
      setError(
        "آدرس API بک‌اند تنظیم نشده است."
      );
      return false;
    }

    try {
      const response = await fetch(
        `${API_BASE}/api/store/admin/auth/me/`,
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

      const valid = Boolean(
        response.ok && data?.success && data?.user
      );

      setAuthenticated(valid);

      return valid;
    } catch {
      setAuthenticated(false);
      return false;
    }
  }, []);

  // ----------------------------------------------------------
  // LOAD PRODUCTS
  // ----------------------------------------------------------

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      params.set("page", String(page));
      params.set("page_size", String(PAGE_SIZE));

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (activeFilter) {
        params.set("active", activeFilter);
      }

      if (categoryFilter) {
        params.set("category", categoryFilter);
      }

      params.set("ordering", "-created_at");

      const response = await fetch(
        `${API_BASE}${PRODUCTS_URL}?${params.toString()}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data = await parseResponse<
        Product[] | ListResult<Product>
      >(response);

      const result = unwrapList(data);

      setProducts(result.items);
      setTotalCount(result.count);
      setHasNext(result.hasNext);
      setHasPrevious(result.hasPrevious);
    } catch (err) {
      setProducts([]);
      setError(
        err instanceof Error
          ? err.message
          : "دریافت محصولات ناموفق بود."
      );
    } finally {
      setLoading(false);
    }
  }, [
    page,
    search,
    activeFilter,
    categoryFilter,
  ]);

  // ----------------------------------------------------------
  // LOAD CATEGORIES AND BRANDS
  // ----------------------------------------------------------

  const loadCategoriesAndBrands = useCallback(
    async () => {
      try {
        const [categoryResponse, brandResponse] =
          await Promise.all([
            fetch(`${API_BASE}${CATEGORIES_URL}`, {
              credentials: "include",
              cache: "no-store",
            }),
            fetch(`${API_BASE}${BRANDS_URL}`, {
              credentials: "include",
              cache: "no-store",
            }),
          ]);

        const categoryData = await parseResponse<
          ProductCategory[] | ListResult<ProductCategory>
        >(categoryResponse);

        const brandData = await parseResponse<
          ProductBrand[] | ListResult<ProductBrand>
        >(brandResponse);

        setCategories(
          unwrapList(categoryData).items
        );

        setBrands(
          unwrapList(brandData).items
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "دریافت دسته‌بندی‌ها و برندها ناموفق بود."
        );
      }
    },
    []
  );

  // ----------------------------------------------------------
  // INITIALIZATION
  // ----------------------------------------------------------

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      const valid = await checkSession();

      if (!mounted) return;

      if (valid) {
        await loadCategoriesAndBrands();

        if (mounted) {
          await loadProducts();
        }
      } else {
        setLoading(false);
      }
    }

    initialize();

    return () => {
      mounted = false;
    };
  }, [
    checkSession,
    loadCategoriesAndBrands,
    loadProducts,
  ]);

  // ----------------------------------------------------------
  // FILTER EFFECT
  // ----------------------------------------------------------

  useEffect(() => {
    if (authenticated !== true) return;

    loadProducts();
  }, [
    authenticated,
    page,
    search,
    activeFilter,
    categoryFilter,
    loadProducts,
  ]);

  // ----------------------------------------------------------
  // OPEN CREATE MODAL
  // ----------------------------------------------------------

  function openCreateModal() {
    setEditingProduct(null);
    setForm({ ...EMPTY_FORM });
    setSelectedImage(null);
    setImagePreview("");
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  // ----------------------------------------------------------
  // OPEN EDIT MODAL
  // ----------------------------------------------------------

  function openEditModal(product: Product) {
    setEditingProduct(product);
    setForm(makeForm(product));
    setSelectedImage(null);
    setImagePreview(
      getImageUrl(product.image)
    );
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  // ----------------------------------------------------------
  // CLOSE MODAL
  // ----------------------------------------------------------

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditingProduct(null);
    setSelectedImage(null);
    setImagePreview("");
  }

  // ----------------------------------------------------------
  // FORM UPDATE
  // ----------------------------------------------------------

  function updateField<K extends keyof ProductForm>(
    key: K,
    value: ProductForm[K]
  ) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  // ----------------------------------------------------------
  // IMAGE SELECTION
  // ----------------------------------------------------------

  function handleImageSelection(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("فایل انتخاب‌شده تصویر معتبر نیست.");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError("حجم تصویر نباید بیشتر از ۸ مگابایت باشد.");
      return;
    }

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
    setError("");
  }

  // ----------------------------------------------------------
  // VALIDATE FORM
  // ----------------------------------------------------------

  function validateForm() {
    if (!form.name.trim()) {
      return "نام محصول الزامی است.";
    }

    if (!form.slug.trim()) {
      return "شناسه آدرس محصول الزامی است.";
    }

    if (!form.sku.trim()) {
      return "کد محصول الزامی است.";
    }

    if (!form.category) {
      return "دسته‌بندی محصول را انتخاب کن.";
    }

    const publicPrice = Number(form.public_price);
    const costPrice = Number(form.cost_price);
    const stock = Number(form.stock_quantity);
    const minimum = Number(form.minimum_order_quantity);
    const carton = Number(form.units_per_carton);
    const weight = Number(form.weight_grams);

    if (
      !Number.isFinite(publicPrice) ||
      publicPrice < 0
    ) {
      return "قیمت فروش معتبر نیست.";
    }

    if (
      !Number.isFinite(costPrice) ||
      costPrice < 0
    ) {
      return "قیمت خرید معتبر نیست.";
    }

    if (
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      return "موجودی باید عدد صحیح و غیرمنفی باشد.";
    }

    if (
      !Number.isInteger(minimum) ||
      minimum < 1
    ) {
      return "حداقل تعداد سفارش باید حداقل یک باشد.";
    }

    if (
      !Number.isInteger(carton) ||
      carton < 1
    ) {
      return "تعداد در کارتن باید حداقل یک باشد.";
    }

    if (
      !Number.isInteger(weight) ||
      weight < 0
    ) {
      return "وزن محصول معتبر نیست.";
    }

    return "";
  }

  // ----------------------------------------------------------
  // CREATE / UPDATE PRODUCT
  // ----------------------------------------------------------

  async function saveProduct(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    try {
      const csrfToken = await getCsrfToken();

      const body = new FormData();

      body.append("name", form.name.trim());
      body.append("slug", form.slug.trim());
      body.append("sku", form.sku.trim().toUpperCase());
      body.append("barcode", form.barcode.trim());

      body.append("category", form.category);
      body.append("brand", form.brand || "");

      body.append(
        "short_description",
        form.short_description.trim()
      );

      body.append(
        "description",
        form.description.trim()
      );

      body.append("public_price", form.public_price);
      body.append("cost_price", form.cost_price);
      body.append("stock_quantity", form.stock_quantity);

      body.append(
        "minimum_order_quantity",
        form.minimum_order_quantity
      );

      body.append(
        "units_per_carton",
        form.units_per_carton
      );

      body.append("weight_grams", form.weight_grams);

      body.append(
        "is_active",
        String(form.is_active)
      );

      body.append(
        "is_featured",
        String(form.is_featured)
      );

      body.append(
        "seo_title",
        form.seo_title.trim()
      );

      body.append(
        "seo_description",
        form.seo_description.trim()
      );

      if (selectedImage) {
        body.append("image", selectedImage);
      }

      const isEditing = Boolean(editingProduct);

      const url = isEditing
        ? `${API_BASE}${PRODUCTS_URL}${editingProduct!.id}/`
        : `${API_BASE}${PRODUCTS_URL}`;

      const response = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "X-CSRFToken": csrfToken,
        },
        body,
      });

      await parseResponse<Product>(response);

      setSuccess(
        isEditing
          ? "اطلاعات محصول با موفقیت بروزرسانی شد."
          : "محصول جدید با موفقیت ثبت شد."
      );

      setModalOpen(false);
      setEditingProduct(null);
      setSelectedImage(null);
      setImagePreview("");

      await loadProducts();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "ذخیره محصول ناموفق بود."
      );
    } finally {
      setSaving(false);
    }
  }

  // ----------------------------------------------------------
  // DELETE PRODUCT
  // ----------------------------------------------------------

  async function deleteProduct(product: Product) {
    const confirmed = window.confirm(
      `محصول «${product.name}» حذف شود؟ این عملیات قابل بازگشت نیست.`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      const csrfToken = await getCsrfToken();

      const response = await fetch(
        `${API_BASE}${PRODUCTS_URL}${product.id}/`,
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

      setSuccess(
        `محصول «${product.name}» حذف شد.`
      );

      await loadProducts();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "حذف محصول انجام نشد."
      );
    }
  }

  // ----------------------------------------------------------
  // AUTHENTICATION SCREEN
  // ----------------------------------------------------------

  if (authenticated === false) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#080808] px-5 text-white"
      >
        <div className="w-full max-w-md rounded-[28px] border border-[#bd9568]/25 bg-[#141311] p-7 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#bd9568]/20 bg-[#bd9568]/10 text-[#e4bd8c]">
            <EyeOff size={28} />
          </div>

          <h1 className="mt-5 text-xl font-black text-[#e4bd8c]">
            دسترسی مدیر لازم است
          </h1>

          <p className="mt-3 text-sm leading-7 text-white/50">
            برای مدیریت محصولات ابتدا وارد پنل مدیریت JALALI شو.
          </p>

          <a
            href="/admin"
            className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-[#e5c18e] to-[#a97845] py-4 font-bold text-black"
          >
            <ArrowRight size={18} />
            ورود به پنل مدیریت
          </a>
        </div>
      </main>
    );
  }

  // ----------------------------------------------------------
  // PAGE
  // ----------------------------------------------------------

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#080808] px-4 py-7 text-white sm:px-6"
    >
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <header className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#bd9568]/25 bg-[#bd9568]/10 text-[#e4bd8c]">
              <Package size={27} />
            </div>

            <div>
              <h1 className="text-2xl font-black text-[#e4bd8c]">
                مدیریت محصولات
              </h1>

              <p className="mt-2 text-xs text-white/40">
                مرکز کنترل محصولات، قیمت‌ها و موجودی انبار JALALI
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="/admin"
              className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-xs text-white/65 transition hover:border-[#bd9568]/40 hover:text-[#e4bd8c]"
            >
              <ArrowRight size={16} />
              بازگشت به داشبورد
            </a>

            <button
              type="button"
              onClick={() => {
                loadProducts();
                loadCategoriesAndBrands();
              }}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-[#bd9568]/30 px-4 py-3 text-xs text-[#e4bd8c] transition hover:bg-[#bd9568]/10 disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={loading ? "animate-spin" : ""}
              />
              بروزرسانی
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-l from-[#e5c18e] to-[#a97845] px-5 py-3 text-xs font-bold text-black transition hover:brightness-110"
            >
              <Plus size={17} />
              افزودن محصول
            </button>
          </div>
        </header>

        {/* MESSAGES */}

        {error && (
          <Message
            type="error"
            message={error}
            onClose={() => setError("")}
          />
        )}

        {success && (
          <Message
            type="success"
            message={success}
            onClose={() => setSuccess("")}
          />
        )}

        {/* SUMMARY */}

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard
            icon={<Boxes size={21} />}
            title="محصولات این صفحه"
            value={formatNumber(products.length)}
          />

          <SummaryCard
            icon={<Package size={21} />}
            title="تعداد کل نتایج"
            value={formatNumber(totalCount)}
          />

          <SummaryCard
            icon={<Tag size={21} />}
            title="دسته‌بندی‌های بارگذاری‌شده"
            value={formatNumber(categories.length)}
          />
        </section>

        {/* FILTERS */}

        <section className="mb-6 rounded-[24px] border border-[#bd9568]/20 bg-[#141311] p-5">
          <div className="mb-4 flex items-center gap-2 text-[#e4bd8c]">
            <Filter size={18} />

            <h2 className="text-sm font-bold">
              جست‌وجو و فیلتر محصولات
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4">
              <Search
                size={18}
                className="shrink-0 text-[#bd9568]"
              />

              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="نام، کد محصول، بارکد یا برند..."
                className="w-full bg-transparent py-4 text-sm outline-none placeholder:text-white/25"
              />
            </div>

            <select
              value={activeFilter}
              onChange={(event) => {
                setActiveFilter(event.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-white/10 bg-[#0d0c0b] px-4 py-4 text-sm text-white/75 outline-none focus:border-[#bd9568]"
            >
              <option value="">تمام وضعیت‌ها</option>
              <option value="true">فقط محصولات فعال</option>
              <option value="false">فقط محصولات غیرفعال</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(event) => {
                setCategoryFilter(event.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-white/10 bg-[#0d0c0b] px-4 py-4 text-sm text-white/75 outline-none focus:border-[#bd9568]"
            >
              <option value="">تمام دسته‌بندی‌ها</option>

              {categories.map((category) => (
                <option
                  key={category.id}
                  value={category.slug}
                >
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* PRODUCTS TABLE */}

        <section className="overflow-hidden rounded-[24px] border border-[#bd9568]/20 bg-[#141311]">
          <div className="flex flex-col justify-between gap-3 border-b border-white/10 p-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-bold text-[#e4bd8c]">
                فهرست محصولات
              </h2>

              <p className="mt-1 text-[11px] text-white/35">
                اطلاعات از API مدیریتی بک‌اند دریافت می‌شود.
              </p>
            </div>

            <span className="text-xs text-white/45">
              صفحه {formatNumber(page)}
            </span>
          </div>

          {loading ? (
            <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-white/45">
              <LoaderCircle
                size={23}
                className="animate-spin text-[#e4bd8c]"
              />

              در حال دریافت محصولات...
            </div>
          ) : products.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-4 px-5 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#bd9568]/20 bg-[#bd9568]/10 text-[#e4bd8c]">
                <Package size={28} />
              </div>

              <p className="font-bold">
                محصولی پیدا نشد
              </p>

              <p className="text-xs text-white/40">
                جست‌وجو یا فیلترها را تغییر بده یا محصول جدید ثبت کن.
              </p>

              <button
                type="button"
                onClick={openCreateModal}
                className="mt-2 flex items-center gap-2 rounded-xl bg-[#bd9568] px-5 py-3 text-xs font-bold text-black"
              >
                <Plus size={16} />
                ثبت محصول جدید
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-right">
                  <thead>
                    <tr className="border-b border-white/10 bg-black/20 text-[11px] text-white/45">
                      <th className="px-5 py-4 font-medium">
                        محصول
                      </th>

                      <th className="px-4 py-4 font-medium">
                        کد محصول
                      </th>

                      <th className="px-4 py-4 font-medium">
                        دسته‌بندی
                      </th>

                      <th className="px-4 py-4 font-medium">
                        قیمت فروش
                      </th>

                      <th className="px-4 py-4 font-medium">
                        موجودی
                      </th>

                      <th className="px-4 py-4 font-medium">
                        وضعیت
                      </th>

                      <th className="px-5 py-4 text-center font-medium">
                        عملیات
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {products.map((product) => {
                      const categoryName =
                        typeof product.category === "object"
                          ? product.category?.name
                          : categories.find(
                              (item) =>
                                String(item.id) ===
                                String(product.category)
                            )?.name;

                      return (
                        <tr
                          key={product.id}
                          className="border-b border-white/[0.06] transition hover:bg-white/[0.025]"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/30">
                                {product.image ? (
                                  <img
                                    src={getImageUrl(product.image)}
                                    alt={product.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full items-center justify-center text-white/20">
                                    <Package size={20} />
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0">
                                <p className="max-w-56 truncate text-sm font-bold">
                                  {product.name}
                                </p>

                                {product.is_featured && (
                                  <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-[#e4bd8c]">
                                    <Star size={11} />
                                    محصول ویژه
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <span className="font-mono text-xs text-white/65">
                              {product.sku}
                            </span>
                          </td>

                          <td className="px-4 py-4 text-xs text-white/60">
                            {categoryName || "—"}
                          </td>

                          <td className="px-4 py-4 text-xs font-bold text-[#e4bd8c]">
                            {formatMoney(product.public_price)}
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={
                                product.stock_quantity > 5
                                  ? "text-xs text-emerald-300"
                                  : product.stock_quantity > 0
                                    ? "text-xs text-amber-300"
                                    : "text-xs text-red-300"
                              }
                            >
                              {formatNumber(product.stock_quantity)}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={
                                product.is_active
                                  ? "rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[10px] text-emerald-300"
                                  : "rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-[10px] text-red-300"
                              }
                            >
                              {product.is_active
                                ? "فعال"
                                : "غیرفعال"}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  openEditModal(product)
                                }
                                title="ویرایش محصول"
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#bd9568]/20 text-[#e4bd8c] transition hover:bg-[#bd9568]/10"
                              >
                                <Pencil size={15} />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  deleteProduct(product)
                                }
                                title="حذف محصول"
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/20 text-red-300 transition hover:bg-red-500/10"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION */}

              <div className="flex flex-col justify-between gap-3 border-t border-white/10 px-5 py-4 sm:flex-row sm:items-center">
                <p className="text-xs text-white/40">
                  مجموع نتایج: {formatNumber(totalCount)}
                </p>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={!hasPrevious || page <= 1}
                    onClick={() =>
                      setPage((previous) =>
                        Math.max(1, previous - 1)
                      )
                    }
                    className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-xs text-white/65 disabled:opacity-30"
                  >
                    <ChevronRight size={15} />
                    قبلی
                  </button>

                  <span className="text-xs text-[#e4bd8c]">
                    {formatNumber(page)}
                  </span>

                  <button
                    type="button"
                    disabled={!hasNext}
                    onClick={() =>
                      setPage((previous) => previous + 1)
                    }
                    className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-xs text-white/65 disabled:opacity-30"
                  >
                    بعدی
                    <ChevronLeft size={15} />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        {/* CATEGORY AND BRAND INFORMATION */}

        <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <SmallCollectionCard
            title="دسته‌بندی‌های موجود"
            icon={<Boxes size={20} />}
            items={categories.map((item) => item.name)}
            empty="هنوز دسته‌بندی‌ای ثبت نشده است."
          />

          <SmallCollectionCard
            title="برندهای موجود"
            icon={<Tag size={20} />}
            items={brands.map((item) => item.name)}
            empty="هنوز برندی ثبت نشده است."
          />
        </section>
      </div>

      {/* ====================================================
          PRODUCT FORM MODAL
      ==================================================== */}

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/80 px-3 py-5 backdrop-blur-sm sm:px-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-[26px] border border-[#bd9568]/25 bg-[#141311] shadow-2xl shadow-black/70">

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between gap-3 border-b border-white/10 p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#bd9568]/20 bg-[#bd9568]/10 text-[#e4bd8c]">
                  {editingProduct ? (
                    <Pencil size={20} />
                  ) : (
                    <Plus size={21} />
                  )}
                </div>

                <div>
                  <h2 className="font-bold text-[#e4bd8c]">
                    {editingProduct
                      ? "ویرایش محصول"
                      : "ثبت محصول جدید"}
                  </h2>

                  <p className="mt-1 text-[10px] text-white/40">
                    اطلاعات محصول در دیتابیس فروشگاه ذخیره می‌شود.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white/60 hover:text-white disabled:opacity-30"
              >
                <X size={19} />
              </button>
            </div>

            {/* MODAL FORM */}

            <form
              onSubmit={saveProduct}
              className="space-y-7 p-5 sm:p-7"
            >
              {error && (
                <Message
                  type="error"
                  message={error}
                  onClose={() => setError("")}
                />
              )}

              {/* BASIC INFORMATION */}

              <FormSection
                title="اطلاعات اصلی محصول"
                icon={<Package size={18} />}
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="نام محصول" required>
                    <input
                      value={form.name}
                      onChange={(event) =>
                        updateField("name", event.target.value)
                      }
                      className="form-input"
                      placeholder="نام کامل محصول"
                      required
                    />
                  </Field>

                  <Field label="شناسه آدرس (Slug)" required>
                    <input
                      value={form.slug}
                      onChange={(event) =>
                        updateField("slug", event.target.value)
                      }
                      dir="ltr"
                      className="form-input text-left"
                      placeholder="product-name"
                      required
                    />
                  </Field>

                  <Field label="کد محصول (SKU)" required>
                    <input
                      value={form.sku}
                      onChange={(event) =>
                        updateField("sku", event.target.value)
                      }
                      dir="ltr"
                      className="form-input text-left"
                      placeholder="JALALI-001"
                      required
                    />
                  </Field>

                  <Field label="بارکد">
                    <input
                      value={form.barcode}
                      onChange={(event) =>
                        updateField("barcode", event.target.value)
                      }
                      dir="ltr"
                      className="form-input text-left"
                      placeholder="Barcode"
                    />
                  </Field>

                  <Field label="دسته‌بندی" required>
                    <select
                      value={form.category}
                      onChange={(event) =>
                        updateField("category", event.target.value)
                      }
                      className="form-input"
                      required
                    >
                      <option value="">
                        انتخاب دسته‌بندی
                      </option>

                      {categories.map((category) => (
                        <option
                          key={category.id}
                          value={category.id}
                        >
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="برند">
                    <select
                      value={form.brand}
                      onChange={(event) =>
                        updateField("brand", event.target.value)
                      }
                      className="form-input"
                    >
                      <option value="">
                        بدون برند
                      </option>

                      {brands.map((brand) => (
                        <option
                          key={brand.id}
                          value={brand.id}
                        >
                          {brand.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </FormSection>

              {/* IMAGE */}

              <FormSection
                title="تصویر اصلی محصول"
                icon={<ImagePlus size={18} />}
              >
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-[180px_1fr]">
                  <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="پیش‌نمایش محصول"
                        className="h-full w-full object-contain"
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
                      <ImagePlus size={19} />
                      انتخاب تصویر محصول

                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelection}
                        className="hidden"
                      />
                    </label>

                    <p className="text-[11px] leading-6 text-white/40">
                      فرمت تصویر باید معتبر باشد و حجم آن حداکثر ۸ مگابایت باشد.
                      در ویرایش محصول، اگر تصویر جدید انتخاب نکنی تصویر قبلی حفظ می‌شود.
                    </p>

                    {selectedImage && (
                      <p className="break-all text-[10px] text-emerald-300">
                        تصویر انتخاب‌شده: {selectedImage.name}
                      </p>
                    )}
                  </div>
                </div>
              </FormSection>

              {/* DESCRIPTION */}

              <FormSection
                title="توضیحات محصول"
                icon={<Tag size={18} />}
              >
                <div className="space-y-4">
                  <Field label="توضیح کوتاه">
                    <input
                      value={form.short_description}
                      onChange={(event) =>
                        updateField(
                          "short_description",
                          event.target.value
                        )
                      }
                      className="form-input"
                      placeholder="توضیح مختصر برای نمایش در کارت محصول"
                      maxLength={350}
                    />
                  </Field>

                  <Field label="توضیحات کامل">
                    <textarea
                      value={form.description}
                      onChange={(event) =>
                        updateField(
                          "description",
                          event.target.value
                        )
                      }
                      className="form-input min-h-32 resize-y"
                      placeholder="توضیحات کامل، ویژگی‌ها و مشخصات محصول..."
                    />
                  </Field>
                </div>
              </FormSection>

              {/* PRICES */}

              <FormSection
                title="قیمت‌گذاری"
                icon={<Tag size={18} />}
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="قیمت فروش عمومی (تومان)" required>
                    <input
                      type="number"
                      min="0"
                      value={form.public_price}
                      onChange={(event) =>
                        updateField(
                          "public_price",
                          event.target.value
                        )
                      }
                      className="form-input"
                      required
                    />
                  </Field>

                  <Field label="قیمت خرید (تومان)">
                    <input
                      type="number"
                      min="0"
                      value={form.cost_price}
                      onChange={(event) =>
                        updateField(
                          "cost_price",
                          event.target.value
                        )
                      }
                      className="form-input"
                    />
                  </Field>
                </div>
              </FormSection>

              {/* INVENTORY */}

              <FormSection
                title="مدیریت موجودی و سفارش"
                icon={<Boxes size={18} />}
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="موجودی انبار">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={form.stock_quantity}
                      onChange={(event) =>
                        updateField(
                          "stock_quantity",
                          event.target.value
                        )
                      }
                      className="form-input"
                    />
                  </Field>

                  <Field label="حداقل تعداد سفارش">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={form.minimum_order_quantity}
                      onChange={(event) =>
                        updateField(
                          "minimum_order_quantity",
                          event.target.value
                        )
                      }
                      className="form-input"
                    />
                  </Field>

                  <Field label="تعداد در هر کارتن">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={form.units_per_carton}
                      onChange={(event) =>
                        updateField(
                          "units_per_carton",
                          event.target.value
                        )
                      }
                      className="form-input"
                    />
                  </Field>

                  <Field label="وزن (گرم)">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={form.weight_grams}
                      onChange={(event) =>
                        updateField(
                          "weight_grams",
                          event.target.value
                        )
                      }
                      className="form-input"
                    />
                  </Field>
                </div>

                <p className="mt-4 text-[10px] leading-6 text-white/35">
                  وضعیت موجودی به‌صورت خودکار در بک‌اند و بر اساس تعداد موجودی تعیین می‌شود.
                </p>
              </FormSection>

              {/* SEO */}

              <FormSection
                title="تنظیمات موتورهای جست‌وجو"
                icon={<Barcode size={18} />}
              >
                <div className="space-y-4">
                  <Field label="عنوان سئو">
                    <input
                      value={form.seo_title}
                      onChange={(event) =>
                        updateField(
                          "seo_title",
                          event.target.value
                        )
                      }
                      className="form-input"
                      maxLength={220}
                    />
                  </Field>

                  <Field label="توضیحات سئو">
                    <textarea
                      value={form.seo_description}
                      onChange={(event) =>
                        updateField(
                          "seo_description",
                          event.target.value
                        )
                      }
                      className="form-input min-h-24 resize-y"
                      maxLength={320}
                    />
                  </Field>
                </div>
              </FormSection>

              {/* VISIBILITY */}

              <FormSection
                title="وضعیت انتشار"
                icon={<Eye size={18} />}
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <ToggleField
                    title="فعال در فروشگاه"
                    description="محصول در فروشگاه عمومی قابل نمایش باشد."
                    checked={form.is_active}
                    onChange={(value) =>
                      updateField("is_active", value)
                    }
                  />

                  <ToggleField
                    title="محصول ویژه"
                    description="محصول به‌عنوان محصول ویژه علامت‌گذاری شود."
                    checked={form.is_featured}
                    onChange={(value) =>
                      updateField("is_featured", value)
                    }
                  />
                </div>
              </FormSection>

              {/* FORM FOOTER */}

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
                    : editingProduct
                      ? "ذخیره تغییرات محصول"
                      : "ثبت محصول در فروشگاه"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GLOBAL FORM STYLES */}

      <style jsx global>{`
        .form-input {
          width: 100%;
          min-width: 0;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.3);
          padding: 14px 15px;
          color: white;
          font-size: 13px;
          outline: none;
          transition: border-color 150ms ease;
        }

        .form-input:focus {
          border-color: rgba(189, 149, 104, 0.75);
        }

        .form-input::placeholder {
          color: rgba(255, 255, 255, 0.25);
        }

        .form-input option {
          color: white;
          background: #141311;
        }
      `}</style>
    </main>
  );
}

// ============================================================
// REUSABLE COMPONENTS
// ============================================================

function Message({
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
          <AlertTriangle
            size={17}
            className="mt-1 shrink-0"
          />
        ) : (
          <CheckCircle2
            size={17}
            className="mt-1 shrink-0"
          />
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
        <span className="text-xs text-white/45">
          {title}
        </span>

        <span className="text-[#e4bd8c]">
          {icon}
        </span>
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
          <span className="mr-1 text-red-300">
            *
          </span>
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

        <h3 className="text-sm font-bold">
          {title}
        </h3>
      </div>

      {children}
    </section>
  );
}

function ToggleField({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/20 p-4">
      <span className="min-w-0">
        <span className="block text-sm font-bold">
          {title}
        </span>

        <span className="mt-1 block text-[10px] leading-5 text-white/40">
          {description}
        </span>
      </span>

      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(event.target.checked)
        }
        className="h-5 w-5 shrink-0 accent-[#bd9568]"
      />
    </label>
  );
}

function SmallCollectionCard({
  title,
  icon,
  items,
  empty,
}: {
  title: string;
  icon: ReactNode;
  items: string[];
  empty: string;
}) {
  return (
    <div className="rounded-2xl border border-[#bd9568]/20 bg-[#141311] p-5">
      <div className="mb-4 flex items-center gap-2 text-[#e4bd8c]">
        {icon}

        <h3 className="text-sm font-bold">
          {title}
        </h3>
      </div>

      {items.length ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item, index) => (
            <span
              key={`${item}-${index}`}
              className="rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-[11px] text-white/65"
            >
              {item}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-white/35">
          {empty}
        </p>
      )}
    </div>
  );
}
