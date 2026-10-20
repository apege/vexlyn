-- ==============================================================================
-- Vexlyn ID Database Schema (Neon Serverless PostgreSQL)
-- Target Platform: Vexlyn Indonesia (Mata Uang: IDR / Rupiah)
-- CS WhatsApp: 088230515875
-- ==============================================================================

-- 1. Enable extension untuk UUID generator
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. PROFILES (Pengguna & Admin Staff)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NULL,
  username text UNIQUE NOT NULL,
  password_hash text NULL,
  full_name text NULL,
  phone text NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin', 'staff')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexing profiles
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ------------------------------------------------------------------------------
-- 2. PRODUCTS (Katalog Paket Robux Vexlyn)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  robux_amount integer NOT NULL CHECK (robux_amount > 0),
  bonus_robux integer NOT NULL DEFAULT 0 CHECK (bonus_robux >= 0),
  price_idr integer NOT NULL CHECK (price_idr >= 0),
  is_active boolean NOT NULL DEFAULT true,
  is_promo boolean NOT NULL DEFAULT false,
  is_popular boolean NOT NULL DEFAULT false,
  is_sultan boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexing products
CREATE INDEX IF NOT EXISTS idx_products_active_order ON public.products(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_products_code ON public.products(code);

-- ------------------------------------------------------------------------------
-- 3. ORDERS (Transaksi Pesanan Top Up)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code text UNIQUE NOT NULL,
  roblox_username text NOT NULL,
  roblox_user_id text NULL,
  roblox_avatar_url text NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  robux_amount integer NOT NULL,
  price_idr integer NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('QRIS', 'WHATSAPP')),
  payment_proof_url text NULL,
  status text NOT NULL DEFAULT 'menunggu_pembayaran' 
    CHECK (status IN ('menunggu_pembayaran', 'menunggu_verifikasi', 'diproses', 'selesai', 'dibatalkan')),
  customer_phone text NOT NULL,
  customer_email text NULL,
  admin_notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexing orders
CREATE INDEX IF NOT EXISTS idx_orders_order_code ON public.orders(order_code);
CREATE INDEX IF NOT EXISTS idx_orders_roblox_username ON public.orders(roblox_username);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- ------------------------------------------------------------------------------
-- 4. BLACKLISTS (Daftar Pengguna / Username Bermasalah)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.blacklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  roblox_username text UNIQUE NOT NULL,
  reason text NOT NULL,
  added_by text NOT NULL DEFAULT 'Admin',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blacklists_roblox_username ON public.blacklists(roblox_username);

-- ------------------------------------------------------------------------------
-- 5. TESTIMONIALS (Ulasan & Rating Pelanggan)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code text NULL,
  roblox_username text NOT NULL,
  package_name text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL,
  is_verified boolean NOT NULL DEFAULT true,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_testimonials_visible ON public.testimonials(is_visible, created_at DESC);

-- ------------------------------------------------------------------------------
-- 6. ID_ACTIVATIONS (Aktivasi ID Roblox di Server Vexlyn)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.id_activations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  roblox_username text NOT NULL,
  roblox_user_id text NULL,
  server_region text NOT NULL DEFAULT 'Asia',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'expired')),
  activated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NULL,
  notes text NULL
);

CREATE INDEX IF NOT EXISTS idx_id_activations_username ON public.id_activations(roblox_username);
CREATE INDEX IF NOT EXISTS idx_id_activations_status ON public.id_activations(status);

-- ------------------------------------------------------------------------------
-- 7. STORE_SETTINGS (Konfigurasi & Pengaturan Toko)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_settings (
  setting_key text PRIMARY KEY,
  setting_value text NOT NULL,
  description text NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 8. STORAGE_CLEANUP_LOGS (Log Pembersihan Bukti Transfer Kadaluarsa)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.storage_cleanup_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deleted_count integer NOT NULL DEFAULT 0,
  details text NULL,
  executed_at timestamptz NOT NULL DEFAULT now()
);

-- ==============================================================================
-- SEED DATA AWAL (DEFAULT SYSTEM DATA)
-- ==============================================================================

-- 1. Default Admin Akun
INSERT INTO public.profiles (username, email, role, full_name, phone)
VALUES ('admin', 'admin@vexlyn.id', 'admin', 'Administrator Vexlyn', '088230515875')
ON CONFLICT (username) DO NOTHING;

-- 2. Katalog 12 Paket Resmi Vexlyn (IDR Rupiah)
INSERT INTO public.products (code, name, robux_amount, bonus_robux, price_idr, is_promo, is_popular, is_sultan, display_order)
VALUES
  ('RBX-1800',  '1.800 Robux',  1800,  0, 35000,  false, false, false, 1),
  ('RBX-2200',  '2.200 Robux',  2200,  0, 45000,  false, false, false, 2),
  ('RBX-2700',  '2.700 Robux',  2700,  0, 50000,  true,  true,  false, 3),
  ('RBX-3200',  '3.200 Robux',  3200,  0, 60000,  false, false, false, 4),
  ('RBX-3700',  '3.700 Robux',  3700,  0, 70000,  false, true,  false, 5),
  ('RBX-4200',  '4.200 Robux',  4200,  0, 80000,  false, false, false, 6),
  ('RBX-4300',  '4.300 Robux',  4300,  0, 90000,  false, false, false, 7),
  ('RBX-5500',  '5.500 Robux',  5500,  0, 100000, false, false, false, 8),
  ('RBX-11500', '11.500 Robux', 11500, 0, 200000, false, false, true,  9),
  ('RBX-15500', '15.500 Robux', 15500, 0, 300000, false, false, true,  10),
  ('RBX-20500', '20.500 Robux', 20500, 0, 400000, false, false, true,  11),
  ('RBX-30500', '30.500 Robux', 30500, 0, 500000, false, false, true,  12)
ON CONFLICT (code) DO UPDATE 
SET 
  price_idr = EXCLUDED.price_idr,
  robux_amount = EXCLUDED.robux_amount,
  is_promo = EXCLUDED.is_promo,
  is_popular = EXCLUDED.is_popular,
  is_sultan = EXCLUDED.is_sultan;

-- 3. Default Store Settings
INSERT INTO public.store_settings (setting_key, setting_value, description)
VALUES
  ('store_name', 'Vexlyn ID', 'Nama brand toko'),
  ('store_tagline', 'Top Up Robux Resmi, Cepat & Terpercaya', 'Tagline utama di homepage'),
  ('whatsapp_cs', '088230515875', 'Nomor Customer Service WhatsApp'),
  ('whatsapp_url', 'https://wa.me/6288230515875', 'Link langsung chat WhatsApp'),
  ('qris_nmid', 'ID102003881023', 'NMID QRIS Toko'),
  ('announcement', 'Selamat datang di Vexlyn! Top up Robux via ID Roblox proses instan & aman.', 'Pengumuman banner website'),
  ('min_sultan_robux', '10000', 'Batas minimal robux untuk mendapatkan badge Sultan otomatis')
ON CONFLICT (setting_key) DO UPDATE 
SET setting_value = EXCLUDED.setting_value;

-- 4. Initial Testimonials (Contoh review awal yang terverifikasi)
INSERT INTO public.testimonials (roblox_username, package_name, rating, comment, is_verified, is_visible)
VALUES
  ('DimasGamerz', '5.000 Robux', 5, 'Prosesnya gila cepet banget ga nyampe 2 menit robux langsung landing! Trusted parah Vexlyn.', true, true),
  ('NabilaChan', '10.000 Robux', 5, 'Awalnya ragu karena harganya murah, tapi pas coba beneran masuk! Adminnya ramah banget lagi.', true, true),
  ('RafiBlox99', '1.800 Robux', 5, 'Metode QRIS sat-set tinggal scan, ga pake ribet password akun cuma butuh username doang.', true, true),
  ('LordSultan99', '30.500 Robux', 5, 'Langsung borong 30.5k Robux buat gacha limited item, mantap Vexlyn nomer satu!', true, true)
ON CONFLICT DO NOTHING;
