"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { compressImageToWebP } from "@/lib/image-compressor";
import {
  LayoutDashboard,
  Inbox,
  Clock,
  CheckCircle2,
  XCircle,
  Tag,
  Users,
  User,
  ShieldCheck,
  LogOut,
  ExternalLink,
  MessageCircle,
  Search,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  CreditCard,
  Zap,
  ShoppingBag,
  TrendingUp,
  Menu,
  X,
  FileText,
  Pencil,
  Trash2,
  Plus,
  ShieldAlert,
  Flame,
  Crown,
  Ban,
  UserCheck,
  Star,
  MessageSquare,
  CornerDownRight,
  Eye,
  EyeOff,
  Settings,
  Globe,
  Store,
  QrCode,
  Calendar,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Upload,
  Save,
  AlertTriangle,
  Lock,
  Sparkles,
} from "lucide-react";

// Types
export type OrderStatus = "menunggu" | "diproses" | "selesai" | "dibatalkan";

export interface AdminOrder {
  id: string;
  orderNumber: string;
  username: string;
  robloxUserId?: string;
  whatsappNumber: string;
  amount: number;
  price: number;
  date: string;
  time: string;
  paymentMethod: "WHATSAPP" | "QRIS";
  status: OrderStatus;
  hasProofPhoto: boolean;
  paymentProofUrl?: string;
  customerNote?: string;
  adminNote?: string;
  reviewToken?: string;
  isReviewed?: boolean;
}

export interface AdminPackage {
  id: number;
  amount: number;
  price: number;
  isActive: boolean;
  badge?: "PROMO" | "SULTAN" | "NONE";
}

export interface CustomerData {
  id: string;
  username: string;
  robloxUserId?: string;
  whatsappNumber: string;
  totalOrders: number;
  totalSpent: number;
  status: "AKTIF" | "BLACKLISTED";
}

export interface BlacklistEntry {
  id: string;
  username: string;
  robloxUserId?: string;
  whatsapp: string;
  orderCount: number;
  totalSpent: number;
  reason: string;
  date: string;
}

export interface TestimonialItem {
  id: string;
  username: string;
  rating: number; // 1 - 5
  comment: string;
  packageName: string;
  date: string;
  isVerified: boolean;
  isVisible: boolean;
  adminReply?: string;
  adminReplyDate?: string;
}

export interface PaymentMutation {
  id: string;
  orderNumber: string;
  username: string;
  channel: "WEBSITE" | "WHATSAPP";
  date: string;
  amountRobux: number;
  amountRupiah: number;
  status: "LUNAS";
}

// Database API Mappers
function mapDbOrderToAdmin(row: any): AdminOrder {
  const createdAt = row.created_at ? new Date(row.created_at) : new Date();
  const dateStr = createdAt.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  const timeStr = createdAt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  let status: OrderStatus = "menunggu";
  if (row.status === "diproses") status = "diproses";
  else if (row.status === "selesai") status = "selesai";
  else if (row.status === "dibatalkan") status = "dibatalkan";
  else status = "menunggu";

  return {
    id: row.id,
    orderNumber: row.order_code || `VEX-${String(row.id).slice(0, 6)}`,
    username: row.roblox_username,
    robloxUserId: row.roblox_user_id || undefined,
    whatsappNumber: row.customer_phone || "-",
    amount: Number(row.robux_amount) || 0,
    price: Number(row.price_idr) || 0,
    date: dateStr,
    time: timeStr,
    paymentMethod: row.payment_method === "WHATSAPP" ? "WHATSAPP" : "QRIS",
    status,
    hasProofPhoto: !!row.payment_proof_url,
    paymentProofUrl: row.payment_proof_url || undefined,
    adminNote: row.admin_notes || "",
    reviewToken: row.review_token || undefined,
    isReviewed: !!row.is_reviewed,
  };
}


function mapDbProductToAdmin(row: any): AdminPackage {
  return {
    id: row.id,
    amount: Number(row.robux_amount) || 0,
    price: Number(row.price_idr) || 0,
    isActive: row.is_active !== false,
    badge: row.is_promo ? "PROMO" : (Number(row.robux_amount) >= 10000 || row.is_sultan) ? "SULTAN" : "NONE",
  };
}

function mapDbBlacklistToAdmin(row: any, ordersList: AdminOrder[]): BlacklistEntry {
  const dateStr = row.created_at ? new Date(row.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "Hari ini";
  const userOrders = ordersList.filter(o => o.username.toLowerCase() === (row.roblox_username || "").toLowerCase());
  const totalSpent = userOrders.filter(o => o.status === "selesai").reduce((sum, o) => sum + o.price, 0);
  const wa = userOrders.length > 0 ? userOrders[0].whatsappNumber : "-";
  const robloxId = userOrders.length > 0 ? userOrders[0].robloxUserId : undefined;

  return {
    id: String(row.id),
    username: row.roblox_username,
    robloxUserId: robloxId,
    whatsapp: wa,
    orderCount: userOrders.length,
    totalSpent,
    reason: row.reason || "Indikasi penipuan atau penyalahgunaan",
    date: dateStr,
  };
}

function mapDbTestimonialToAdmin(row: any): TestimonialItem {
  const dateStr = row.created_at ? new Date(row.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : "Hari ini";
  const replyDateStr = row.admin_reply_at ? new Date(row.admin_reply_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : undefined;
  return {
    id: String(row.id),
    username: row.roblox_username,
    rating: Number(row.rating) || 5,
    comment: row.comment || "",
    packageName: row.package_name || "+2.700 Robux",
    date: dateStr,
    isVerified: row.is_verified !== false,
    isVisible: row.is_visible !== false,
    adminReply: row.admin_reply || undefined,
    adminReplyDate: replyDateStr || (row.admin_reply ? "Baru saja" : undefined),
  };
}

function formatPromoBadge(raw: string) {
  if (!raw) return "2.700 RBX 50K";
  const match = raw.match(/([\d\.,]+)\s*Robux\s*\(Rp\s*([\d\.,]+)\)/i);
  if (match) {
    const rbx = match[1];
    const priceNum = parseInt(match[2].replace(/\D/g, ""), 10);
    const priceK = priceNum >= 1000 ? `${Math.round(priceNum / 1000)}K` : match[2];
    return `${rbx} RBX ${priceK}`;
  }
  return raw;
}

export default function AdminPage() {
  // Admin Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [authAdminUser, setAuthAdminUser] = useState<string>("Admin Vexlyn");
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [packages, setPackages] = useState<AdminPackage[]>([]);
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([]);
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);

  const [activeTab, setActiveTab] = useState<
    | "dashboard"
    | "order-masuk"
    | "order-diproses"
    | "order-selesai"
    | "order-dibatalkan"
    | "pricelist"
    | "pelanggan"
    | "blacklist"
    | "testimoni"
    | "keuangan"
    | "pengaturan"
  >("dashboard");

  // Selected Order for Detail View
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [blacklistSearchQuery, setBlacklistSearchQuery] = useState("");
  const [testimonialSearchQuery, setTestimonialSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<"ALL" | "WHATSAPP" | "QRIS">("ALL");
  const [testimonialFilterTab, setTestimonialFilterTab] = useState<"semua" | "aktif" | "sembunyi" | "perlu-balasan">("semua");
  
  // Derived Mutations dari live real-time orders
  const mutations = useMemo<PaymentMutation[]>(() => {
    return orders.map((o) => ({
      id: `mut-${o.id}`,
      orderNumber: o.orderNumber,
      username: o.username,
      channel: o.paymentMethod === "WHATSAPP" ? "WHATSAPP" : "WEBSITE",
      date: `${o.date} ${o.time}`,
      amountRobux: o.amount,
      amountRupiah: o.price,
      status: "LUNAS",
    }));
  }, [orders]);

  // Derived Customers terhitung otomatis dari live real-time orders & database blacklist
  const customers = useMemo<CustomerData[]>(() => {
    const map = new Map<string, CustomerData>();
    const blacklistedSet = new Set(blacklist.map((b) => b.username.toLowerCase()));

    orders.forEach((o) => {
      const key = o.username.toLowerCase();
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          id: `cust-${key}`,
          username: o.username,
          robloxUserId: o.robloxUserId,
          whatsappNumber: o.whatsappNumber || "-",
          totalOrders: 1,
          totalSpent: o.status === "selesai" ? o.price : 0,
          status: blacklistedSet.has(key) ? "BLACKLISTED" : "AKTIF",
        });
      } else {
        existing.totalOrders += 1;
        if (o.status === "selesai") {
          existing.totalSpent += o.price;
        }
        if (o.whatsappNumber && o.whatsappNumber !== "-") {
          existing.whatsappNumber = o.whatsappNumber;
        }
        if (o.robloxUserId && !existing.robloxUserId) {
          existing.robloxUserId = o.robloxUserId;
        }
      }
    });

    // Masukkan juga user yang ada di blacklist walaupun belum memesan
    blacklist.forEach((b) => {
      const key = b.username.toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          id: `cust-${key}`,
          username: b.username,
          robloxUserId: b.robloxUserId,
          whatsappNumber: b.whatsapp || "-",
          totalOrders: b.orderCount || 0,
          totalSpent: b.totalSpent || 0,
          status: "BLACKLISTED",
        });
      } else {
        map.get(key)!.status = "BLACKLISTED";
      }
    });

    return Array.from(map.values());
  }, [orders, blacklist]);

  const [paymentHistoryTab, setPaymentHistoryTab] = useState<"semua" | "website" | "whatsapp">("semua");
  const [paymentHistorySearch, setPaymentHistorySearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mobile sidebar state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  
  const saveSettingsToDb = async (settingsObj: Record<string, string>, msg: string) => {
    showToast(msg);
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: settingsObj }),
      });
    } catch (err) {
      console.error("Gagal menyimpan ke database:", err);
    }
  };

  // Temporary feedback toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Admin note input in detail view
  const [currentAdminNote, setCurrentAdminNote] = useState("");

  // Modal State for Pricelist Add / Edit
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [editingPackageId, setEditingPackageId] = useState<number | null>(null);
  const [packageAmountInput, setPackageAmountInput] = useState("");
  const [packagePriceInput, setPackagePriceInput] = useState("");
  const [packageIsActiveInput, setPackageIsActiveInput] = useState(true);

  // ID Roblox Activation Card State
  const [activationUsername, setActivationUsername] = useState("erewfrwfw");
  const [activationFee, setActivationFee] = useState<number>(100000);
  const [isActivatingId, setIsActivatingId] = useState(false);
  const [isActivatedId, setIsActivatedId] = useState(false);

  // Modal State for Blacklist Add
  const [isBlacklistModalOpen, setIsBlacklistModalOpen] = useState(false);
  const [blacklistUserInput, setBlacklistUserInput] = useState("");
  const [blacklistWaInput, setBlacklistWaInput] = useState("");
  const [blacklistRobloxIdInput, setBlacklistRobloxIdInput] = useState("");
  const [blacklistReasonInput, setBlacklistReasonInput] = useState("Indikasi penipuan atau penyalahgunaan");

  // Modal State for Testimonial Add / Edit
  const [isTestiModalOpen, setIsTestiModalOpen] = useState(false);
  const [editingTestiId, setEditingTestiId] = useState<string | null>(null);
  const [testiUserInput, setTestiUserInput] = useState("");
  const [testiRatingInput, setTestiRatingInput] = useState<number>(5);
  const [testiCommentInput, setTestiCommentInput] = useState("");
  const [testiPackageInput, setTestiPackageInput] = useState("+2.700 Robux");

  // Modal State for Reply Testimonial
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [replyingTesti, setReplyingTesti] = useState<TestimonialItem | null>(null);
  const [replyTextInput, setReplyTextInput] = useState("");

  // ==========================================
  // Store Settings & Banner State
  // ==========================================
  const [isSection1Open, setIsSection1Open] = useState(true);
  const [isSection2Open, setIsSection2Open] = useState(true);
  const [isSection3Open, setIsSection3Open] = useState(true);

  // Section 1: Store & Contact
  const [storeName, setStoreName] = useState("Vexlyn.id");
  const [whatsappCs, setWhatsappCs] = useState("088230515875");

  // Section 2: Promo Banner
  const [promoIsActive, setPromoIsActive] = useState(true);
  const [promoPackage, setPromoPackage] = useState("2.700 Robux (Rp 50.000)");
  const [promoHeadline, setPromoHeadline] = useState("ROBUX BULAN INI");
  const [promoDescription, setPromoDescription] = useState(
    "Top Up Robux Instant, Cepat, Legal, Aman & Bergaransi 100% Uang Kembali!"
  );
  const [promoEndDate, setPromoEndDate] = useState("11 Oktober 2026");
  const [promoEndTime, setPromoEndTime] = useState("06:59 WIB");

  // Countdown Modal State
  const [isCountdownModalOpen, setIsCountdownModalOpen] = useState(false);
  const [countdownDay, setCountdownDay] = useState(11);
  const [countdownMonth, setCountdownMonth] = useState("Oktober");
  const [countdownYear, setCountdownYear] = useState(2026);
  const [countdownHour, setCountdownHour] = useState("06");
  const [countdownMinute, setCountdownMinute] = useState("59");
  const [activePreset, setActivePreset] = useState<string>("Akhir Bulan");

  // Section 3: QRIS & Logo
  const [qrisNmid, setQrisNmid] = useState("ID1029384756102");
  const [qrisImage, setQrisImage] = useState<string>("");
  const [logoImage, setLogoImage] = useState<string>("/logo.jpg");
  const [isUploadingQris, setIsUploadingQris] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState<{ url: string; title: string } | null>(null);

  const qrisInputRef = useRef<HTMLInputElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const areAllSectionsClosed = !isSection1Open && !isSection2Open && !isSection3Open;
  const toggleAllSections = () => {
    if (areAllSectionsClosed) {
      setIsSection1Open(true);
      setIsSection2Open(true);
      setIsSection3Open(true);
    } else {
      setIsSection1Open(false);
      setIsSection2Open(false);
      setIsSection3Open(false);
    }
  };

  const handleQrisUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingQris(true);
    try {
      // 1. Kompres gambar ke WebP
      const compressed = await compressImageToWebP(file, { maxWidth: 1000, maxHeight: 1000, quality: 0.88 });

      // 2. Upload file ke endpoint /api/upload dengan folder 'qris'
      const formData = new FormData();
      formData.append("file", compressed.file);
      formData.append("folder", "qris");

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const uploadJson = await uploadRes.json();

      if (!uploadRes.ok || !uploadJson.success) {
        throw new Error(uploadJson.message || "Gagal mengunggah barcode QRIS");
      }

      // 3. Simpan permanen URL QRIS ke database settings
      const newQrisUrl = uploadJson.url;
      setQrisImage(newQrisUrl);
      await saveSettingsToDb({ qris_image: newQrisUrl }, "Barcode QRIS berhasil diperbarui & disimpan permanen!");
    } catch (err: any) {
      alert(err?.message || "Gagal memproses gambar QRIS");
    } finally {
      setIsUploadingQris(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    try {
      // 1. Kompres gambar ke WebP
      const compressed = await compressImageToWebP(file, { maxWidth: 800, maxHeight: 800, quality: 0.88 });

      // 2. Upload file ke endpoint /api/upload dengan folder 'logo'
      const formData = new FormData();
      formData.append("file", compressed.file);
      formData.append("folder", "logo");

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const uploadJson = await uploadRes.json();

      if (!uploadRes.ok || !uploadJson.success) {
        throw new Error(uploadJson.message || "Gagal mengunggah logo");
      }

      // 3. Simpan permanen URL Logo ke database settings
      const newLogoUrl = uploadJson.url;
      setLogoImage(newLogoUrl);
      await saveSettingsToDb({ logo_image: newLogoUrl }, "Logo storefront berhasil diperbarui & disimpan permanen!");
    } catch (err: any) {
      alert(err?.message || "Gagal memproses gambar logo");
    } finally {
      setIsUploadingLogo(false);
      if (e.target) e.target.value = "";
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(`Berhasil disalin: ${text}`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  
  // Load Live Realtime Data dari Backend API (Neon PostgreSQL)
  const loadAdminData = async () => {
    setIsRefreshing(true);
    try {
      // 1. Fetch Orders
      const resOrders = await fetch("/api/orders?limit=200");
      let currentOrders: AdminOrder[] = [];
      if (resOrders.ok) {
        const json = await resOrders.json();
        if (json.success && Array.isArray(json.data)) {
          currentOrders = json.data.map(mapDbOrderToAdmin);
          setOrders(currentOrders);
        }
      }

      // 2. Fetch Products
      const resProducts = await fetch("/api/products?all=true");
      if (resProducts.ok) {
        const json = await resProducts.json();
        if (json.success && Array.isArray(json.data)) {
          setPackages(json.data.map(mapDbProductToAdmin));
        }
      }

      // 3. Fetch Blacklists
      const resBlacklist = await fetch("/api/blacklists");
      if (resBlacklist.ok) {
        const json = await resBlacklist.json();
        if (json.success && Array.isArray(json.data)) {
          setBlacklist(json.data.map((row: any) => mapDbBlacklistToAdmin(row, currentOrders)));
        }
      }

      // 4. Fetch Testimonials
      const resTesti = await fetch("/api/testimonials?all=true");
      if (resTesti.ok) {
        const json = await resTesti.json();
        if (json.success && Array.isArray(json.data)) {
          setTestimonials(json.data.map(mapDbTestimonialToAdmin));
        }
      }

      // 5. Fetch Settings
      const resSettings = await fetch("/api/settings");
      if (resSettings.ok) {
        const json = await resSettings.json();
        if (json.success && json.settings) {
          const s = json.settings;
          if (s.store_name) setStoreName(s.store_name);
          if (s.whatsapp_cs) setWhatsappCs(s.whatsapp_cs);
          if (s.promo_headline) setPromoHeadline(s.promo_headline);
          if (s.promo_description) setPromoDescription(s.promo_description);
          if (s.promo_package) setPromoPackage(s.promo_package);
          if (s.qris_nmid) setQrisNmid(s.qris_nmid);
          if (s.qris_image) setQrisImage(s.qris_image);
          if (s.logo_image) setLogoImage(s.logo_image);
        }
      }
    } catch (err) {
      console.error("Gagal memuat data dari database:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Sesi Otorisasi Admin
  const checkAdminAuth = async () => {
    try {
      const res = await fetch("/api/admin/check");
      const json = await res.json();
      if (json.success && json.authenticated) {
        setIsAuthenticated(true);
        if (json.username) setAuthAdminUser(json.username);
        loadAdminData();
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername.trim() || !loginPassword.trim()) {
      setLoginError("Harap masukkan username dan password admin.");
      return;
    }

    setIsSubmittingLogin(true);
    setLoginError(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: loginUsername.trim(),
          password: loginPassword.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setLoginError(json.message || "Username atau kata sandi tidak valid.");
        return;
      }

      setIsAuthenticated(true);
      if (json.user?.username) setAuthAdminUser(json.user.username);
      loadAdminData();
      showToast("Autentikasi berhasil! Selamat datang di Panel Admin.");
    } catch (err: any) {
      setLoginError(err?.message || "Gagal menghubungkan ke server.");
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const handleLogout = async () => {
    if (!confirm("Apakah Anda yakin ingin keluar dari panel admin?")) return;
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {}
    setIsAuthenticated(false);
    setLoginPassword("");
  };

  // Refresh handler
  const handleRefresh = async () => {
    await loadAdminData();
    showToast("Data realtime berhasil diperbarui!");
  };


  // Order Counts
    // Order Counts Realtime Murni dari Database
  const counts = useMemo(() => {
    const masuk = orders.filter((o) => o.status === "menunggu").length;
    const diproses = orders.filter((o) => o.status === "diproses").length;
    const selesai = orders.filter((o) => o.status === "selesai").length;
    const dibatalkan = orders.filter((o) => o.status === "dibatalkan").length;
    const totalOmset = orders
      .filter((o) => o.status === "selesai")
      .reduce((sum, o) => sum + (o.price || 0), 0);

    return {
      masuk,
      diproses,
      selesai,
      dibatalkan,
      totalOmset,
    };
  }, [orders]);

  // Testimonial Counts & Stats
  const testiStats = useMemo(() => {
    const total = testimonials.length;
    const active = testimonials.filter((t) => t.isVisible).length;
    const hidden = testimonials.filter((t) => !t.isVisible).length;
    const needReply = testimonials.filter((t) => !t.adminReply).length;
    const avgRating = total > 0 ? (testimonials.reduce((sum, t) => sum + t.rating, 0) / total).toFixed(1) : "5.0";

    return {
      total,
      active,
      hidden,
      needReply,
      avgRating,
    };
  }, [testimonials]);

  // Selected Order object
  const selectedOrder = useMemo(() => {
    return orders.find((o) => o.id === selectedOrderId) || null;
  }, [orders, selectedOrderId]);

  // Sync admin note when selected order changes
  const openOrderDetail = (orderId: string) => {
    setSelectedOrderId(orderId);
    const ord = orders.find((o) => o.id === orderId);
    setCurrentAdminNote(ord?.adminNote || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

    // Status Updater (Realtime Sync ke PostgreSQL)
  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, status: newStatus } : ord))
    );
    const label =
      newStatus === "diproses"
        ? "Sedang Diproses"
        : newStatus === "selesai"
        ? "Selesai"
        : newStatus === "dibatalkan"
        ? "Dibatalkan"
        : "Menunggu Bayar";
    showToast(`Status pesanan diperbarui menjadi "${label}"`);

    try {
      let dbStatus = "menunggu_pembayaran";
      if (newStatus === "diproses") dbStatus = "diproses";
      else if (newStatus === "selesai") dbStatus = "selesai";
      else if (newStatus === "dibatalkan") dbStatus = "dibatalkan";

      await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, status: dbStatus }),
      });
    } catch (err) {
      console.error("Gagal menyimpan perubahan status:", err);
    }
  };

    // Save Admin Note (Realtime Sync ke PostgreSQL)
  const saveAdminNote = async (orderId: string) => {
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, adminNote: currentAdminNote } : ord))
    );
    showToast("Catatan admin berhasil disimpan!");

    try {
      await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, admin_notes: currentAdminNote }),
      });
    } catch (err) {
      console.error("Gagal menyimpan catatan admin:", err);
    }
  };

  // ==========================================
  // Automatic Package Badge Logic
  // 1. Populer = mengambil dari paket yang paling banyak dibeli
  // 2. Promo   = mengambil dari paket yang di-set promo di pengaturan toko
  // 3. Sultan  = mengambil dari paket yang di atas 10k robux
  // ==========================================
  const activePromoAmount = useMemo(() => {
    if (!promoIsActive) return null;
    const clean = promoPackage.replace(/\./g, "").replace(/,/g, "");
    const match = clean.match(/(\d+)\s*robux/i) || clean.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }, [promoIsActive, promoPackage]);

  const mostPurchasedAmount = useMemo(() => {
    const freq: Record<number, number> = {};
    orders.forEach((o) => {
      freq[o.amount] = (freq[o.amount] || 0) + 1;
    });
    mutations.forEach((m) => {
      freq[m.amountRobux] = (freq[m.amountRobux] || 0) + 1;
    });
    let maxAmt = 2200;
    let maxCount = -1;
    for (const [amt, count] of Object.entries(freq)) {
      const numAmt = Number(amt);
      if (count > maxCount) {
        maxCount = count;
        maxAmt = numAmt;
      }
    }
    return maxAmt;
  }, [orders, mutations]);

  const getAutoPackageBadge = (pkg: { amount: number }): "PROMO" | "SULTAN" | "POPULER" | null => {
    // 1. Promo = dia ngambil dari paket yang di set promo di pengaturan toko
    if (activePromoAmount && pkg.amount === activePromoAmount) {
      return "PROMO";
    }

    // 2. Sultan = dia ngambil dari paket yang diatas 10k robux
    if (pkg.amount > 10000) {
      return "SULTAN";
    }

    // 3. Populer = dia ngambil dari paket yang paling banyak di beli
    if (pkg.amount === mostPurchasedAmount) {
      return "POPULER";
    }

    return null;
  };

  // Package Handlers
  const openAddPackageModal = () => {
    setEditingPackageId(null);
    setPackageAmountInput("1.000");
    setPackagePriceInput("20.000");
    setPackageIsActiveInput(true);
    setIsPackageModalOpen(true);
  };

  const openEditPackageModal = (pkg: AdminPackage) => {
    setEditingPackageId(pkg.id);
    setPackageAmountInput(pkg.amount.toLocaleString("id-ID"));
    setPackagePriceInput(pkg.price.toLocaleString("id-ID"));
    setPackageIsActiveInput(pkg.isActive);
    setIsPackageModalOpen(true);
  };

    const handleTogglePackageStatus = async (id: number) => {
    const target = packages.find((p) => p.id === id);
    if (!target) return;
    const nextState = !target.isActive;

    setPackages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isActive: nextState } : p))
    );
    showToast(`Paket ${target.amount.toLocaleString()} Robux kini ${nextState ? "Aktif" : "Nonaktif"}`);

    try {
      await fetch("/api/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: nextState }),
      });
    } catch (err) {
      console.error("Gagal update status paket:", err);
    }
  };

    const handleDeletePackage = async (id: number) => {
    const pkg = packages.find((p) => p.id === id);
    if (!pkg) return;
    if (confirm(`Apakah kamu yakin ingin menghapus paket ${pkg.amount.toLocaleString()} Robux?`)) {
      setPackages((prev) => prev.filter((p) => p.id !== id));
      showToast(`Paket ${pkg.amount.toLocaleString()} Robux telah dihapus`);

      try {
        await fetch(`/api/products?id=${id}`, { method: "DELETE" });
      } catch (err) {
        console.error("Gagal menghapus produk:", err);
      }
    }
  };

    const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = parseInt(packageAmountInput.replace(/\./g, "").replace(/,/g, ""), 10);
    const cleanPrice = parseInt(packagePriceInput.replace(/\./g, "").replace(/,/g, ""), 10);

    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      alert("Masukkan nominal Robux yang valid.");
      return;
    }
    if (isNaN(cleanPrice) || cleanPrice <= 0) {
      alert("Masukkan harga jual yang valid.");
      return;
    }

    if (editingPackageId !== null) {
      setPackages((prev) =>
        prev.map((p) =>
          p.id === editingPackageId
            ? {
                ...p,
                amount: cleanAmount,
                price: cleanPrice,
                isActive: packageIsActiveInput,
              }
            : p
        )
      );
      showToast("Nominal Robux berhasil diperbarui!");
      setIsPackageModalOpen(false);

      try {
        await fetch("/api/products", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingPackageId,
            robux_amount: cleanAmount,
            price_idr: cleanPrice,
            is_active: packageIsActiveInput,
          }),
        });
      } catch (err) {
        console.error("Gagal update produk:", err);
      }
    } else {
      const tempId = Date.now();
      const newPkg: AdminPackage = {
        id: tempId,
        amount: cleanAmount,
        price: cleanPrice,
        isActive: packageIsActiveInput,
      };
      setPackages((prev) => [...prev, newPkg]);
      showToast("Nominal Robux baru berhasil ditambahkan!");
      setIsPackageModalOpen(false);

      try {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: `RBX-${cleanAmount}`,
            name: `${cleanAmount.toLocaleString("id-ID")} Robux`,
            robux_amount: cleanAmount,
            price_idr: cleanPrice,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.data?.id) {
            setPackages((prev) => prev.map((p) => (p.id === tempId ? { ...p, id: json.data.id } : p)));
          }
        }
      } catch (err) {
        console.error("Gagal menambahkan produk:", err);
      }
    }
  };

  // ID Roblox Activation Handler
  const handleActivateId = () => {
    const cleanUsername = activationUsername.replace(/^@/, "").trim();
    if (!cleanUsername) {
      alert("Silakan masukkan username Roblox yang ingin diaktifkan.");
      return;
    }
    setIsActivatingId(true);
    setTimeout(() => {
      setIsActivatingId(false);
      setIsActivatedId(true);
      showToast(`ID Roblox @${cleanUsername} berhasil diaktifkan di server!`);
    }, 700);
  };

  // Blacklist Trigger from Customer List
  const handleTriggerBlacklistFromCustomer = (cust: CustomerData) => {
    setBlacklistUserInput(cust.username);
    setBlacklistWaInput(cust.whatsappNumber);
    setBlacklistRobloxIdInput(cust.robloxUserId || "");
    setBlacklistReasonInput("Indikasi penipuan atau penyalahgunaan");
    setIsBlacklistModalOpen(true);
  };

  // Blacklist Submit
    const handleSaveBlacklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blacklistUserInput.trim()) {
      alert("Masukkan username Roblox yang ingin diblacklist.");
      return;
    }

    const cleanUsername = blacklistUserInput.replace(/^@/, "").trim();
    const existingCust = customers.find((c) => c.username.toLowerCase() === cleanUsername.toLowerCase());

    const newEntry: BlacklistEntry = {
      id: `bl-${Date.now()}`,
      username: cleanUsername,
      robloxUserId: blacklistRobloxIdInput.trim() || undefined,
      whatsapp: blacklistWaInput.trim() || "Belum terdata",
      orderCount: existingCust ? existingCust.totalOrders : 0,
      totalSpent: existingCust ? existingCust.totalSpent : 0,
      reason: blacklistReasonInput.trim() || "Indikasi penipuan atau penyalahgunaan",
      date: "Hari ini",
    };

    setBlacklist((prev) => [newEntry, ...prev]);
    showToast(`Akun @${cleanUsername} berhasil dimasukkan ke daftar Blacklist!`);
    setIsBlacklistModalOpen(false);

    try {
      await fetch("/api/blacklists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roblox_username: cleanUsername,
          reason: blacklistReasonInput.trim() || "Indikasi penipuan atau penyalahgunaan",
        }),
      });
    } catch (err) {
      console.error("Gagal menyimpan blacklist:", err);
    }
  };

  // Remove from Blacklist (Buka Blokir)
    const handleUnblock = async (id: string) => {
    const item = blacklist.find((b) => b.id === id);
    if (!item) return;

    setBlacklist((prev) => prev.filter((b) => b.id !== id));
    showToast(`Blokir untuk akun @${item.username} berhasil dibuka!`);

    try {
      await fetch(`/api/blacklists?username=${encodeURIComponent(item.username)}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Gagal membuka blokir:", err);
    }
  };

  // Testimonial Handlers
  const openAddTestiModal = () => {
    setEditingTestiId(null);
    setTestiUserInput("");
    setTestiRatingInput(5);
    setTestiCommentInput("");
    setTestiPackageInput("+2.700 Robux");
    setIsTestiModalOpen(true);
  };

  // State & Handler Kirim Link Ulasan 1x Pakai via WhatsApp ke Customer
  const [isGeneratingReviewLink, setIsGeneratingReviewLink] = useState<string | null>(null);

  const handleSendReviewLink = async (ord: AdminOrder) => {
    setIsGeneratingReviewLink(ord.id);
    try {
      const res = await fetch("/api/orders/review-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: ord.id }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        showToast(data.message || "Gagal membuat link ulasan.");
        return;
      }

      if (data.is_reviewed) {
        showToast(`Pesanan #${ord.orderNumber} sudah pernah diulas oleh pelanggan!`);
        setOrders((prev) =>
          prev.map((o) => (o.id === ord.id ? { ...o, isReviewed: true } : o))
        );
        return;
      }

      const token = data.review_token;
      const reviewUrl = `${window.location.origin}/review?token=${token}`;

      setOrders((prev) =>
        prev.map((o) => (o.id === ord.id ? { ...o, reviewToken: token } : o))
      );

      try {
        await navigator.clipboard.writeText(reviewUrl);
      } catch {}

      const cleanPhone = (ord.whatsappNumber || "").replace(/[^0-9]/g, "");
      const formattedPhone = cleanPhone.startsWith("0") ? "62" + cleanPhone.slice(1) : cleanPhone;

      const waMessage =
        `Halo kak @${ord.username}! 🎉\n\n` +
        `Pesanan Robux kamu #${ord.orderNumber} (${ord.amount.toLocaleString("id-ID")} Robux) telah berhasil dikirim & berstatus SELESAI.\n\n` +
        `Mohon bantu luangkan waktu 30 detik untuk memberikan rating kepuasan & ulasan kamu melalui link resmi berikut (hanya berlaku 1x pakai):\n` +
        `👉 ${reviewUrl}\n\n` +
        `Ulasan kamu sangat berarti bagi kemajuan toko kami. Terima kasih banyak sudah top up di Vexlyn! ⭐`;

      const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(waMessage)}`;

      window.open(waUrl, "_blank", "noopener,noreferrer");
      showToast("Link ulasan 1x pakai berhasil disalin & WhatsApp dibuka!");
    } catch (err) {
      console.error("Error generating review link:", err);
      showToast("Gagal memproses link ulasan.");
    } finally {
      setIsGeneratingReviewLink(null);
    }
  };

  const openEditTestiModal = (testi: TestimonialItem) => {
    setEditingTestiId(testi.id);
    setTestiUserInput(testi.username);
    setTestiRatingInput(testi.rating);
    setTestiCommentInput(testi.comment);
    setTestiPackageInput(testi.packageName);
    setIsTestiModalOpen(true);
  };

    const handleSaveTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testiUserInput.trim()) {
      alert("Masukkan username pembeli.");
      return;
    }
    if (!testiCommentInput.trim()) {
      alert("Masukkan ulasan testimoni.");
      return;
    }

    const cleanUsername = testiUserInput.replace(/^@/, "").trim();

    if (editingTestiId) {
      setTestimonials((prev) =>
        prev.map((t) =>
          t.id === editingTestiId
            ? {
                ...t,
                username: cleanUsername,
                rating: testiRatingInput,
                comment: testiCommentInput,
                packageName: testiPackageInput.trim() || "+2.700 Robux",
              }
            : t
        )
      );
      showToast("Testimoni berhasil diperbarui!");
      setIsTestiModalOpen(false);

      try {
        await fetch("/api/testimonials", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingTestiId,
            rating: testiRatingInput,
            comment: testiCommentInput,
          }),
        });
      } catch (err) {
        console.error("Gagal update testimoni:", err);
      }
    } else {
      const tempId = `testi-${Date.now()}`;
      const newTesti: TestimonialItem = {
        id: tempId,
        username: cleanUsername,
        rating: testiRatingInput,
        comment: testiCommentInput,
        packageName: testiPackageInput.trim() || "+2.700 Robux",
        date: "Baru saja",
        isVerified: true,
        isVisible: true,
      };
      setTestimonials((prev) => [newTesti, ...prev]);
      showToast("Testimoni baru berhasil ditambahkan!");
      setIsTestiModalOpen(false);

      try {
        await fetch("/api/testimonials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roblox_username: cleanUsername,
            package_name: testiPackageInput.trim() || "+2.700 Robux",
            rating: testiRatingInput,
            comment: testiCommentInput,
          }),
        });
      } catch (err) {
        console.error("Gagal simpan testimoni:", err);
      }
    }
  };

    const handleToggleTestiVisibility = async (id: string) => {
    const item = testimonials.find((t) => t.id === id);
    if (!item) return;
    const next = !item.isVisible;

    setTestimonials((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isVisible: next } : t))
    );
    showToast(`Testimoni @${item.username} kini ${next ? "ditampilkan di website" : "disembunyikan"}`);

    try {
      await fetch("/api/testimonials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_visible: next }),
      });
    } catch (err) {
      console.error("Gagal toggle ulasan:", err);
    }
  };

    const handleDeleteTesti = async (id: string) => {
    const item = testimonials.find((t) => t.id === id);
    if (!item) return;
    if (confirm(`Apakah Anda yakin ingin menghapus testimoni dari @${item.username}?`)) {
      setTestimonials((prev) => prev.filter((t) => t.id !== id));
      showToast("Testimoni telah dihapus");

      try {
        await fetch(`/api/testimonials?id=${id}`, { method: "DELETE" });
      } catch (err) {
        console.error("Gagal hapus testimoni:", err);
      }
    }
  };

  // Reply Handlers
  const openReplyModal = (testi: TestimonialItem) => {
    setReplyingTesti(testi);
    setReplyTextInput(testi.adminReply || "");
    setIsReplyModalOpen(true);
  };

  const handleSaveReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingTesti) return;

    if (!replyTextInput.trim()) {
      alert("Tuliskan balasan untuk ulasan pembeli.");
      return;
    }

    const replyText = replyTextInput.trim();

    try {
      const res = await fetch("/api/testimonials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: replyingTesti.id,
          admin_reply: replyText,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        alert(data.message || "Gagal menyimpan balasan admin.");
        return;
      }

      setTestimonials((prev) =>
        prev.map((t) =>
          t.id === replyingTesti.id
            ? {
                ...t,
                adminReply: replyText,
                adminReplyDate: "Baru saja",
              }
            : t
        )
      );

      showToast(`Balasan untuk @${replyingTesti.username} berhasil dikirim!`);
      setIsReplyModalOpen(false);
    } catch {
      alert("Terjadi kesalahan saat menyimpan balasan admin.");
    }
  };

  // Filtered orders for tables
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      if (activeTab === "order-masuk" && ord.status !== "menunggu") return false;
      if (activeTab === "order-diproses" && ord.status !== "diproses") return false;
      if (activeTab === "order-selesai" && ord.status !== "selesai") return false;
      if (activeTab === "order-dibatalkan" && ord.status !== "dibatalkan") return false;

      if (paymentFilter !== "ALL" && ord.paymentMethod !== paymentFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchId = ord.orderNumber.toLowerCase().includes(q);
        const matchUser = ord.username.toLowerCase().includes(q);
        const matchRobloxId = ord.robloxUserId?.includes(q) || false;
        const matchWa = ord.whatsappNumber.includes(q);
        if (!matchId && !matchUser && !matchRobloxId && !matchWa) return false;
      }

      return true;
    });
  }, [orders, activeTab, paymentFilter, searchQuery]);

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((cust) => {
      if (!customerSearchQuery.trim()) return true;
      const q = customerSearchQuery.toLowerCase().trim();
      const matchUser = cust.username.toLowerCase().includes(q);
      const matchRobloxId = cust.robloxUserId?.includes(q) || false;
      const matchWa = cust.whatsappNumber.includes(q);
      return matchUser || matchRobloxId || matchWa;
    });
  }, [customers, customerSearchQuery]);

  // Filtered Blacklist
  const filteredBlacklist = useMemo(() => {
    return blacklist.filter((b) => {
      if (!blacklistSearchQuery.trim()) return true;
      const q = blacklistSearchQuery.toLowerCase().trim();
      const matchUser = b.username.toLowerCase().includes(q);
      const matchRobloxId = b.robloxUserId?.includes(q) || false;
      const matchWa = b.whatsapp.includes(q);
      return matchUser || matchRobloxId || matchWa;
    });
  }, [blacklist, blacklistSearchQuery]);

  // Filtered Testimonials
  const filteredTestimonials = useMemo(() => {
    return testimonials.filter((t) => {
      // Tab filter
      if (testimonialFilterTab === "aktif" && !t.isVisible) return false;
      if (testimonialFilterTab === "sembunyi" && t.isVisible) return false;
      if (testimonialFilterTab === "perlu-balasan" && t.adminReply) return false;

      // Search query
      if (testimonialSearchQuery.trim()) {
        const q = testimonialSearchQuery.toLowerCase().trim();
        const matchUser = t.username.toLowerCase().includes(q);
        const matchComment = t.comment.toLowerCase().includes(q);
        const matchPkg = t.packageName.toLowerCase().includes(q);
        if (!matchUser && !matchComment && !matchPkg) return false;
      }

      return true;
    });
  }, [testimonials, testimonialFilterTab, testimonialSearchQuery]);

  // Filtered Payment Mutations
  const filteredMutations = useMemo(() => {
    return mutations.filter((item) => {
      // Channel tab filter
      if (paymentHistoryTab === "website" && item.channel !== "WEBSITE") return false;
      if (paymentHistoryTab === "whatsapp" && item.channel !== "WHATSAPP") return false;

      // Search query (order number or username)
      if (paymentHistorySearch.trim()) {
        const q = paymentHistorySearch.toLowerCase().trim();
        const matchOrder = item.orderNumber.toLowerCase().includes(q);
        const matchUser = item.username.toLowerCase().includes(q);
        if (!matchOrder && !matchUser) return false;
      }

      return true;
    });
  }, [mutations, paymentHistoryTab, paymentHistorySearch]);

  // Format IDR
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID").format(val);
  };

  // 1. Loading State saat memeriksa sesi otorisasi admin (diselaraskan dengan brand Vexlyn)
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#FFF5F8] text-[#220813] flex flex-col items-center justify-center p-6 selection:bg-rose-600 selection:text-white relative overflow-hidden">
        {/* Soft Ambient Glows */}
        <div className="absolute w-72 h-72 rounded-full bg-rose-200/50 blur-3xl pointer-events-none" />
        
        <div className="relative flex items-center justify-center mb-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7A0620] via-[#8B0E2F] to-[#BE123C] flex items-center justify-center shadow-xl shadow-rose-900/20 border border-rose-300/60 animate-pulse">
            <Lock className="w-7 h-7 text-white" />
          </div>
        </div>
        <h2 className="text-base font-black tracking-tight text-[#7A0620]">
          Vexlyn Security Portal
        </h2>
        <p className="text-xs text-slate-500 mt-2 flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#BE123C]" />
          <span>Memeriksa otorisasi sesi admin...</span>
        </p>
      </div>
    );
  }

  // 2. Tampilan Halaman Login Admin diselaraskan dengan tema logo Vexlyn ID
  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF5F8] via-[#FFEBF1] to-[#FFF0F5] text-[#220813] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans selection:bg-rose-600 selection:text-white">
        {/* Soft Ambient Brand Glow Orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-br from-[#7A0620]/10 via-[#BE123C]/15 to-[#FF2A6D]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-rose-300/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#FFE4EC] rounded-full blur-3xl pointer-events-none" />

        {/* Login Card */}
        <div className="relative z-10 w-full max-w-md bg-white/95 border border-rose-200/90 rounded-3xl p-6 sm:p-9 shadow-2xl shadow-rose-950/10 backdrop-blur-xl">
          {/* Header Brand */}
          <div className="flex flex-col items-center text-center mb-7">
            {/* Logo dengan Frame Gradien Signature Vexlyn */}
            <div className="relative w-20 h-20 rounded-3xl p-1 bg-gradient-to-br from-[#7A0620] via-[#A11438] to-[#BE123C] shadow-lg shadow-rose-900/20 mb-4">
              <div className="relative w-full h-full rounded-[20px] overflow-hidden bg-white">
                <Image
                  src={logoImage || "/logo.jpg"}
                  alt="Vexlyn Logo"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-[10px] font-black uppercase tracking-wider text-[#8B0E2F] mb-2.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#BE123C]" />
              <span>Akses Khusus Admin</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#7A0620] via-[#A11438] to-[#C41E3A]">
              Portal Admin Vexlyn
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xs leading-relaxed">
              Masuk dengan kredensial otorisasi untuk mengelola pesanan, stok robux, dan pengaturan toko.
            </p>
          </div>

          {/* Form Login */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Error Banner */}
            {loginError && (
              <div className="p-3.5 rounded-2xl bg-[#FFF0F3] border border-rose-300 text-[#8B0E2F] text-xs font-semibold flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-[#BE123C] shrink-0 mt-0.5" />
                <span className="leading-relaxed">{loginError}</span>
              </div>
            )}

            {/* Field Username */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-[#7A0620] flex items-center justify-between">
                <span>Username Admin</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-rose-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="Masukkan username admin..."
                  className="w-full pl-10 pr-4 py-3 sm:py-3.5 bg-[#FFF9FA] border border-rose-200/90 hover:border-rose-300 focus:border-[#BE123C] focus:bg-white text-sm text-slate-900 placeholder:text-slate-400 rounded-2xl focus:outline-none focus:ring-3 focus:ring-rose-100 transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* Field Password */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-[#7A0620] flex items-center justify-between">
                <span>Kata Sandi Otoritas</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-rose-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showLoginPassword ? "text" : "password"}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Masukkan kata sandi..."
                  className="w-full pl-10 pr-11 py-3 sm:py-3.5 bg-[#FFF9FA] border border-rose-200/90 hover:border-rose-300 focus:border-[#BE123C] focus:bg-white text-sm text-slate-900 placeholder:text-slate-400 rounded-2xl focus:outline-none focus:ring-3 focus:ring-rose-100 transition-all shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-rose-600 cursor-pointer transition-colors"
                  title={showLoginPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmittingLogin}
              className="w-full mt-2 py-3.5 sm:py-4 px-4 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-[#7A0620] via-[#8B0E2F] to-[#BE123C] hover:from-[#680319] hover:to-[#A11438] active:scale-[0.99] transition-all shadow-lg shadow-rose-900/25 hover:shadow-rose-900/35 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmittingLogin ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi Otoritas...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Masuk ke Panel Kontrol</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Back Link */}
          <div className="mt-6 pt-5 border-t border-rose-100 flex items-center justify-between text-xs text-slate-500">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-slate-600 hover:text-[#7A0620] font-bold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Toko</span>
            </Link>
            <span className="text-[10px] text-rose-600 font-extrabold">
              Sesi Aman 7 Hari
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF5F8] text-[#220813] flex font-sans antialiased selection:bg-rose-600 selection:text-white">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-[#7A0620] text-white text-xs sm:text-sm font-semibold rounded-2xl shadow-xl shadow-rose-950/20 border border-rose-500/30 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-rose-300 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Backdrop for Mobile Sidebar */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* -------------------- SIDEBAR -------------------- */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 h-screen bg-white/95 backdrop-blur-xl border-r border-rose-100 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* 1. FIXED TOP HEADER (Tidak ikut scroll) */}
        <div className="shrink-0 p-4 sm:p-5 pb-5 border-b border-rose-100/80 bg-white/95">
          <div className="flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-3 group">
              <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-rose-500/80 p-0.5 shadow-sm group-hover:border-rose-600 transition-all bg-white shrink-0">
                <Image
                  src="/logo.jpg"
                  alt="Vexlyn Logo"
                  fill
                  className="object-cover rounded-full"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#7A0620] via-[#A11438] to-[#C41E3A]">
                    VEXLYN
                  </span>
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                    ID
                  </span>
                </div>
                <span className="text-[10px] font-bold text-rose-700/80 tracking-widest uppercase">
                  Admin Control Panel
                </span>
              </div>
            </Link>

            {/* Mobile Close Button */}
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-xl hover:bg-rose-50 text-slate-500 hover:text-rose-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. SCROLLABLE MIDDLE MENU (Hanya area ini yang scroll) */}
        <nav className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
            {/* Dashboard Link */}
            <div>
              <button
                onClick={() => {
                  setActiveTab("dashboard");
                  setSelectedOrderId(null);
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all text-left cursor-pointer ${
                  activeTab === "dashboard" && !selectedOrderId
                    ? "bg-rose-50 text-rose-700 font-extrabold shadow-xs border border-rose-200/70"
                    : "text-slate-600 hover:text-rose-700 hover:bg-rose-50/50"
                }`}
              >
                <LayoutDashboard
                  className={`w-4 h-4 ${
                    activeTab === "dashboard" && !selectedOrderId
                      ? "text-rose-600"
                      : "text-slate-400"
                  }`}
                />
                <span>Dashboard</span>
              </button>
            </div>

            {/* Section: ORDER MANAGEMENT */}
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3.5">
                ORDER MANAGEMENT
              </span>

              {/* Order Masuk */}
              <button
                onClick={() => {
                  setActiveTab("order-masuk");
                  setSelectedOrderId(null);
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === "order-masuk" && !selectedOrderId
                    ? "bg-rose-50 text-rose-700 font-extrabold shadow-xs border border-rose-200/70"
                    : "text-slate-600 hover:text-rose-700 hover:bg-rose-50/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Inbox className="w-4 h-4 text-slate-400" />
                  <span>Order Masuk</span>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                  {counts.masuk}
                </span>
              </button>

              {/* Order Diproses */}
              <button
                onClick={() => {
                  setActiveTab("order-diproses");
                  setSelectedOrderId(null);
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === "order-diproses" && !selectedOrderId
                    ? "bg-rose-50 text-rose-700 font-extrabold shadow-xs border border-rose-200/70"
                    : "text-slate-600 hover:text-rose-700 hover:bg-rose-50/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>Order Diproses</span>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                  {counts.diproses}
                </span>
              </button>

              {/* Order Selesai */}
              <button
                onClick={() => {
                  setActiveTab("order-selesai");
                  setSelectedOrderId(null);
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === "order-selesai" && !selectedOrderId
                    ? "bg-rose-50 text-rose-700 font-extrabold shadow-xs border border-rose-200/70"
                    : "text-slate-600 hover:text-rose-700 hover:bg-rose-50/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-slate-400" />
                  <span>Order Selesai</span>
                </div>
              </button>

              {/* Order Dibatalkan */}
              <button
                onClick={() => {
                  setActiveTab("order-dibatalkan");
                  setSelectedOrderId(null);
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === "order-dibatalkan" && !selectedOrderId
                    ? "bg-rose-50 text-rose-700 font-extrabold shadow-xs border border-rose-200/70"
                    : "text-slate-600 hover:text-rose-700 hover:bg-rose-50/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <XCircle className="w-4 h-4 text-slate-400" />
                  <span>Order Dibatalkan</span>
                </div>
              </button>
            </div>

            {/* Section: PRICELIST */}
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3.5">
                PRICELIST
              </span>
              <button
                onClick={() => {
                  setActiveTab("pricelist");
                  setSelectedOrderId(null);
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === "pricelist" && !selectedOrderId
                    ? "bg-rose-50 text-rose-700 font-extrabold shadow-xs border border-rose-200/70"
                    : "text-slate-600 hover:text-rose-700 hover:bg-rose-50/50"
                }`}
              >
                <Tag className="w-4 h-4 text-slate-400" />
                <span>Pricelist Robux</span>
              </button>
            </div>

            {/* Section: PELANGGAN */}
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3.5">
                PELANGGAN
              </span>
              <button
                onClick={() => {
                  setActiveTab("pelanggan");
                  setSelectedOrderId(null);
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === "pelanggan" && !selectedOrderId
                    ? "bg-rose-50 text-rose-700 font-extrabold shadow-xs border border-rose-200/70"
                    : "text-slate-600 hover:text-rose-700 hover:bg-rose-50/50"
                }`}
              >
                <Users className="w-4 h-4 text-slate-400" />
                <span>Daftar Pelanggan</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("blacklist");
                  setSelectedOrderId(null);
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === "blacklist" && !selectedOrderId
                    ? "bg-rose-50 text-rose-700 font-extrabold shadow-xs border border-rose-200/70"
                    : "text-slate-600 hover:text-rose-700 hover:bg-rose-50/50"
                }`}
              >
                <Ban className="w-4 h-4 text-slate-400" />
                <span>Blacklist</span>
              </button>
            </div>

            {/* Section: KONTEN & ULASAN (Matching Reference) */}
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3.5">
                KONTEN & ULASAN
              </span>
              <button
                onClick={() => {
                  setActiveTab("testimoni");
                  setSelectedOrderId(null);
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === "testimoni" && !selectedOrderId
                    ? "bg-rose-50 text-rose-700 font-extrabold shadow-xs border border-rose-200/70"
                    : "text-slate-600 hover:text-rose-700 hover:bg-rose-50/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-4 h-4 text-slate-400" />
                  <span>Kelola Testimoni</span>
                </div>
                {testiStats.needReply > 0 && (
                  <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                    {testiStats.needReply}
                  </span>
                )}
              </button>
            </div>

            {/* Section: KEUANGAN */}
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3.5">
                KEUANGAN
              </span>
              <button
                onClick={() => {
                  setActiveTab("keuangan");
                  setSelectedOrderId(null);
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === "keuangan" && !selectedOrderId
                    ? "bg-rose-50 text-rose-700 font-extrabold shadow-xs border border-rose-200/70"
                    : "text-slate-600 hover:text-rose-700 hover:bg-rose-50/50"
                }`}
              >
                <CreditCard className="w-4 h-4 text-slate-400" />
                <span>Riwayat Pembayaran</span>
              </button>
            </div>

            {/* Section: PENGATURAN */}
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3.5">
                PENGATURAN
              </span>
              <button
                onClick={() => {
                  setActiveTab("pengaturan");
                  setSelectedOrderId(null);
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === "pengaturan" && !selectedOrderId
                    ? "bg-rose-50 text-rose-700 font-extrabold shadow-xs border border-rose-200/70"
                    : "text-slate-600 hover:text-rose-700 hover:bg-rose-50/50"
                }`}
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Pengaturan Toko</span>
              </button>
            </div>
        </nav>

        {/* 3. FIXED BOTTOM FOOTER (Tidak ikut scroll / tetap diam di bawah) */}
        <div className="shrink-0 p-4 sm:p-5 pt-3.5 border-t border-rose-100/80 space-y-3 bg-white/95">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#FFF5F8] to-rose-50/70 border border-rose-200/80 text-center space-y-2 shadow-2xs">
            <div className="text-xs font-bold text-slate-800">Butuh Bantuan?</div>
            <div className="text-[10px] text-slate-500">
              Tim Vexlyn siap membantu kamu!
            </div>
            <a
              href={`https://wa.me/${(whatsappCs || "6288230515875").replace(/\D/g, "").replace(/^0/, "62")}?text=Halo%20Admin%20${encodeURIComponent(storeName)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white border border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-50 transition-colors shadow-2xs"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Chat Admin</span>
            </a>
          </div>

          {/* Quick Links: Lihat Toko & Keluar */}
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 px-1 pt-0.5">
            <Link
              href="/"
              className="flex items-center gap-1 hover:text-rose-700 transition-colors"
              target="_blank"
            >
              <span>Lihat Toko</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-rose-600 hover:text-rose-800 transition-colors cursor-pointer"
            >
              <LogOut className="w-3 h-3" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </aside>

      {/* -------------------- MAIN CONTENT AREA -------------------- */}
      <main className="flex-1 lg:ml-72 flex flex-col min-h-screen min-w-0">
        {/* TOP BAR / HEADER */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-rose-100 px-3.5 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-2.5 sm:gap-4">
          {/* Mobile Menu Button & Search */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-xl min-w-0">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 shrink-0 cursor-pointer transition-colors"
              title="Menu Navigasi"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Global Search Input */}
            <div className="relative w-full min-w-0">
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari order, username, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 sm:pl-9 pr-3 sm:pr-4 py-1.5 sm:py-2 bg-slate-50/80 hover:bg-slate-50 focus:bg-white text-xs sm:text-sm text-slate-800 rounded-full border border-slate-200/90 focus:border-rose-400 focus:outline-hidden transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Admin Profile & Logout */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Admin Info Pill */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border border-rose-300 bg-white shrink-0 shadow-2xs">
                <Image
                  src="/logo.jpg"
                  alt="Admin Avatar"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800 leading-tight">
                  {authAdminUser}
                </span>
                <span className="text-[10px] font-extrabold text-rose-600">
                  Super Admin
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full border border-rose-200 bg-rose-50/70 hover:bg-rose-100/80 text-rose-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
              title="Keluar dari Panel Admin"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* BODY CONTENT CONTAINER */}
        <div className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-4 sm:space-y-6 min-w-0">
          {/* ============================================================== */}
          {/* VIEW: ORDER DETAIL (IF AN ORDER IS SELECTED)                   */}
          {/* ============================================================== */}
          {selectedOrder ? (
            <div className="space-y-6 animate-fadeIn">
              {/* Back Link */}
              <button
                onClick={() => setSelectedOrderId(null)}
                className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-rose-700 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-rose-600" />
                <span>
                  Kembali ke{" "}
                  {activeTab === "order-masuk"
                    ? "Order Masuk"
                    : activeTab === "order-diproses"
                    ? "Order Diproses"
                    : activeTab === "order-selesai"
                    ? "Order Selesai"
                    : activeTab === "order-dibatalkan"
                    ? "Order Dibatalkan"
                    : "Dashboard"}
                </span>
              </button>

              {/* Order Header Banner */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl sm:text-3xl font-black text-rose-900 tracking-tight">
                      ORDER #{selectedOrder.orderNumber}
                    </h1>
                    <span
                      className={`text-xs font-extrabold px-3 py-1 rounded-full border ${
                        selectedOrder.status === "menunggu"
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : selectedOrder.status === "diproses"
                          ? "bg-blue-50 text-blue-800 border-blue-200"
                          : selectedOrder.status === "selesai"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-rose-50 text-rose-800 border-rose-200"
                      }`}
                    >
                      {selectedOrder.status === "menunggu"
                        ? "Menunggu Pembayaran"
                        : selectedOrder.status === "diproses"
                        ? "Sedang Diproses"
                        : selectedOrder.status === "selesai"
                        ? "Pesanan Selesai"
                        : "Pesanan Dibatalkan"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    {selectedOrder.date} pukul {selectedOrder.time} WIB
                  </p>
                </div>
              </div>

              {/* Action Bar: UBAH STATUS CEPAT */}
              <div className="p-4 rounded-3xl bg-white border border-rose-100 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                  UBAH STATUS CEPAT:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, "diproses")}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      selectedOrder.status === "diproses"
                        ? "bg-blue-600 text-white"
                        : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                    }`}
                  >
                    Proses Pesanan
                  </button>
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, "selesai")}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      selectedOrder.status === "selesai"
                        ? "bg-emerald-600 text-white"
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                    }`}
                  >
                    Selesaikan Order
                  </button>
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, "dibatalkan")}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      selectedOrder.status === "dibatalkan"
                        ? "bg-rose-600 text-white"
                        : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                    }`}
                  >
                    Batalkan
                  </button>
                  <a
                    href={`https://wa.me/${selectedOrder.whatsappNumber.replace(
                      /[^0-9]/g,
                      ""
                    )}?text=Halo%20kak%20@${selectedOrder.username},%20terima%20kasih%20telah%20order%20Robux%20di%20Vexlyn%20ID%20(Invoice%20%23${selectedOrder.orderNumber})...`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition-all shadow-2xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Chat Pelanggan</span>
                  </a>

                  {selectedOrder.status === "selesai" && (
                    selectedOrder.isReviewed ? (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black shadow-2xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Pesanan Sudah Diulas Customer</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendReviewLink(selectedOrder)}
                        disabled={isGeneratingReviewLink === selectedOrder.id}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white text-xs font-black transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                        title="Kirim link rating ulasan 1x pakai via WhatsApp ke customer"
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-white/20" />
                        <span>
                          {isGeneratingReviewLink === selectedOrder.id
                            ? "Memproses Link..."
                            : "Kirim Link Ulasan 1x Pakai (WA)"}
                        </span>
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Card 1: DETAIL PESANAN */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white border border-rose-100 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-rose-100">
                  <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800">
                    DETAIL PESANAN
                  </h3>
                </div>

                <div className="flex justify-between items-center text-xs font-semibold text-slate-400 pb-2 border-b border-slate-100">
                  <span>PRODUK</span>
                  <span>HARGA</span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-center justify-center overflow-hidden shrink-0">
                      <Image
                        src="/robux.webp"
                        alt="Robux Coin"
                        width={28}
                        height={28}
                        className="object-contain"
                      />
                    </div>
                    <div>
                      <span className="text-base sm:text-lg font-black text-slate-900 block">
                        {selectedOrder.amount.toLocaleString("id-ID")} Robux
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Transfer Resmi Developer Payout
                      </span>
                    </div>
                  </div>
                  <span className="text-base sm:text-lg font-black text-slate-900">
                    Rp {formatRupiah(selectedOrder.price)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <span className="text-slate-600 font-medium">Metode Pembayaran</span>
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-black text-[11px] tracking-wider">
                    {selectedOrder.paymentMethod}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-rose-100">
                  <span className="text-xs sm:text-sm font-black text-slate-900 uppercase">
                    TOTAL PEMBAYARAN
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-rose-700">
                    Rp {formatRupiah(selectedOrder.price)}
                  </span>
                </div>

                {/* Transfer Proof note / preview */}
                {selectedOrder.paymentProofUrl ? (
                  <div className="p-4 sm:p-5 rounded-2xl bg-white border border-rose-200/80 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                          BUKTI TRANSFER PEMBAYARAN
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase tracking-wider">
                        ✓ Terlampir
                      </span>
                    </div>

                    <div
                      onClick={() =>
                        setEnlargedImage({
                          url: selectedOrder.paymentProofUrl!,
                          title: `Bukti Transfer - ${selectedOrder.orderNumber} (@${selectedOrder.username})`,
                        })
                      }
                      className="group relative w-full h-64 sm:h-80 rounded-xl overflow-hidden border border-slate-200 bg-slate-950 flex items-center justify-center cursor-pointer hover:border-rose-400 transition-all shadow-inner"
                    >
                      <img
                        src={selectedOrder.paymentProofUrl}
                        alt={`Bukti Transfer ${selectedOrder.orderNumber}`}
                        className="w-full h-full object-contain group-hover:scale-102 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-2 backdrop-blur-[2px]">
                        <Eye className="w-4 h-4 text-rose-300" />
                        <span>Klik untuk memperbesar foto bukti</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span className="font-medium">Format: Gambar WebP Terkompresi</span>
                      <a
                        href={selectedOrder.paymentProofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-rose-700 hover:text-rose-800 hover:underline"
                      >
                        <span>Buka Tab Baru</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-1">
                    <p className="text-xs text-slate-600 font-bold">
                      {selectedOrder.hasProofPhoto
                        ? "Bukti transfer telah diverifikasi otomatis oleh gateway."
                        : "Tidak ada foto bukti transfer"}
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Pelanggan belum mengunggah foto bukti atau menyelesaikan transaksi langsung via WhatsApp CS.
                    </p>
                  </div>
                )}
              </div>

              {/* Card 2: INFORMASI PELANGGAN */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white border border-rose-100 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-rose-100">
                  <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800">
                    INFORMASI PELANGGAN
                  </h3>
                </div>

                <div className="space-y-3.5 text-xs sm:text-sm">
                  {/* Username Roblox */}
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-semibold">Username Roblox</span>
                    <a
                      href={`https://www.roblox.com/search/users?keyword=${selectedOrder.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-black text-rose-700 hover:text-rose-900 flex items-center gap-1.5"
                    >
                      <span>@{selectedOrder.username}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* User ID Roblox */}
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-semibold">User ID Roblox</span>
                    <div className="flex items-center gap-2 font-mono font-bold text-slate-800">
                      <span>{selectedOrder.robloxUserId || "-"}</span>
                      {selectedOrder.robloxUserId && (
                        <button
                          onClick={() =>
                            copyToClipboard(selectedOrder.robloxUserId || "", "robloxId")
                          }
                          className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                          title="Copy ID"
                        >
                          {copiedKey === "robloxId" ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* WhatsApp */}
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-semibold">No. WhatsApp</span>
                    <div className="flex items-center gap-2 font-mono font-bold text-slate-800">
                      <a
                        href={`https://wa.me/${selectedOrder.whatsappNumber.replace(
                          /[^0-9]/g,
                          ""
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100"
                      >
                        <MessageCircle className="w-3 h-3 text-emerald-600" />
                        <span>{selectedOrder.whatsappNumber}</span>
                      </a>
                      <button
                        onClick={() =>
                          copyToClipboard(selectedOrder.whatsappNumber, "whatsapp")
                        }
                        className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                        title="Copy WhatsApp"
                      >
                        {copiedKey === "whatsapp" ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Catatan Pelanggan */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 gap-1">
                    <span className="text-slate-500 font-semibold">Catatan Pelanggan</span>
                    <span className="font-medium text-slate-700 text-right">
                      {selectedOrder.customerNote || "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 3: CATATAN ADMIN */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white border border-rose-100 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-rose-100">
                  <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800">
                    CATATAN ADMIN
                  </h3>
                </div>

                <div className="space-y-3">
                  <textarea
                    rows={3}
                    placeholder="Tulis catatan untuk order ini (hanya admin)..."
                    value={currentAdminNote}
                    onChange={(e) => setCurrentAdminNote(e.target.value)}
                    className="w-full p-4 rounded-2xl bg-slate-50/70 border border-slate-200 text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-rose-400 focus:outline-hidden transition-all"
                  />
                  <button
                    onClick={() => saveAdminNote(selectedOrder.id)}
                    className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#7A0620] via-[#A11438] to-[#C41E3A] text-white text-xs font-bold tracking-wider hover:opacity-95 shadow-md shadow-rose-950/20 active:scale-95 transition-all cursor-pointer"
                  >
                    Simpan Catatan
                  </button>
                </div>
              </div>
            </div>
          ) : activeTab === "dashboard" ? (
            /* ============================================================== */
            /* VIEW: DASHBOARD (STATISTICS & RECENT ORDERS)                   */
            /* ============================================================== */
            <div className="space-y-6">
              {/* WELCOME BANNER (Matching Storefront Theme) */}
              <div className="relative overflow-hidden p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-white/95 border border-rose-200/90 shadow-[0_15px_40px_rgba(159,18,57,0.06)] space-y-4 sm:space-y-6">
                {/* Background Banner Image (from Storefront) */}
                <div className="absolute inset-0 pointer-events-none">
                  <Image
                    src="/banner-light-bg.jpg"
                    alt="Vexlyn Admin Banner"
                    fill
                    className="object-cover object-right md:object-right-top opacity-70 sm:opacity-85 md:opacity-90"
                    priority
                  />
                  {/* Luminous Pearl / Rose gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/85 to-white/40 lg:hidden" />
                  <div className="absolute inset-0 hidden lg:block bg-gradient-to-r from-white via-white/90 to-transparent w-3/4" />
                </div>

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
                  <div className="space-y-2 max-w-2xl">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 border border-rose-200/90 backdrop-blur-md text-[10px] sm:text-[11px] font-extrabold text-rose-800 shadow-2xs">
                      <Users className="w-3.5 h-3.5 text-rose-600" />
                      <span>Vexlyn Admin Control</span>
                    </div>
                    <h1 className="text-xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                      Selamat Datang di Panel Admin!
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                      Pantau transaksi top up Robux, proses aktivasi pesanan secara instan,
                      dan kelola katalog produk toko dengan mudah.
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveTab("order-masuk")}
                    className="w-full sm:w-auto justify-center flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-gradient-to-r from-[#7A0620] via-[#A11438] to-[#C41E3A] hover:from-[#8B0825] hover:to-[#D1203E] text-white text-xs sm:text-sm font-bold tracking-wide shadow-md shadow-rose-900/20 hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:scale-95 shrink-0 cursor-pointer"
                  >
                    <span>Kelola Order</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* 3 Highlight Cards with Glassmorphism */}
                <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3.5 pt-1 sm:pt-2">
                  <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/85 backdrop-blur-md border border-rose-100 hover:border-rose-200 hover:bg-white shadow-2xs transition-all flex items-start gap-3">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-rose-100/80 text-rose-700 flex items-center justify-center shrink-0">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-800">Transaksi Cepat</h4>
                      <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 font-medium leading-tight">
                        Pantau top up Robux secara real-time.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/85 backdrop-blur-md border border-rose-100 hover:border-rose-200 hover:bg-white shadow-2xs transition-all flex items-start gap-3">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-rose-100/80 text-rose-700 flex items-center justify-center shrink-0">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-800">Aktivasi Instan</h4>
                      <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 font-medium leading-tight">
                        Proses pesanan otomatis dan cepat.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/85 backdrop-blur-md border border-rose-100 hover:border-rose-200 hover:bg-white shadow-2xs transition-all flex items-start gap-3">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-rose-100/80 text-rose-700 flex items-center justify-center shrink-0">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-800">Kelola Katalog</h4>
                      <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 font-medium leading-tight">
                        Atur produk dan stok dengan mudah.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD AKTIVASI ID ROBLOX (TEMA RESMI VEXLYN: RUBY RED & ROSE) */}
              <div className="p-4 sm:p-7 md:p-10 rounded-2xl sm:rounded-3xl bg-white border border-rose-100 shadow-xs relative overflow-hidden transition-all">
                {/* Top Badge: PERINGATAN SISTEM */}
                <div className="flex justify-center">
                  <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-rose-50 border border-rose-200/90 text-[#A11438] text-[10px] sm:text-xs font-black tracking-widest uppercase shadow-2xs">
                    <AlertTriangle className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-[#C41E3A]" />
                    <span>PERINGATAN SISTEM</span>
                    <AlertTriangle className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-[#C41E3A]" />
                  </div>
                </div>

                {/* Judul: ID ROBLOX BELUM AKTIF */}
                <h2 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 tracking-[0.06em] sm:tracking-[0.16em] font-mono uppercase text-center mt-3 sm:mt-4 break-words">
                  {isActivatedId ? "ID ROBLOX SUDAH AKTIF" : "ID ROBLOX BELUM AKTIF"}
                </h2>

                {/* Input / Display Baris Username */}
                <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 sm:gap-3 max-w-xl mx-auto w-full">
                  <label className="text-xs sm:text-sm font-black text-slate-700 tracking-wider uppercase shrink-0 text-center sm:text-left">
                    USERNAME :
                  </label>
                  <div className="relative w-full sm:max-w-md">
                    <span className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-sm sm:text-base font-black text-rose-500 select-none">
                      @
                    </span>
                    <input
                      type="text"
                      value={activationUsername}
                      onChange={(e) => {
                        setActivationUsername(e.target.value.replace(/^@/, ""));
                        setIsActivatedId(false);
                      }}
                      placeholder="masukkan_username"
                      className="w-full pl-8 sm:pl-9 pr-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-rose-50/40 focus:bg-white border border-rose-200 focus:border-[#C41E3A] text-xs sm:text-sm font-black text-slate-900 focus:outline-hidden transition-all shadow-2xs placeholder-slate-400"
                    />
                  </div>
                </div>

                {/* 2 Card Tengah (Grid 2 Kolom) */}
                <div className="mt-4 sm:mt-6 grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-stretch">
                  {/* Card Kiri: AKTIVASI DIPERLUKAN */}
                  <div className="md:col-span-8 p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-rose-50/30 border border-rose-100 flex items-start gap-3 sm:gap-4 shadow-2xs">
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl border flex items-center justify-center shrink-0 transition-colors ${
                        isActivatedId
                          ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                          : "bg-rose-100/80 border-rose-200 text-[#C41E3A]"
                      }`}
                    >
                      {isActivatedId ? (
                        <CheckCircle2 className="w-5 sm:w-6 h-5 sm:h-6 text-emerald-600" />
                      ) : (
                        <Lock className="w-4 sm:w-5 h-4 sm:h-5 text-[#C41E3A]" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <h4
                        className={`text-xs sm:text-sm font-black tracking-wider uppercase ${
                          isActivatedId ? "text-emerald-800" : "text-[#7A0620]"
                        }`}
                      >
                        {isActivatedId ? "STATUS: SUDAH DIAKTIFKAN" : "AKTIVASI DIPERLUKAN"}
                      </h4>
                      <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-medium">
                        {isActivatedId ? (
                          <>
                            ID Roblox pada akun{" "}
                            <strong className="font-extrabold text-emerald-700">
                              @{activationUsername || "username"}
                            </strong>{" "}
                            telah berhasil aktif di server. Seluruh proses pesanan dapat langsung dilanjutkan.
                          </>
                        ) : (
                          <>
                            ID Roblox pada order akun{" "}
                            <strong className="font-extrabold text-[#A11438]">
                              @{activationUsername || "username"}
                            </strong>{" "}
                            belum aktif di server. Silakan aktifkan ID terlebih dahulu untuk melanjutkan proses pengiriman Robux.
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Card Kanan: BIAYA PENGAKTIFAN ID */}
                  <div className="md:col-span-4 p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-rose-50/30 border border-rose-100 flex flex-col justify-center items-center text-center shadow-2xs">
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-500">
                      BIAYA PENGAKTIFAN ID
                    </span>
                    <div className="mt-1.5 sm:mt-2 text-xl sm:text-3xl font-black text-[#7A0620] tracking-tight">
                      Rp {activationFee.toLocaleString("id-ID")}
                    </div>
                  </div>
                </div>

                {/* Card Catatan Admin */}
                <div className="mt-3 sm:mt-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-rose-100 flex items-center gap-2.5 sm:gap-3 text-xs sm:text-sm text-slate-700 shadow-2xs">
                  <Sparkles className="w-4 h-4 text-[#C41E3A] shrink-0" />
                  <p className="text-[11px] sm:text-[13px] text-slate-600 leading-relaxed">
                    <strong className="font-bold text-slate-900">Catatan Admin:</strong>{" "}
                    {isActivatedId ? (
                      <span>
                        ID <strong className="text-emerald-700">@{activationUsername || "username"}</strong> sudah aktif, order dapat langsung diproses seperti biasa.
                      </span>
                    ) : (
                      <span>
                        Setelah ID <strong className="text-[#A11438]">@{activationUsername || "username"}</strong> diaktifkan, order dapat langsung diproses seperti biasa.
                      </span>
                    )}
                  </p>
                </div>

                {/* Tombol CTA Besar (Gradien Ruby Vexlyn) */}
                <div className="mt-4 sm:mt-5">
                  {isActivatedId ? (
                    <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                      <button
                        type="button"
                        disabled
                        className="flex-1 py-3 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl bg-emerald-600 text-white font-black text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-md shadow-emerald-900/20 text-center"
                      >
                        <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                        <span>ID @{(activationUsername || "username").toUpperCase()} TELAH AKTIF DI SERVER</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsActivatedId(false);
                          setActivationUsername("");
                        }}
                        className="py-2.5 sm:py-4 px-5 sm:px-6 rounded-xl sm:rounded-2xl bg-white border border-rose-200 hover:bg-rose-50 text-slate-700 font-extrabold text-xs sm:text-sm tracking-wide transition-all shadow-xs cursor-pointer text-center"
                      >
                        Aktifkan ID Lain
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleActivateId}
                      disabled={isActivatingId || !activationUsername.trim()}
                      className="w-full py-3 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#7A0620] via-[#A11438] to-[#C41E3A] hover:from-[#8B0825] hover:to-[#D1203E] active:scale-[0.99] text-white font-black text-xs sm:text-sm tracking-wider sm:tracking-widest uppercase transition-all shadow-md shadow-rose-900/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 text-center"
                    >
                      {isActivatingId ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-white shrink-0" />
                          <span>MEMPROSES AKTIVASI SERVER...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 fill-white text-white shrink-0" />
                          <span>AKTIFKAN ID @{(activationUsername || "username").toUpperCase()} SEKARANG</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* 4 METRIC CARDS (2 KOLOM DI MOBILE AGAR COMPACT & RAPI) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                {/* Metric 1: Total Omset */}
                <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-rose-100 shadow-xs flex flex-col justify-between space-y-2 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-400">
                      TOTAL OMSET
                    </span>
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                      <TrendingUp className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                    </div>
                  </div>
                  <div>
                    <span className="text-base sm:text-xl lg:text-2xl font-black text-slate-900 block tracking-tight leading-tight">
                      Rp {formatRupiah(counts.totalOmset)}
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-bold text-emerald-600 flex items-center gap-1 mt-0.5 sm:mt-1">
                      <span>↑ Sukses</span>
                    </span>
                  </div>
                </div>

                {/* Metric 2: Order Masuk */}
                <div
                  onClick={() => setActiveTab("order-masuk")}
                  className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-rose-100 shadow-xs flex flex-col justify-between space-y-2 sm:space-y-4 cursor-pointer hover:border-amber-300 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-400">
                      ORDER MASUK
                    </span>
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <Inbox className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                    </div>
                  </div>
                  <div>
                    <span className="text-base sm:text-xl lg:text-2xl font-black text-amber-600 block tracking-tight leading-tight">
                      {counts.masuk}
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-bold text-amber-700 flex items-center gap-1 mt-0.5 sm:mt-1 group-hover:translate-x-0.5 transition-transform">
                      <span>Perlu proses</span>
                      <ArrowRight className="w-2.5 sm:w-3 h-2.5 sm:h-3" />
                    </span>
                  </div>
                </div>

                {/* Metric 3: Sedang Diproses */}
                <div
                  onClick={() => setActiveTab("order-diproses")}
                  className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-rose-100 shadow-xs flex flex-col justify-between space-y-2 sm:space-y-4 cursor-pointer hover:border-blue-300 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-400">
                      DIPROSES
                    </span>
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Clock className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                    </div>
                  </div>
                  <div>
                    <span className="text-base sm:text-xl lg:text-2xl font-black text-blue-600 block tracking-tight leading-tight">
                      {counts.diproses}
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-bold text-blue-600 flex items-center gap-1 mt-0.5 sm:mt-1 group-hover:translate-x-0.5 transition-transform">
                      <span>Antrean payout</span>
                      <ArrowRight className="w-2.5 sm:w-3 h-2.5 sm:h-3" />
                    </span>
                  </div>
                </div>

                {/* Metric 4: Order Selesai */}
                <div
                  onClick={() => setActiveTab("order-selesai")}
                  className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-rose-100 shadow-xs flex flex-col justify-between space-y-2 sm:space-y-4 cursor-pointer hover:border-emerald-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-400">
                      SELESAI
                    </span>
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                    </div>
                  </div>
                  <div>
                    <span className="text-base sm:text-xl lg:text-2xl font-black text-emerald-600 block tracking-tight leading-tight">
                      142
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 block mt-0.5 sm:mt-1">
                      Dari 242 order
                    </span>
                  </div>
                </div>
              </div>

              {/* PESANAN TERBARU (Recent Orders Table) */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white border border-rose-100 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-rose-100">
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      Pesanan Terbaru
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      5 transaksi terakhir yang masuk ke sistem
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("order-masuk")}
                    className="flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-800 transition-colors cursor-pointer"
                  >
                    <span>Lihat Semua</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* List of 5 Recent Orders */}
                <div className="divide-y divide-slate-100">
                  {orders.slice(0, 5).map((ord) => (
                    <div
                      key={ord.id}
                      onClick={() => openOrderDetail(ord.id)}
                      className="py-3.5 flex items-center justify-between gap-3 hover:bg-rose-50/40 rounded-2xl px-2 transition-colors cursor-pointer group"
                    >
                      {/* Left: Icon + ID + Username */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center overflow-hidden shrink-0">
                          <Image
                            src="/robux.webp"
                            alt="Robux"
                            width={22}
                            height={22}
                            className="object-contain"
                          />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs sm:text-sm font-black text-rose-700 block truncate group-hover:text-rose-800">
                            #{ord.orderNumber}
                          </span>
                          <span className="text-[11px] text-slate-600 font-medium block truncate">
                            @{ord.username} • {ord.amount.toLocaleString("id-ID")} Robux
                          </span>
                        </div>
                      </div>

                      {/* Right: Price + Badge */}
                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-xs sm:text-sm font-black text-slate-900">
                          Rp {formatRupiah(ord.price)}
                        </span>
                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 tracking-wider">
                          {ord.paymentMethod}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : activeTab === "pricelist" ? (
            /* ============================================================== */
            /* VIEW: PRICELIST ROBUX                                          */
            /* ============================================================== */
            <div className="space-y-6 animate-fadeIn">
              {/* Header Title & Button + Tambah Nominal Baru */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                    Pricelist Robux
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">
                    Kelola daftar nominal Robux, harga jual, dan status ketersediaan
                  </p>
                </div>

                <button
                  onClick={openAddPackageModal}
                  className="self-start sm:self-center flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#7A0620] via-[#A11438] to-[#C41E3A] hover:from-[#8B0825] hover:to-[#D1203E] text-white text-xs sm:text-sm font-bold tracking-wide shadow-md shadow-rose-900/20 active:scale-95 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Tambah Nominal Baru</span>
                </button>
              </div>

              {/* Grid 3 Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="p-5 sm:p-6 rounded-3xl bg-white border border-rose-100 shadow-xs hover:shadow-sm hover:border-rose-200 transition-all flex flex-col justify-between space-y-4"
                  >
                    {/* Top Row: Coin + Details + Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50/90 border border-amber-200/90 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                          <Image
                            src="/robux.webp"
                            alt="Robux"
                            width={32}
                            height={32}
                            className="object-contain"
                          />
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-base sm:text-lg font-black text-slate-900">
                              {pkg.amount.toLocaleString("id-ID")} Robux
                            </span>
                          </div>

                          {(() => {
                            const autoBadge = getAutoPackageBadge(pkg);
                            if (autoBadge === "PROMO") {
                              return (
                                <div className="mt-0.5">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200 font-extrabold text-[9px] tracking-wide">
                                    <Flame className="w-2.5 h-2.5 text-rose-600 fill-rose-600" />
                                    <span>PROMO</span>
                                  </span>
                                </div>
                              );
                            }
                            if (autoBadge === "SULTAN") {
                              return (
                                <div className="mt-0.5">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200 font-extrabold text-[9px] tracking-wide">
                                    <Crown className="w-2.5 h-2.5 text-amber-600 fill-amber-600" />
                                    <span>SULTAN</span>
                                  </span>
                                </div>
                              );
                            }
                            if (autoBadge === "POPULER") {
                              return (
                                <div className="mt-0.5">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 border border-purple-200 font-extrabold text-[9px] tracking-wide">
                                    <Star className="w-2.5 h-2.5 text-purple-600 fill-purple-600" />
                                    <span>POPULER</span>
                                  </span>
                                </div>
                              );
                            }
                            return null;
                          })()}

                          <div className="mt-0.5">
                            <span className="text-sm sm:text-base font-black text-[#A11438]">
                              Rp {formatRupiah(pkg.price)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[11px] font-extrabold px-3 py-1 rounded-full border shrink-0 ${
                          pkg.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                        }`}
                      >
                        {pkg.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </div>

                    {/* Bottom Row */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <button
                        onClick={() => handleTogglePackageStatus(pkg.id)}
                        className="font-bold text-slate-500 hover:text-rose-700 transition-colors cursor-pointer"
                      >
                        {pkg.isActive ? "Nonaktifkan" : "Aktifkan"}
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditPackageModal(pkg)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Edit Nominal"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePackage(pkg.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Hapus Nominal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === "testimoni" ? (
            /* ============================================================== */
            /* VIEW: KELOLA TESTIMONI & ULASAN (Matching User's 2 Images)     */
            /* ============================================================== */
            <div className="space-y-6 animate-fadeIn">
              {/* Header Title & Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                    Kelola Testimoni & Ulasan
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">
                    Moderasi ulasan pembeli, tambah ulasan manual, balas testimoni, dan kontrol publikasi di website
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={openAddTestiModal}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#7A0620] via-[#A11438] to-[#C41E3A] hover:from-[#8B0825] hover:to-[#D1203E] text-white text-xs sm:text-sm font-bold tracking-wide shadow-md shadow-rose-900/20 active:scale-95 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Tambah Testimoni</span>
                  </button>

                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 text-xs sm:text-sm font-bold transition-all shadow-2xs active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-rose-600" : ""}`}
                    />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {/* 4 Stat Cards (Matching Image 1) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-3xl bg-white border border-rose-100 shadow-xs space-y-2">
                  <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                    TOTAL ULASAN
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 block">
                    {testiStats.total}
                  </span>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-rose-100 shadow-xs space-y-2">
                  <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                    RATING RATA-RATA
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-2xl sm:text-3xl font-black text-amber-500">
                      {testiStats.avgRating}
                    </span>
                    <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                  </div>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-rose-100 shadow-xs space-y-2">
                  <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                    AKTIF (TAMPIL)
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-emerald-600 block">
                    {testiStats.active}
                  </span>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-rose-100 shadow-xs space-y-2">
                  <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                    PERLU BALASAN
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-rose-600 block">
                    {testiStats.needReply}
                  </span>
                </div>
              </div>

              {/* Filter Tabs & Search Bar (Matching Image 1) */}
              <div className="p-4 rounded-3xl bg-white border border-rose-100 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                {/* Tabs */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => setTestimonialFilterTab("semua")}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      testimonialFilterTab === "semua"
                        ? "bg-[#C41E3A] text-white shadow-xs"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Semua ({testiStats.total})
                  </button>
                  <button
                    onClick={() => setTestimonialFilterTab("aktif")}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      testimonialFilterTab === "aktif"
                        ? "bg-[#C41E3A] text-white shadow-xs"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Aktif ({testiStats.active})
                  </button>
                  <button
                    onClick={() => setTestimonialFilterTab("sembunyi")}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      testimonialFilterTab === "sembunyi"
                        ? "bg-[#C41E3A] text-white shadow-xs"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Disembunyikan ({testiStats.hidden})
                  </button>
                  <button
                    onClick={() => setTestimonialFilterTab("perlu-balasan")}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      testimonialFilterTab === "perlu-balasan"
                        ? "bg-[#C41E3A] text-white shadow-xs"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Perlu Balasan ({testiStats.needReply})
                  </button>
                </div>

                {/* Search in Testimonials */}
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari username atau ulasan..."
                    value={testimonialSearchQuery}
                    onChange={(e) => setTestimonialSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 text-xs text-slate-800 rounded-full border border-slate-200 focus:bg-white focus:border-rose-400 focus:outline-hidden transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Testimonial Cards List (Image upload feature omitted as requested!) */}
              <div className="space-y-3.5">
                {filteredTestimonials.length === 0 ? (
                  <div className="p-12 text-center bg-white rounded-3xl border border-rose-100 shadow-xs space-y-2">
                    <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
                    <h3 className="text-sm font-bold text-slate-700">Tidak ada ulasan ditemukan</h3>
                    <p className="text-xs text-slate-400">
                      Coba ganti filter tab atau kata kunci pencarian.
                    </p>
                  </div>
                ) : (
                  filteredTestimonials.map((t) => (
                    <div
                      key={t.id}
                      className="p-5 sm:p-6 rounded-3xl bg-white border border-rose-100 shadow-xs hover:border-rose-200 transition-all space-y-3.5"
                    >
                      {/* Top Header Row: User Info + Action Buttons */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {/* User Avatar Circle */}
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-500 to-[#C41E3A] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-2xs">
                            {t.username.substring(0, 1).toUpperCase()}
                          </div>

                          {/* Username & Badges */}
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm sm:text-base font-black text-slate-900">
                                @{t.username}
                              </span>
                              {t.isVerified && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <Check className="w-2.5 h-2.5" />
                                  <span>Terverifikasi</span>
                                </span>
                              )}
                              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                                {t.packageName}
                              </span>
                            </div>

                            {/* Stars & Time */}
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-3.5 h-3.5 ${
                                      star <= t.rating
                                        ? "text-amber-400 fill-amber-400"
                                        : "text-slate-200"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-[11px] text-slate-400 font-medium">
                                • {t.date}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions: Tampil / Edit / Balas / Hapus */}
                        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                          {/* Tampil Toggle Button */}
                          <button
                            onClick={() => handleToggleTestiVisibility(t.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                              t.isVisible
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                            }`}
                          >
                            {t.isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            <span>{t.isVisible ? "Tampil" : "Sembunyi"}</span>
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => openEditTestiModal(t)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-all cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5 text-slate-500" />
                            <span>Edit</span>
                          </button>

                          {/* Balas Button */}
                          <button
                            onClick={() => openReplyModal(t)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all cursor-pointer"
                          >
                            <CornerDownRight className="w-3.5 h-3.5 text-rose-600" />
                            <span>{t.adminReply ? "Edit Balasan" : "Balas"}</span>
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteTesti(t.id)}
                            className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Hapus Testimoni"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Review Comment Body (No photo preview per user request) */}
                      <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed pl-1">
                        &ldquo;{t.comment}&rdquo;
                      </p>

                      {/* Admin Reply (if exists) */}
                      {t.adminReply && (
                        <div className="p-3.5 rounded-2xl bg-[#FFF5F8] border border-rose-200/80 space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-extrabold text-[#7A0620] flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-rose-600" />
                              <span>Admin Vexlyn</span>
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {t.adminReplyDate || "Baru saja"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 font-medium pl-3.5">
                            {t.adminReply}
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : activeTab === "blacklist" ? (
            /* ============================================================== */
            /* VIEW: DAFTAR BLACKLIST                                         */
            /* ============================================================== */
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                    Daftar Blacklist
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">
                    Daftar akun pelanggan yang diblokir karena indikasi penipuan atau penyalahgunaan
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => {
                      setBlacklistUserInput("");
                      setBlacklistWaInput("");
                      setBlacklistRobloxIdInput("");
                      setBlacklistReasonInput("Indikasi penipuan atau penyalahgunaan");
                      setIsBlacklistModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#7A0620] via-[#A11438] to-[#C41E3A] hover:from-[#8B0825] hover:to-[#D1203E] text-white text-xs sm:text-sm font-bold tracking-wide shadow-md shadow-rose-900/20 active:scale-95 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Tambah Blacklist</span>
                  </button>

                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 text-xs sm:text-sm font-bold transition-all shadow-2xs active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-rose-600" : ""}`}
                    />
                    <span>Refresh Data</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-3xl bg-white border border-rose-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari akun blacklist..."
                    value={blacklistSearchQuery}
                    onChange={(e) => setBlacklistSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 text-xs text-slate-800 rounded-full border border-slate-200 focus:bg-white focus:border-rose-400 focus:outline-hidden transition-all placeholder:text-slate-400"
                  />
                </div>

                <span className="text-xs font-bold text-slate-400">
                  Menampilkan {filteredBlacklist.length} akun blacklist
                </span>
              </div>

              <div className="space-y-3">
                {filteredBlacklist.length === 0 ? (
                  <div className="p-12 text-center bg-white rounded-3xl border border-rose-100 shadow-xs space-y-2">
                    <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto" />
                    <h3 className="text-sm font-bold text-slate-700">Tidak ada akun dalam daftar blacklist</h3>
                    <p className="text-xs text-slate-400">
                      Semua transaksi pelanggan saat ini aman dan terverifikasi.
                    </p>
                  </div>
                ) : (
                  filteredBlacklist.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 sm:p-5 rounded-3xl bg-white border border-rose-100 shadow-xs hover:border-rose-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base sm:text-lg font-black text-[#C41E3A]">
                            @{item.username}
                          </span>
                          <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 tracking-wider">
                            BLACKLISTED
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
                          <span className="text-slate-400">
                            ID:{" "}
                            <span className="font-semibold text-slate-600">
                              {item.robloxUserId || "Belum terdata"}
                            </span>
                          </span>
                          <span>•</span>
                          <span className="text-slate-400">
                            WA:{" "}
                            <span className="font-bold text-slate-700 font-mono">
                              {item.whatsapp}
                            </span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 sm:gap-6 justify-between sm:justify-end">
                        <div className="text-left sm:text-right">
                          <span className="text-xs font-bold text-slate-800 block">
                            {item.orderCount} Pesanan
                          </span>
                          <span className="text-xs font-black text-rose-700 block">
                            Total: Rp {formatRupiah(item.totalSpent)}
                          </span>
                        </div>

                        <button
                          onClick={() => handleUnblock(item.id)}
                          className="px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                        >
                          Buka Blokir
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : activeTab === "pelanggan" ? (
            /* ============================================================== */
            /* VIEW: DAFTAR PELANGGAN                                         */
            /* ============================================================== */
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                    Daftar Pelanggan
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">
                    Data pembeli yang otomatis diagregasi langsung dari transaksi real database
                  </p>
                </div>

                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="self-start sm:self-center flex items-center gap-2 px-4 py-2.5 rounded-full border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 text-xs sm:text-sm font-bold transition-all shadow-2xs active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-rose-600" : ""}`}
                  />
                  <span>Refresh Data</span>
                </button>
              </div>

              <div className="p-4 rounded-3xl bg-white border border-rose-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari username, ID Roblox, atau WhatsApp..."
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 text-xs text-slate-800 rounded-full border border-slate-200 focus:bg-white focus:border-rose-400 focus:outline-hidden transition-all placeholder:text-slate-400"
                  />
                </div>

                <span className="text-xs font-bold text-slate-400">
                  Menampilkan {filteredCustomers.length} pelanggan
                </span>
              </div>

              <div className="space-y-3">
                {filteredCustomers.length === 0 ? (
                  <div className="p-12 text-center bg-white rounded-3xl border border-rose-100 shadow-xs space-y-2">
                    <Users className="w-10 h-10 text-slate-300 mx-auto" />
                    <h3 className="text-sm font-bold text-slate-700">Tidak ada pelanggan ditemukan</h3>
                    <p className="text-xs text-slate-400">
                      Coba cari dengan kata kunci username, User ID, atau nomor WhatsApp lain.
                    </p>
                  </div>
                ) : (
                  filteredCustomers.map((cust) => (
                    <div
                      key={cust.id}
                      className="p-4 sm:p-5 rounded-3xl bg-white border border-rose-100 shadow-xs hover:border-rose-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base sm:text-lg font-black text-[#A11438]">
                            @{cust.username}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <UserCheck className="w-3 h-3 text-emerald-600" />
                            <span>AKTIF</span>
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
                          <span className="text-slate-400">
                            ID:{" "}
                            <span className="font-semibold text-slate-600">
                              {cust.robloxUserId || "-"}
                            </span>
                          </span>
                          <span>•</span>
                          <span className="text-slate-400">
                            WA:{" "}
                            <span className="font-bold text-slate-700 font-mono">
                              {cust.whatsappNumber}
                            </span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 sm:gap-6 justify-between sm:justify-end">
                        <div className="text-left sm:text-right">
                          <span className="text-xs font-semibold text-slate-400 block">
                            Total {cust.totalOrders}x order
                          </span>
                          <span className="text-base sm:text-lg font-black text-[#A11438] block">
                            Rp {formatRupiah(cust.totalSpent)}
                          </span>
                        </div>

                        <button
                          onClick={() => handleTriggerBlacklistFromCustomer(cust)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-rose-50/80 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                        >
                          <Ban className="w-3.5 h-3.5 text-rose-600" />
                          <span>Blacklist</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : activeTab === "keuangan" ? (
            /* ============================================================== */
            /* VIEW: KEUANGAN / RIWAYAT PEMBAYARAN                            */
            /* ============================================================== */
            <div className="space-y-6 animate-fadeIn">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    Riwayat Pembayaran
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">
                    Log mutasi kas masuk dan ringkasan pembayaran pesanan Robux yang berhasil
                  </p>
                </div>

                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-white border border-rose-200 text-rose-700 hover:bg-rose-50/60 font-bold text-xs sm:text-sm transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50 shrink-0 self-start sm:self-auto"
                >
                  <RefreshCw className={`w-4 h-4 text-rose-600 ${isRefreshing ? "animate-spin" : ""}`} />
                  <span>Refresh Data</span>
                </button>
              </div>

              {/* Top 3 Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. TOTAL DANA MASUK */}
                <div className="p-5 sm:p-6 rounded-3xl bg-white border border-rose-100 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <span className="text-[11px] font-black tracking-wider text-slate-400 uppercase">
                      TOTAL DANA MASUK
                    </span>
                    <div className="w-8 h-8 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-2xl sm:text-3xl font-black text-[#A11438] tracking-tight">
                      Rp 1.102.000
                    </div>
                    <p className="text-xs text-slate-400 mt-1 font-medium">
                      Dari 24 transaksi pembayaran lunas
                    </p>
                  </div>
                </div>

                {/* 2. TOTAL ROBUX TERJUAL */}
                <div className="p-5 sm:p-6 rounded-3xl bg-white border border-rose-100 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <span className="text-[11px] font-black tracking-wider text-slate-400 uppercase">
                      TOTAL ROBUX TERJUAL
                    </span>
                    <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center">
                      <Image
                        src="/robux.webp"
                        alt="Robux"
                        width={18}
                        height={18}
                        className="object-contain"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-2xl sm:text-3xl font-black text-amber-500 tracking-tight flex items-baseline gap-1.5">
                      57.400 <span className="text-sm sm:text-base font-extrabold text-amber-500">R$</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 font-medium">
                      Robux terkirim ke akun pelanggan
                    </p>
                  </div>
                </div>

                {/* 3. RATA-RATA ORDER */}
                <div className="p-5 sm:p-6 rounded-3xl bg-white border border-rose-100 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <span className="text-[11px] font-black tracking-wider text-slate-400 uppercase">
                      RATA-RATA ORDER
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[11px] font-black tracking-wide">
                      AOV
                    </span>
                  </div>
                  <div className="mt-4">
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      Rp 45.917
                    </div>
                    <p className="text-xs text-emerald-600 mt-1 font-semibold">
                      Average Order Value per transaksi
                    </p>
                  </div>
                </div>
              </div>

              {/* OMSET PER METODE PEMBAYARAN */}
              <div className="space-y-3">
                <div>
                  <h2 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">
                    OMSET PER METODE PEMBAYARAN
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">
                    Ringkasan total pemasukan berdasarkan metode pembayaran
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Card WEBSITE */}
                  <div className="p-5 sm:p-6 rounded-3xl bg-white border border-rose-100 shadow-xs space-y-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                          <Globe className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-black text-slate-900 tracking-wider">
                          WEBSITE
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100 text-xs font-black">
                        100.0%
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                          Total Omset
                        </span>
                        <span className="text-lg sm:text-xl font-black text-[#A11438]">
                          Rp 1.102.000
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                          Transaksi
                        </span>
                        <span className="text-base sm:text-lg font-black text-slate-900">
                          24 transaksi
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar 100% */}
                    <div className="w-full bg-rose-100/70 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-gradient-to-r from-[#7A0620] via-[#A11438] to-[#C41E3A] h-2.5 rounded-full w-full" />
                    </div>
                  </div>

                  {/* Card WHATSAPP */}
                  <div className="p-5 sm:p-6 rounded-3xl bg-white border border-rose-100 shadow-xs space-y-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                          <MessageCircle className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-black text-slate-900 tracking-wider">
                          WHATSAPP
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-xs font-black">
                        0.0%
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                          Total Omset
                        </span>
                        <span className="text-lg sm:text-xl font-black text-[#A11438]">
                          Rp 0
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                          Transaksi
                        </span>
                        <span className="text-base sm:text-lg font-black text-slate-900">
                          0 transaksi
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar 0% */}
                    <div className="w-full bg-emerald-50 rounded-full h-2.5 overflow-hidden border border-emerald-100/40">
                      <div className="bg-emerald-500 h-2.5 rounded-full w-0" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Log Mutasi Pembayaran Masuk */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white border border-rose-100 shadow-xs space-y-5">
                {/* Header with Title and Filter Tabs */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      Log Mutasi Pembayaran Masuk
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      Riwayat penerimaan pembayaran yang valid dan sudah lunas
                    </p>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 bg-slate-50/80 p-1 rounded-full border border-slate-200/80 self-start md:self-auto">
                    <button
                      onClick={() => setPaymentHistoryTab("semua")}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        paymentHistoryTab === "semua"
                          ? "bg-gradient-to-r from-[#7A0620] via-[#A11438] to-[#C41E3A] text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Semua ({mutations.length})
                    </button>
                    <button
                      onClick={() => setPaymentHistoryTab("website")}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        paymentHistoryTab === "website"
                          ? "bg-gradient-to-r from-[#7A0620] via-[#A11438] to-[#C41E3A] text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Website ({mutations.filter((m) => m.channel === "WEBSITE").length})
                    </button>
                    <button
                      onClick={() => setPaymentHistoryTab("whatsapp")}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        paymentHistoryTab === "whatsapp"
                          ? "bg-gradient-to-r from-[#7A0620] via-[#A11438] to-[#C41E3A] text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      WhatsApp ({mutations.filter((m) => m.channel === "WHATSAPP").length})
                    </button>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={paymentHistorySearch}
                    onChange={(e) => setPaymentHistorySearch(e.target.value)}
                    placeholder="Cari kode order atau username..."
                    className="w-full bg-white border border-slate-200 rounded-full pl-11 pr-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all shadow-2xs"
                  />
                  {paymentHistorySearch && (
                    <button
                      onClick={() => setPaymentHistorySearch("")}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Mutation List */}
                <div className="divide-y divide-slate-100">
                  {filteredMutations.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs sm:text-sm space-y-1">
                      <p className="font-semibold text-slate-600">Tidak ada data mutasi yang ditemukan</p>
                      <p className="text-slate-400 text-xs">Coba sesuaikan kata kunci pencarian atau tab filter di atas.</p>
                    </div>
                  ) : (
                    filteredMutations.map((item) => (
                      <div
                        key={item.id}
                        className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-rose-50/20 px-2 rounded-2xl transition-colors"
                      >
                        {/* Left Side */}
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-slate-900 text-sm tracking-tight">
                              #{item.orderNumber}
                            </span>
                            <span className="font-bold text-[#A11438] text-sm">
                              @{item.username}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-black uppercase tracking-wider">
                              LUNAS
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                                item.channel === "WEBSITE"
                                  ? "bg-rose-50 text-rose-600 border border-rose-200"
                                  : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                              }`}
                            >
                              {item.channel}
                            </span>
                            <span>•</span>
                            <span>{item.date}</span>
                          </div>
                        </div>

                        {/* Right Side */}
                        <div className="text-left sm:text-right space-y-0.5">
                          <div className="text-lg font-black text-emerald-600 tracking-tight">
                            +Rp {formatRupiah(item.amountRupiah)}
                          </div>
                          <div className="flex items-center sm:justify-end gap-1.5 text-xs font-bold text-amber-500">
                            <Image
                              src="/robux.webp"
                              alt="Robux"
                              width={14}
                              height={14}
                              className="object-contain inline-block"
                            />
                            <span>{formatRupiah(item.amountRobux)} Robux</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : activeTab === "pengaturan" ? (
            /* ============================================================== */
            /* VIEW: PENGATURAN TOKO & BANNER                                 */
            /* ============================================================== */
            <div className="space-y-6 animate-fadeIn">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    Pengaturan Toko & Banner
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">
                    Konfigurasi identitas toko, nomor WhatsApp CS, barcode QRIS, dan banner promo pelanggan langsung di Neon DB
                  </p>
                </div>

                <button
                  type="button"
                  onClick={toggleAllSections}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-white border border-rose-200 text-slate-700 hover:bg-rose-50/50 font-bold text-xs sm:text-sm transition-all shadow-xs cursor-pointer active:scale-95 shrink-0 self-start sm:self-auto"
                >
                  {areAllSectionsClosed ? (
                    <>
                      <ChevronDown className="w-4 h-4 text-rose-600" />
                      <span>Buka Semua Section</span>
                    </>
                  ) : (
                    <>
                      <ChevronUp className="w-4 h-4 text-rose-600" />
                      <span>Tutup Semua Section</span>
                    </>
                  )}
                </button>
              </div>

              {/* Hidden file inputs for uploads */}
              <input
                ref={qrisInputRef}
                type="file"
                accept="image/*"
                onChange={handleQrisUpload}
                className="hidden"
              />
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />

              {/* ============================================================ */}
              {/* SECTION 1: IDENTITAS TOKO & KONTAK                           */}
              {/* ============================================================ */}
              <div className="rounded-3xl bg-white border border-rose-100 shadow-xs overflow-hidden transition-all">
                {/* Header Accordion */}
                <div
                  onClick={() => setIsSection1Open(!isSection1Open)}
                  className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-rose-50/20 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-700 shrink-0">
                      <Store className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs sm:text-base font-black text-slate-900 uppercase tracking-wider">
                        IDENTITAS TOKO & KONTAK
                      </h3>
                      <p className="text-[11px] sm:text-xs text-slate-400 font-medium">
                        Nama toko di navbar pelanggan dan nomor WhatsApp CS
                      </p>
                    </div>
                  </div>

                  <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <span className="px-2.5 sm:px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] sm:text-xs font-bold border border-slate-200/60 shrink min-w-0 truncate">
                      <span className="sm:hidden">{storeName}</span>
                      <span className="hidden sm:inline">{storeName} • WA: {whatsappCs}</span>
                    </span>
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors shrink-0">
                      {isSection1Open ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Body Form */}
                {isSection1Open && (
                  <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-slate-100 space-y-5 animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 block">
                          Nama Toko (Navbar Pelanggan)
                        </label>
                        <input
                          type="text"
                          value={storeName}
                          onChange={(e) => setStoreName(e.target.value)}
                          placeholder="Contoh: Vexlyn.id"
                          className="w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all shadow-2xs"
                        />
                        <p className="text-[11px] text-slate-400">Tampil di navbar web utama.</p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 block">
                          Nomor WhatsApp Admin CS (Format 62...)
                        </label>
                        <input
                          type="text"
                          value={whatsappCs}
                          onChange={(e) => setWhatsappCs(e.target.value)}
                          placeholder="Contoh: 088230515875"
                          className="w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all shadow-2xs font-mono"
                        />
                        <p className="text-[11px] text-slate-400">
                          Tujuan konfirmasi order dan tombol bantuan CS pelanggan.
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => saveSettingsToDb({ store_name: storeName, whatsapp_cs: whatsappCs, whatsapp_url: `https://wa.me/${whatsappCs.replace(/^0/, "62")}` }, "Identitas & kontak toko berhasil disimpan!")}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#7A0620] via-[#A11438] to-[#C41E3A] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg cursor-pointer transition-all active:scale-95"
                      >
                        <Save className="w-4 h-4" />
                        <span>Simpan Identitas & Kontak</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ============================================================ */}
              {/* SECTION 2: PENGATURAN PROMO BANNER WEB PELANGGAN             */}
              {/* ============================================================ */}
              <div className="rounded-3xl bg-white border border-rose-100 shadow-xs overflow-hidden transition-all">
                {/* Header Accordion */}
                <div
                  onClick={() => setIsSection2Open(!isSection2Open)}
                  className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-rose-50/20 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-700 shrink-0">
                      <Flame className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs sm:text-base font-black text-slate-900 uppercase tracking-wider">
                        PENGATURAN PROMO BANNER WEB PELANGGAN
                      </h3>
                      <p className="text-[11px] sm:text-xs text-slate-400 font-medium">
                        Atur paket promo yang muncul pada banner hero bagian atas website toko
                      </p>
                    </div>
                  </div>

                  <div
                    className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="px-2.5 sm:px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-[11px] sm:text-xs font-bold border border-rose-200/60 shrink min-w-0 truncate">
                      <span className="sm:hidden">{promoIsActive ? "Promo Aktif" : "Nonaktif"}</span>
                      <span className="hidden sm:inline">{promoIsActive ? `Promo Aktif • ${promoPackage}` : "Promo Nonaktif"}</span>
                    </span>

                    <div className="flex items-center gap-2.5 shrink-0">
                      {/* Switch Toggle */}
                      <button
                        type="button"
                        onClick={() => {
                          setPromoIsActive(!promoIsActive);
                          showToast(`Banner promo kini ${!promoIsActive ? "Aktif" : "Nonaktif"}`);
                        }}
                        className={`w-11 sm:w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                          promoIsActive ? "bg-[#A11438]" : "bg-slate-300"
                        }`}
                        title={promoIsActive ? "Nonaktifkan Promo" : "Aktifkan Promo"}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                            promoIsActive ? "translate-x-5 sm:translate-x-6" : "translate-x-0"
                          }`}
                        />
                      </button>

                      <div
                        onClick={() => setIsSection2Open(!isSection2Open)}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors cursor-pointer shrink-0"
                      >
                        {isSection2Open ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Body Form */}
                {isSection2Open && (
                  <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-slate-100 space-y-5 animate-fadeIn">
                    {/* Paket Promo Highlight (Dari Database Produk Lengkap) */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 block">
                        Paket Promo Highlight (Pilih dari Database)
                      </label>
                      <select
                        value={promoPackage}
                        onChange={(e) => setPromoPackage(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all cursor-pointer shadow-2xs"
                      >
                        {packages && packages.length > 0 ? (
                          packages
                            .filter((pkg) => pkg.isActive !== false)
                            .map((pkg) => {
                              const val = `${pkg.amount.toLocaleString("id-ID")} Robux (Rp ${pkg.price.toLocaleString("id-ID")})`;
                              return (
                                <option key={pkg.id} value={val}>
                                  {pkg.amount.toLocaleString("id-ID")} Robux (Rp {pkg.price.toLocaleString("id-ID")})
                                </option>
                              );
                            })
                        ) : (
                          <>
                            <option value="1.800 Robux (Rp 35.000)">1.800 Robux (Rp 35.000)</option>
                            <option value="2.200 Robux (Rp 45.000)">2.200 Robux (Rp 45.000)</option>
                            <option value="2.700 Robux (Rp 50.000)">2.700 Robux (Rp 50.000)</option>
                            <option value="3.200 Robux (Rp 60.000)">3.200 Robux (Rp 60.000)</option>
                            <option value="3.700 Robux (Rp 70.000)">3.700 Robux (Rp 70.000)</option>
                            <option value="4.200 Robux (Rp 80.000)">4.200 Robux (Rp 80.000)</option>
                            <option value="4.300 Robux (Rp 90.000)">4.300 Robux (Rp 90.000)</option>
                            <option value="5.500 Robux (Rp 100.000)">5.500 Robux (Rp 100.000)</option>
                            <option value="11.500 Robux (Rp 200.000)">11.500 Robux (Rp 200.000)</option>
                            <option value="15.500 Robux (Rp 300.000)">15.500 Robux (Rp 300.000)</option>
                            <option value="20.500 Robux (Rp 400.000)">20.500 Robux (Rp 400.000)</option>
                            <option value="30.500 Robux (Rp 500.000)">30.500 Robux (Rp 500.000)</option>
                            <option value="99.999 Robux (Rp 999.999)">99.999 Robux (Rp 999.999)</option>
                          </>
                        )}
                      </select>

                      {/* Live Badge Preview */}
                      <div className="flex items-center gap-2 pt-1 text-xs">
                        <span className="text-slate-500 font-semibold text-[11px]">Tampilan Badge di Web:</span>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-bold shadow-2xs">
                          <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>FLASH SALE</span>
                          <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-rose-600 to-red-600 text-white font-extrabold text-[10px] shadow-xs">
                            {formatPromoBadge(promoPackage)}
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Otomatis memuat seluruh daftar paket resmi &amp; paket baru dari Neon Database (terurut harga termurah ke termahal).
                      </p>
                    </div>

                    {/* Waktu Berakhir Promo (Countdown Timer) */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">
                        Waktu Berakhir Promo (Countdown Timer)
                      </label>
                      <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border border-rose-100 flex items-center justify-center text-rose-600 shadow-2xs shrink-0">
                            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs sm:text-sm font-black text-slate-900 block truncate">
                              {promoEndDate} • {promoEndTime}
                            </span>
                            <span className="text-[10px] sm:text-[11px] text-slate-400 block truncate">
                              Klik tombol untuk mengatur hitung mundur
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setIsCountdownModalOpen(true)}
                          className="px-4 sm:px-5 py-2 rounded-xl bg-gradient-to-r from-[#7A0620] via-[#A11438] to-[#C41E3A] text-white text-xs font-black uppercase tracking-wider shadow-xs hover:shadow-md cursor-pointer transition-all active:scale-95 shrink-0"
                        >
                          ATUR
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => saveSettingsToDb({ promo_package: promoPackage, promo_end_date: `${promoEndDate} ${promoEndTime}` }, "Pengaturan promo banner berhasil disimpan!")}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#7A0620] via-[#A11438] to-[#C41E3A] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg cursor-pointer transition-all active:scale-95"
                      >
                        <Save className="w-4 h-4" />
                        <span>Simpan Pengaturan Promo</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ============================================================ */}
              {/* SECTION 3: BARCODE QRIS & LOGO TOKO                          */}
              {/* ============================================================ */}
              <div className="rounded-3xl bg-white border border-rose-100 shadow-xs overflow-hidden transition-all">
                {/* Header Accordion */}
                <div
                  onClick={() => setIsSection3Open(!isSection3Open)}
                  className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-rose-50/20 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-700 shrink-0">
                      <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs sm:text-base font-black text-slate-900 uppercase tracking-wider">
                        BARCODE QRIS & LOGO TOKO
                      </h3>
                      <p className="text-[11px] sm:text-xs text-slate-400 font-medium">
                        Barcode pembayaran QRIS otomatis dan logo storefront toko
                      </p>
                    </div>
                  </div>

                  <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <span className="px-2.5 sm:px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] sm:text-xs font-bold border border-slate-200/60 shrink min-w-0 truncate">
                      <span className="sm:hidden">QRIS & Logo Aktif</span>
                      <span className="hidden sm:inline">QRIS: Terpasang • Logo: Terpasang</span>
                    </span>
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors shrink-0">
                      {isSection3Open ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Body Content */}
                {isSection3Open && (
                  <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-slate-100 space-y-5 animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Card 1: Barcode QRIS */}
                      <div className="p-5 rounded-3xl bg-slate-50/60 border border-slate-200/80 space-y-4 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm font-black text-slate-900">
                              Status Barcode QRIS
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-black uppercase tracking-wider">
                              ✓ Terpasang
                            </span>
                          </div>
                          <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                            NMID: {qrisNmid}
                          </p>
                        </div>

                        {/* QRIS Preview Box */}
                        <div
                          onClick={() => {
                            if (qrisImage) {
                              setEnlargedImage({
                                url: qrisImage,
                                title: "Barcode QRIS Standar Indonesia",
                              });
                            }
                          }}
                          className="group relative flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-200 hover:border-rose-300 transition-all cursor-pointer shadow-2xs"
                        >
                          <div className="w-32 h-40 bg-white rounded-xl border border-slate-100 p-2 flex flex-col items-center justify-center shadow-xs relative overflow-hidden">
                            {qrisImage ? (
                              <div className="relative w-full h-full">
                                <Image
                                  src={qrisImage}
                                  alt="Barcode QRIS"
                                  fill
                                  className="object-contain"
                                />
                              </div>
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-between">
                                <div className="w-full bg-[#E51B24] rounded-t py-1 text-center text-white text-[9px] font-black tracking-widest">
                                  QRIS
                                </div>
                                <div className="w-20 h-20 relative flex items-center justify-center p-1 bg-slate-50 rounded">
                                  <QrCode className="w-16 h-16 text-slate-900 group-hover:scale-105 transition-transform" />
                                </div>
                                <div className="text-[8px] font-mono text-slate-400 text-center">
                                  {qrisNmid}
                                </div>
                              </div>
                            )}
                          </div>

                          <span className="text-[11px] font-medium text-slate-400 mt-2.5 group-hover:text-rose-600 transition-colors">
                            {qrisImage ? "Klik gambar untuk memperbesar QRIS" : "Belum ada barcode QRIS kustom"}
                          </span>
                        </div>

                        {/* Button Ganti QRIS */}
                        <button
                          type="button"
                          disabled={isUploadingQris}
                          onClick={() => qrisInputRef.current?.click()}
                          className="w-full py-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-rose-50/50 hover:border-rose-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer active:scale-98 disabled:opacity-60"
                        >
                          {isUploadingQris ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
                              <span>Mengunggah Barcode QRIS...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 text-slate-500" />
                              <span>Ganti Barcode QRIS</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Card 2: Logo Storefront */}
                      <div className="p-5 rounded-3xl bg-slate-50/60 border border-slate-200/80 space-y-4 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm font-black text-slate-900">
                              Status Logo Storefront
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-black uppercase tracking-wider">
                              ✓ Terpasang
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Logo kustom (tersimpan di database)
                          </p>
                        </div>

                        {/* Logo Preview Box */}
                        <div
                          onClick={() =>
                            setEnlargedImage({
                              url: logoImage,
                              title: "Logo Storefront Vexlyn",
                            })
                          }
                          className="group relative flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-200 hover:border-rose-300 transition-all cursor-pointer shadow-2xs"
                        >
                          <div className="w-32 h-40 flex items-center justify-center p-2">
                            <div className="relative w-28 h-28 rounded-2xl overflow-hidden border border-slate-200 shadow-sm group-hover:scale-105 transition-transform bg-black">
                              <Image
                                src={logoImage}
                                alt="Logo Storefront"
                                fill
                                className="object-cover"
                              />
                            </div>
                          </div>

                          <span className="text-[11px] font-medium text-slate-400 mt-2.5 group-hover:text-rose-600 transition-colors">
                            Klik gambar untuk memperbesar Logo
                          </span>
                        </div>

                        {/* Button Ganti Logo */}
                        <button
                          type="button"
                          disabled={isUploadingLogo}
                          onClick={() => logoInputRef.current?.click()}
                          className="w-full py-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-rose-50/50 hover:border-rose-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer active:scale-98 disabled:opacity-60"
                        >
                          {isUploadingLogo ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
                              <span>Mengunggah Logo...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 text-slate-500" />
                              <span>Ganti Logo Storefront</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => showToast("Barcode QRIS dan logo storefront berhasil disimpan!")}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#7A0620] via-[#A11438] to-[#C41E3A] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg cursor-pointer transition-all active:scale-95"
                      >
                        <Save className="w-4 h-4" />
                        <span>Simpan QRIS & Logo</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ============================================================== */
            /* VIEW: ORDER MANAGEMENT LIST (Order Masuk / Diproses / ...)     */
            /* ============================================================== */
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                    {activeTab === "order-masuk"
                      ? "Order Masuk"
                      : activeTab === "order-diproses"
                      ? "Order Diproses"
                      : activeTab === "order-selesai"
                      ? "Order Selesai"
                      : "Order Dibatalkan"}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">
                    {activeTab === "order-masuk"
                      ? "Kelola dan proses seluruh pesanan Robux baru yang masuk ke Vexlyn"
                      : activeTab === "order-diproses"
                      ? "Daftar pesanan Robux yang sedang dalam antrean pengiriman"
                      : activeTab === "order-selesai"
                      ? "Riwayat pesanan Robux yang telah berhasil dikirim ke akun pelanggan"
                      : "Daftar pesanan Robux yang dibatalkan"}
                  </p>
                </div>

                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="self-start sm:self-center flex items-center gap-2 px-4 py-2 rounded-full border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-rose-600" : ""}`}
                  />
                  <span>Refresh Data</span>
                </button>
              </div>

              {/* Filter Bar & Count */}
              <div className="p-4 rounded-3xl bg-white border border-rose-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filter order atau username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 text-xs text-slate-800 rounded-full border border-slate-200 focus:bg-white focus:border-rose-400 focus:outline-hidden transition-all placeholder:text-slate-400"
                  />
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
                  <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-full border border-slate-200">
                    <button
                      onClick={() => setPaymentFilter("ALL")}
                      className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                        paymentFilter === "ALL"
                          ? "bg-white text-rose-800 shadow-2xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Semua
                    </button>
                    <button
                      onClick={() => setPaymentFilter("WHATSAPP")}
                      className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                        paymentFilter === "WHATSAPP"
                          ? "bg-white text-rose-800 shadow-2xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      WhatsApp
                    </button>
                    <button
                      onClick={() => setPaymentFilter("QRIS")}
                      className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                        paymentFilter === "QRIS"
                          ? "bg-white text-rose-800 shadow-2xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      QRIS
                    </button>
                  </div>

                  <span className="text-xs font-bold text-slate-400">
                    Menampilkan{" "}
                    {activeTab === "order-masuk" ? counts.masuk : filteredOrders.length} pesanan
                  </span>
                </div>
              </div>

              {/* Order Cards List */}
              <div className="space-y-3">
                {filteredOrders.length === 0 ? (
                  <div className="p-12 text-center bg-white rounded-3xl border border-rose-100 shadow-xs space-y-2">
                    <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
                    <h3 className="text-sm font-bold text-slate-700">Tidak ada pesanan ditemukan</h3>
                    <p className="text-xs text-slate-400">
                      Coba ubah kata kunci pencarian atau filter metode pembayaran.
                    </p>
                  </div>
                ) : (
                  filteredOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-4 sm:p-5 rounded-3xl bg-white border border-rose-100 shadow-xs hover:border-rose-200 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm sm:text-base font-black text-rose-700">
                            #{ord.orderNumber}
                          </span>
                          <span
                            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                              ord.status === "menunggu"
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : ord.status === "diproses"
                                ? "bg-blue-50 text-blue-800 border-blue-200"
                                : ord.status === "selesai"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-rose-50 text-rose-800 border-rose-200"
                            }`}
                          >
                            {ord.status === "menunggu"
                              ? "Menunggu Bayar"
                              : ord.status === "diproses"
                              ? "Diproses"
                              : ord.status === "selesai"
                              ? "Selesai"
                              : "Dibatalkan"}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
                          <span className="font-bold text-slate-800">@{ord.username}</span>
                          <span>•</span>
                          <span>
                            {ord.date}, {ord.time}
                          </span>
                          <span>•</span>
                          <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {ord.paymentMethod}
                          </span>
                          <span>•</span>
                          {ord.hasProofPhoto ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Ada Bukti Foto</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                              <span>Tanpa Foto</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center shrink-0">
                          <Image
                            src="/robux.webp"
                            alt="Robux"
                            width={20}
                            height={20}
                            className="object-contain"
                          />
                        </div>
                        <div>
                          <span className="text-xs sm:text-sm font-black text-slate-900 block">
                            {ord.amount.toLocaleString("id-ID")} Robux
                          </span>
                          <span className="text-xs sm:text-sm font-black text-rose-700">
                            Rp {formatRupiah(ord.price)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                        {ord.status === "menunggu" && (
                          <button
                            onClick={() => updateOrderStatus(ord.id, "diproses")}
                            className="px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold hover:bg-blue-100 transition-colors cursor-pointer"
                          >
                            Proses
                          </button>
                        )}
                        {ord.status === "diproses" && (
                          <button
                            onClick={() => updateOrderStatus(ord.id, "selesai")}
                            className="px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
                          >
                            Selesaikan
                          </button>
                        )}
                        {ord.status === "selesai" && (
                          ord.isReviewed ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Sudah Diulas</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSendReviewLink(ord)}
                              disabled={isGeneratingReviewLink === ord.id}
                              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 text-emerald-800 border border-emerald-300 text-xs font-black transition-all shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
                              title="Kirim link ulasan rating 1x pakai via WhatsApp ke customer"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />
                              <span>
                                {isGeneratingReviewLink === ord.id ? "Membuat Link..." : "Kirim Link WA"}
                              </span>
                            </button>
                          )
                        )}
                        <button
                          onClick={() => openOrderDetail(ord.id)}
                          className="flex items-center gap-1 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#7A0620] via-[#A11438] to-[#C41E3A] text-white text-xs font-bold hover:opacity-95 shadow-2xs transition-all cursor-pointer"
                        >
                          <span>Detail</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* =================================================================== */}
      {/* MODAL: TAMBAH / EDIT NOMINAL ROBUX                                  */}
      {/* =================================================================== */}
      {isPackageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-rose-100 shadow-2xl w-full max-w-md p-6 sm:p-7 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                {editingPackageId !== null ? "Edit Nominal Robux" : "Tambah Nominal Robux"}
              </h3>
              <button
                onClick={() => setIsPackageModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePackage} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                  <span>Nominal Robux</span>
                  <Image
                    src="/robux.webp"
                    alt="Robux"
                    width={14}
                    height={14}
                    className="object-contain"
                  />
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="1.000"
                    value={packageAmountInput}
                    onChange={(e) => setPackageAmountInput(e.target.value)}
                    className="w-full pr-12 pl-4 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-rose-400 rounded-2xl text-sm font-black text-slate-900 focus:outline-hidden transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    R$
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">
                  Harga Jual (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-rose-600">
                    Rp
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="20.000"
                    value={packagePriceInput}
                    onChange={(e) => setPackagePriceInput(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-rose-400 rounded-2xl text-sm font-black text-slate-900 focus:outline-hidden transition-all"
                  />
                </div>
              </div>

              {/* Info Label Otomatis */}
              <div className="p-3 rounded-2xl bg-rose-50/60 border border-rose-100 space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 font-extrabold text-slate-800">
                  <Zap className="w-3.5 h-3.5 text-[#C41E3A]" />
                  <span>Sistem Label Otomatis</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Badge nominal ditentukan otomatis oleh sistem: <strong className="text-purple-700">Populer</strong> (penjualan terbanyak), <strong className="text-rose-700">Promo</strong> (diatur di Pengaturan Toko), dan <strong className="text-amber-700">Sultan</strong> (nominal di atas 10.000 Robux).
                </p>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2.5 text-xs font-bold text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={packageIsActiveInput}
                    onChange={(e) => setPackageIsActiveInput(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 cursor-pointer accent-rose-600"
                  />
                  <span>Nominal Aktif & Ditampilkan di Web</span>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPackageModalOpen(false)}
                  className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#7A0620] via-[#A11438] to-[#C41E3A] hover:from-[#8B0825] hover:to-[#D1203E] text-white text-xs font-bold tracking-wide shadow-md shadow-rose-900/20 active:scale-95 transition-all cursor-pointer"
                >
                  Simpan Nominal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: TAMBAH KE BLACKLIST                                          */}
      {/* =================================================================== */}
      {isBlacklistModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-rose-100 shadow-2xl w-full max-w-md p-6 sm:p-7 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  Tambah ke Blacklist
                </h3>
              </div>
              <button
                onClick={() => setIsBlacklistModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBlacklist} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">
                  Username Roblox <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                    @
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Perusuh"
                    value={blacklistUserInput}
                    onChange={(e) => setBlacklistUserInput(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-rose-400 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-hidden transition-all placeholder:text-slate-400 placeholder:font-normal"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">
                  Nomor WhatsApp (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 08123456789"
                  value={blacklistWaInput}
                  onChange={(e) => setBlacklistWaInput(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-rose-400 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-hidden transition-all placeholder:text-slate-400 placeholder:font-normal"
                />
                <p className="text-[10px] text-slate-400 font-medium">
                  Jika diisi, nomor ini akan otomatis dicegah saat checkout pesanan.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">
                  Roblox User ID (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 123456789"
                  value={blacklistRobloxIdInput}
                  onChange={(e) => setBlacklistRobloxIdInput(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-rose-400 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-hidden transition-all placeholder:text-slate-400 placeholder:font-normal"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">
                  Alasan Blokir <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Indikasi penipuan atau penyalahgunaan"
                  value={blacklistReasonInput}
                  onChange={(e) => setBlacklistReasonInput(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-rose-400 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-hidden transition-all"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBlacklistModalOpen(false)}
                  className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#7A0620] via-[#A11438] to-[#C41E3A] hover:from-[#8B0825] hover:to-[#D1203E] text-white text-xs font-bold tracking-wide shadow-md shadow-rose-900/20 active:scale-95 transition-all cursor-pointer"
                >
                  Blokir Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: TAMBAH / EDIT TESTIMONI (No Photo Upload per user request)   */}
      {/* =================================================================== */}
      {isTestiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-rose-100 shadow-2xl w-full max-w-md p-6 sm:p-7 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                {editingTestiId ? "Edit Testimoni" : "Tambah Testimoni Baru"}
              </h3>
              <button
                onClick={() => setIsTestiModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTestimonial} className="space-y-4">
              {/* Username Roblox */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">
                  Username Roblox <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                    @
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: APG_Channel11"
                    value={testiUserInput}
                    onChange={(e) => setTestiUserInput(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-rose-400 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-hidden transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Rating Kepuasan */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">
                  Rating Kepuasan (1 - 5 Bintang)
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 p-2 rounded-2xl bg-slate-50 border border-slate-200">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setTestiRatingInput(star)}
                        className="p-1 rounded-lg hover:bg-white transition-colors cursor-pointer"
                      >
                        <Star
                          className={`w-6 h-6 transition-colors ${
                            star <= testiRatingInput
                              ? "text-amber-400 fill-amber-400"
                              : "text-slate-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-black text-slate-700">
                    {testiRatingInput} Bintang
                  </span>
                </div>
              </div>

              {/* Isi Ulasan Testimoni */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">
                  Isi Ulasan Testimoni <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Tuliskan pengalaman / ulasan kepuasan pembeli..."
                  value={testiCommentInput}
                  onChange={(e) => setTestiCommentInput(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-rose-400 rounded-2xl text-xs sm:text-sm text-slate-800 focus:outline-hidden transition-all"
                />
              </div>

              {/* Paket Robux / Kode Order */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">
                  Paket Robux / Kode Order (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: +2.700 Robux atau #VEX15449734"
                  value={testiPackageInput}
                  onChange={(e) => setTestiPackageInput(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-rose-400 rounded-2xl text-xs sm:text-sm text-slate-800 font-medium focus:outline-hidden transition-all"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTestiModalOpen(false)}
                  className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#7A0620] via-[#A11438] to-[#C41E3A] hover:from-[#8B0825] hover:to-[#D1203E] text-white text-xs font-bold tracking-wide shadow-md shadow-rose-900/20 active:scale-95 transition-all cursor-pointer"
                >
                  {editingTestiId ? "Simpan Perubahan" : "Tambah Testimoni"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: BALAS TESTIMONI                                              */}
      {/* =================================================================== */}
      {isReplyModalOpen && replyingTesti && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-rose-100 shadow-2xl w-full max-w-md p-6 sm:p-7 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  Balas Ulasan
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Membalas ulasan dari @{replyingTesti.username}
                </p>
              </div>
              <button
                onClick={() => setIsReplyModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Testimonial Quote */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 italic">
              &ldquo;{replyingTesti.comment}&rdquo;
            </div>

            <form onSubmit={handleSaveReply} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700">
                  Balasan Admin Vexlyn
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Tuliskan respon resmi dari Admin Vexlyn..."
                  value={replyTextInput}
                  onChange={(e) => setReplyTextInput(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-rose-400 rounded-2xl text-xs sm:text-sm text-slate-800 focus:outline-hidden transition-all"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">
                  Template Balasan Cepat:
                </span>
                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setReplyTextInput("Terima kasih banyak sudah belanja di Vexlyn kak! Ditunggu orderan berikutnya ya 🙏")
                    }
                    className="text-left text-[11px] p-2 rounded-xl bg-rose-50/60 hover:bg-rose-100/70 text-rose-800 border border-rose-200 transition-colors cursor-pointer"
                  >
                    💬 &ldquo;Terima kasih banyak sudah belanja di Vexlyn kak! Ditunggu orderan berikutnya ya 🙏&rdquo;
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setReplyTextInput("Mohon maaf atas keterlambatan pengirimannya ya kak, kami akan terus tingkatkan kecepatan kami!")
                    }
                    className="text-left text-[11px] p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                  >
                    💬 &ldquo;Mohon maaf atas keterlambatan pengirimannya ya kak...&rdquo;
                  </button>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsReplyModalOpen(false)}
                  className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#7A0620] via-[#A11438] to-[#C41E3A] hover:from-[#8B0825] hover:to-[#D1203E] text-white text-xs font-bold tracking-wide shadow-md shadow-rose-900/20 active:scale-95 transition-all cursor-pointer"
                >
                  Kirim Balasan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Countdown Timer Promo (Screenshot 3) */}
      {isCountdownModalOpen && (
        <div
          onClick={() => setIsCountdownModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-rose-100 space-y-5 animate-scaleUp text-slate-900"
          >
            {/* Quick Preset Pills */}
            <div className="flex items-center justify-between gap-1.5 flex-wrap">
              {[
                { label: "+3 Hari", day: 14 },
                { label: "+7 Hari", day: 18 },
                { label: "+14 Hari", day: 25 },
                { label: "Akhir Bulan", day: 31 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setCountdownDay(preset.day);
                    setActivePreset(preset.label);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    activePreset === preset.label
                      ? "bg-gradient-to-r from-[#7A0620] via-[#A11438] to-[#C41E3A] text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Month Year Header */}
            <div className="flex items-center justify-between font-black text-sm text-slate-900 pt-1">
              <span>{countdownMonth} {countdownYear}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div>
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400 mb-2">
                <span className="text-rose-500">Min</span>
                <span>Sen</span>
                <span>Sel</span>
                <span>Rab</span>
                <span>Kam</span>
                <span>Jum</span>
                <span>Sab</span>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold">
                {/* Previous month days: 27, 28, 29, 30 */}
                {[27, 28, 29, 30].map((d) => (
                  <span key={`prev-${d}`} className="py-2 text-slate-300">
                    {d}
                  </span>
                ))}

                {/* Current month days: 1 to 31 */}
                {Array.from({ length: 31 }).map((_, i) => {
                  const dayNum = i + 1;
                  const isSelected = countdownDay === dayNum;
                  const isSunday = (i + 4) % 7 === 0;

                  return (
                    <button
                      key={dayNum}
                      type="button"
                      onClick={() => {
                        setCountdownDay(dayNum);
                        setActivePreset("");
                      }}
                      className={`py-2 rounded-full transition-all cursor-pointer flex items-center justify-center font-bold ${
                        isSelected
                          ? "bg-gradient-to-r from-[#7A0620] to-[#C41E3A] text-white shadow-xs font-black"
                          : isSunday
                          ? "text-rose-500 hover:bg-rose-50"
                          : "text-slate-800 hover:bg-slate-100"
                      }`}
                    >
                      {dayNum}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Picker Section */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>Atur Jam & Menit Berakhir</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100 text-xs font-black">
                  {countdownHour}:{countdownMinute} WIB
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Jam (00 - 23)
                  </label>
                  <select
                    value={countdownHour}
                    onChange={(e) => setCountdownHour(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-rose-400 cursor-pointer"
                  >
                    {Array.from({ length: 24 }).map((_, i) => {
                      const h = i.toString().padStart(2, "0");
                      return (
                        <option key={h} value={h}>
                          {h} : 00
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Menit (00 - 59)
                  </label>
                  <select
                    value={countdownMinute}
                    onChange={(e) => setCountdownMinute(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-rose-400 cursor-pointer"
                  >
                    {Array.from({ length: 60 }).map((_, i) => {
                      const m = i.toString().padStart(2, "0");
                      return (
                        <option key={m} value={m}>
                          Menit {m}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={() => {
                setPromoEndDate(`${countdownDay} ${countdownMonth} ${countdownYear}`);
                setPromoEndTime(`${countdownHour}:${countdownMinute} WIB`);
                setIsCountdownModalOpen(false);
                showToast("Waktu berakhir promo berhasil diterapkan!");
              }}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#7A0620] via-[#A11438] to-[#C41E3A] text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <Check className="w-4 h-4" />
              <span>Terapkan Waktu Promo</span>
            </button>
          </div>
        </div>
      )}

      {/* Lightbox / Zoom Modal for QRIS and Logo */}
      {enlargedImage && (
        <div
          onClick={() => setEnlargedImage(null)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-rose-100 space-y-4 animate-scaleUp text-slate-900"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-black text-slate-900 text-sm tracking-tight">
                {enlargedImage.title}
              </h4>
              <button
                type="button"
                onClick={() => setEnlargedImage(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="relative w-64 h-64 rounded-xl overflow-hidden shadow-xs bg-black flex items-center justify-center">
                <Image
                  src={enlargedImage.url}
                  alt={enlargedImage.title}
                  fill
                  className="object-contain"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setEnlargedImage(null)}
              className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              Tutup Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
