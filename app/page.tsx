"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  ShieldCheck,
  Zap,
  Clock,
  Users,
  CheckCircle2,
  Check,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  HelpCircle,
  ArrowRight,
  Sparkles,
  QrCode,
  X,
  Flame,
  Award,
  Globe,
  Star,
  ChevronLeft,
  ChevronRight,
  Crown,
  Menu,
  Wallet,
  Upload,
  Trash2,
  FileCheck,
} from "lucide-react";
import { compressImageToWebP } from "@/lib/image-compressor";

interface RobuxPackage {
  id: number;
  amount: number;
  price: number;
  promo?: boolean;
  bestSeller?: boolean;
  vip?: boolean;
  tag?: string;
}

// Exactly matches the client's official pricelist flyer
const ALL_PACKAGES: RobuxPackage[] = [
  { id: 1, amount: 1800, price: 35000, tag: "35K" },
  { id: 2, amount: 2200, price: 45000, tag: "45K" },
  { id: 3, amount: 2700, price: 50000, promo: true, bestSeller: true, tag: "50K" },
  { id: 4, amount: 3200, price: 60000, tag: "60K" },
  { id: 5, amount: 3700, price: 70000, bestSeller: true, tag: "70K" },
  { id: 6, amount: 4200, price: 80000, tag: "80K" },
  { id: 7, amount: 4300, price: 90000, tag: "90K" },
  { id: 8, amount: 5500, price: 100000, tag: "100K" },
  { id: 9, amount: 11500, price: 200000, vip: true, tag: "200K" },
  { id: 10, amount: 15500, price: 300000, vip: true, tag: "300K" },
  { id: 11, amount: 20500, price: 400000, vip: true, tag: "400K" },
  { id: 12, amount: 30500, price: 500000, vip: true, tag: "500K" },
];

const TESTIMONIALS = [
  {
    id: 1,
    name: "Rizky_Gamer",
    handle: "@rizkygaming",
    stars: 5,
    quote: "“Gila cepet banget! Baru scan QRIS ga sampe 2 menit Robux langsung masuk. Tanpa password aman bgt!”",
    package: "+4.200 Robux",
    date: "15 Okt",
  },
  {
    id: 2,
    name: "DimasPratama",
    handle: "@dimas_rbx",
    stars: 5,
    quote: "“Harga paling murah se-Indonesia. Admin WhatsApp juga ramah dan fast respon pas nanya-nanya.”",
    package: "+2.200 Robux",
    date: "15 Okt",
  },
  {
    id: 3,
    name: "Nabila_S",
    handle: "@nabilaplay",
    stars: 5,
    quote: "“Udah langganan beli Robux di Vexlyn. Murah dan anti banned karena sistem resmi grup payout!”",
    package: "+2.700 Robux",
    date: "14 Okt",
  },
  {
    id: 4,
    name: "Aldo_Vip",
    handle: "@aldoroblox",
    stars: 5,
    quote: "“Order paket 30.500 Robux diproses kilat. Terbaik pokoknya Vexlyn!”",
    package: "+30.500 Robux",
    date: "14 Okt",
  },
];

const FAQ_ITEMS = [
  {
    q: "Kenapa harga Robux di Vexlyn jauh lebih murah?",
    a: "Kami bekerja sama langsung melalui program developer exchange resmi dan jalur volume partner tanpa potongan biaya toko aplikasi hingga 30%, sehingga kami bisa memberikan harga grosir termurah langsung dalam Rupiah.",
  },
  {
    q: "Apakah butuh password atau email akun Roblox saya?",
    a: "SAMA SEKALI TIDAK! Kami hanya membutuhkan Username publik Roblox kamu. Kami tidak pernah meminta password, PIN, kode OTP, ataupun data cookie akun.",
  },
  {
    q: "Berapa lama proses pengiriman Robux setelah bayar?",
    a: "Sistem otomatis kami memproses transfer Robux hanya dalam waktu 1 hingga 5 menit setelah verifikasi pembayaran berhasil.",
  },
  {
    q: "Metode pembayaran apa saja yang didukung?",
    a: "Kami mendukung 2 metode utama: Via Website (QRIS otomatis untuk semua e-wallet seperti DANA, GoPay, OVO, ShopeePay & M-Banking BCA, Mandiri, BRI, BNI), serta Via WhatsApp untuk transaksi langsung dengan CS Admin.",
  },
  {
    q: "Apakah aman dari sanksi atau banned Roblox?",
    a: "100% aman dan legal! Semua pengiriman menggunakan metode resmi developer payout & group transfer yang telah terbukti 0% risiko ban pada lebih dari 10.000+ pesanan.",
  },
];

const FEATURE_ITEMS = [
  {
    id: 1,
    type: "wallet",
    title: "Harga Lebih Hemat",
    desc: "Harga grosir mulai 35K",
  },
  {
    id: 2,
    type: "shield",
    title: "100% Aman & Legal",
    desc: "Tanpa butuh password",
  },
  {
    id: 3,
    type: "zap",
    title: "Proses Instan",
    desc: "1–3 menit langsung masuk",
  },
  {
    id: 4,
    type: "chat",
    title: "CS WhatsApp 24 Jam",
    desc: "Fast respon siap bantu",
  },
];

function renderFeatureIcon(type: string) {
  if (type === "wallet") {
    return (
      <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-600 shrink-0">
        <Wallet className="w-5 h-5 stroke-[2.2]" />
      </div>
    );
  }

  if (type === "shield") {
    return (
      <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shrink-0">
        <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
      </div>
    );
  }

  if (type === "zap") {
    return (
      <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 shrink-0">
        <Zap className="w-5 h-5 stroke-[2.2]" />
      </div>
    );
  }

  return (
    <div className="w-10 h-10 rounded-full bg-teal-50 border border-teal-200/80 flex items-center justify-center text-teal-600 shrink-0">
      <MessageCircle className="w-5 h-5 stroke-[2.2]" />
    </div>
  );
}

interface RobloxUserData {
  id: number;
  name: string;
  displayName: string;
  avatarUrl: string;
  hasVerifiedBadge?: boolean;
}

interface StoreSettings {
  store_name: string;
  whatsapp_cs: string;
  whatsapp_url: string;
  qris_nmid: string;
  promo_headline: string;
  promo_description: string;
  promo_package: string;
  logo_image?: string;
  qris_image?: string;
}

const DEFAULT_STORE_SETTINGS: StoreSettings = {
  store_name: "Vexlyn ID a",
  whatsapp_cs: "088230515875",
  whatsapp_url: "https://wa.me/6288230515875",
  qris_nmid: "ID102003881023",
  promo_headline: "PROMO SPESIAL AKHIR PEKAN",
  promo_description: "Dapatkan bonus Robux hingga 20% untuk setiap pembelian minimal 2.700 Robux.",
  promo_package: "+2.700 Robux",
};

export default function Home() {
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);

  // Helper untuk WhatsApp Number & Link Dinamis
  const getCleanWa = (raw?: string) => {
    const digits = (raw || storeSettings.whatsapp_cs || "088230515875").replace(/\D/g, "");
    if (digits.startsWith("0")) return "62" + digits.slice(1);
    if (digits.startsWith("62")) return digits;
    return digits ? "62" + digits : "6288230515875";
  };

  const getWaLink = (text: string) => {
    const cleanNum = getCleanWa(storeSettings.whatsapp_cs);
    return `https://wa.me/${cleanNum}?text=${encodeURIComponent(text)}`;
  };

  const formatWaPhoneDisplay = (raw?: string) => {
    const digits = (raw || storeSettings.whatsapp_cs || "088230515875").replace(/\D/g, "");
    let local = digits;
    if (local.startsWith("62")) {
      local = "0" + local.slice(2);
    }
    if (local.length >= 10) {
      return local.replace(/(\d{4})(\d{4})(\d+)/, "$1-$2-$3");
    }
    return raw || "0882-3051-5875";
  };

  const formatPromoBadge = (raw?: string) => {
    if (!raw) return "2.700 RBX 50K";
    const match = raw.match(/([\d\.,]+)\s*Robux\s*\(Rp\s*([\d\.,]+)\)/i);
    if (match) {
      const rbx = match[1];
      const priceNum = parseInt(match[2].replace(/\D/g, ""), 10);
      const priceK = priceNum >= 1000 ? `${Math.round(priceNum / 1000)}K` : match[2];
      return `${rbx} RBX ${priceK}`;
    }
    return raw;
  };

  const [username, setUsername] = useState("");
  const [isChecked, setIsChecked] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [checkError, setCheckError] = useState("");
  const [robloxUser, setRobloxUser] = useState<RobloxUserData | null>(null);

  const [filterTab, setFilterTab] = useState<"all" | "bestseller" | "vip">("all");
  const [showMore, setShowMore] = useState(false);
  
  const [packages, setPackages] = useState<RobuxPackage[]>(ALL_PACKAGES);
  const [testimonials, setTestimonials] = useState<any[]>(TESTIMONIALS);

  // Sync Live Settings, Products & Testimonials dari Neon Database via single bootstrap request
  useEffect(() => {
    fetch("/api/bootstrap")
      .then((res) => res.json())
      .then((json) => {
        if (!json.success) return;

        // 1. Pengaturan identitas toko & nomor WhatsApp real-time
        if (json.settings) {
          const s = json.settings;
          setStoreSettings((prev) => ({
            ...prev,
            store_name: s.store_name?.trim() || prev.store_name,
            whatsapp_cs: s.whatsapp_cs?.trim() || prev.whatsapp_cs,
            whatsapp_url: s.whatsapp_url || `https://wa.me/${getCleanWa(s.whatsapp_cs || prev.whatsapp_cs)}`,
            qris_nmid: s.qris_nmid || prev.qris_nmid,
            promo_headline: s.promo_headline || prev.promo_headline,
            promo_description: s.promo_description || prev.promo_description,
            promo_package: s.promo_package || prev.promo_package,
            logo_image: s.logo_image || prev.logo_image,
            qris_image: s.qris_image || prev.qris_image,
          }));
        }

        // 2. Paket produk robux
        if (Array.isArray(json.products) && json.products.length > 0) {
          const sorted = [...json.products].sort(
            (a: any, b: any) => (Number(a.price_idr) || 0) - (Number(b.price_idr) || 0)
          );
          const mapped = sorted.map((p: any) => {
            const amount = Number(p.robux_amount) || 0;
            const price = Number(p.price_idr) || 0;
            const isPromo = !!p.is_promo;
            const isSultan = amount >= 10000 || !!p.is_sultan;
            const isPopular = !!p.is_popular || amount === 2200 || amount === 2700 || amount === 3700;

            return {
              id: p.id,
              amount,
              price,
              promo: isPromo,
              bestSeller: isPopular,
              vip: isSultan,
              tag: `${Math.round(price / 1000)}K`,
            };
          });
          setPackages(mapped);
        }

        // 3. Ulasan & testimoni
        if (Array.isArray(json.testimonials) && json.testimonials.length > 0) {
          const mapped = json.testimonials.map((t: any, idx: number) => ({
            id: t.id || idx + 1,
            name: t.roblox_username,
            handle: `@${(t.roblox_username || "user").toLowerCase()}`,
            stars: Number(t.rating) || 5,
            quote: `“${t.comment}”`,
            package: t.package_name || "+2.700 Robux",
            date: t.created_at ? new Date(t.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : "Terbaru",
            adminReply: t.admin_reply || undefined,
            adminReplyDate: t.admin_reply_at ? new Date(t.admin_reply_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : (t.admin_reply ? "Baru saja" : undefined),
          }));
          setTestimonials(mapped);
        }
      })
      .catch(() => {});
  }, []);

  const [selectedPackage, setSelectedPackage] = useState<RobuxPackage>(ALL_PACKAGES[2]); // Default to 2.700 promo package
  const [selectedMethod, setSelectedMethod] = useState<"website" | "whatsapp">("website");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isPaidSuccess, setIsPaidSuccess] = useState(false);
  const [orderInvoiceId, setOrderInvoiceId] = useState("VEX-849201");

  // Payment Proof Upload State (Terkompresi WebP)
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);
  const [isCompressingProof, setIsCompressingProof] = useState(false);
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);
  const [proofError, setProofError] = useState("");
  const proofFileInputRef = useRef<HTMLInputElement>(null);

  // Handle Upload Bukti Transfer dengan Kompresi WebP Otomatis
  const handleProofFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProofError("");
    setIsCompressingProof(true);

    try {
      const result = await compressImageToWebP(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.8 });
      setPaymentProofFile(result.file);
      setPaymentProofPreview(result.dataUrl);
    } catch (err: any) {
      setProofError(err?.message || "Gagal memproses gambar bukti transfer.");
    } finally {
      setIsCompressingProof(false);
    }
  };

  const handleRemoveProof = () => {
    setPaymentProofFile(null);
    setPaymentProofPreview(null);
    setProofError("");
    if (proofFileInputRef.current) {
      proofFileInputRef.current.value = "";
    }
  };

  // Creative How-To-Order Interactive Step State
  const [activeStepTab, setActiveStepTab] = useState<number>(1);

  // Testimonials Carousel State
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  const nextTestimonial = () => {
    setTestimonialIndex((prev) => (prev + 1 >= testimonials.length ? 0 : prev + 1));
  };

  const prevTestimonial = () => {
    setTestimonialIndex((prev) => (prev - 1 < 0 ? testimonials.length - 1 : prev - 1));
  };

  // Handle Verify Username dengan Live Roblox API
  const handleCheckUsername = async () => {
    const trimmed = username.trim();
    if (!trimmed) {
      setCheckError("Masukkan username Roblox kamu terlebih dahulu");
      setIsChecked(false);
      setRobloxUser(null);
      return;
    }
    setCheckError("");
    setIsChecking(true);
    setIsChecked(false);

    try {
      const res = await fetch("/api/roblox/check-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmed }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setCheckError(data.message || "Username Roblox tidak ditemukan.");
        setIsChecked(false);
        setRobloxUser(null);
      } else {
        setRobloxUser(data.user);
        setUsername(data.user.name);
        setIsChecked(true);
        setCheckError("");
      }
    } catch {
      setCheckError("Gagal memeriksa akun Roblox. Pastikan koneksi internet stabil.");
      setIsChecked(false);
      setRobloxUser(null);
    } finally {
      setIsChecking(false);
    }
  };

  // Filter packages based on active tab
  const filteredPackages = packages.filter((pkg) => {
    if (filterTab === "bestseller") return pkg.bestSeller || pkg.promo;
    if (filterTab === "vip") return pkg.vip;
    return true;
  });

  const displayedPackages = showMore ? filteredPackages : filteredPackages.slice(0, 6);

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim();
    if (!cleanUsername) {
      alert("Silakan masukkan Username Roblox kamu pada Langkah 1.");
      return;
    }
    if (!whatsappNumber.trim()) {
      alert("Silakan masukkan Nomor WhatsApp kamu pada Langkah 4.");
      return;
    }

    // Jika belum dicek atau robloxUser belum ada, trigger check otomatis
    let currentRobloxUser = robloxUser;
    if (!isChecked || !currentRobloxUser) {
      setIsChecking(true);
      try {
        const checkRes = await fetch("/api/roblox/check-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: cleanUsername }),
        });
        const checkData = await checkRes.json();
        if (!checkRes.ok || !checkData.success) {
          alert(checkData.message || "Username Roblox tidak valid. Pastikan akun Roblox terdaftar!");
          setIsChecking(false);
          return;
        }
        currentRobloxUser = checkData.user;
        setRobloxUser(checkData.user);
        setUsername(checkData.user.name);
        setIsChecked(true);
      } catch {
        alert("Gagal memverifikasi akun Roblox. Periksa koneksi internet Anda.");
        setIsChecking(false);
        return;
      } finally {
        setIsChecking(false);
      }
    }

    const newInvoice = `VEX-${Math.floor(10000 + Math.random() * 90000)}`;
    setOrderInvoiceId(newInvoice);
    setIsPaidSuccess(false);
    setIsModalOpen(true);

    // Simpan order langsung ke Neon PostgreSQL
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_code: newInvoice,
          roblox_username: currentRobloxUser?.name || cleanUsername,
          roblox_user_id: currentRobloxUser?.id ? String(currentRobloxUser.id) : null,
          roblox_avatar_url: currentRobloxUser?.avatarUrl || null,
          product_name: `${selectedPackage.amount.toLocaleString()} Robux`,
          robux_amount: selectedPackage.amount,
          price_idr: selectedPackage.price,
          payment_method: selectedMethod === "whatsapp" ? "WHATSAPP" : "QRIS",
          customer_phone: whatsappNumber.trim(),
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.order_code) {
          setOrderInvoiceId(json.data.order_code);
        }
      }
    } catch (orderErr) {
      console.warn("[Order Sync Notice]:", orderErr);
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID").format(val);
  };

  return (
    <div className="min-h-screen bg-[#FFF5F8] text-[#260813] flex flex-col font-sans selection:bg-rose-600 selection:text-white w-full max-w-full overflow-x-hidden">
      {/* ----------------- TOP NAVBAR ----------------- */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/95 border-b border-rose-100 shadow-xs w-full max-w-full overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          {/* Logo & Brand */}
          <a href="#" className="flex items-center gap-2 sm:gap-3.5 group shrink-0">
            <div className="relative w-9 h-9 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-rose-500/80 p-0.5 shadow-sm group-hover:border-rose-600 transition-all bg-white shrink-0">
              <Image
                src="/logo.jpg"
                alt="Vexlyn Logo"
                fill
                className="object-cover rounded-full"
                priority
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="text-base sm:text-xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#7A0620] via-[#A11438] to-[#C41E3A] uppercase">
                  {storeSettings.store_name}
                </span>
              </div>
              <span className="text-[9px] sm:text-[11px] font-bold text-rose-700/80 tracking-widest uppercase">
                Gamers Store
              </span>
            </div>
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-slate-700">
            <a
              href="#order-section"
              className="flex items-center gap-1.5 hover:text-rose-600 transition-colors py-1"
            >
              <Zap className="w-4 h-4 text-rose-600" />
              <span>Order Robux</span>
            </a>
            <a
              href="#how-it-works"
              className="hover:text-rose-600 transition-colors py-1"
            >
              Cara Order
            </a>
            <a
              href="#why-vexlyn"
              className="flex items-center gap-1.5 hover:text-rose-600 transition-colors py-1"
            >
              <ShieldCheck className="w-4 h-4 text-rose-500" />
              <span>Kenapa Kami?</span>
            </a>
            <a
              href="#testimonials"
              className="hover:text-rose-600 transition-colors py-1"
            >
              Testimoni
            </a>
            <a
              href="#faq"
              className="hover:text-rose-600 transition-colors py-1"
            >
              FAQ
            </a>
          </nav>

          {/* WhatsApp CS Button Desktop */}
          <div className="hidden sm:flex items-center gap-3">
            <a
              href={getWaLink(`Halo Admin ${storeSettings.store_name}, saya mau order Robux`)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold tracking-wider shadow-md shadow-emerald-600/25 transition-all transform hover:-translate-y-0.5"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WHATSAPP CS (ONLINE)</span>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 cursor-pointer active:scale-95 transition-all shrink-0"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden px-4 py-4 bg-white/98 backdrop-blur-xl border-b border-rose-200 flex flex-col gap-2.5 shadow-lg animate-fadeIn w-full">
            <a
              href="#order-section"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-rose-50/60 text-sm font-bold text-rose-900 hover:bg-rose-100/70"
            >
              <Zap className="w-4 h-4 text-rose-600" />
              <span>Order Robux RBX</span>
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-sm font-semibold text-slate-700 hover:text-rose-600"
            >
              Cara Order (3 Langkah)
            </a>
            <a
              href="#why-vexlyn"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-700 hover:text-rose-600"
            >
              <ShieldCheck className="w-4 h-4 text-rose-500" />
              <span>Kenapa Kami?</span>
            </a>
            <a
              href="#testimonials"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-sm font-semibold text-slate-700 hover:text-rose-600"
            >
              Testimoni Gamers
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-sm font-semibold text-slate-700 hover:text-rose-600"
            >
              Pertanyaan (FAQ)
            </a>
            <a
              href={getWaLink(`Halo Admin ${storeSettings.store_name}, saya mau order Robux`)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-md shadow-emerald-700/20"
            >
              <MessageCircle className="w-4 h-4" />
              <span>HUBUNGI CS WHATSAPP (24 JAM)</span>
            </a>
          </div>
        )}
      </header>

      {/* ----------------- MAIN CONTENT ----------------- */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 md:py-10 space-y-10 sm:space-y-14 md:space-y-16 overflow-x-hidden">
        
        {/* ================= HERO SECTION (MATCHING ROYAL PEARL/RUBY THEME) ================= */}
        <section className="relative rounded-2xl sm:rounded-3xl border border-rose-200/90 bg-white/95 overflow-hidden shadow-[0_15px_40px_rgba(159,18,57,0.06)] w-full">
          {/* Background Banner Image */}
          <div className="absolute inset-0 pointer-events-none">
            <Image
              src="/banner-light-bg.jpg"
              alt="Vexlyn Hero Banner"
              fill
              className="object-cover object-right md:object-right-top opacity-60 sm:opacity-85 md:opacity-95"
              priority
            />
            {/* Luminous Pearl gradient overlay on mobile & desktop */}
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/85 to-white/40 lg:hidden" />
            <div className="absolute inset-0 hidden lg:block bg-gradient-to-r from-white via-white/85 to-transparent w-3/4" />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 p-4 sm:p-10 lg:p-14 max-w-3xl w-full">
            {/* Badges Row */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-4 sm:mb-6 max-w-full">
              {/* Official Store Badge */}
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-white/95 border border-rose-200 backdrop-blur-md text-[10px] sm:text-xs font-bold text-rose-900 shadow-xs max-w-full">
                <div className="relative w-4 h-3 sm:w-5 sm:h-3.5 rounded-xs overflow-hidden shadow-xs border border-slate-200 shrink-0">
                  <Image
                    src="/indonesia-flag.svg"
                    alt="Indonesia Flag"
                    fill
                    className="object-cover"
                  />
                </div>
                <span className="truncate">Official Store • Garansi 100% Legal</span>
              </div>

              {/* Flash Sale Badge */}
              <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-rose-50 border border-rose-200 backdrop-blur-md text-[10px] sm:text-xs font-bold text-rose-800 shadow-xs">
                <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>FLASH SALE</span>
                <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-rose-600 to-red-600 text-white font-extrabold text-[9px] sm:text-[11px] shadow-xs">
                  {formatPromoBadge(storeSettings.promo_package)}
                </span>
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-2xl xs:text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] mb-3 sm:mb-5">
              <span className="text-slate-900 block">Top Up Robux </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B0E2F] via-[#B31237] to-[#D81E48]">
                Lebih Hemat,
              </span>{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#BE123C] via-[#E11D48] to-[#FF2A6D] drop-shadow-xs">
                Proses Instan!
              </span>
            </h1>

            {/* Description */}
            <p className="text-slate-600 text-xs sm:text-base leading-relaxed max-w-xl mb-5 sm:mb-7 font-medium">
              Robux langsung masuk ke akun kamu hanya dengan Username Roblox.
              Tanpa password, 100% aman anti-banned, pengiriman kilat 1–5 menit, dan
              harga grosir termurah di Indonesia!
            </p>

            {/* Micro Trust Pills */}
            <div className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:gap-3 mb-5 sm:mb-8 w-full">
              <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-1 sm:gap-1.5 px-2 sm:px-3.5 py-2 rounded-xl bg-white/95 border border-rose-100 text-[10px] sm:text-xs font-bold text-rose-950 shadow-xs min-w-0">
                <Clock className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span className="truncate">1–5 Menit</span>
              </div>
              <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-1 sm:gap-1.5 px-2 sm:px-3.5 py-2 rounded-xl bg-white/95 border border-emerald-100 text-[10px] sm:text-xs font-bold text-emerald-900 shadow-xs min-w-0">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">100% Legal</span>
              </div>
              <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-1 sm:gap-1.5 px-2 sm:px-3.5 py-2 rounded-xl bg-white/95 border border-amber-100 text-[10px] sm:text-xs font-bold text-amber-900 shadow-xs min-w-0">
                <Users className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="truncate">10K+ Gamers</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-4 mb-5 sm:mb-8 w-full">
              <a
                href="#order-section"
                className="inline-flex items-center justify-center gap-2 px-5 sm:px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#9F1239] via-[#BE123C] to-[#E11D48] hover:from-[#8B0E2F] hover:to-[#BE123C] text-white font-extrabold text-xs sm:text-sm tracking-wide shadow-lg shadow-rose-900/25 hover:shadow-rose-900/40 transition-all text-center"
              >
                <span>Top Up Robux Sekarang</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </a>

              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-3.5 rounded-xl bg-white hover:bg-rose-50 border border-rose-200 text-rose-950 font-bold text-xs sm:text-sm shadow-xs transition-all text-center"
              >
                <span>Lihat Cara Order</span>
              </a>
            </div>

            {/* Social Proof Row */}
            <div className="pt-3.5 border-t border-rose-100 flex items-center gap-2.5 sm:gap-3 w-full">
              <div className="flex -space-x-1.5 sm:-space-x-2 shrink-0">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-rose-600 border-2 border-white flex items-center justify-center text-[8px] sm:text-[9px] font-black text-white shadow-xs">
                  JKT
                </div>
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center text-[8px] sm:text-[9px] font-black text-white shadow-xs">
                  BDG
                </div>
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-red-600 border-2 border-white flex items-center justify-center text-[8px] sm:text-[9px] font-black text-white shadow-xs">
                  SBY
                </div>
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-pink-600 border-2 border-white flex items-center justify-center text-[8px] sm:text-[9px] font-black text-white shadow-xs">
                  MDN
                </div>
              </div>
              <p className="text-[11px] sm:text-sm font-semibold text-slate-700 truncate">
                <span className="text-rose-700 font-extrabold">500+ pesanan</span> sukses diproses hari ini!
              </p>
            </div>
          </div>
        </section>

        {/* ================= 4 FEATURE CARDS (JALAN SENDIRI KE SAMPING SEPERTI REFERENSI) ================= */}
        {/* Mobile: Smooth Continuous Auto-Marquee Running Sideways */}
        <section className="lg:hidden relative w-full overflow-hidden py-1">
          {/* Subtle edge fade gradient masks exactly like reference */}
          <div className="absolute left-0 top-0 bottom-0 w-10 sm:w-16 bg-gradient-to-r from-[#FFF5F8] via-[#FFF5F8]/90 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-10 sm:w-16 bg-gradient-to-l from-[#FFF5F8] via-[#FFF5F8]/90 to-transparent z-10 pointer-events-none" />

          <div className="flex animate-marquee w-max py-1">
            <div className="flex gap-3 pr-3 shrink-0">
              {FEATURE_ITEMS.map((item) => (
                <div
                  key={item.id}
                  className="px-4 py-3 rounded-2xl bg-white border border-rose-100/90 shadow-[0_4px_14px_rgba(159,18,57,0.05)] flex items-center gap-3 shrink-0"
                >
                  {renderFeatureIcon(item.type)}
                  <div className="text-left">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight whitespace-nowrap">
                      {item.title}
                    </h4>
                    <p className="text-[10px] sm:text-xs text-slate-500 font-medium leading-tight mt-0.5 whitespace-nowrap">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3 pr-3 shrink-0">
              {FEATURE_ITEMS.map((item) => (
                <div
                  key={`dup-${item.id}`}
                  className="px-4 py-3 rounded-2xl bg-white border border-rose-100/90 shadow-[0_4px_14px_rgba(159,18,57,0.05)] flex items-center gap-3 shrink-0"
                >
                  {renderFeatureIcon(item.type)}
                  <div className="text-left">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight whitespace-nowrap">
                      {item.title}
                    </h4>
                    <p className="text-[10px] sm:text-xs text-slate-500 font-medium leading-tight mt-0.5 whitespace-nowrap">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Desktop: Stationary 4-Column Grid */}
        <section className="hidden lg:grid grid-cols-4 gap-5 w-full">
          {FEATURE_ITEMS.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-white/95 border border-rose-100 flex items-center gap-3.5 shadow-xs hover:border-rose-300 transition-all"
            >
              {renderFeatureIcon(item.type)}
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-slate-900 truncate">
                  {item.title}
                </h4>
                <p className="text-xs text-slate-500 font-medium truncate">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </section>

        {/* ================= ORDER SYSTEM (4 STEPS - SENADA DENGAN FLYER) ================= */}
        <section id="order-section" className="space-y-6 pt-2 w-full">
          <div className="text-center max-w-2xl mx-auto space-y-2.5 px-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 border border-rose-200 text-rose-800 text-[11px] sm:text-xs font-bold tracking-wider">
              <Zap className="w-3.5 h-3.5 text-rose-600" />
              <span>SISTEM ORDER RESMI {storeSettings.store_name.toUpperCase()}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900">
              Pricelist &amp; Order{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B0E2F] via-[#B31237] to-[#E11D48]">
                Robux RBX
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Daftar harga resmi {storeSettings.store_name}. Robux dikirim langsung ke akun kamu dengan aman dan cepat.
            </p>
          </div>

          {/* Main Order Card */}
          <form
            onSubmit={handleOrderSubmit}
            className="rounded-2xl sm:rounded-3xl border border-rose-200/90 bg-white/95 backdrop-blur-xl p-3.5 sm:p-8 lg:p-10 shadow-[0_15px_50px_rgba(159,18,57,0.06)] space-y-7 sm:space-y-10 w-full"
          >
            {/* ---------------- STEP 1: ROBLOX USERNAME ---------------- */}
            <div className="space-y-3.5 w-full">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-r from-[#8B0E2F] to-[#BE123C] text-white font-black text-xs sm:text-sm flex items-center justify-center shadow-xs shrink-0">
                  1
                </div>
                <h3 className="text-sm sm:text-lg font-bold text-slate-900 truncate">
                  Masukkan Username Roblox{" "}
                  <span className="hidden xs:inline text-xs font-normal text-slate-500">
                    (Tanpa password)
                  </span>
                </h3>
              </div>

              <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full">
                <div className="relative flex-1 min-w-0">
                  <div className="absolute inset-y-0 left-0 pl-3.5 sm:pl-4 flex items-center pointer-events-none text-rose-600">
                    <Users className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setIsChecked(false);
                      setRobloxUser(null);
                      setCheckError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCheckUsername();
                      }
                    }}
                    placeholder="Username Roblox (contoh: Builderman)..."
                    className="w-full pl-10 sm:pl-11 pr-3 sm:pr-4 py-3 sm:py-3.5 rounded-xl bg-[#FFF9FA] border border-rose-200 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200 text-slate-900 placeholder-slate-400 text-xs sm:text-sm transition-all"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleCheckUsername}
                  disabled={isChecking}
                  className="px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-rose-50 to-rose-100 hover:from-rose-100 hover:to-rose-200 border border-rose-300 text-rose-900 font-extrabold text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer shadow-xs active:scale-98"
                >
                  {isChecking ? (
                    <>
                      <div className="w-4 h-4 border-2 border-rose-700 border-t-transparent rounded-full animate-spin"></div>
                      <span>Memeriksa API...</span>
                    </>
                  ) : isChecked ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700 font-black">ID Valid</span>
                    </>
                  ) : (
                    <span>Check ID</span>
                  )}
                </button>
              </div>

              {/* Live Roblox Profile Card */}
              {isChecked && robloxUser && (
                <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-emerald-50/90 border border-emerald-300/80 flex items-center justify-between gap-3 shadow-xs animate-fadeIn">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-emerald-400 p-0.5 bg-white shadow-sm shrink-0">
                      <Image
                        src={robloxUser.avatarUrl}
                        alt={robloxUser.displayName}
                        width={56}
                        height={56}
                        unoptimized
                        className="object-cover rounded-full bg-slate-100"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-slate-900 text-xs sm:text-sm truncate">
                          {robloxUser.displayName}
                        </span>
                        {robloxUser.hasVerifiedBadge && (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700 text-[9px] font-black">
                            ✓ Verified
                          </span>
                        )}
                        <span className="text-[10px] sm:text-xs text-slate-500 font-semibold truncate">
                          (@{robloxUser.name})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] sm:text-[11px] text-emerald-700 font-medium">
                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-100/80 font-mono font-bold text-emerald-800">
                          ID: {robloxUser.id}
                        </span>
                        <span className="hidden xs:inline">• Akun Roblox Aktif &amp; Siap Terima Robux</span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1 text-emerald-600 font-black text-[11px] sm:text-xs px-2.5 py-1.5 rounded-xl bg-emerald-100/60 border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="hidden sm:inline">Terhubung</span>
                  </div>
                </div>
              )}

              {checkError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                  <span className="text-rose-600 font-bold text-sm">⚠</span>
                  <span>{checkError}</span>
                </div>
              )}

              <p className="text-[11px] sm:text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                <span className="text-rose-600 font-bold shrink-0">ⓘ</span>
                <span>Ketik username Roblox kamu lalu klik <strong>Check ID</strong> untuk memastikan akun terdaftar.</span>
              </p>
            </div>

            {/* ---------------- STEP 2: CHOOSE ROBUX PACKAGE (MATCHES CLIENT FLYER) ---------------- */}
            <div className="space-y-4 sm:space-y-5 pt-4 border-t border-rose-100 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-r from-[#8B0E2F] to-[#BE123C] text-white font-black text-xs sm:text-sm flex items-center justify-center shadow-xs shrink-0">
                    2
                  </div>
                  <h3 className="text-sm sm:text-lg font-bold text-slate-900">
                    Pilih Nominal Robux RBX
                  </h3>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-rose-50/70 border border-rose-200/80 w-full sm:w-auto text-xs font-bold overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setFilterTab("all")}
                    className={`flex-1 sm:flex-initial text-center px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                      filterTab === "all"
                        ? "bg-gradient-to-r from-[#8B0E2F] to-[#BE123C] text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterTab("bestseller")}
                    className={`flex-1 sm:flex-initial text-center px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
                      filterTab === "bestseller"
                        ? "bg-gradient-to-r from-[#8B0E2F] to-[#BE123C] text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Best Seller</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterTab("vip")}
                    className={`flex-1 sm:flex-initial text-center px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
                      filterTab === "vip"
                        ? "bg-gradient-to-r from-[#8B0E2F] to-[#BE123C] text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>VIP Tier</span>
                  </button>
                </div>
              </div>

              {/* Package Grid (Styled like the flyer's crimson metallic cards) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3.5 lg:gap-4 w-full">
                {displayedPackages.map((pkg) => {
                  const isSelected = selectedPackage.id === pkg.id;
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg)}
                      className={`relative rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 flex flex-col items-center justify-between cursor-pointer transition-all border min-w-0 ${
                        isSelected
                          ? "bg-white border-2 border-rose-600 shadow-[0_10px_25px_rgba(225,29,72,0.18)] scale-[1.02]"
                          : "bg-[#FFF9FA] border-rose-100 hover:border-rose-300 hover:bg-white shadow-xs"
                      }`}
                    >
                      {/* Checkmark badge when active */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-xs">
                          <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" />
                        </div>
                      )}

                      {/* Badge Otomatis: PROMO, SULTAN, POPULER */}
                      {pkg.promo ? (
                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-600 text-[9px] sm:text-[10px] font-black text-white shadow-xs flex items-center gap-1 whitespace-nowrap z-10">
                          <Sparkles className="w-2.5 h-2.5 shrink-0" />
                          <span>PROMO</span>
                        </div>
                      ) : pkg.vip || pkg.amount >= 10000 ? (
                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-800 text-[9px] sm:text-[10px] font-black text-white shadow-xs flex items-center gap-1 whitespace-nowrap z-10">
                          <Crown className="w-2.5 h-2.5 text-amber-300 shrink-0" />
                          <span>SULTAN</span>
                        </div>
                      ) : pkg.bestSeller ? (
                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-700 text-[9px] sm:text-[10px] font-black text-white shadow-xs flex items-center gap-1 whitespace-nowrap z-10">
                          <Flame className="w-2.5 h-2.5 text-amber-300 shrink-0" />
                          <span>POPULER</span>
                        </div>
                      ) : null}

                      {/* Robux Gold Coin Image */}
                      <div className="relative w-9 h-9 sm:w-12 sm:h-12 my-1 sm:my-2 flex items-center justify-center filter drop-shadow-[0_2px_8px_rgba(245,158,11,0.35)]">
                        <Image
                          src="/robux.webp"
                          alt="Robux"
                          fill
                          className="object-contain"
                        />
                      </div>

                      {/* Robux Amount */}
                      <div className="text-center my-0.5 sm:my-1">
                        <span className="text-sm sm:text-xl font-black text-slate-900 tracking-tight">
                          {pkg.amount.toLocaleString()}
                        </span>
                        <span className="block text-[9px] sm:text-[10px] font-extrabold text-rose-700 uppercase tracking-wider">
                          RBX
                        </span>
                      </div>

                      {/* Price Badge */}
                      <div className="mt-1.5 text-center w-full">
                        <span className="inline-block w-full py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-[#8B0E2F] via-[#A11438] to-[#BE123C] text-white font-black text-xs sm:text-sm tracking-wide shadow-xs">
                          {pkg.tag}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* View More Packages Toggle */}
              {filteredPackages.length > 6 && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setShowMore(!showMore)}
                    className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-bold text-rose-900 transition-all cursor-pointer shadow-xs active:scale-98"
                  >
                    <span>
                      {showMore
                        ? "Tampilkan Lebih Sedikit"
                        : `Lihat Paket Lainnya (+${filteredPackages.length - 6} Paket)`}
                    </span>
                    {showMore ? (
                      <ChevronUp className="w-4 h-4 text-rose-600" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-rose-600" />
                    )}
                  </button>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1.5 font-medium">
                    Menampilkan {displayedPackages.length} dari {filteredPackages.length} paket Robux resmi
                  </p>
                </div>
              )}
            </div>

            {/* ---------------- STEP 3: PAYMENT METHOD (2 METHODS ONLY) ---------------- */}
            <div className="space-y-4 pt-4 border-t border-rose-100 w-full">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-r from-[#8B0E2F] to-[#BE123C] text-white font-black text-xs sm:text-sm flex items-center justify-center shadow-xs shrink-0">
                  3
                </div>
                <h3 className="text-sm sm:text-lg font-bold text-slate-900">
                  Pilih Metode Pembayaran
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5 w-full">
                {/* Method 1: Via Website */}
                <div
                  onClick={() => setSelectedMethod("website")}
                  className={`p-3.5 sm:p-6 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between min-w-0 ${
                    selectedMethod === "website"
                      ? "bg-white border-2 border-rose-600 shadow-[0_10px_30px_rgba(225,29,72,0.12)]"
                      : "bg-[#FFF9FA] border-rose-100 hover:border-rose-300"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700">
                        <Globe className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div
                        className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border flex items-center justify-center ${
                          selectedMethod === "website"
                            ? "border-rose-600 bg-rose-600 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {selectedMethod === "website" && <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                    <h4 className="text-sm sm:text-lg font-bold text-slate-900">Via Website (QRIS Otomatis)</h4>
                    <p className="text-[11px] sm:text-xs font-semibold text-rose-700 mb-2">
                      QRIS (DANA, GoPay, OVO, ShopeePay) &amp; M-Banking
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed mb-4 font-medium">
                      Verifikasi instan otomatis 24 jam. Cukup scan barcode QRIS menggunakan e-wallet atau m-banking, transfer Robux langsung diproses.
                    </p>
                  </div>
                  <div className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-[10px] sm:text-xs font-bold text-emerald-800 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                    <span className="truncate">Verifikasi Otomatis QRIS 24 Jam</span>
                  </div>
                </div>

                {/* Method 2: Via WhatsApp */}
                <div
                  onClick={() => setSelectedMethod("whatsapp")}
                  className={`p-3.5 sm:p-6 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between min-w-0 ${
                    selectedMethod === "whatsapp"
                      ? "bg-white border-2 border-rose-600 shadow-[0_10px_30px_rgba(225,29,72,0.12)]"
                      : "bg-[#FFF9FA] border-rose-100 hover:border-rose-300"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                        <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div
                        className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border flex items-center justify-center ${
                          selectedMethod === "whatsapp"
                            ? "border-rose-600 bg-rose-600 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {selectedMethod === "whatsapp" && <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                    <h4 className="text-sm sm:text-lg font-bold text-slate-900">Via WhatsApp (CS Admin)</h4>
                    <p className="text-[11px] sm:text-xs font-semibold text-emerald-700 mb-2">
                      Chat Langsung dengan CS Admin Resmi
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed mb-4 font-medium">
                      Mau bayar via transfer manual atau butuh panduan langsung? CS {storeSettings.store_name} siap melayani pesanan kamu secara ramah dan fast respon.
                    </p>
                  </div>
                  <div className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-[10px] sm:text-xs font-bold text-emerald-800 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                    <span className="truncate">Layanan CS Prioritas WhatsApp</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ---------------- STEP 4: CONTACT & COMPLETE ORDER ---------------- */}
            <div className="space-y-4 pt-4 border-t border-rose-100 w-full">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-r from-[#8B0E2F] to-[#BE123C] text-white font-black text-xs sm:text-sm flex items-center justify-center shadow-xs shrink-0">
                  4
                </div>
                <h3 className="text-sm sm:text-lg font-bold text-slate-900">
                  Kontak &amp; Selesaikan Pesanan
                </h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start w-full">
                {/* Left: WhatsApp Number Input & Info Card */}
                <div className="lg:col-span-7 space-y-4 min-w-0 w-full">
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80 flex items-start gap-3">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0 mt-0.5">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <h4 className="text-xs font-bold text-slate-900">
                          Notifikasi &amp; Resit WhatsApp
                        </h4>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-200 text-[10px] font-extrabold text-emerald-800">
                          Instant Alert
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                        Kami akan mengirimkan bukti invoice, resit transaksi, dan konfirmasi pengiriman Robux langsung ke nomor WhatsApp kamu secara otomatis.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 w-full">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] sm:text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                        NOMOR WHATSAPP (RESIT &amp; UPDATE) <span className="text-rose-600">*</span>
                      </label>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                        WAJIB
                      </span>
                    </div>

                    {/* Fixed Flex container - No horizontal blowout */}
                    <div className="flex items-center gap-2 w-full min-w-0">
                      <div className="px-3 sm:px-4 py-3 sm:py-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs sm:text-sm font-extrabold text-rose-900 shrink-0">
                        +62
                      </div>
                      <input
                        type="tel"
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                        placeholder="812-3456-7890"
                        className="flex-1 min-w-0 w-0 px-3.5 sm:px-4 py-3 sm:py-3.5 rounded-xl bg-[#FFF9FA] border border-rose-200 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200 text-slate-900 placeholder-slate-400 text-xs sm:text-sm transition-all"
                      />
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
                      Diperlukan untuk konfirmasi instan, pengiriman invoice, dan bantuan layanan pelanggan.
                    </p>
                  </div>
                </div>

                {/* Right: Order Summary Box */}
                <div className="lg:col-span-5 p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-[#FFF5F8] to-[#FFEDF2] border border-rose-200 space-y-3.5 shadow-xs w-full min-w-0">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="font-medium">Metode Dipilih:</span>
                    <span className="font-bold text-slate-900">
                      {selectedMethod === "website"
                        ? "Via Website (QRIS)"
                        : "Via WhatsApp (CS)"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="font-medium">Paket Dipilih:</span>
                    <span className="font-bold text-rose-800 flex items-center gap-1.5">
                      <Image src="/robux.webp" alt="Robux" width={14} height={14} className="object-contain" />
                      <span>{selectedPackage.amount.toLocaleString()} Robux ({selectedPackage.tag})</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-rose-200">
                    <span className="text-xs sm:text-sm font-bold text-slate-800">Total Pembayaran:</span>
                    <span className="text-lg sm:text-2xl font-black text-rose-700">
                      Rp {formatRupiah(selectedPackage.price)}
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-2 py-3.5 sm:py-4 rounded-xl bg-gradient-to-r from-[#8B0E2F] via-[#B31237] to-[#BE123C] hover:from-[#7A0620] hover:to-[#A11438] text-white font-extrabold text-xs sm:text-base tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-rose-900/25 hover:shadow-rose-900/40 transition-all cursor-pointer active:scale-98"
                  >
                    <span>Bayar Sekarang • Rp {formatRupiah(selectedPackage.price)}</span>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>
            </div>
          </form>
        </section>

        {/* ================= HIGH-CREATIVE "HOW TO ORDER" SECTION ================= */}
        <section id="how-it-works" className="space-y-6 sm:space-y-8 pt-4 relative w-full">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 border border-rose-200 text-rose-800 text-[11px] sm:text-xs font-bold tracking-wider">
                <span>PANDUAN PRAKTIS 3 LANGKAH</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900">
                Cara Order di{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B0E2F] via-[#B31237] to-[#E11D48]">
                  Vexlyn
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-xl font-medium">
                Cepat, mudah, dan tanpa ribet untuk semua pemain Roblox di seluruh Indonesia.
              </p>
            </div>

            <a
              href="#order-section"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-rose-700 hover:text-rose-800 transition-colors group self-start md:self-auto"
            >
              <span>Mulai Order Sekarang</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          {/* Interactive Creative Step Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 relative w-full">
            {/* Step 1 Card */}
            <div
              onMouseEnter={() => setActiveStepTab(1)}
              className={`relative rounded-2xl sm:rounded-3xl p-4 sm:p-7 flex flex-col justify-between transition-all duration-300 border min-w-0 ${
                activeStepTab === 1
                  ? "bg-white border-2 border-rose-500 shadow-[0_15px_35px_rgba(225,29,72,0.12)] scale-[1.01]"
                  : "bg-white/80 border-rose-100 hover:border-rose-200"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-[#8B0E2F] to-[#BE123C] text-white font-black text-sm sm:text-base flex items-center justify-center shadow-xs">
                    1
                  </div>
                  <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] sm:text-[11px] font-extrabold text-emerald-800">
                    Cek Akun Instan
                  </span>
                </div>

                <h3 className="text-base sm:text-xl font-black text-slate-900 mb-1">
                  Masukkan Username Roblox
                </h3>
                <p className="text-[11px] sm:text-xs font-bold text-rose-700 mb-2">
                  Tanpa butuh password atau login akun.
                </p>
                <p className="text-xs text-slate-600 leading-relaxed mb-4 font-medium">
                  Cukup ketik username Roblox kamu. Sistem kami akan memverifikasi profil secara otomatis agar pengiriman tepat sasaran.
                </p>
              </div>

              {/* Live UI Mockup 1 */}
              <div className="p-2.5 sm:p-3.5 rounded-2xl bg-rose-50/60 border border-rose-100 flex items-center gap-3 group hover:border-rose-300 transition-all min-w-0">
                <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-white p-0.5 border border-rose-200 flex items-center justify-center shrink-0 shadow-xs">
                  <div className="relative w-full h-full rounded-[10px] overflow-hidden">
                    <Image
                      src="/logo.jpg"
                      alt="Avatar"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h5 className="text-xs font-bold text-slate-900 truncate">
                    GamerPro_ID
                  </h5>
                  <p className="text-[10px] text-emerald-700 flex items-center gap-1 font-semibold mt-0.5 truncate">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span className="truncate">Akun Roblox Terverifikasi</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2 Card */}
            <div
              onMouseEnter={() => setActiveStepTab(2)}
              className={`relative rounded-2xl sm:rounded-3xl p-4 sm:p-7 flex flex-col justify-between transition-all duration-300 border min-w-0 ${
                activeStepTab === 2
                  ? "bg-white border-2 border-rose-500 shadow-[0_15px_35px_rgba(225,29,72,0.12)] scale-[1.01]"
                  : "bg-white/80 border-rose-100 hover:border-rose-200"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-[#8B0E2F] to-[#BE123C] text-white font-black text-sm sm:text-base flex items-center justify-center shadow-xs">
                    2
                  </div>
                  <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-amber-50 border border-amber-200 text-[10px] sm:text-[11px] font-extrabold text-amber-900">
                    Bebas Biaya Admin
                  </span>
                </div>

                <h3 className="text-base sm:text-xl font-black text-slate-900 mb-1">
                  Pilih Nominal &amp; Bayar
                </h3>
                <p className="text-[11px] sm:text-xs font-bold text-rose-700 mb-2">
                  Bisa via QRIS Website atau CS WhatsApp.
                </p>
                <p className="text-xs text-slate-600 leading-relaxed mb-4 font-medium">
                  Pilih paket Robux mulai dari 1.800 (35K) sampai 30.500 Robux (500K) lalu checkout praktis dengan scan QRIS atau WhatsApp.
                </p>
              </div>

              {/* Live UI Mockup 2 */}
              <div className="space-y-2 p-2 sm:p-3 rounded-2xl bg-rose-50/60 border border-rose-100 min-w-0">
                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-white border border-rose-200 text-xs shadow-xs min-w-0">
                  <div className="flex items-center gap-1.5 text-slate-900 font-bold text-[10px] sm:text-xs truncate">
                    <QrCode className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span className="truncate">QRIS (Semua E-Wallet)</span>
                  </div>
                  <span className="text-[8px] sm:text-[10px] font-bold text-rose-800 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 shrink-0">
                    Scan &amp; Bayar
                  </span>
                </div>
                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-white border border-emerald-200 text-xs shadow-xs min-w-0">
                  <div className="flex items-center gap-1.5 text-slate-900 font-semibold text-[10px] sm:text-xs truncate">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">Layanan WhatsApp</span>
                  </div>
                  <span className="text-[8px] sm:text-[10px] font-bold text-emerald-700 shrink-0">
                    Fast Respon
                  </span>
                </div>
              </div>
            </div>

            {/* Step 3 Card */}
            <div
              onMouseEnter={() => setActiveStepTab(3)}
              className={`relative rounded-2xl sm:rounded-3xl p-4 sm:p-7 flex flex-col justify-between transition-all duration-300 border min-w-0 ${
                activeStepTab === 3
                  ? "bg-white border-2 border-rose-500 shadow-[0_15px_35px_rgba(225,29,72,0.12)] scale-[1.01]"
                  : "bg-white/80 border-rose-100 hover:border-rose-200"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-[#8B0E2F] to-[#BE123C] text-white font-black text-sm sm:text-base flex items-center justify-center shadow-xs">
                    3
                  </div>
                  <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] sm:text-[11px] font-extrabold text-emerald-800">
                    1–5 Menit
                  </span>
                </div>

                <h3 className="text-base sm:text-xl font-black text-slate-900 mb-1">
                  Robux Masuk Otomatis!
                </h3>
                <p className="text-[11px] sm:text-xs font-bold text-rose-700 mb-2">
                  Estimasi sampai dalam 1–5 menit.
                </p>
                <p className="text-xs text-slate-600 leading-relaxed mb-4 font-medium">
                  Duduk santai! Saldo Robux langsung masuk ke dompet Roblox kamu. 100% aman, legal, dan langsung bisa kamu gunakan.
                </p>
              </div>

              {/* Live UI Mockup 3 */}
              <div className="p-2.5 sm:p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between shadow-xs min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="relative w-6 h-6 sm:w-8 sm:h-8 shrink-0 filter drop-shadow-[0_2px_6px_rgba(245,158,11,0.4)]">
                    <Image
                      src="/robux.webp"
                      alt="Robux"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[9px] sm:text-[11px] font-semibold text-slate-600 truncate">
                      Robux Berhasil Dikirim!
                    </span>
                    <span className="text-xs sm:text-sm font-black text-emerald-800 tracking-tight">
                      +1.800 Robux
                    </span>
                  </div>
                </div>
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= WHY VEXLYN SECTION ================= */}
        <section id="why-vexlyn" className="space-y-6 sm:space-y-8 pt-4 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start w-full">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-6 min-w-0">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 border border-rose-200 text-rose-800 text-[11px] sm:text-xs font-bold tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
                <span>KEUNGGULAN RESMI VEXLYN GAMERS</span>
              </div>

              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-tight">
                Kenapa Beli Robux di{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B0E2F] via-[#B31237] to-[#E11D48]">
                  {storeSettings.store_name}
                </span>{" "}
                Jauh Lebih Hemat?
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                Harga bawaan resmi di dalam aplikasi Roblox sering kali terkena pajak toko aplikasi tambahan (hingga 30%). Di{" "}
                <strong className="text-slate-900">{storeSettings.store_name}</strong>, kami memanfaatkan saluran distribusi resmi mitra developer terverifikasi sehingga kamu bisa mendapatkan Robux legal berharga grosir dalam Rupiah (IDR).
              </p>

              {/* 3 Check Benefits */}
              <div className="space-y-3 pt-1 sm:pt-2">
                <div className="flex items-start gap-2.5 sm:gap-3">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 shrink-0 mt-0.5">
                    <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="text-xs sm:text-sm font-bold text-slate-900">100% Sumber Legal &amp; Bersih</h5>
                    <p className="text-[10px] sm:text-xs text-slate-600 mt-0.5 font-medium">
                      Semua Robux legal dan terverifikasi. Bukan hasil carding, no black market, dan garansi zero banned.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 sm:gap-3">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 shrink-0 mt-0.5">
                    <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="text-xs sm:text-sm font-bold text-slate-900">Privasi Terjaga (Tanpa Butuh Password)</h5>
                    <p className="text-[10px] sm:text-xs text-slate-600 mt-0.5 font-medium">
                      Kami tidak pernah meminta password, PIN, ataupun kode 2FA. Cukup berikan username Roblox publik kamu.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 sm:gap-3">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 shrink-0 mt-0.5">
                    <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="text-xs sm:text-sm font-bold text-slate-900">Mata Uang Rupiah (IDR) – Tanpa Biaya Tersembunyi</h5>
                    <p className="text-[10px] sm:text-xs text-slate-600 mt-0.5 font-medium">
                      Harga yang tertera adalah harga bersih yang kamu bayar. Tanpa potongan kurs valuta asing atau biaya kartu kredit.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <a
                  href="#order-section"
                  className="inline-flex items-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-[#8B0E2F] via-[#B31237] to-[#BE123C] hover:from-[#7A0620] hover:to-[#A11438] text-white font-extrabold text-xs sm:text-sm shadow-md shadow-rose-900/25 transition-all cursor-pointer"
                >
                  <span>Cek Daftar Harga Robux</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Right Cards */}
            <div className="lg:col-span-5 space-y-4 min-w-0 w-full">
              <div className="grid grid-cols-2 gap-2.5 sm:gap-4 w-full">
                <div className="p-3.5 sm:p-6 rounded-xl sm:rounded-3xl bg-white border border-rose-100 flex flex-col justify-between shadow-xs min-w-0">
                  <span className="text-2xl sm:text-4xl font-black text-rose-700">
                    10.000+
                  </span>
                  <div className="mt-2 sm:mt-3">
                    <h5 className="text-[11px] sm:text-xs font-bold text-slate-900 truncate">Pesanan Selesai</h5>
                    <p className="text-[9px] sm:text-[11px] text-emerald-700 font-semibold truncate">Di Seluruh Indonesia</p>
                  </div>
                </div>

                <div className="p-3.5 sm:p-6 rounded-xl sm:rounded-3xl bg-white border border-rose-100 flex flex-col justify-between shadow-xs min-w-0">
                  <span className="text-2xl sm:text-4xl font-black text-amber-500">
                    4.95 / 5.0
                  </span>
                  <div className="mt-2 sm:mt-3">
                    <h5 className="text-[11px] sm:text-xs font-bold text-slate-900 truncate">Rating Kepuasan</h5>
                    <div className="flex items-center gap-1 text-amber-500 text-xs mt-0.5">
                      {"★".repeat(5)}
                      <span className="text-[8px] sm:text-[10px] text-slate-500 ml-1">Terverifikasi</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 24/7 WhatsApp Support Card */}
              <div className="p-4 sm:p-7 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#FFF5F8] to-[#FFEBF1] border border-rose-200 space-y-3 sm:space-y-4 relative overflow-hidden shadow-xs min-w-0 w-full">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 text-[10px] sm:text-[11px] font-bold">
                  <span>FAST CS WHATSAPP RESPONSE</span>
                </div>

                <h3 className="text-lg sm:text-2xl font-black text-slate-900">
                  Layanan Bantuan WhatsApp 24 Jam
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Ada kendala saat order atau butuh info paket? Tim Customer Care kami siap membantu kamu kapan saja secara cepat lewat WhatsApp.
                </p>

                <div className="pt-2 sm:pt-3 border-t border-rose-200 flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Rata-rata Respon:</span>
                  <span className="font-black text-emerald-700">&lt; 2 Menit</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= TESTIMONIALS SECTION ================= */}
        <section id="testimonials" className="space-y-5 sm:space-y-6 pt-4 w-full">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 border border-rose-200 text-rose-800 text-[11px] sm:text-xs font-bold">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>REVIEW REAL CUSTOMER</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900">
                Kata Para{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B0E2F] via-[#B31237] to-[#E11D48]">
                  Gamers
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                Ribuan pemain Roblox setiap hari mempercayakan top-up mereka di {storeSettings.store_name}.
              </p>
            </div>

            {/* Slider Navigation Arrows */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={prevTestimonial}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border border-rose-200 hover:border-rose-400 text-slate-700 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                aria-label="Previous review"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                type="button"
                onClick={nextTestimonial}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border border-rose-200 hover:border-rose-400 text-slate-700 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                aria-label="Next review"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Testimonial Cards (1 card on mobile, 2 on desktop) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full">
            {/* Active Card */}
            <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-rose-100 flex flex-col justify-between space-y-4 sm:space-y-6 hover:border-rose-300 transition-all shadow-xs min-w-0 w-full">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-full overflow-hidden border border-rose-200 p-0.5 bg-white shadow-xs shrink-0">
                      <Image
                        src="/logo.jpg"
                        alt={testimonials[testimonialIndex].name}
                        fill
                        className="object-cover rounded-full"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">{testimonials[testimonialIndex].name}</h4>
                      <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate">{testimonials[testimonialIndex].handle}</span>
                    </div>
                  </div>
                  <div className="flex items-center text-amber-500 text-xs sm:text-sm shrink-0">
                    {"★".repeat(testimonials[testimonialIndex].stars)}
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 italic font-medium leading-relaxed">
                  {testimonials[testimonialIndex].quote}
                </p>

                {/* Balasan Admin Vexlyn */}
                {testimonials[testimonialIndex].adminReply && (
                  <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[#FFF5F8] border border-rose-200/80 space-y-1 animate-fadeIn">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-extrabold text-[#7A0620] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
                        <span>Admin Vexlyn</span>
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {testimonials[testimonialIndex].adminReplyDate || "Baru saja"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium pl-3.5 leading-relaxed">
                      {testimonials[testimonialIndex].adminReply}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-rose-100 text-xs">
                <div className="flex items-center gap-2">
                  <div className="relative w-5 h-5 sm:w-6 sm:h-6 shrink-0 filter drop-shadow-[0_1px_4px_rgba(245,158,11,0.3)]">
                    <Image
                      src="/robux.webp"
                      alt="Robux"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] sm:text-[10px] text-slate-500 block font-medium">Paket:</span>
                    <span className="font-extrabold text-slate-900 text-xs sm:text-sm">{testimonials[testimonialIndex].package}</span>
                  </div>
                </div>
                <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium">{testimonials[testimonialIndex].date}</span>
              </div>
            </div>

            {/* Second Card on Desktop */}
            {(() => {
              const secondIdx = (testimonialIndex + 1) % testimonials.length;
              const item = testimonials[secondIdx];
              return (
                <div className="hidden md:flex p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-rose-100 flex-col justify-between space-y-4 sm:space-y-6 hover:border-rose-300 transition-all shadow-xs min-w-0 w-full">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-full overflow-hidden border border-rose-200 p-0.5 bg-white shadow-xs shrink-0">
                          <Image
                            src="/logo.jpg"
                            alt={item.name}
                            fill
                            className="object-cover rounded-full"
                          />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">{item.name}</h4>
                          <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate">{item.handle}</span>
                        </div>
                      </div>
                      <div className="flex items-center text-amber-500 text-xs sm:text-sm shrink-0">
                        {"★".repeat(item.stars)}
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 italic font-medium leading-relaxed">
                      {item.quote}
                    </p>

                    {/* Balasan Admin Vexlyn */}
                    {item.adminReply && (
                      <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[#FFF5F8] border border-rose-200/80 space-y-1 animate-fadeIn">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-extrabold text-[#7A0620] flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
                            <span>Admin Vexlyn</span>
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {item.adminReplyDate || "Baru saja"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 font-medium pl-3.5 leading-relaxed">
                          {item.adminReply}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-rose-100 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="relative w-5 h-5 sm:w-6 sm:h-6 shrink-0 filter drop-shadow-[0_1px_4px_rgba(245,158,11,0.3)]">
                        <Image
                          src="/robux.webp"
                          alt="Robux"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] sm:text-[10px] text-slate-500 block font-medium">Paket:</span>
                        <span className="font-extrabold text-slate-900 text-xs sm:text-sm">{item.package}</span>
                      </div>
                    </div>
                    <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium">{item.date}</span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Carousel Indicator Dots */}
          <div className="flex items-center justify-center gap-1.5 pt-1">
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setTestimonialIndex(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  testimonialIndex === idx ? "w-7 bg-rose-600" : "w-2 bg-rose-200"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </section>

        {/* ================= FAQ SECTION ================= */}
        <section id="faq" className="space-y-5 sm:space-y-6 pt-4 max-w-4xl mx-auto w-full">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 border border-rose-200 text-rose-800 text-[11px] sm:text-xs font-bold">
              <HelpCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>ADA PERTANYAAN?</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900">
              Pertanyaan yang Sering{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B0E2F] via-[#B31237] to-[#E11D48]">
                Diajukan (FAQ)
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Semua info penting seputar keamanan &amp; pembelian Robux di Vexlyn.
            </p>
          </div>

          <div className="space-y-2.5 sm:space-y-3 w-full">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = faqOpen === idx;
              return (
                <div
                  key={idx}
                  className={`rounded-2xl border transition-all overflow-hidden w-full ${
                    isOpen
                      ? "bg-white border-rose-300 shadow-sm"
                      : "bg-white/80 border-rose-100 hover:border-rose-200"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setFaqOpen(isOpen ? null : idx)}
                    className="w-full p-3.5 sm:p-5 text-left font-bold text-xs sm:text-base text-slate-900 flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <span>{item.q}</span>
                    <div
                      className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        isOpen
                          ? "bg-rose-600 text-white"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      <ChevronDown
                        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-3.5 sm:px-5 pb-3.5 sm:pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-rose-100 pt-3 font-medium">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* ----------------- FOOTER (ROYAL CRIMSON VELVET) ----------------- */}
      <footer className="mt-12 sm:mt-16 border-t border-rose-900/30 bg-[#1D030D] text-rose-200 text-xs w-full max-w-full overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 space-y-8 sm:space-y-10 w-full">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start w-full">
            {/* Left: Brand Bio */}
            <div className="md:col-span-5 space-y-3.5 sm:space-y-4 min-w-0">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-rose-500/70 p-0.5 shadow-md bg-white shrink-0">
                  <Image
                    src="/logo.jpg"
                    alt="Vexlyn Logo"
                    fill
                    className="object-cover rounded-full"
                  />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-black text-white tracking-wider uppercase">
                    {storeSettings.store_name}
                  </h4>
                  <span className="text-[10px] sm:text-[11px] font-bold text-rose-400 uppercase tracking-widest block">
                    GAMERS ROBUX STORE
                  </span>
                </div>
              </div>

              <p className="text-xs text-rose-200/80 leading-relaxed max-w-sm font-medium">
                {storeSettings.store_name} adalah platform top up Roblox Robux terpercaya #1 di Indonesia. Pengiriman kilat, harga grosir termurah, dan garansi transaksi 100% aman tanpa perlu password.
              </p>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-950/60 border border-rose-800/40 text-[10px] sm:text-[11px] font-medium text-emerald-400 max-w-full">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="leading-snug">Distributor Terpercaya Komunitas Roblox Indonesia</span>
              </div>
            </div>

            {/* Middle: Quick Links */}
            <div className="md:col-span-3 space-y-3 min-w-0">
              <h5 className="text-[11px] sm:text-xs font-bold text-white uppercase tracking-wider">
                NAVIGASI
              </h5>
              <ul className="space-y-2 text-xs">
                <li>
                  <a href="#order-section" className="text-rose-200/80 hover:text-white transition-colors">
                    Order Robux
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="text-rose-200/80 hover:text-white transition-colors">
                    Cara Order
                  </a>
                </li>
                <li>
                  <a href="#why-vexlyn" className="text-rose-200/80 hover:text-white transition-colors">
                    Kenapa Kami?
                  </a>
                </li>
                <li>
                  <a href="#testimonials" className="text-rose-200/80 hover:text-white transition-colors">
                    Testimoni Pelanggan
                  </a>
                </li>
                <li>
                  <a href="#faq" className="text-rose-200/80 hover:text-white transition-colors">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

            {/* Right: Customer Support WhatsApp */}
            <div className="md:col-span-4 space-y-3 min-w-0">
              <h5 className="text-[11px] sm:text-xs font-bold text-white uppercase tracking-wider">
                LAYANAN PELANGGAN
              </h5>
              <p className="text-xs text-rose-200/80 leading-relaxed font-medium">
                Butuh bantuan dengan pesanan atau ingin tanya ketersediaan stok? Hubungi admin resmi kami kapan saja.
              </p>

              <div className="pt-1 sm:pt-2">
                <a
                  href={getWaLink(`Halo Admin ${storeSettings.store_name}, saya mau order Robux`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs tracking-wider shadow-lg shadow-emerald-950/40 transition-all cursor-pointer text-center"
                >
                  <MessageCircle className="w-4 h-4 shrink-0" />
                  <span>WhatsApp CS: {formatWaPhoneDisplay(storeSettings.whatsapp_cs)} (24 Jam)</span>
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-5 sm:pt-6 border-t border-rose-900/30 flex items-center justify-center sm:justify-start text-[10px] sm:text-[11px] text-rose-300/60 font-medium text-center sm:text-left">
            <p>© 2026 {storeSettings.store_name}. All rights reserved. Komunitas Robloxian Indonesia.</p>
          </div>
        </div>
      </footer>

      {/* ----------------- ORDER CONFIRMATION MODAL ----------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl sm:rounded-3xl bg-white border border-rose-200 p-4 sm:p-8 shadow-[0_25px_70px_rgba(0,0,0,0.25)] space-y-4 sm:space-y-5">
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-xl bg-rose-50 text-slate-500 hover:text-slate-900 border border-rose-200 cursor-pointer active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>

            {/* JIKA SUDAH SUKSES: TAMPILKAN SCREEN SUKSES BERSIH & TERPISAH */}
            {isPaidSuccess ? (
              <div className="space-y-5 text-center animate-fadeIn py-2 sm:py-4">
                {/* Icon Centang Sukses */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-100 border-4 border-emerald-300 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-600" />
                </div>

                {/* Judul & Pesan Sukses */}
                <div className="space-y-1.5">
                  <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-black uppercase tracking-wider">
                    {selectedMethod === "whatsapp" ? "✓ Pesanan Diteruskan ke WhatsApp" : "✓ Pembayaran Berhasil Terkirim"}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                    {selectedMethod === "whatsapp" ? "Pesanan Siap Diproses CS!" : "Pesanan Sedang Diproses!"}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium max-w-sm mx-auto">
                    {selectedMethod === "whatsapp"
                      ? `Detail pesanan kamu telah diteruskan ke WhatsApp CS resmi ${storeSettings.store_name}. Silakan lanjutkan chat untuk proses transfer langsung.`
                      : `Bukti transfer telah diterima sistem dan konfirmasi otomatis telah dibuka ke WhatsApp Admin ${storeSettings.store_name}. Robux akan masuk dalam 1–5 menit!`}
                  </p>
                </div>

                {/* Ringkasan Pesanan Sukses */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/70 via-teal-50/50 to-emerald-50/70 border border-emerald-200 text-left text-xs space-y-2 shadow-xs">
                  <div className="flex justify-between items-center py-1 border-b border-emerald-200/60">
                    <span className="text-slate-500 font-medium">Nomor Invoice:</span>
                    <span className="font-mono font-black text-emerald-900">#{orderInvoiceId}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-emerald-200/60">
                    <span className="text-slate-500 font-medium">Akun Roblox Penerima:</span>
                    <span className="font-bold text-slate-900">@{robloxUser?.name || username}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-emerald-200/60">
                    <span className="text-slate-500 font-medium">Paket Robux:</span>
                    <span className="font-extrabold text-rose-700">{selectedPackage.amount.toLocaleString()} Robux</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-slate-500 font-medium">Total Pembayaran:</span>
                    <span className="font-black text-slate-900">Rp {formatRupiah(selectedPackage.price)}</span>
                  </div>
                </div>

                {/* Tombol Aksi */}
                <div className="space-y-2.5 pt-2">
                  <a
                    href={getWaLink(
                      selectedMethod === "whatsapp"
                        ? `Halo CS ${storeSettings.store_name}, saya ingin menyelesaikan pemesanan Robux:\n\n• Invoice: #${orderInvoiceId}\n• Username Roblox: @${robloxUser?.name || username}${robloxUser?.id ? ` (ID: ${robloxUser.id})` : ""}\n• Paket: ${selectedPackage.amount.toLocaleString()} Robux (${selectedPackage.tag || ""})\n• Total: Rp ${formatRupiah(selectedPackage.price)}\n• No. WhatsApp: +62 ${whatsappNumber}\n\nMohon dibantu proses ya min, terima kasih!`
                        : `Halo Admin ${storeSettings.store_name}, saya sudah melakukan pembayaran via Website (QRIS):\n\n• Invoice: #${orderInvoiceId}\n• Username Roblox: @${robloxUser?.name || username}${robloxUser?.id ? ` (ID: ${robloxUser.id})` : ""}\n• Paket: ${selectedPackage.amount.toLocaleString()} Robux (${selectedPackage.tag || ""})\n• Total: Rp ${formatRupiah(selectedPackage.price)}\n• No. WhatsApp: +62 ${whatsappNumber}\n• Status: Bukti Pembayaran Telah Diunggah ke Website\n\nMohon segera diproses ya min, terima kasih!`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-98"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Buka Chat WhatsApp Admin</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setIsPaidSuccess(false);
                      setPaymentProofFile(null);
                      setPaymentProofPreview(null);
                    }}
                    className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-all cursor-pointer"
                  >
                    Selesai &amp; Tutup
                  </button>
                </div>
              </div>
            ) : (
              /* JIKA BELUM SUKSES: TAMPILKAN FORM PEMBAYARAN & UPLOAD QRIS */
              <>
                {/* Modal Header */}
                <div className="space-y-1 text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-rose-100 border border-rose-200 text-rose-700 flex items-center justify-center mx-auto mb-1.5">
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900">Konfirmasi Pesanan</h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                    Invoice #{orderInvoiceId}
                  </p>
                </div>

                {/* Order Details Card */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-[#FFF9FA] border border-rose-200 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between py-1.5 border-b border-rose-100">
                    <span className="text-slate-600 font-medium">Akun Penerima:</span>
                    <div className="flex items-center gap-2">
                      {robloxUser?.avatarUrl && (
                        <div className="w-7 h-7 rounded-full overflow-hidden border border-emerald-400 bg-white shrink-0">
                          <Image
                            src={robloxUser.avatarUrl}
                            alt={robloxUser.name}
                            width={28}
                            height={28}
                            unoptimized
                            className="object-cover rounded-full"
                          />
                        </div>
                      )}
                      <div className="text-right">
                        <span className="font-extrabold text-slate-900 block leading-tight">
                          @{robloxUser?.name || username}
                        </span>
                        {robloxUser?.id && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            ID: {robloxUser.id}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between py-1 border-b border-rose-100">
                    <span className="text-slate-600 font-medium">Paket Robux:</span>
                    <span className="font-bold text-rose-800 flex items-center gap-1.5">
                      <Image src="/robux.webp" alt="Robux" width={14} height={14} className="object-contain" />
                      <span>{selectedPackage.amount.toLocaleString()} Robux ({selectedPackage.tag})</span>
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-rose-100">
                    <span className="text-slate-600 font-medium">Nomor WhatsApp:</span>
                    <span className="font-bold text-slate-900">+62 {whatsappNumber}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-rose-100">
                    <span className="text-slate-600 font-medium">Metode Bayar:</span>
                    <span className="font-bold text-slate-900 uppercase">
                      {selectedMethod === "website" ? "Via Website (QRIS)" : "Via WhatsApp (CS)"}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-800">Total Tagihan:</span>
                    <span className="text-lg sm:text-xl font-black text-rose-700">
                      Rp {formatRupiah(selectedPackage.price)}
                    </span>
                  </div>
                </div>

                {/* Payment Interactive Instruction based on selectedMethod (2 methods only) */}
                {selectedMethod === "website" ? (
                  <div className="space-y-4">
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-50/70 border border-rose-200 flex flex-col items-center text-center space-y-2.5">
                      <span className="text-xs font-bold text-rose-900">
                        SCAN BARCODE QRIS UNTUK MEMBAYAR
                      </span>
                      {/* Barcode QRIS Toko atau Default */}
                      <div className="w-36 h-36 sm:w-44 sm:h-44 bg-white p-2.5 sm:p-3 rounded-2xl shadow-md border border-rose-200 flex flex-col items-center justify-center relative overflow-hidden">
                        {storeSettings.qris_image ? (
                          <div className="relative w-full h-full">
                            <Image
                              src={storeSettings.qris_image}
                              alt="QRIS Barcode"
                              fill
                              className="object-contain"
                            />
                          </div>
                        ) : (
                          <>
                            <QrCode className="w-28 h-28 sm:w-36 sm:h-36 text-slate-900" />
                            <span className="text-[9px] sm:text-[10px] font-black text-rose-700 tracking-wider">
                              QRIS NASIONAL
                            </span>
                          </>
                        )}
                      </div>
                      {storeSettings.qris_nmid && (
                        <span className="text-[9px] sm:text-[10px] font-mono font-semibold text-slate-500">
                          NMID: {storeSettings.qris_nmid}
                        </span>
                      )}
                      <p className="text-[10px] sm:text-[11px] text-slate-600 font-medium">
                        Mendukung <strong>DANA, GoPay, OVO, ShopeePay, LinkAja, BCA, Mandiri, BRI, BNI &amp; Semua Bank</strong>.
                      </p>
                    </div>

                    {/* Upload Bukti Pembayaran (Wajib) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Upload className="w-3.5 h-3.5 text-rose-600" />
                          <span>Upload Bukti Pembayaran</span>
                        </span>
                        <span className="text-[10px] text-rose-700 font-bold bg-rose-100/80 px-2 py-0.5 rounded-md">
                          Wajib
                        </span>
                      </div>

                      <input
                        ref={proofFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleProofFileChange}
                        className="hidden"
                      />

                      {isCompressingProof ? (
                        <div className="p-4 rounded-xl bg-rose-50/50 border border-dashed border-rose-300 flex items-center justify-center gap-2 text-xs font-semibold text-rose-800">
                          <div className="w-4 h-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
                          <span>Memproses bukti pembayaran...</span>
                        </div>
                      ) : paymentProofPreview ? (
                        <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-300 flex items-center justify-between gap-3 animate-fadeIn">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-emerald-400 bg-white shadow-xs shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={paymentProofPreview}
                                alt="Preview Bukti"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-slate-900 block truncate">
                                {paymentProofFile?.name || "Bukti Transfer Terpilih"}
                              </span>
                              <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                                <FileCheck className="w-3 h-3 text-emerald-600" />
                                <span>Siap diverifikasi</span>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => proofFileInputRef.current?.click()}
                              className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-[11px] font-bold transition-all cursor-pointer"
                            >
                              Ganti
                            </button>
                            <button
                              type="button"
                              onClick={handleRemoveProof}
                              className="p-1.5 rounded-lg bg-rose-100/70 hover:bg-rose-200 text-rose-700 transition-all cursor-pointer"
                              title="Hapus foto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => proofFileInputRef.current?.click()}
                          className="p-4 rounded-xl border-2 border-dashed border-rose-200 hover:border-rose-400 bg-rose-50/30 hover:bg-rose-50/60 transition-all flex flex-col items-center justify-center text-center cursor-pointer group space-y-1"
                        >
                          <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <Upload className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold text-slate-800">
                            Klik untuk memilih foto bukti transfer
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            Mendukung foto struk ATM, Mobile Banking, atau screenshot e-wallet
                          </span>
                        </div>
                      )}

                      {proofError && (
                        <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                          <span>⚠</span>
                          <span>{proofError}</span>
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={isSubmittingProof || isCompressingProof}
                      onClick={async () => {
                        if (!paymentProofFile) {
                          setProofError("Wajib mengunggah bukti pembayaran terlebih dahulu sebelum verifikasi.");
                          return;
                        }

                        setIsSubmittingProof(true);
                        setProofError("");

                        try {
                          // 1. Upload file WebP ke server
                          const formData = new FormData();
                          formData.append("file", paymentProofFile);
                          formData.append("folder", "proofs");

                          const uploadRes = await fetch("/api/upload", {
                            method: "POST",
                            body: formData,
                          });
                          const uploadData = await uploadRes.json();

                          if (!uploadRes.ok || !uploadData.success) {
                            throw new Error(uploadData.message || "Gagal mengunggah bukti pembayaran.");
                          }

                          // 2. Update pesanan di database dengan URL bukti pembayaran
                          await fetch("/api/orders", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              order_code: orderInvoiceId,
                              status: "menunggu_verifikasi",
                              payment_proof_url: uploadData.url,
                            }),
                          });

                          // 3. Set status sukses di modal (menggantikan seluruh layar modal)
                          setIsPaidSuccess(true);

                          // 4. Otomatis redirect ke WhatsApp Admin untuk menginfokan pembelian
                          const targetUser = robloxUser?.name || username;
                          const targetId = robloxUser?.id ? ` (ID: ${robloxUser.id})` : "";
                          const waText = 
                            `Halo Admin ${storeSettings.store_name}, saya sudah melakukan pembayaran via Website (QRIS):\n\n` +
                            `• Invoice: #${orderInvoiceId}\n` +
                            `• Username Roblox: @${targetUser}${targetId}\n` +
                            `• Paket: ${selectedPackage.amount.toLocaleString()} Robux (${selectedPackage.tag || ""})\n` +
                            `• Total: Rp ${formatRupiah(selectedPackage.price)}\n` +
                            `• No. WhatsApp: +62 ${whatsappNumber}\n` +
                            `• Status: Bukti Pembayaran Telah Diunggah ke Website\n\n` +
                            `Mohon segera diproses ya min, terima kasih!`;

                          const waLink = getWaLink(waText);
                          window.open(waLink, "_blank");
                        } catch (err: any) {
                          setProofError(err?.message || "Gagal mengirim bukti pembayaran. Coba lagi.");
                        } finally {
                          setIsSubmittingProof(false);
                        }
                      }}
                      className={`w-full py-3 sm:py-3.5 rounded-xl text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 ${
                        !paymentProofFile
                          ? "bg-slate-400 hover:bg-slate-500 cursor-not-allowed opacity-90"
                          : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500"
                      }`}
                    >
                      {isSubmittingProof ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Mengirim Bukti &amp; Memverifikasi...</span>
                        </>
                      ) : (
                        <span>Kirim Bukti Pembayaran &amp; Selesaikan</span>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3.5 text-center">
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Klik tombol di bawah ini untuk membuka WhatsApp CS resmi kami beserta detail pesanan otomatis yang sudah disiapkan.
                    </p>
                    <a
                      href={getWaLink(
                        `Halo CS ${storeSettings.store_name}, saya ingin menyelesaikan pemesanan Robux:\n\n• Invoice: #${orderInvoiceId}\n• Username Roblox: @${robloxUser?.name || username}${robloxUser?.id ? ` (ID: ${robloxUser.id})` : ""}\n• Paket: ${selectedPackage.amount.toLocaleString()} Robux (${selectedPackage.tag || ""})\n• Total: Rp ${formatRupiah(selectedPackage.price)}\n• No. WhatsApp: +62 ${whatsappNumber}\n\nMohon dibantu proses ya min, terima kasih!`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsPaidSuccess(true)}
                      className="w-full py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-98"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Lanjutkan ke Chat WhatsApp Admin</span>
                    </a>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
