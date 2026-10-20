"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Star,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  MessageSquare,
  Lock,
  Loader2,
} from "lucide-react";

interface OrderReviewInfo {
  order_code: string;
  roblox_username: string;
  product_name: string;
  robux_amount: number;
  price_idr?: number;
  reviewed_at?: string;
}

function ReviewContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAlreadyReviewed, setIsAlreadyReviewed] = useState(false);
  const [order, setOrder] = useState<OrderReviewInfo | null>(null);

  // Form State
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setErrorMsg("Link ulasan tidak valid atau token tidak ditemukan pada URL.");
      setIsLoading(false);
      return;
    }

    const checkToken = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/review?token=${encodeURIComponent(token)}`);
        const data = await res.json();

        if (res.ok && data.success && data.order) {
          setOrder(data.order);
          setIsAlreadyReviewed(false);
        } else if (data.is_reviewed) {
          setIsAlreadyReviewed(true);
          setOrder(data.order || null);
          setErrorMsg(data.message || "Link ulasan ini sudah pernah digunakan.");
        } else {
          setErrorMsg(data.message || "Link ulasan tidak valid atau pesanan tidak ditemukan.");
        }
      } catch {
        setErrorMsg("Gagal menghubungi server. Periksa koneksi internet Anda.");
      } finally {
        setIsLoading(false);
      }
    };

    checkToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!comment.trim() || comment.trim().length < 3) {
      alert("Mohon ketikkan ulasan pengalaman Anda (minimal 3 karakter).");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          rating,
          comment: comment.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsSuccess(true);
      } else {
        alert(data.message || "Gagal mengirim ulasan. Silakan coba lagi.");
        if (data.is_reviewed) {
          setIsAlreadyReviewed(true);
        }
      }
    } catch {
      alert("Terjadi kendala koneksi saat mengirim ulasan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingLabel = (stars: number) => {
    switch (stars) {
      case 5:
        return "⭐⭐⭐⭐⭐ Luar Biasa! Sangat Puas & Cepat";
      case 4:
        return "⭐⭐⭐⭐ Bagus & Memuaskan";
      case 3:
        return "⭐⭐⭐ Cukup Bagus";
      case 2:
        return "⭐⭐ Kurang Puas";
      case 1:
        return "⭐ Sangat Kecewa";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF5F8] text-[#220813] flex flex-col font-sans selection:bg-rose-600 selection:text-white">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-rose-100 shadow-2xs">
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-rose-400 p-0.5 bg-white">
              <Image src="/logo.jpg" alt="Vexlyn" fill className="object-cover rounded-full" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#7A0620] via-[#A11438] to-[#C41E3A]">
                VEXLYN ID
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                Ulasan Pelanggan
              </span>
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-rose-700 transition-colors py-1.5 px-3 rounded-full hover:bg-rose-50"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Ke Beranda</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">
        {isLoading ? (
          <div className="p-8 sm:p-12 text-center bg-white rounded-3xl border border-rose-100 shadow-sm space-y-4">
            <Loader2 className="w-10 h-10 text-rose-600 animate-spin mx-auto" />
            <div className="space-y-1">
              <h2 className="text-base font-black text-slate-800">Memverifikasi Link Ulasan...</h2>
              <p className="text-xs text-slate-400">
                Memeriksa keaslian token pesanan 1x pakai.
              </p>
            </div>
          </div>
        ) : isSuccess ? (
          /* ======================================================== */
          /* SUCCESS STATE                                            */
          /* ======================================================== */
          <div className="p-6 sm:p-10 text-center bg-white rounded-3xl border border-rose-100 shadow-sm space-y-6 animate-fadeIn">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-9 h-9 sm:w-11 sm:h-11" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Ulasan Berhasil Terbit</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                Terima Kasih Banyak! 🎉
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                Penilaian dan testimoni kamu untuk pesanan{" "}
                <span className="font-extrabold text-slate-800">#{order?.order_code}</span> telah
                berhasil kami publikasikan secara resmi di website Vexlyn.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100 text-left space-y-2">
              <div className="flex items-center justify-between text-xs font-extrabold text-slate-800">
                <span>@{order?.roblox_username}</span>
                <span className="text-amber-500 font-bold">{"★".repeat(rating)}</span>
              </div>
              <p className="text-xs text-slate-600 italic">“{comment}”</p>
            </div>

            <Link
              href="/"
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-[#7A0620] via-[#A11438] to-[#C41E3A] text-white text-sm font-black shadow-md hover:shadow-lg transition-all active:scale-98"
            >
              <span>Kembali ke Halaman Utama</span>
            </Link>
          </div>
        ) : isAlreadyReviewed ? (
          /* ======================================================== */
          /* ALREADY REVIEWED (1X USE PROTECTION)                     */
          /* ======================================================== */
          <div className="p-6 sm:p-10 text-center bg-white rounded-3xl border border-amber-200/80 shadow-sm space-y-6 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-black">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span>Link Sudah Digunakan (Sekali Pakai)</span>
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                Ulasan Sudah Pernah Dikirim
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                Pesanan <span className="font-extrabold text-slate-800">#{order?.order_code || "Vexlyn"}</span>{" "}
                sudah berhasil diberikan ulasan sebelumnya. Untuk menjaga integritas testimoni dan mencegah spam,
                setiap link hanya berlaku 1 kali pakai.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 font-medium">
              Terima kasih banyak atas apresiasi dan testimoni kamu untuk Vexlyn! Ulasan kamu sudah tampil di beranda toko.
            </div>

            <Link
              href="/"
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs sm:text-sm font-bold shadow-2xs transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Halaman Utama</span>
            </Link>
          </div>
        ) : errorMsg ? (
          /* ======================================================== */
          /* ERROR STATE                                              */
          /* ======================================================== */
          <div className="p-6 sm:p-10 text-center bg-white rounded-3xl border border-rose-200 shadow-sm space-y-6 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-rose-50 border-2 border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-black text-slate-900">Link Ulasan Tidak Valid</h1>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
                {errorMsg}
              </p>
            </div>

            <Link
              href="/"
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-[#7A0620] via-[#A11438] to-[#C41E3A] text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Beranda</span>
            </Link>
          </div>
        ) : (
          /* ======================================================== */
          /* FORM REVIEW (VALID TOKEN)                                */
          /* ======================================================== */
          <div className="bg-white rounded-3xl border border-rose-100 shadow-sm overflow-hidden animate-fadeIn">
            {/* Top Banner / Order Info */}
            <div className="p-5 sm:p-6 bg-gradient-to-br from-[#FFF5F8] via-rose-50/50 to-white border-b border-rose-100">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-black uppercase tracking-wider">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Pesanan Selesai</span>
                </div>
                <span className="font-mono text-xs font-bold text-slate-400">
                  #{order?.order_code}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white border border-rose-200 flex items-center justify-center shrink-0 shadow-2xs">
                  <Image src="/robux.webp" alt="Robux" width={30} height={30} className="object-contain" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 truncate">
                    {order?.product_name || `${order?.robux_amount.toLocaleString()} Robux`}
                  </h2>
                  <p className="text-xs text-slate-500 font-semibold truncate">
                    Akun Roblox: <span className="text-[#A11438] font-bold">@{order?.roblox_username}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6">
              {/* Star Rating Section */}
              <div className="space-y-2 text-center">
                <label className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 block">
                  Beri Rating Kepuasan Kamu
                </label>
                <div className="flex items-center justify-center gap-2 py-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = (hoverRating || rating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 cursor-pointer transition-transform hover:scale-125 active:scale-95 focus:outline-none"
                        title={`${star} Bintang`}
                      >
                        <Star
                          className={`w-8 h-8 sm:w-10 sm:h-10 transition-colors ${
                            isFilled
                              ? "text-amber-400 fill-amber-400 drop-shadow-xs"
                              : "text-slate-200 hover:text-amber-200"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <div className="text-xs font-bold text-rose-700 min-h-[1.25rem]">
                  {getRatingLabel(hoverRating || rating)}
                </div>
              </div>

              {/* Review Comment Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Tuliskan Ulasan / Testimoni *
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {comment.length}/500
                  </span>
                </div>
                <textarea
                  required
                  rows={4}
                  maxLength={500}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Contoh: Proses pengiriman Robux kilat banget, cuma 1-2 menit langsung masuk tanpa password! Admin ramah dan amanah. Bakal langganan terus!"
                  className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all shadow-2xs resize-none"
                />
              </div>


              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !comment.trim()}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#7A0620] via-[#A11438] to-[#C41E3A] hover:opacity-95 text-white text-xs sm:text-sm font-black uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mempublikasikan...</span>
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4" />
                    <span>Kirim Penilaian & Ulasan</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-[11px] text-slate-400 border-t border-rose-100">
        © {new Date().getFullYear()} Vexlyn.id • Transaksi Legal & Terpercaya
      </footer>
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FFF5F8] flex items-center justify-center p-4">
          <Loader2 className="w-8 h-8 text-rose-600 animate-spin" />
        </div>
      }
    >
      <ReviewContent />
    </Suspense>
  );
}
