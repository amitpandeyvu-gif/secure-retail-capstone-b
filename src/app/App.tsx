import React, { useEffect, useState } from "react";
import {
  ShoppingBag, Heart, Search, User, Menu, X, ChevronRight, Star,
  Package, Truck, CheckCircle, ArrowRight, Filter, Minus, Plus,
  Trash2, CreditCard, MapPin, Phone, Mail, ChevronDown, ChevronUp,
  Eye, BarChart2, Users, ShoppingCart, DollarSign,
  TrendingUp, Bell, Settings, LogOut, Edit, Trash, Upload, Tag,
  MessageSquare, Box, Globe, AlertCircle, Clock, Check,
  Download, MoreVertical, Home, ArrowLeft, Lock, Award,
  Layers, Instagram, Facebook, Twitter, Youtube, RefreshCw, Shield
} from "lucide-react";
import {
  AreaChart, Area, BarChart as RechBar, Bar, PieChart as RechPie,
  Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

type Page =
  | "home" | "login" | "signup" | "forgot-password" | "dashboard"
  | "shop" | "product" | "cart" | "checkout" | "order-confirmation"
  | "orders" | "wishlist" | "profile" | "about" | "contact" | "faq"
  | "admin-login" | "admin-dashboard" | "admin-products" | "admin-categories"
  | "admin-orders" | "admin-customers" | "admin-inventory" | "admin-promotions"
  | "admin-reviews" | "admin-analytics" | "admin-settings" | "admin-profile";

interface Product {
  id: number; name: string; brand: string;
  price: number; originalPrice?: number;
  category: string; gender: string;
  colors: string[]; sizes: string[];
  image: string; rating: number; reviewCount: number;
  isNew?: boolean; isSale?: boolean; description: string;
}

interface CartItem { product: Product; quantity: number; size: string; color: string; }
type UserRole = "guest" | "customer" | "admin";
type AdminCustomer = typeof ADMIN_CUSTOMERS[number];
type AdminOrder = typeof ADMIN_ORDERS[number];
type InventoryItem = typeof INVENTORY[number];
type Promotion = typeof PROMOTIONS[number];
type Review = typeof REVIEWS[number];

interface SessionUser {
  name: string;
  email: string;
  role: Exclude<UserRole, "guest">;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const PRODUCTS: Product[] = [
  { id: 1, name: "Amit Signature Wool Blazer", brand: "Amit Pandey Studio", price: 349, category: "outerwear", gender: "women", colors: ["black", "camel", "grey"], sizes: ["XS","S","M","L","XL"], image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=800&fit=crop&auto=format", rating: 4.9, reviewCount: 87, isNew: true, description: "A structured wool-blend blazer with an oversized editorial silhouette, sharp lapels, and a relaxed shoulder for everyday styling." },
  { id: 2, name: "Organic Heavyweight Tee", brand: "Amit Pandey Studio", price: 89, category: "tops", gender: "unisex", colors: ["black","white","grey"], sizes: ["XS","S","M","L","XL","XXL"], image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=800&fit=crop&auto=format", rating: 4.7, reviewCount: 243, description: "A premium organic cotton tee with dropped shoulders, compact jersey weight, and a clean neckline for repeat wear." },
  { id: 3, name: "Utility Wide-Leg Cargo", brand: "Amit Pandey Studio", price: 189, originalPrice: 249, category: "bottoms", gender: "unisex", colors: ["black","olive","beige"], sizes: ["XS","S","M","L","XL"], image: "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=600&h=800&fit=crop&auto=format", rating: 4.8, reviewCount: 156, isSale: true, description: "Wide-leg cargo trousers cut from durable twill with utility pockets, tonal stitching, and a soft washed finish." },
  { id: 4, name: "Cloud Runner Sneaker", brand: "Amit Pandey Studio", price: 229, category: "footwear", gender: "unisex", colors: ["white","black","grey"], sizes: ["36","37","38","39","40","41","42","43","44"], image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=800&fit=crop&auto=format", rating: 4.6, reviewCount: 312, isNew: true, description: "A lightweight everyday runner with breathable mesh, cushioned sole support, and minimal reflective detailing." },
  { id: 5, name: "Sculpted Leather Crossbody", brand: "Amit Pandey Studio", price: 299, originalPrice: 399, category: "accessories", gender: "women", colors: ["black","tan","white"], sizes: ["One Size"], image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&h=800&fit=crop&auto=format", rating: 4.9, reviewCount: 67, isSale: true, description: "A compact crossbody in full-grain leather with sculpted edges, gold-tone hardware, and an adjustable padded strap." },
  { id: 6, name: "Merino Rib Mock-Neck", brand: "Amit Pandey Studio", price: 159, category: "tops", gender: "women", colors: ["cream","black","terracotta"], sizes: ["XS","S","M","L"], image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&h=800&fit=crop&auto=format", rating: 4.8, reviewCount: 98, isNew: true, description: "A fine-gauge merino blend knit with a ribbed surface, soft mock-neck, and slim shape for layering." },
  { id: 7, name: "Tapered Stretch Chino", brand: "Amit Pandey Studio", price: 149, category: "bottoms", gender: "men", colors: ["navy","beige","charcoal"], sizes: ["28x30","30x30","32x30","32x32","34x32"], image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&h=800&fit=crop&auto=format", rating: 4.5, reviewCount: 134, description: "A clean tapered chino in stretch cotton twill, finished with minimal hardware and a polished everyday fit." },
  { id: 8, name: "Archive Graphic Hoodie", brand: "Amit Pandey Studio", price: 179, category: "tops", gender: "unisex", colors: ["black","white","grey"], sizes: ["S","M","L","XL","XXL"], image: "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&h=800&fit=crop&auto=format", rating: 4.7, reviewCount: 201, description: "A heavyweight fleece hoodie with a brushed interior, oversized hood, and limited-run studio artwork." },
  { id: 9, name: "Black Bias Silk Slip Dress", brand: "Amit Pandey Studio", price: 319, originalPrice: 429, category: "dresses", gender: "women", colors: ["black","champagne","burgundy"], sizes: ["XS","S","M","L"], image: "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=600&h=800&fit=crop&auto=format", rating: 4.9, reviewCount: 145, isSale: true, description: "A bias-cut slip dress in fluid silk-charmeuse with adjustable straps and a clean evening-ready drape." },
  { id: 10, name: "Red Tulle City Gown", brand: "Amit Pandey Studio", price: 389, category: "dresses", gender: "women", colors: ["red","scarlet"], sizes: ["XS","S","M","L"], image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=800&fit=crop&auto=format", rating: 4.9, reviewCount: 118, isNew: true, description: "A statement red dress with sheer tulle volume, fitted bodice, and an editorial street-style finish." },
  { id: 11, name: "White Pleated Column Dress", brand: "Amit Pandey Studio", price: 279, category: "dresses", gender: "women", colors: ["white","ivory"], sizes: ["XS","S","M","L","XL"], image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&h=800&fit=crop&auto=format", rating: 4.8, reviewCount: 92, isNew: true, description: "A white pleated column dress with soft movement, relaxed sleeves, and a high-fashion city mood." },
  { id: 12, name: "Sunset Linen Midi Dress", brand: "Amit Pandey Studio", price: 229, category: "dresses", gender: "women", colors: ["orange","coral","saffron"], sizes: ["XS","S","M","L"], image: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&h=800&fit=crop&auto=format", rating: 4.7, reviewCount: 81, isNew: true, description: "A bright linen midi with a relaxed shape, breathable texture, and a Pinterest-style vacation edit feel." },
  { id: 13, name: "Lilac Cloud Organza Dress", brand: "Amit Pandey Studio", price: 449, category: "dresses", gender: "women", colors: ["lilac","lavender"], sizes: ["XS","S","M"], image: "https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?w=600&h=800&fit=crop&auto=format", rating: 4.9, reviewCount: 64, description: "A dramatic organza mini dress with soft sculptural volume, pastel tone, and special-occasion energy." },
  { id: 14, name: "Maroon Evening Wrap Dress", brand: "Amit Pandey Studio", price: 259, originalPrice: 329, category: "dresses", gender: "women", colors: ["maroon","wine"], sizes: ["XS","S","M","L"], image: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=600&h=800&fit=crop&auto=format", rating: 4.8, reviewCount: 104, isSale: true, description: "An elegant wrap dress with a deep maroon tone, soft waist tie, and refined evening silhouette." },
  { id: 15, name: "Structured Everyday Tote", brand: "Amit Pandey Studio", price: 259, category: "accessories", gender: "unisex", colors: ["black","tan"], sizes: ["One Size"], image: "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=600&h=800&fit=crop&auto=format", rating: 4.6, reviewCount: 88, isNew: true, description: "A spacious architectural tote made for laptops, daily essentials, and clean city styling." },
  { id: 16, name: "Washed Linen Button-Down", brand: "Amit Pandey Studio", price: 129, category: "tops", gender: "men", colors: ["white","sky","sage"], sizes: ["S","M","L","XL"], image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600&h=800&fit=crop&auto=format", rating: 4.7, reviewCount: 167, description: "A relaxed linen shirt with two chest pockets, roll-sleeve tabs, and a soft washed finish." },
  { id: 17, name: "Platform Chelsea Boot", brand: "Amit Pandey Studio", price: 289, originalPrice: 359, category: "footwear", gender: "women", colors: ["black","tan"], sizes: ["36","37","38","39","40","41"], image: "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600&h=800&fit=crop&auto=format", rating: 4.8, reviewCount: 73, isSale: true, description: "A bold leather Chelsea boot with a raised platform sole, elastic side panels, and everyday stability." },
  { id: 18, name: "Silver Studio Mini Dress", brand: "Amit Pandey Studio", price: 299, category: "dresses", gender: "women", colors: ["silver","grey"], sizes: ["XS","S","M","L"], image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&h=800&fit=crop&auto=format", rating: 4.7, reviewCount: 76, description: "A modern mini dress with metallic grey tone, clean neckline, and sharp after-dark styling." },
];

const SAMPLE_ORDERS = [
  { id: "AP-2026-1041", date: "Jun 18, 2026", status: "delivered", items: 3, total: 767, tracking: "APX7812045591" },
  { id: "AP-2026-1048", date: "Jun 24, 2026", status: "shipped", items: 1, total: 389, tracking: "APX7812045792" },
  { id: "AP-2026-1053", date: "Jun 29, 2026", status: "processing", items: 2, total: 578, tracking: null },
];

const MONTHLY_DATA = [
  { month: "Jan", revenue: 42000, orders: 320 }, { month: "Feb", revenue: 38000, orders: 290 },
  { month: "Mar", revenue: 55000, orders: 410 }, { month: "Apr", revenue: 61000, orders: 470 },
  { month: "May", revenue: 57000, orders: 440 }, { month: "Jun", revenue: 73000, orders: 580 },
  { month: "Jul", revenue: 68000, orders: 520 }, { month: "Aug", revenue: 82000, orders: 640 },
  { month: "Sep", revenue: 79000, orders: 610 }, { month: "Oct", revenue: 91000, orders: 710 },
  { month: "Nov", revenue: 105000, orders: 830 }, { month: "Dec", revenue: 127000, orders: 980 },
];

const PIE_DATA = [
  { name: "Delivered", value: 68, color: "#0a0a0a" },
  { name: "Processing", value: 18, color: "#c8a97e" },
  { name: "Shipped", value: 10, color: "#9b9b9b" },
  { name: "Cancelled", value: 4, color: "#e0e0e0" },
];

const CATEGORY_DATA = [
  { category: "Dresses", sales: 5400 }, { category: "Tops", sales: 3200 },
  { category: "Footwear", sales: 4100 }, { category: "Bottoms", sales: 2800 },
  { category: "Accessories", sales: 1900 }, { category: "Outerwear", sales: 2200 },
];

const ADMIN_CUSTOMERS = [
  { id: 1, name: "Nisha Sharma", email: "nisha.sharma@example.com", orders: 14, spent: 2847, joined: "Mar 2025", status: "vip" },
  { id: 2, name: "Riya Kapoor", email: "riya.kapoor@example.com", orders: 8, spent: 1654, joined: "Jun 2025", status: "active" },
  { id: 3, name: "Ananya Rao", email: "ananya.rao@example.com", orders: 23, spent: 5231, joined: "Jan 2025", status: "vip" },
  { id: 4, name: "Kabir Mehta", email: "kabir.mehta@example.com", orders: 3, spent: 437, joined: "Oct 2025", status: "active" },
  { id: 5, name: "Aisha Khan", email: "aisha.khan@example.com", orders: 31, spent: 7892, joined: "Nov 2025", status: "vip" },
  { id: 6, name: "Dev Malhotra", email: "dev.malhotra@example.com", orders: 2, spent: 298, joined: "Jun 2026", status: "active" },
];

const ADMIN_ORDERS = [
  { id: "AP-2026-1053", customer: "Ananya Rao", product: "Red Tulle City Gown", date: "Jun 29, 2026", amount: 389, status: "processing" },
  { id: "AP-2026-1052", customer: "Kabir Mehta", product: "Cloud Runner Sneaker", date: "Jun 29, 2026", amount: 229, status: "shipped" },
  { id: "AP-2026-1051", customer: "Nisha Sharma", product: "Amit Signature Wool Blazer", date: "Jun 28, 2026", amount: 349, status: "delivered" },
  { id: "AP-2026-1050", customer: "Aisha Khan", product: "Sculpted Leather Crossbody", date: "Jun 28, 2026", amount: 299, status: "delivered" },
  { id: "AP-2026-1049", customer: "Riya Kapoor", product: "Utility Wide-Leg Cargo", date: "Jun 27, 2026", amount: 189, status: "shipped" },
  { id: "AP-2026-1048", customer: "Dev Malhotra", product: "Archive Graphic Hoodie", date: "Jun 27, 2026", amount: 179, status: "processing" },
];

const INVENTORY = [
  { id: 1, name: "Organic Heavyweight Tee", sku: "APS-TOP-001", stock: 312, sold: 243, low: false },
  { id: 2, name: "Cloud Runner Sneaker", sku: "APS-FTW-004", stock: 18, sold: 312, low: true },
  { id: 3, name: "Red Tulle City Gown", sku: "APS-DRS-010", stock: 7, sold: 118, low: true },
  { id: 4, name: "Utility Wide-Leg Cargo", sku: "APS-BTM-003", stock: 89, sold: 156, low: false },
  { id: 5, name: "Amit Signature Wool Blazer", sku: "APS-OUT-001", stock: 44, sold: 87, low: false },
  { id: 6, name: "Platform Chelsea Boot", sku: "APS-FTW-017", stock: 12, sold: 73, low: true },
  { id: 7, name: "Sculpted Leather Crossbody", sku: "APS-NSC-005", stock: 34, sold: 67, low: false },
  { id: 8, name: "Black Bias Silk Slip Dress", sku: "APS-DRS-009", stock: 22, sold: 145, low: false },
];

const PROMOTIONS = [
  { id: 1, code: "AMIT30", type: "Percentage", value: "30%", minOrder: "$100", uses: 847, limit: 1000, expires: "Jul 31, 2026", status: "active" },
  { id: 2, code: "NEWSTUDIO15", type: "Percentage", value: "15%", minOrder: "$0", uses: 2341, limit: null, expires: "Dec 31, 2026", status: "active" },
  { id: 3, code: "FREESHIP", type: "Free Shipping", value: "100%", minOrder: "$75", uses: 1203, limit: null, expires: "Sep 30, 2026", status: "active" },
  { id: 4, code: "FLASH50", type: "Fixed", value: "$50", minOrder: "$200", uses: 500, limit: 500, expires: "Jun 15, 2026", status: "expired" },
];

const REVIEWS = [
  { id: 1, product: "Amit Signature Wool Blazer", customer: "Nisha S.", rating: 5, comment: "The cut feels premium and photographs beautifully. It instantly makes the whole outfit look sharper.", date: "Jun 25, 2026", status: "published" },
  { id: 2, product: "Cloud Runner Sneaker", customer: "Kabir M.", rating: 4, comment: "Comfortable for full-day wear and easy to style with cargos or denim.", date: "Jun 23, 2026", status: "published" },
  { id: 3, product: "Red Tulle City Gown", customer: "Ananya R.", rating: 5, comment: "This dress is dramatic in the best way. The color, volume, and movement are perfect for events.", date: "Jun 22, 2026", status: "pending" },
  { id: 4, product: "Archive Graphic Hoodie", customer: "Dev M.", rating: 4, comment: "Heavy fabric, clean print, and a better fit than most oversized hoodies.", date: "Jun 20, 2026", status: "pending" },
  { id: 5, product: "Platform Chelsea Boot", customer: "Aisha K.", rating: 5, comment: "The platform gives height without feeling uncomfortable. Looks great with dresses too.", date: "Jun 18, 2026", status: "published" },
];

// ─── Shared Components ────────────────────────────────────────────────────────

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={size} className={i <= Math.round(rating) ? "fill-[#c8a97e] text-[#c8a97e]" : "text-gray-200 fill-gray-200"} />
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    processing: "bg-amber-50 text-amber-700 border border-amber-200",
    shipped: "bg-blue-50 text-blue-700 border border-blue-200",
    delivered: "bg-green-50 text-green-700 border border-green-200",
    cancelled: "bg-red-50 text-red-700 border border-red-200",
    active: "bg-green-50 text-green-700 border border-green-200",
    inactive: "bg-gray-100 text-gray-500 border border-gray-200",
    vip: "bg-[#f5f0e8] text-[#8a6d3b] border border-[#c8a97e]/30",
    published: "bg-green-50 text-green-700 border border-green-200",
    pending: "bg-amber-50 text-amber-700 border border-amber-200",
    expired: "bg-gray-100 text-gray-500 border border-gray-200",
    "low-stock": "bg-red-50 text-red-700 border border-red-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${cfg[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

function ProductCard({ product, navigate, onWishlistToggle, isWishlisted, onAddToCart, onProductSelect }: {
  product: Product; navigate: (p: Page) => void;
  onWishlistToggle?: (id: number) => void; isWishlisted?: boolean;
  onAddToCart?: (p: Product, quantity?: number, size?: string, color?: string) => void; onProductSelect?: (p: Product) => void;
}) {
  return (
    <div className="group cursor-pointer" onClick={() => { onProductSelect?.(product); navigate("product"); }}>
      <div className="relative overflow-hidden bg-gray-50 aspect-[3/4] mb-3">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        {product.isNew && <span className="absolute top-3 left-3 bg-black text-white text-[10px] font-semibold tracking-widest px-2 py-1">NEW</span>}
        {product.isSale && <span className="absolute top-3 left-3 bg-[#c8a97e] text-white text-[10px] font-semibold tracking-widest px-2 py-1">SALE</span>}
        <button
          className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={e => { e.stopPropagation(); onWishlistToggle?.(product.id); }}
        >
          <Heart size={14} className={isWishlisted ? "fill-black text-black" : "text-gray-400"} />
        </button>
        <button
          className="absolute bottom-0 left-0 right-0 bg-black text-white text-xs tracking-widest font-semibold py-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300"
          onClick={e => { e.stopPropagation(); onAddToCart?.(product); }}
        >
          QUICK ADD
        </button>
      </div>
      <div className="space-y-1">
        <p className="text-[11px] text-gray-400 tracking-widest uppercase">{product.brand}</p>
        <p className="text-sm font-medium text-gray-900 leading-snug">{product.name}</p>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">${product.price}</span>
          {product.originalPrice && <span className="text-sm text-gray-400 line-through">${product.originalPrice}</span>}
        </div>
      </div>
    </div>
  );
}

// ─── Customer Navbar ──────────────────────────────────────────────────────────

function CustomerNav({ page, navigate, cartCount, wishlistCount, isLoggedIn }: {
  page: Page; navigate: (p: Page) => void;
  cartCount: number; wishlistCount: number; isLoggedIn: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#e8e8e8]">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <button className="lg:hidden text-gray-700" onClick={() => setMenuOpen(true)}><Menu size={22} /></button>
          <nav className="hidden lg:flex items-center gap-8">
            {[["Shop","shop"],["New In","shop"],["Sale","shop"],["About","about"]].map(([label, pg]) => (
              <button key={label} onClick={() => navigate(pg as Page)} className="text-[13px] font-medium tracking-wide text-gray-700 hover:text-black transition-colors">{label}</button>
            ))}
          </nav>
          <button onClick={() => navigate("home")} className="text-xl tracking-[0.2em] font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            POPCULTURE
          </button>
          <div className="flex items-center gap-4">
            {searchOpen ? (
              <div className="flex items-center gap-2 border-b border-black pb-1">
                <input autoFocus className="text-sm outline-none w-40" placeholder="Search..." />
                <button onClick={() => setSearchOpen(false)}><X size={16} /></button>
              </div>
            ) : (
              <button onClick={() => setSearchOpen(true)}><Search size={20} className="text-gray-700" /></button>
            )}
            <button onClick={() => navigate(isLoggedIn ? "dashboard" : "login")}><User size={20} className="text-gray-700" /></button>
            <button onClick={() => navigate("wishlist")} className="relative">
              <Heart size={20} className="text-gray-700" />
              {wishlistCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-black text-white text-[9px] rounded-full flex items-center justify-center">{wishlistCount}</span>}
            </button>
            <button onClick={() => navigate("cart")} className="relative">
              <ShoppingBag size={20} className="text-gray-700" />
              {cartCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-black text-white text-[9px] rounded-full flex items-center justify-center">{cartCount}</span>}
            </button>
          </div>
        </div>
        <nav className="hidden lg:flex items-center gap-6 py-2 border-t border-[#f0f0f0] text-[11px] tracking-widest text-gray-500 uppercase">
          {["Women","Men","Streetwear","Footwear","Accessories","Dresses","Sale"].map(c => (
            <button key={c} onClick={() => navigate("shop")} className="hover:text-black transition-colors">{c}</button>
          ))}
        </nav>
      </div>
      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col p-6">
          <div className="flex justify-between items-center mb-8">
            <span className="text-xl tracking-[0.2em] font-semibold" style={{ fontFamily: "var(--font-display)" }}>POPCULTURE</span>
            <button onClick={() => setMenuOpen(false)}><X size={24} /></button>
          </div>
          <nav className="flex flex-col gap-6">
            {[["Shop","shop"],["New In","shop"],["Sale","shop"],["About","about"],["Contact","contact"],["FAQs","faq"]].map(([l,p]) => (
              <button key={l} className="text-left text-2xl font-light" style={{ fontFamily: "var(--font-display)" }} onClick={() => { navigate(p as Page); setMenuOpen(false); }}>{l}</button>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

function CustomerFooter({ navigate }: { navigate: (p: Page) => void }) {
  return (
    <footer className="bg-[#0a0a0a] text-white mt-24">
      <div className="max-w-[1400px] mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div>
          <div className="text-xl tracking-[0.2em] font-semibold mb-4" style={{ fontFamily: "var(--font-display)" }}>POPCULTURE</div>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">Premium fashion rooted in culture. Designed for the bold, worn by the confident.</p>
          <div className="flex gap-4">
            {[Instagram, Facebook, Twitter, Youtube].map((Icon, i) => (
              <button key={i} className="w-9 h-9 border border-white/20 rounded-full flex items-center justify-center hover:border-[#c8a97e] hover:text-[#c8a97e] transition-colors">
                <Icon size={15} />
              </button>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-xs tracking-widest uppercase text-gray-400 mb-5">Shop</h4>
          <div className="flex flex-col gap-3">
            {["New Arrivals","Women","Men","Footwear","Accessories","Sale"].map(l => (
              <button key={l} onClick={() => navigate("shop")} className="text-sm text-gray-300 hover:text-white text-left transition-colors">{l}</button>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-xs tracking-widest uppercase text-gray-400 mb-5">Help</h4>
          <div className="flex flex-col gap-3">
            {[["FAQs","faq"],["Contact Us","contact"],["Shipping","faq"],["Returns","faq"],["Size Guide","faq"]].map(([l,p]) => (
              <button key={l} onClick={() => navigate(p as Page)} className="text-sm text-gray-300 hover:text-white text-left transition-colors">{l}</button>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-xs tracking-widest uppercase text-gray-400 mb-5">Stay in the Loop</h4>
          <p className="text-sm text-gray-400 mb-4">Get early access to drops, exclusive offers, and style inspiration.</p>
          <div className="flex border border-white/20 rounded">
            <input className="flex-1 bg-transparent text-sm text-white px-4 py-2.5 outline-none placeholder:text-gray-600" placeholder="Your email" />
            <button className="bg-white text-black text-xs font-semibold px-4 hover:bg-[#c8a97e] transition-colors">JOIN</button>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-6 py-6 max-w-[1400px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-xs text-gray-500">&copy; 2026 Amit Pandey Studio. All rights reserved.</p>
        <div className="flex gap-6 text-xs text-gray-500">
          <button className="hover:text-gray-300">Privacy Policy</button>
          <button className="hover:text-gray-300">Terms of Service</button>
          <button className="hover:text-gray-300">Cookie Settings</button>
        </div>
      </div>
    </footer>
  );
}

// ─── Home Page ────────────────────────────────────────────────────────────────

function HomePage({ navigate, products, onAddToCart, wishlist, onWishlistToggle, onProductSelect }: {
  navigate: (p: Page) => void; onAddToCart: (p: Product, quantity?: number, size?: string, color?: string) => void;
  products: Product[]; wishlist: number[]; onWishlistToggle: (id: number) => void; onProductSelect: (p: Product) => void;
}) {
  const categories = [
    { label: "Women", img: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=500&fit=crop&auto=format" },
    { label: "Men", img: "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=400&h=500&fit=crop&auto=format" },
    { label: "Streetwear", img: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=400&h=500&fit=crop&auto=format" },
    { label: "Footwear", img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=500&fit=crop&auto=format" },
    { label: "Accessories", img: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=500&fit=crop&auto=format" },
    { label: "Sale", img: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=500&fit=crop&auto=format" },
  ];
  const testimonials = [
    { name: "Aria K.", location: "London", text: "PopCulture completely changed how I think about my wardrobe. Everything is considered — the quality, the fit, the details. Nothing comes close.", rating: 5 },
    { name: "Jordan M.", location: "Sydney", text: "I've been shopping here for two years and the quality never wavers. My Wool Blazer is still perfect after 18 months of heavy use.", rating: 5 },
    { name: "Sasha T.", location: "Sydney", text: "The Black Bias Silk Slip Dress was the best purchase I've made this year. Three sizes tried, one perfect fit. Their size guide is genuinely accurate.", rating: 5 },
  ];
  const igImages = [
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&h=300&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=300&h=300&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=300&h=300&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=300&h=300&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=300&h=300&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop&auto=format",
  ];
  return (
    <div>
      {/* Hero */}
      <section className="relative h-[92vh] min-h-[600px] bg-gray-900 overflow-hidden">
        <img src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1920&h=1080&fit=crop&auto=format" alt="Hero" className="absolute inset-0 w-full h-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
        <div className="relative h-full flex items-end pb-20 px-8 md:px-16 max-w-[1400px] mx-auto">
          <div className="max-w-2xl">
            <p className="text-[11px] tracking-[0.4em] text-[#c8a97e] uppercase mb-4 font-medium">New Season — SS25</p>
            <h1 className="text-6xl md:text-8xl text-white leading-none mb-6" style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}>
              Culture<br />Defines<br />Style.
            </h1>
            <p className="text-white/70 text-base mb-8 max-w-md leading-relaxed">Explore the new season collection — pieces built to last, designed to define.</p>
            <div className="flex gap-4">
              <button onClick={() => navigate("shop")} className="bg-white text-black px-8 py-4 text-[12px] tracking-widest font-semibold hover:bg-[#c8a97e] transition-colors">SHOP NOW</button>
              <button onClick={() => navigate("shop")} className="border border-white text-white px-8 py-4 text-[12px] tracking-widest font-semibold hover:bg-white/10 transition-colors">VIEW LOOKBOOK</button>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee ticker */}
      <div className="bg-black text-white py-3 overflow-hidden">
        <div className="flex whitespace-nowrap animate-[marquee_20s_linear_infinite]">
          {Array(3).fill(["FREE SHIPPING ON ORDERS OVER $150", "·", "NEW ARRIVALS EVERY FRIDAY", "·", "30-DAY RETURNS", "·", "SHOP THE SUMMER SALE — UP TO 40% OFF", "·"]).flat().map((t, i) => (
            <span key={i} className="text-[11px] tracking-[0.3em] mx-6">{t}</span>
          ))}
        </div>
      </div>

      {/* Categories */}
      <section className="max-w-[1400px] mx-auto px-6 py-20">
        <div className="flex items-end justify-between mb-10">
          <h2 className="text-3xl" style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}>Shop by Category</h2>
          <button onClick={() => navigate("shop")} className="text-[12px] tracking-widest text-gray-500 hover:text-black flex items-center gap-2">VIEW ALL <ArrowRight size={14} /></button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map(({ label, img }) => (
            <button key={label} onClick={() => navigate("shop")} className="group relative aspect-[3/4] overflow-hidden bg-gray-100">
              <img src={img} alt={label} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors" />
              <div className="absolute inset-0 flex items-end p-4">
                <span className="text-white font-semibold text-sm tracking-wide">{label}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Featured Collection */}
      <section className="bg-[#f5f0e8] py-20">
        <div className="max-w-[1400px] mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-[11px] tracking-[0.4em] text-[#c8a97e] uppercase mb-4">Featured Collection</p>
            <h2 className="text-5xl leading-tight mb-6" style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}>The Essential<br />Edit SS25</h2>
            <p className="text-gray-600 leading-relaxed mb-8">Curated pieces that form the cornerstone of a considered wardrobe. Quiet luxury, enduring quality — each item selected to work harder and last longer.</p>
            <button onClick={() => navigate("shop")} className="bg-black text-white px-8 py-4 text-[12px] tracking-widest font-semibold hover:bg-gray-800 transition-colors inline-flex items-center gap-3">EXPLORE EDIT <ArrowRight size={14} /></button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=500&fit=crop&auto=format" alt="Collection 1" className="w-full h-72 object-cover" />
            <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=500&fit=crop&auto=format" alt="Collection 2" className="w-full h-72 mt-8 object-cover" />
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="max-w-[1400px] mx-auto px-6 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-[11px] tracking-[0.4em] text-gray-400 uppercase mb-2">Just Landed</p>
            <h2 className="text-3xl" style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}>New Arrivals</h2>
          </div>
          <button onClick={() => navigate("shop")} className="text-[12px] tracking-widest text-gray-500 hover:text-black flex items-center gap-2">SEE ALL <ArrowRight size={14} /></button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {products.filter(p => p.isNew).slice(0, 4).map(p => (
            <ProductCard key={p.id} product={p} navigate={navigate} isWishlisted={wishlist.includes(p.id)} onWishlistToggle={onWishlistToggle} onAddToCart={onAddToCart} onProductSelect={onProductSelect} />
          ))}
        </div>
      </section>

      {/* Sale Banner */}
      <section className="bg-black py-20 text-center text-white">
        <p className="text-[11px] tracking-[0.5em] text-[#c8a97e] uppercase mb-4">Limited Time</p>
        <h2 className="text-6xl mb-4" style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}>Up to 40% Off</h2>
        <p className="text-gray-400 mb-8">Shop the season-end sale — selected styles reduced while stocks last.</p>
        <button onClick={() => navigate("shop")} className="border border-white text-white px-10 py-4 text-[12px] tracking-widest font-semibold hover:bg-white hover:text-black transition-colors">SHOP THE SALE</button>
      </section>

      {/* Trending */}
      <section className="max-w-[1400px] mx-auto px-6 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-[11px] tracking-[0.4em] text-gray-400 uppercase mb-2">Most Wanted</p>
            <h2 className="text-3xl" style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}>Trending Now</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {products.filter(p => p.isSale || p.reviewCount > 100).slice(0, 4).map(p => (
            <ProductCard key={p.id} product={p} navigate={navigate} isWishlisted={wishlist.includes(p.id)} onWishlistToggle={onWishlistToggle} onAddToCart={onAddToCart} onProductSelect={onProductSelect} />
          ))}
        </div>
      </section>

      {/* Why PopCulture */}
      <section className="border-t border-b border-[#e8e8e8] py-16">
        <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { icon: Truck, title: "Free Shipping", sub: "On orders over $150" },
            { icon: RefreshCw, title: "30-Day Returns", sub: "Hassle-free returns" },
            { icon: Shield, title: "Secure Checkout", sub: "256-bit SSL encryption" },
            { icon: Award, title: "Ethically Made", sub: "Responsible production" },
          ].map(({ icon: Icon, title, sub }) => (
            <div key={title} className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border border-[#e8e8e8] rounded-full flex items-center justify-center">
                <Icon size={20} className="text-gray-700" />
              </div>
              <div>
                <p className="font-semibold text-sm">{title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-[1400px] mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <p className="text-[11px] tracking-[0.4em] text-gray-400 uppercase mb-3">What They Say</p>
          <h2 className="text-3xl" style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}>Customer Stories</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t) => (
            <div key={t.name} className="bg-[#f8f8f8] p-8">
              <StarRating rating={t.rating} />
              <p className="text-gray-700 leading-relaxed my-5 text-sm">&ldquo;{t.text}&rdquo;</p>
              <div>
                <p className="font-semibold text-sm">{t.name}</p>
                <p className="text-xs text-gray-400">{t.location}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-[#f5f0e8] py-20 text-center">
        <p className="text-[11px] tracking-[0.4em] text-[#c8a97e] uppercase mb-4">Exclusive Access</p>
        <h2 className="text-4xl mb-4" style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}>Join the Inner Circle</h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto text-sm leading-relaxed">Get first access to new drops, members-only discounts, and curated style notes from our team.</p>
        <div className="flex max-w-md mx-auto border border-black/20">
          <input className="flex-1 bg-transparent text-sm px-5 py-4 outline-none placeholder:text-gray-400" placeholder="Enter your email address" />
          <button className="bg-black text-white px-6 py-4 text-[11px] tracking-widest font-semibold hover:bg-gray-800 transition-colors">SUBSCRIBE</button>
        </div>
        <p className="text-[11px] text-gray-400 mt-4">No spam, ever. Unsubscribe at any time.</p>
      </section>

      {/* Instagram Grid */}
      <section className="max-w-[1400px] mx-auto px-6 py-20">
        <div className="text-center mb-10">
          <p className="text-[11px] tracking-[0.4em] text-gray-400 uppercase mb-3">Follow @popculture</p>
          <h2 className="text-3xl" style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}>Worn in the Wild</h2>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {igImages.map((img, i) => (
            <div key={i} className="group relative aspect-square overflow-hidden bg-gray-100 cursor-pointer">
              <img src={img} alt={`Instagram ${i+1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <Instagram size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── Login Page ───────────────────────────────────────────────────────────────

function LoginPage({ navigate, onLogin }: { navigate: (p: Page) => void; onLogin: (email: string, password: string) => { ok: boolean; message?: string } }) {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = onLogin(email, password);
    setError(result.ok ? "" : result.message || "Unable to sign in with those details.");
  };
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:block relative bg-gray-900">
        <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900&h=1100&fit=crop&auto=format" alt="Fashion" className="w-full h-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-16">
          <div className="text-2xl tracking-[0.2em] text-white font-semibold mb-4" style={{ fontFamily: "var(--font-display)" }}>POPCULTURE</div>
          <p className="text-white/70 text-lg italic leading-relaxed" style={{ fontFamily: "var(--font-display)" }}>"Style is a way to say who you are without having to speak."</p>
        </div>
      </div>
      <div className="flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <h1 className="text-3xl font-semibold mb-2" style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}>Welcome back</h1>
            <p className="text-gray-500 text-sm">Sign in to your PopCulture account</p>
          </div>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-[12px] font-semibold tracking-wide text-gray-700 mb-2">EMAIL OR USER ID</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="text" autoComplete="username" className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black transition-colors" placeholder="you@example.com" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-[12px] font-semibold tracking-wide text-gray-700">PASSWORD</label>
                <button type="button" onClick={() => navigate("forgot-password")} className="text-[12px] text-gray-500 hover:text-black">Forgot password?</button>
              </div>
              <div className="relative">
                <input value={password} onChange={e => setPassword(e.target.value)} type={show ? "text" : "password"} autoComplete="current-password" className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black transition-colors pr-10" placeholder="Password" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><Eye size={16} /></button>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4">
              <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="accent-black" />
                Keep me signed in
              </label>
              <span className="text-[11px] tracking-widest text-gray-400 uppercase">Role detected after login</span>
            </div>
            {error && <div className="border border-red-200 bg-red-50 text-red-700 rounded px-4 py-3 text-sm">{error}</div>}
            <button type="submit" className="w-full bg-black text-white py-4 text-[12px] tracking-widest font-semibold hover:bg-gray-800 transition-colors">SIGN IN</button>
          </form>
          <div className="mt-6 grid sm:grid-cols-2 gap-3">
            <div className="border border-[#e8e8e8] rounded p-4 bg-[#fafafa]">
              <p className="text-[11px] tracking-widest uppercase text-gray-400 mb-1">Customer demo</p>
              <p className="text-sm font-semibold">customer@popculture.com</p>
              <p className="text-xs text-gray-500 mt-1">customer123</p>
            </div>
            <div className="border border-[#e8e8e8] rounded p-4 bg-[#fafafa]">
              <p className="text-[11px] tracking-widest uppercase text-gray-400 mb-1">Amit admin</p>
              <p className="text-sm font-semibold">amit@popculture.com</p>
              <p className="text-xs text-gray-500 mt-1">amit123</p>
            </div>
          </div>
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#e8e8e8]" /></div>
            <div className="relative text-center text-xs text-gray-400 bg-white px-4 inline-block left-1/2 -translate-x-1/2">or continue with</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button className="border border-[#e8e8e8] rounded py-3 text-sm font-medium hover:bg-gray-50 flex items-center justify-center gap-2">
              <Globe size={16} /> Google
            </button>
            <button className="border border-[#e8e8e8] rounded py-3 text-sm font-medium hover:bg-gray-50 flex items-center justify-center gap-2">
              <Facebook size={16} /> Facebook
            </button>
          </div>
          <p className="text-center text-sm text-gray-500 mt-8">
            No account yet?{" "}
            <button onClick={() => navigate("signup")} className="text-black font-semibold hover:underline">Create one</button>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Sign Up Page ─────────────────────────────────────────────────────────────

function SignupPage({ navigate, onSignup }: { navigate: (p: Page) => void; onSignup: (name: string, email: string) => void }) {
  const [show, setShow] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:block relative bg-gray-900">
        <img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&h=1100&fit=crop&auto=format" alt="Fashion" className="w-full h-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-16">
          <div className="text-white/60 text-sm tracking-widest uppercase mb-4">New Member Benefits</div>
          <div className="space-y-3">
            {["15% off your first order","Early access to new drops","Free express shipping over $150","Members-only promotions"].map(b => (
              <div key={b} className="flex items-center gap-3 text-white/80 text-sm"><CheckCircle size={16} className="text-[#c8a97e]" /> {b}</div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <h1 className="text-3xl font-semibold mb-2" style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}>Create account</h1>
            <p className="text-gray-500 text-sm">Join the PopCulture community today</p>
          </div>
          <form className="space-y-4" onSubmit={e => { e.preventDefault(); onSignup(`${firstName} ${lastName}`.trim() || "PopCulture Member", email); }}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-semibold tracking-wide text-gray-700 mb-2">FIRST NAME</label>
                <input value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black transition-colors" placeholder="Nisha" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold tracking-wide text-gray-700 mb-2">LAST NAME</label>
                <input value={lastName} onChange={e => setLastName(e.target.value)} className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black transition-colors" placeholder="Sharma" />
              </div>
            </div>
            <div>
              <label className="block text-[12px] font-semibold tracking-wide text-gray-700 mb-2">EMAIL ADDRESS</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" autoComplete="email" className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black transition-colors" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-[12px] font-semibold tracking-wide text-gray-700 mb-2">PASSWORD</label>
              <div className="relative">
                <input value={password} onChange={e => setPassword(e.target.value)} type={show ? "text" : "password"} autoComplete="new-password" className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black transition-colors pr-10" placeholder="Password" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><Eye size={16} /></button>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <input type="checkbox" id="agree" className="mt-0.5 accent-black" />
              <label htmlFor="agree" className="text-xs text-gray-500 leading-relaxed">I agree to the <button type="button" className="underline">Terms of Service</button> and <button type="button" className="underline">Privacy Policy</button>. I consent to receiving marketing emails (you can unsubscribe anytime).</label>
            </div>
            <button type="submit" className="w-full bg-black text-white py-4 text-[12px] tracking-widest font-semibold hover:bg-gray-800 transition-colors">CREATE ACCOUNT</button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-8">
            Already have an account?{" "}
            <button onClick={() => navigate("login")} className="text-black font-semibold hover:underline">Sign in</button>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Forgot Password ──────────────────────────────────────────────────────────

function ForgotPasswordPage({ navigate }: { navigate: (p: Page) => void }) {
  const [sent, setSent] = useState(false);
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <button onClick={() => navigate("login")} className="flex items-center gap-2 text-sm text-gray-500 hover:text-black mb-8"><ArrowLeft size={16} /> Back to sign in</button>
        {!sent ? (
          <>
            <div className="mb-8">
              <div className="w-16 h-16 bg-[#f5f0e8] rounded-full flex items-center justify-center mb-6"><Lock size={24} className="text-[#c8a97e]" /></div>
              <h1 className="text-3xl font-semibold mb-2" style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}>Reset password</h1>
              <p className="text-gray-500 text-sm leading-relaxed">Enter your email and we&apos;ll send you a link to reset your password.</p>
            </div>
            <form className="space-y-5" onSubmit={e => { e.preventDefault(); setSent(true); }}>
              <div>
                <label className="block text-[12px] font-semibold tracking-wide text-gray-700 mb-2">EMAIL ADDRESS</label>
                <input type="email" className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black transition-colors" placeholder="you@example.com" />
              </div>
              <button type="submit" className="w-full bg-black text-white py-4 text-[12px] tracking-widest font-semibold hover:bg-gray-800 transition-colors">SEND RESET LINK</button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle size={28} className="text-green-600" /></div>
            <h1 className="text-3xl font-semibold mb-3" style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}>Check your inbox</h1>
            <p className="text-gray-500 text-sm leading-relaxed mb-8">We&apos;ve sent a reset link to your email address. It expires in 30 minutes.</p>
            <button onClick={() => navigate("login")} className="bg-black text-white px-8 py-4 text-[12px] tracking-widest font-semibold hover:bg-gray-800 transition-colors">BACK TO SIGN IN</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Customer Dashboard ───────────────────────────────────────────────────────

function DashboardPage({ navigate, products, wishlist, userName = "Nisha Sharma", onProductSelect }: { navigate: (p: Page) => void; products: Product[]; wishlist: number[]; userName?: string; onProductSelect: (p: Product) => void }) {
  const stats = [
    { label: "Orders", value: "14", icon: Package, color: "bg-blue-50 text-blue-600" },
    { label: "Wishlist", value: wishlist.length.toString(), icon: Heart, color: "bg-pink-50 text-pink-600" },
    { label: "Points", value: "2,847", icon: Award, color: "bg-[#f5f0e8] text-[#c8a97e]" },
    { label: "Saved", value: "$140", icon: DollarSign, color: "bg-green-50 text-green-600" },
  ];
  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="text-[11px] tracking-widest text-gray-400 uppercase mb-1">Welcome back</p>
          <h1 className="text-3xl" style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}>{userName}</h1>
        </div>
        <button onClick={() => navigate("profile")} className="border border-[#e8e8e8] px-5 py-2.5 text-sm font-medium hover:bg-gray-50 flex items-center gap-2"><User size={15} /> Edit Profile</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="border border-[#e8e8e8] rounded p-5">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color}`}><Icon size={18} /></div>
            <p className="text-2xl font-semibold">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-semibold">Recent Orders</h2>
            <button onClick={() => navigate("orders")} className="text-xs text-gray-500 hover:text-black">View all</button>
          </div>
          <div className="space-y-3">
            {SAMPLE_ORDERS.map(o => (
              <div key={o.id} className="border border-[#e8e8e8] rounded p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center"><Package size={16} className="text-gray-500" /></div>
                  <div>
                    <p className="text-sm font-semibold">{o.id}</p>
                    <p className="text-xs text-gray-400">{o.date} · {o.items} items</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">${o.total}</p>
                  <StatusBadge status={o.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-semibold">Wishlist</h2>
            <button onClick={() => navigate("wishlist")} className="text-xs text-gray-500 hover:text-black">View all</button>
          </div>
          <div className="space-y-3">
            {products.filter(p => wishlist.includes(p.id)).slice(0, 3).map(p => (
              <div key={p.id} className="flex items-center gap-3 border border-[#e8e8e8] rounded p-3 cursor-pointer hover:border-gray-400 transition-colors" onClick={() => { onProductSelect(p); navigate("product"); }}>
                <img src={p.image} alt={p.name} className="w-14 h-14 object-cover rounded" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-sm text-gray-500">${p.price}</p>
                </div>
                <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
              </div>
            ))}
          </div>
          <div className="border border-[#e8e8e8] rounded p-5 mt-6 bg-[#f5f0e8]">
            <p className="text-[11px] tracking-widest text-[#c8a97e] uppercase mb-2">Rewards Program</p>
            <p className="text-sm font-medium mb-3">2,847 points earned</p>
            <div className="w-full bg-white rounded-full h-2 mb-2">
              <div className="bg-[#c8a97e] h-2 rounded-full" style={{ width: "57%" }} />
            </div>
            <p className="text-xs text-gray-500">1,153 points to Platinum status</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Shop Page ────────────────────────────────────────────────────────────────

function ShopPage({ navigate, products, onAddToCart, wishlist, onWishlistToggle, onProductSelect }: {
  navigate: (p: Page) => void; onAddToCart: (p: Product, quantity?: number, size?: string, color?: string) => void;
  products: Product[]; wishlist: number[]; onWishlistToggle: (id: number) => void; onProductSelect: (p: Product) => void;
}) {
  const [selectedCategory, setSelectedCategory] = useState<string[]>([]);
  const [selectedGender, setSelectedGender] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("featured");
  const [priceMax, setPriceMax] = useState(500);
  const [filterOpen, setFilterOpen] = useState(false);

  const categories = ["tops","bottoms","outerwear","dresses","footwear","accessories"];
  const genders = ["women","men","unisex"];

  const filtered = products.filter(p => {
    if (selectedCategory.length > 0 && !selectedCategory.includes(p.category)) return false;
    if (selectedGender.length > 0 && !selectedGender.includes(p.gender)) return false;
    if (p.price > priceMax) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === "price-asc") return a.price - b.price;
    if (sortBy === "price-desc") return b.price - a.price;
    if (sortBy === "rating") return b.rating - a.rating;
    return 0;
  });

  const toggleFilter = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  };

  const FilterSection = ({ title, items, selected, setSelected }: { title: string; items: string[]; selected: string[]; setSelected: (v: string[]) => void }) => {
    const [open, setOpen] = useState(true);
    return (
      <div className="border-b border-[#e8e8e8] pb-5 mb-5">
        <button onClick={() => setOpen(!open)} className="flex justify-between items-center w-full mb-3">
          <span className="text-[11px] tracking-widest font-semibold uppercase">{title}</span>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {open && (
          <div className="space-y-2">
            {items.map(item => (
              <label key={item} className="flex items-center gap-2.5 cursor-pointer group">
                <input type="checkbox" checked={selected.includes(item)} onChange={() => toggleFilter(selected, setSelected, item)} className="accent-black" />
                <span className="text-sm capitalize text-gray-600 group-hover:text-black">{item}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-10">
      <div className="mb-8">
        <p className="text-[11px] tracking-widest text-gray-400 uppercase mb-1">Browse</p>
        <h1 className="text-3xl" style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}>All Products</h1>
      </div>
      <div className="flex gap-10">
        {/* Sidebar */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <div className="sticky top-24">
            <div className="flex justify-between items-center mb-6">
              <span className="text-sm font-semibold">Filters</span>
              <button onClick={() => { setSelectedCategory([]); setSelectedGender([]); setPriceMax(500); }} className="text-[11px] text-gray-400 hover:text-black">Clear all</button>
            </div>
            <FilterSection title="Category" items={categories} selected={selectedCategory} setSelected={setSelectedCategory} />
            <FilterSection title="Gender" items={genders} selected={selectedGender} setSelected={setSelectedGender} />
            <div className="border-b border-[#e8e8e8] pb-5 mb-5">
              <div className="text-[11px] tracking-widest font-semibold uppercase mb-3">Price Range</div>
              <input type="range" min={0} max={500} value={priceMax} onChange={e => setPriceMax(Number(e.target.value))} className="w-full accent-black" />
              <div className="flex justify-between text-xs text-gray-500 mt-1"><span>$0</span><span>${priceMax}</span></div>
            </div>
          </div>
        </aside>
        {/* Grid */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#e8e8e8]">
            <p className="text-sm text-gray-500">{filtered.length} products</p>
            <div className="flex items-center gap-4">
              <button className="lg:hidden flex items-center gap-2 text-sm border border-[#e8e8e8] px-4 py-2 rounded" onClick={() => setFilterOpen(!filterOpen)}><Filter size={14} /> Filter</button>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="text-sm border border-[#e8e8e8] rounded px-3 py-2 outline-none">
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Best Rated</option>
              </select>
            </div>
          </div>
          {(selectedCategory.length > 0 || selectedGender.length > 0) && (
            <div className="flex flex-wrap gap-2 mb-6">
              {[...selectedCategory, ...selectedGender].map(f => (
                <span key={f} className="inline-flex items-center gap-1.5 bg-black text-white text-xs px-3 py-1.5 rounded-full capitalize">
                  {f}
                  <button onClick={() => {
                    if (selectedCategory.includes(f)) setSelectedCategory(selectedCategory.filter(x => x !== f));
                    else setSelectedGender(selectedGender.filter(x => x !== f));
                  }}><X size={12} /></button>
                </span>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {filtered.map(p => (
              <ProductCard key={p.id} product={p} navigate={navigate} isWishlisted={wishlist.includes(p.id)} onWishlistToggle={onWishlistToggle} onAddToCart={onAddToCart} onProductSelect={onProductSelect} />
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-400 text-sm">No products match your filters.</p>
              <button onClick={() => { setSelectedCategory([]); setSelectedGender([]); }} className="text-black underline text-sm mt-2">Clear filters</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Product Detail Page ──────────────────────────────────────────────────────

function ProductDetailPage({ navigate, product, products, onAddToCart, wishlist, onWishlistToggle, onProductSelect }: {
  navigate: (p: Page) => void; onAddToCart: (p: Product, quantity?: number, size?: string, color?: string) => void;
  product: Product; products: Product[]; wishlist: number[]; onWishlistToggle: (id: number) => void; onProductSelect: (p: Product) => void;
}) {
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [activeImg, setActiveImg] = useState(0);
  const imgs = [product.image, ...products.filter(p => p.id !== product.id).slice(0, 3).map(p => p.image)];

  useEffect(() => {
    setSelectedSize("");
    setSelectedColor(product.colors[0]);
    setQty(1);
    setActiveImg(0);
  }, [product.id]);

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-10">
      <nav className="flex items-center gap-2 text-xs text-gray-400 mb-8">
        <button onClick={() => navigate("home")} className="hover:text-black">Home</button>
        <ChevronRight size={12} />
        <button onClick={() => navigate("shop")} className="hover:text-black">Shop</button>
        <ChevronRight size={12} />
        <span className="text-black">{product.name}</span>
      </nav>
      <div className="grid lg:grid-cols-2 gap-16">
        {/* Images */}
        <div className="flex gap-4">
          <div className="flex flex-col gap-2 w-16 flex-shrink-0">
            {imgs.map((img, i) => (
              <button key={i} onClick={() => setActiveImg(i)} className={`aspect-square overflow-hidden border-2 transition-colors ${activeImg === i ? "border-black" : "border-transparent"}`}>
                <img src={img} alt={`View ${i+1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
          <div className="flex-1 relative aspect-[3/4] overflow-hidden bg-gray-50">
            <img src={imgs[activeImg]} alt={product.name} className="w-full h-full object-cover" />
            {product.isNew && <span className="absolute top-4 left-4 bg-black text-white text-[10px] font-semibold tracking-widest px-3 py-1.5">NEW</span>}
          </div>
        </div>
        {/* Details */}
        <div className="lg:py-4">
          <p className="text-[11px] tracking-widest text-gray-400 uppercase mb-2">{product.brand}</p>
          <h1 className="text-4xl mb-3" style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}>{product.name}</h1>
          <div className="flex items-center gap-3 mb-4">
            <StarRating rating={product.rating} />
            <span className="text-sm text-gray-500">{product.rating} ({product.reviewCount} reviews)</span>
          </div>
          <div className="flex items-center gap-3 mb-8">
            <span className="text-2xl font-semibold">${product.price}</span>
            {product.originalPrice && (
              <>
                <span className="text-lg text-gray-400 line-through">${product.originalPrice}</span>
                <span className="bg-[#f5f0e8] text-[#8a6d3b] text-xs font-semibold px-2 py-1">SAVE ${product.originalPrice - product.price}</span>
              </>
            )}
          </div>
          {/* Color */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[12px] font-semibold tracking-wide">COLOUR: <span className="font-normal capitalize">{selectedColor}</span></span>
            </div>
            <div className="flex gap-2">
              {product.colors.map(c => {
                const colorMap: Record<string, string> = {
                  black: "#0a0a0a", white: "#ffffff", grey: "#9b9b9b", gray: "#9b9b9b",
                  camel: "#c8a97e", cream: "#f5f0e8", ivory: "#f8f4ec", terracotta: "#c0613a",
                  olive: "#6b6b3a", navy: "#1a2744", beige: "#e8d9c0", charcoal: "#3c3c3c",
                  sage: "#8fad88", sky: "#87ceeb", burgundy: "#8b2e4a", wine: "#722f37",
                  maroon: "#6b1f2a", red: "#c0392b", scarlet: "#d42b2b", orange: "#e8763a",
                  coral: "#e8856a", saffron: "#f4a830", lilac: "#c8a8d8", lavender: "#c5aed6",
                  champagne: "#f5e6c8", silver: "#c0c0c0", tan: "#d2956c",
                };
                const hex = colorMap[c.toLowerCase()];
                return (
                  <button key={c} onClick={() => setSelectedColor(c)} title={c}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${selectedColor === c ? "border-black ring-2 ring-offset-1 ring-black" : "border-gray-200 hover:border-gray-400"}`}
                    style={{ backgroundColor: hex || "#e8e8e8" }}>
                    {!hex && <span className="text-[10px] text-gray-700 font-medium">{c[0].toUpperCase()}</span>}
                  </button>
                );
              })}
            </div>
          </div>
          {/* Size */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[12px] font-semibold tracking-wide">SIZE</span>
              <button className="text-[12px] text-gray-500 underline hover:text-black">Size Guide</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map(s => (
                <button key={s} onClick={() => setSelectedSize(s)} className={`px-4 py-2.5 text-sm border transition-all ${selectedSize === s ? "border-black bg-black text-white" : "border-[#e8e8e8] hover:border-black"}`}>{s}</button>
              ))}
            </div>
          </div>
          {/* Qty */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center border border-[#e8e8e8] rounded">
              <button onClick={() => setQty(Math.max(1, qty-1))} className="w-10 h-10 flex items-center justify-center hover:bg-gray-50"><Minus size={14} /></button>
              <span className="w-10 text-center text-sm font-medium">{qty}</span>
              <button onClick={() => setQty(qty+1)} className="w-10 h-10 flex items-center justify-center hover:bg-gray-50"><Plus size={14} /></button>
            </div>
            <p className="text-xs text-gray-400">In stock · Ships in 2-4 business days</p>
          </div>
          {/* CTAs */}
          <div className="flex gap-3 mb-6">
            <button onClick={() => { onAddToCart(product, qty, selectedSize || product.sizes[0], selectedColor); navigate("cart"); }} className="flex-1 bg-black text-white py-4 text-[12px] tracking-widest font-semibold hover:bg-gray-800 transition-colors">ADD TO CART</button>
            <button onClick={() => onWishlistToggle(product.id)} className={`w-14 h-14 border flex items-center justify-center transition-colors ${wishlist.includes(product.id) ? "border-black bg-black" : "border-[#e8e8e8] hover:border-black"}`}>
              <Heart size={18} className={wishlist.includes(product.id) ? "fill-white text-white" : ""} />
            </button>
          </div>
          {/* Perks */}
          <div className="border border-[#e8e8e8] rounded divide-y divide-[#e8e8e8]">
            {[
              { icon: Truck, text: "Free shipping on orders over $150" },
              { icon: RefreshCw, text: "Free 30-day returns & exchanges" },
              { icon: Shield, text: "Authentic products, guaranteed" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600">
                <Icon size={16} className="text-gray-400 flex-shrink-0" /> {text}
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Tabs */}
      <div className="mt-16 border-t border-[#e8e8e8] pt-10">
        <div className="flex gap-8 border-b border-[#e8e8e8] mb-8">
          {["description","details","reviews"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-4 text-[12px] tracking-widest uppercase font-semibold border-b-2 transition-colors ${activeTab === tab ? "border-black text-black" : "border-transparent text-gray-400 hover:text-black"}`}>{tab}</button>
          ))}
        </div>
        {activeTab === "description" && <p className="text-gray-600 leading-relaxed max-w-2xl text-sm">{product.description}</p>}
        {activeTab === "details" && (
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl text-sm">
            {[["Material","82% Wool, 18% Polyester"],["Fit","Oversized"],["Country of Origin","Italy"],["Care","Dry clean only"],["SKU","APS-OUT-001"],["Season","Autumn/Winter 2026"]].map(([k,v]) => (
              <div key={k} className="flex justify-between border-b border-[#f0f0f0] pb-3">
                <span className="text-gray-500">{k}</span><span className="font-medium">{v}</span>
              </div>
            ))}
          </div>
        )}
        {activeTab === "reviews" && (
          <div className="space-y-6 max-w-2xl">
            {[
              { name: "Nisha S.", rating: 5, date: "Jun 25, 2026", comment: "Absolutely stunning quality. The cut is perfect and the fabric feels luxurious." },
              { name: "Kabir M.", rating: 4, date: "Jun 12, 2026", comment: "Great blazer. Runs large — I sized down from my usual M to an S. Worth it." },
              { name: "Ananya R.", rating: 5, date: "May 30, 2026", comment: "My favourite purchase this year. Incredibly versatile and the quality speaks for itself." },
            ].map((r) => (
              <div key={r.name} className="border-b border-[#f0f0f0] pb-6">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-sm">{r.name}</p>
                    <StarRating rating={r.rating} size={12} />
                  </div>
                  <span className="text-xs text-gray-400">{r.date}</span>
                </div>
                <p className="text-sm text-gray-600 mt-2 leading-relaxed">{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Related */}
      <div className="mt-16">
        <h2 className="text-2xl mb-8" style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}>You May Also Like</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {products.filter(p => p.id !== product.id).slice(0, 4).map(p => (
            <ProductCard key={p.id} product={p} navigate={navigate} isWishlisted={wishlist.includes(p.id)} onWishlistToggle={onWishlistToggle} onAddToCart={onAddToCart} onProductSelect={onProductSelect} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Cart Page ────────────────────────────────────────────────────────────────

function CartPage({ navigate, cart, onRemove, onQtyChange, onProductSelect }: {
  navigate: (p: Page) => void;
  cart: CartItem[];
  onRemove: (index: number) => void;
  onQtyChange: (index: number, qty: number) => void;
  onProductSelect: (p: Product) => void;
}) {
  const subtotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const shipping = subtotal >= 150 ? 0 : 12;
  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + shipping + tax;

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12">
      <h1 className="text-3xl mb-10" style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}>Shopping Cart <span className="text-gray-400 text-2xl">({cart.length})</span></h1>
      {cart.length === 0 ? (
        <div className="text-center py-24">
          <ShoppingBag size={48} className="text-gray-200 mx-auto mb-4" />
          <p className="text-lg text-gray-400 mb-6">Your cart is empty</p>
          <button onClick={() => navigate("shop")} className="bg-black text-white px-8 py-4 text-[12px] tracking-widest font-semibold">CONTINUE SHOPPING</button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-0 divide-y divide-[#e8e8e8]">
            {cart.map((item, index) => (
              <div key={`${item.product.id}-${item.size}-${item.color}-${index}`} className="py-6 flex gap-6">
                <div className="w-24 h-28 bg-gray-50 flex-shrink-0 overflow-hidden cursor-pointer" onClick={() => { onProductSelect(item.product); navigate("product"); }}>
                  <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[11px] tracking-widest text-gray-400 uppercase">{item.product.brand}</p>
                      <p className="font-medium text-sm mt-0.5">{item.product.name}</p>
                      <p className="text-xs text-gray-500 mt-1">Size: {item.size} · Colour: <span className="capitalize">{item.color}</span></p>
                    </div>
                    <button onClick={() => onRemove(index)} className="text-gray-400 hover:text-black transition-colors p-1"><Trash2 size={16} /></button>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center border border-[#e8e8e8] rounded">
                      <button onClick={() => onQtyChange(index, Math.max(1, item.quantity - 1))} className="w-8 h-8 flex items-center justify-center hover:bg-gray-50"><Minus size={12} /></button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <button onClick={() => onQtyChange(index, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-50"><Plus size={12} /></button>
                    </div>
                    <p className="font-semibold">${item.product.price * item.quantity}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="border border-[#e8e8e8] rounded p-6">
              <h2 className="font-semibold text-lg mb-5">Order Summary</h2>
              <div className="space-y-3 text-sm mb-6">
                <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span>${subtotal}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Shipping</span><span>{shipping === 0 ? <span className="text-green-600">Free</span> : `$${shipping}`}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Tax (10%)</span><span>${tax}</span></div>
                <div className="border-t border-[#e8e8e8] pt-3 flex justify-between font-semibold text-base"><span>Total</span><span>${total}</span></div>
              </div>
              <div className="flex gap-2 mb-5">
                <input className="flex-1 border border-[#e8e8e8] rounded px-3 py-2.5 text-sm outline-none focus:border-black" placeholder="Promo code" />
                <button className="bg-black text-white px-4 py-2.5 text-xs font-semibold tracking-wide hover:bg-gray-800 rounded">APPLY</button>
              </div>
              <button onClick={() => navigate("checkout")} className="w-full bg-black text-white py-4 text-[12px] tracking-widest font-semibold hover:bg-gray-800 transition-colors mb-3">PROCEED TO CHECKOUT</button>
              <button onClick={() => navigate("shop")} className="w-full border border-[#e8e8e8] py-4 text-[12px] tracking-widest font-semibold hover:bg-gray-50 transition-colors">CONTINUE SHOPPING</button>
              {shipping > 0 && <p className="text-xs text-center text-gray-500 mt-4">Add ${150 - subtotal} more for free shipping</p>}
            </div>
            <div className="flex items-center justify-center gap-4 mt-4">
              {[CreditCard, Shield, Lock].map((Icon, i) => (<Icon key={i} size={20} className="text-gray-300" />))}
            </div>
            <p className="text-center text-[11px] text-gray-400 mt-2">Secure, encrypted checkout</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Checkout Page ────────────────────────────────────────────────────────────

function CheckoutPage({ navigate, cart, onClearCart }: { navigate: (p: Page) => void; cart: CartItem[]; onClearCart: () => void }) {
  const [step, setStep] = useState(1);
  const subtotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const total = subtotal + (subtotal >= 150 ? 0 : 12) + Math.round(subtotal * 0.1);
  const steps = ["Shipping", "Payment", "Review"];

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <header className="bg-white border-b border-[#e8e8e8] px-6 py-5 flex items-center justify-between">
        <div className="text-xl tracking-[0.2em] font-semibold cursor-pointer" style={{ fontFamily: "var(--font-display)" }} onClick={() => navigate("home")}>POPCULTURE</div>
        <div className="flex items-center gap-3">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <div className={`flex items-center gap-2 text-[12px] font-medium tracking-wide ${i + 1 === step ? "text-black" : i + 1 < step ? "text-[#c8a97e]" : "text-gray-300"}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${i + 1 === step ? "bg-black text-white" : i + 1 < step ? "bg-[#c8a97e] text-white" : "bg-gray-200 text-gray-400"}`}>
                  {i + 1 < step ? <Check size={12} /> : i + 1}
                </div>
                <span className="hidden sm:block">{s}</span>
              </div>
              {i < steps.length - 1 && <div className={`w-8 h-px ${i + 1 < step ? "bg-[#c8a97e]" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>
        <button onClick={() => navigate("cart")} className="text-sm text-gray-500 hover:text-black flex items-center gap-1"><ArrowLeft size={14} /> Cart</button>
      </header>
      <div className="max-w-[1100px] mx-auto px-6 py-10 grid lg:grid-cols-5 gap-12">
        <div className="lg:col-span-3">
          {step === 1 && (
            <div>
              <h2 className="text-xl font-semibold mb-6">Delivery Information</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">FIRST NAME</label><input className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black bg-white" placeholder="Nisha" /></div>
                  <div><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">LAST NAME</label><input className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black bg-white" placeholder="Sharma" /></div>
                </div>
                <div><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">EMAIL</label><input type="email" className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black bg-white" placeholder="you@example.com" /></div>
                <div><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">PHONE</label><input type="tel" className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black bg-white" placeholder="+1 (555) 000-0000" /></div>
                <div><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">ADDRESS</label><input className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black bg-white" placeholder="42 Crown Street" /></div>
                <div className="grid grid-cols-3 gap-4">
                  <div><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">CITY</label><input className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black bg-white" placeholder="Sydney" /></div>
                  <div><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">STATE</label><input className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black bg-white" placeholder="NSW" /></div>
                  <div><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">ZIP</label><input className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black bg-white" placeholder="2000" /></div>
                </div>
                <div><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">SHIPPING METHOD</label>
                  <div className="space-y-2">
                    {[
                      { label: "Standard (5-7 days)", price: subtotal >= 150 ? "Free" : "$12", id: "std" },
                      { label: "Express (2-3 days)", price: "$22", id: "exp" },
                      { label: "Overnight (Next day)", price: "$45", id: "ovn" },
                    ].map(({ label, price, id }) => (
                      <label key={id} className="flex items-center justify-between border border-[#e8e8e8] rounded px-4 py-3 cursor-pointer hover:border-black has-[:checked]:border-black bg-white">
                        <div className="flex items-center gap-3"><input type="radio" name="shipping" defaultChecked={id === "std"} className="accent-black" /><span className="text-sm">{label}</span></div>
                        <span className="text-sm font-semibold">{price}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={() => setStep(2)} className="mt-8 w-full bg-black text-white py-4 text-[12px] tracking-widest font-semibold hover:bg-gray-800 transition-colors">CONTINUE TO PAYMENT</button>
            </div>
          )}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-semibold mb-6">Payment Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">CARD NUMBER</label>
                  <div className="relative"><input className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black bg-white pr-12" placeholder="1234 5678 9012 3456" /><CreditCard size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" /></div>
                </div>
                <div><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">NAME ON CARD</label><input className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black bg-white" placeholder="Nisha Sharma" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">EXPIRY DATE</label><input className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black bg-white" placeholder="MM / YY" /></div>
                  <div><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">CVV</label><input className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black bg-white" placeholder="123" /></div>
                </div>
                <div className="border border-[#e8e8e8] rounded p-4 bg-[#f8f8f8]">
                  <div className="text-[11px] tracking-widest text-gray-500 uppercase mb-3 font-medium">Or pay with</div>
                  <div className="grid grid-cols-3 gap-3">
                    {["Apple Pay","Google Pay","PayPal"].map(m => (
                      <button key={m} className="border border-[#e8e8e8] bg-white rounded py-3 text-xs font-semibold hover:border-black transition-colors">{m}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button onClick={() => setStep(1)} className="flex-1 border border-[#e8e8e8] py-4 text-[12px] tracking-widest font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"><ArrowLeft size={14} /> BACK</button>
                <button onClick={() => setStep(3)} className="flex-[2] bg-black text-white py-4 text-[12px] tracking-widest font-semibold hover:bg-gray-800 transition-colors">REVIEW ORDER</button>
              </div>
            </div>
          )}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-semibold mb-6">Review Your Order</h2>
              <div className="space-y-3 mb-6">
                {cart.map(item => (
                  <div key={item.product.id} className="flex gap-4 border border-[#e8e8e8] rounded p-4 bg-white">
                    <img src={item.product.image} alt={item.product.name} className="w-16 h-20 object-cover" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.product.name}</p>
                      <p className="text-xs text-gray-500 mt-1">Size: {item.size} · Qty: {item.quantity}</p>
                      <p className="text-sm font-semibold mt-2">${item.product.price * item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-[#f5f0e8] rounded p-5 mb-6 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Delivering to</span><span className="font-medium">42 Crown Street, NSW 2000</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Payment</span><span className="font-medium">•••• •••• •••• 3456</span></div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 border border-[#e8e8e8] py-4 text-[12px] tracking-widest font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"><ArrowLeft size={14} /> BACK</button>
                <button onClick={() => { onClearCart(); navigate("order-confirmation"); }} className="flex-[2] bg-black text-white py-4 text-[12px] tracking-widest font-semibold hover:bg-gray-800 transition-colors">PLACE ORDER · ${total}</button>
              </div>
            </div>
          )}
        </div>
        {/* Order summary sidebar */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-[#e8e8e8] rounded p-6 sticky top-24">
            <h3 className="font-semibold mb-4">Order Summary</h3>
            {cart.slice(0, 3).map(item => (
              <div key={item.product.id} className="flex gap-3 mb-3">
                <div className="relative flex-shrink-0">
                  <img src={item.product.image} alt={item.product.name} className="w-14 h-14 object-cover rounded" />
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-black text-white text-[9px] rounded-full flex items-center justify-center">{item.quantity}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{item.product.name}</p>
                  <p className="text-xs text-gray-400">{item.size}</p>
                </div>
                <p className="text-sm font-medium">${item.product.price}</p>
              </div>
            ))}
            <div className="border-t border-[#e8e8e8] pt-4 mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>${subtotal}</span></div>
              <div className="flex justify-between text-gray-600"><span>Shipping</span><span>{subtotal >= 150 ? <span className="text-green-600">Free</span> : "$12"}</span></div>
              <div className="flex justify-between text-gray-600"><span>Tax</span><span>${Math.round(subtotal * 0.1)}</span></div>
              <div className="flex justify-between font-semibold text-base pt-2 border-t border-[#e8e8e8]"><span>Total</span><span>${total}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Order Confirmation ───────────────────────────────────────────────────────

function OrderConfirmationPage({ navigate }: { navigate: (p: Page) => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-[#fafafa]">
      <div className="max-w-lg w-full text-center">
        <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-8">
          <CheckCircle size={36} className="text-white" />
        </div>
        <p className="text-[11px] tracking-[0.4em] text-[#c8a97e] uppercase mb-3">Order Confirmed</p>
        <h1 className="text-4xl mb-4" style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}>Thank you, Nisha!</h1>
        <p className="text-gray-500 mb-2 leading-relaxed">Your order <strong>AP-2026-1054</strong> has been received and is being prepared.</p>
        <p className="text-gray-400 text-sm mb-10">A confirmation email has been sent to your registered email address.</p>
        <div className="bg-white border border-[#e8e8e8] rounded p-6 text-left mb-8 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-gray-400 mb-1 text-xs">Order number</p><p className="font-semibold">AP-2026-1054</p></div>
            <div><p className="text-gray-400 mb-1 text-xs">Estimated delivery</p><p className="font-semibold">Jul 5-8, 2026</p></div>
            <div><p className="text-gray-400 mb-1 text-xs">Shipping to</p><p className="font-semibold">42 Crown Street, NSW</p></div>
            <div><p className="text-gray-400 mb-1 text-xs">Payment</p><p className="font-semibold">•••• 3456</p></div>
          </div>
          <div className="border-t border-[#e8e8e8] pt-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-[#e8e8e8] h-1.5 rounded-full">
                <div className="bg-black h-1.5 rounded-full w-1/4" />
              </div>
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 mt-2">
              <span className="text-black font-medium">Order Placed</span>
              <span>Processing</span>
              <span>Shipped</span>
              <span>Delivered</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate("orders")} className="flex-1 border border-black py-3.5 text-[12px] tracking-widest font-semibold hover:bg-gray-50 transition-colors">TRACK ORDER</button>
          <button onClick={() => navigate("shop")} className="flex-1 bg-black text-white py-3.5 text-[12px] tracking-widest font-semibold hover:bg-gray-800 transition-colors">CONTINUE SHOPPING</button>
        </div>
      </div>
    </div>
  );
}

// ─── Orders Page ──────────────────────────────────────────────────────────────

function OrdersPage({ navigate }: { navigate: (p: Page) => void }) {
  const statusIcon = { delivered: CheckCircle, shipped: Truck, processing: Clock, cancelled: X };
  return (
    <div className="max-w-[900px] mx-auto px-6 py-12">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => navigate("dashboard")} className="text-gray-400 hover:text-black"><ArrowLeft size={18} /></button>
        <h1 className="text-3xl" style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}>My Orders</h1>
      </div>
      <p className="text-sm text-gray-500 mb-10 ml-7">Track and manage your purchases</p>
      <div className="space-y-4">
        {[...SAMPLE_ORDERS, { id: "AP-2026-1039", date: "May 10, 2026", status: "cancelled", items: 1, total: 179, tracking: null }].map(o => {
          const Icon = statusIcon[o.status as keyof typeof statusIcon] || Package;
          const colors: Record<string, string> = { delivered: "text-green-600", shipped: "text-blue-600", processing: "text-amber-600", cancelled: "text-red-500" };
          return (
            <div key={o.id} className="border border-[#e8e8e8] rounded p-6 hover:border-gray-400 transition-colors cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Icon size={18} className={colors[o.status] || "text-gray-400"} />
                  <div>
                    <p className="font-semibold text-sm">{o.id}</p>
                    <p className="text-xs text-gray-400">{o.date}</p>
                  </div>
                </div>
                <StatusBadge status={o.status} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex gap-6 text-gray-500">
                  <span>{o.items} item{o.items > 1 ? "s" : ""}</span>
                  {o.tracking && <span className="font-mono text-xs">{o.tracking}</span>}
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold">${o.total}</span>
                  <button className="text-[11px] tracking-wide text-gray-500 hover:text-black border border-[#e8e8e8] px-3 py-1.5 rounded">Details</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Wishlist Page ────────────────────────────────────────────────────────────

function WishlistPage({ navigate, products, wishlist, onWishlistToggle, onAddToCart, onProductSelect }: {
  navigate: (p: Page) => void; wishlist: number[];
  products: Product[]; onWishlistToggle: (id: number) => void; onAddToCart: (p: Product, quantity?: number, size?: string, color?: string) => void; onProductSelect: (p: Product) => void;
}) {
  const items = products.filter(p => wishlist.includes(p.id));
  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => navigate("dashboard")} className="text-gray-400 hover:text-black"><ArrowLeft size={18} /></button>
        <h1 className="text-3xl" style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}>Wishlist <span className="text-gray-400">({items.length})</span></h1>
      </div>
      <p className="text-sm text-gray-500 mb-10 ml-7">Items you&apos;ve saved for later</p>
      {items.length === 0 ? (
        <div className="text-center py-24">
          <Heart size={48} className="text-gray-200 mx-auto mb-4" />
          <p className="text-lg text-gray-400 mb-6">Your wishlist is empty</p>
          <button onClick={() => navigate("shop")} className="bg-black text-white px-8 py-4 text-[12px] tracking-widest font-semibold">START BROWSING</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {items.map(p => (
            <div key={p.id} className="group">
              <div className="relative aspect-[3/4] overflow-hidden bg-gray-50 mb-3 cursor-pointer" onClick={() => { onProductSelect(p); navigate("product"); }}>
                <img src={p.image} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <button onClick={e => { e.stopPropagation(); onWishlistToggle(p.id); }} className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <Heart size={14} className="fill-black text-black" />
                </button>
              </div>
              <p className="text-[11px] text-gray-400 tracking-widest uppercase">{p.brand}</p>
              <p className="text-sm font-medium mt-0.5">{p.name}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-semibold">${p.price}</span>
                <button onClick={() => onAddToCart(p)} className="text-[11px] tracking-widest font-semibold border border-black px-3 py-1.5 hover:bg-black hover:text-white transition-colors">ADD TO CART</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Profile Page ─────────────────────────────────────────────────────────────

function ProfilePage({ navigate, user }: { navigate: (p: Page) => void; user?: SessionUser | null }) {
  const [activeTab, setActiveTab] = useState("account");
  return (
    <div className="max-w-[900px] mx-auto px-6 py-12">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate("dashboard")} className="text-gray-400 hover:text-black"><ArrowLeft size={18} /></button>
        <h1 className="text-3xl" style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}>My Profile</h1>
      </div>
      <div className="grid md:grid-cols-4 gap-8">
        <div>
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-3 text-white text-2xl font-medium">{(user?.name || "PC").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}</div>
            <p className="font-semibold">{user?.name || "PopCulture Member"}</p>
            <p className="text-xs text-gray-400">Member since Jan 2025</p>
            <span className="inline-block mt-2 bg-[#f5f0e8] text-[#8a6d3b] text-[10px] font-semibold tracking-wide px-2 py-0.5">GOLD MEMBER</span>
          </div>
          <nav className="space-y-1">
            {[["account","Account Details"],["addresses","Addresses"],["payment","Payment Methods"],["preferences","Preferences"],["security","Security"]].map(([id, label]) => (
              <button key={id} onClick={() => setActiveTab(id)} className={`w-full text-left px-4 py-2.5 text-sm rounded transition-colors ${activeTab === id ? "bg-black text-white" : "hover:bg-gray-50 text-gray-700"}`}>{label}</button>
            ))}
          </nav>
        </div>
        <div className="md:col-span-3">
          {activeTab === "account" && (
            <div className="border border-[#e8e8e8] rounded p-6">
              <h2 className="font-semibold mb-5">Account Details</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">FIRST NAME</label><input defaultValue={user?.name?.split(" ")[0] || "First"} className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black" /></div>
                  <div><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">LAST NAME</label><input defaultValue={user?.name?.split(" ").slice(1).join(" ") || "Last"} className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black" /></div>
                </div>
                <div><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">EMAIL</label><input defaultValue={user?.email || "you@example.com"} className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black" /></div>
                <div><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">PHONE</label><input defaultValue="+1 (555) 000-1234" className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black" /></div>
                <div><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">DATE OF BIRTH</label><input type="date" defaultValue="1993-07-14" className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black" /></div>
              </div>
              <button className="mt-6 bg-black text-white px-6 py-3 text-[12px] tracking-widest font-semibold hover:bg-gray-800 transition-colors">SAVE CHANGES</button>
            </div>
          )}
          {activeTab === "addresses" && (
            <div className="space-y-4">
              {[
                { label: "Home", address: "42 Crown Street, Apt 4B", city: "Sydney, NSW 2000", default: true },
                { label: "Work", address: "456 Design Avenue, Suite 200", city: "Sydney, NSW 10002", default: false },
              ].map(addr => (
                <div key={addr.label} className="border border-[#e8e8e8] rounded p-5 flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1"><p className="font-semibold text-sm">{addr.label}</p>{addr.default && <span className="bg-black text-white text-[9px] px-2 py-0.5 font-semibold">DEFAULT</span>}</div>
                    <p className="text-sm text-gray-600">{addr.address}</p>
                    <p className="text-sm text-gray-600">{addr.city}</p>
                  </div>
                  <div className="flex gap-2"><button className="text-xs text-gray-500 hover:text-black">Edit</button><button className="text-xs text-red-400 hover:text-red-600">Remove</button></div>
                </div>
              ))}
              <button className="border border-dashed border-[#e8e8e8] rounded p-5 w-full text-sm text-gray-400 hover:border-black hover:text-black transition-colors flex items-center justify-center gap-2"><Plus size={16} /> Add New Address</button>
            </div>
          )}
          {activeTab === "security" && (
            <div className="border border-[#e8e8e8] rounded p-6 space-y-5">
              <h2 className="font-semibold mb-5">Security Settings</h2>
              <div><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">CURRENT PASSWORD</label><input type="password" className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black" placeholder="••••••••" /></div>
              <div><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">NEW PASSWORD</label><input type="password" className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black" placeholder="••••••••" /></div>
              <div><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">CONFIRM NEW PASSWORD</label><input type="password" className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black" placeholder="••••••••" /></div>
              <button className="bg-black text-white px-6 py-3 text-[12px] tracking-widest font-semibold hover:bg-gray-800 transition-colors">UPDATE PASSWORD</button>
            </div>
          )}
          {(activeTab === "payment" || activeTab === "preferences") && (
            <div className="border border-[#e8e8e8] rounded p-10 text-center text-gray-400 text-sm">
              <Settings size={32} className="mx-auto mb-3 text-gray-200" />
              <p>Settings coming soon</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── About Page ───────────────────────────────────────────────────────────────

function AboutPage({ navigate }: { navigate: (p: Page) => void }) {
  return (
    <div>
      <section className="relative h-[60vh] bg-gray-900 overflow-hidden">
        <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1400&h=700&fit=crop&auto=format" alt="About" className="w-full h-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-black/50 flex items-end pb-16 px-8 md:px-16 max-w-[1400px] mx-auto">
          <div>
            <p className="text-[11px] tracking-[0.4em] text-[#c8a97e] uppercase mb-4">Our Story</p>
            <h1 className="text-6xl text-white" style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}>Born from<br />Culture.</h1>
          </div>
        </div>
      </section>
      <section className="max-w-[900px] mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-16 mb-20">
          <div>
            <h2 className="text-3xl mb-6" style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}>Where We Started</h2>
            <p className="text-gray-600 leading-relaxed text-sm mb-4">Amit Pandey Studio is built around a simple vision: fashion that feels editorial, wearable, and personal. The collection sits between street culture, eveningwear, and clean everyday essentials.</p>
            <p className="text-gray-600 leading-relaxed text-sm">From a digital-first studio to a growing online presence, the brand keeps its focus on quality, culture, and community.</p>
          </div>
          <div>
            <h2 className="text-3xl mb-6" style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}>Our Philosophy</h2>
            <p className="text-gray-600 leading-relaxed text-sm mb-4">We design for people who live with intention. Every piece in our collection is considered from first sketch to final stitch — responsible production, ethical supply chains, and materials that are built to last.</p>
            <p className="text-gray-600 leading-relaxed text-sm">Less waste. More meaning. That is the Amit Pandey Studio promise.</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-8 text-center border-t border-b border-[#e8e8e8] py-12 mb-20">
          {[["2019","Founded"],["180+","Countries"],["2M+","Customers"],].map(([num, label]) => (
            <div key={label}><p className="text-4xl font-semibold mb-1" style={{ fontFamily: "var(--font-display)" }}>{num}</p><p className="text-sm text-gray-500">{label}</p></div>
          ))}
        </div>
        <h2 className="text-3xl mb-10 text-center" style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}>Our Values</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: Award, title: "Uncompromising Quality", text: "We source only the finest materials and partner with certified manufacturers who share our standards." },
            { icon: Globe, title: "Global Responsibility", text: "Every decision considers its impact on people and planet. We are committed to net-zero by 2030." },
            { icon: Users, title: "Community First", text: "Our customers are collaborators. We listen, we learn, and we build the brand together." },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="text-center">
              <div className="w-12 h-12 border border-[#e8e8e8] rounded-full flex items-center justify-center mx-auto mb-4"><Icon size={20} /></div>
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── Contact Page ─────────────────────────────────────────────────────────────

function ContactPage({ navigate }: { navigate: (p: Page) => void }) {
  return (
    <div className="max-w-[1000px] mx-auto px-6 py-20">
      <div className="text-center mb-16">
        <p className="text-[11px] tracking-[0.4em] text-gray-400 uppercase mb-3">Get in Touch</p>
        <h1 className="text-4xl" style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}>We&apos;d Love to Hear From You</h1>
      </div>
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        {[
          { icon: Mail, title: "Email Us", detail: "hello@popculture.com", sub: "We reply within 24 hours" },
          { icon: Phone, title: "Call Us", detail: "+1 (800) 767-2854", sub: "Mon–Fri, 9am–6pm EST" },
          { icon: MapPin, title: "Visit Us", detail: "Sydney, NSW, Australia", sub: "Mon-Sat, 10am-8pm" },
        ].map(({ icon: Icon, title, detail, sub }) => (
          <div key={title} className="text-center border border-[#e8e8e8] rounded p-8">
            <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mx-auto mb-4"><Icon size={20} className="text-white" /></div>
            <h3 className="font-semibold mb-1">{title}</h3>
            <p className="text-sm font-medium mt-1">{detail}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-12 items-start">
        <form className="space-y-4">
          <h2 className="text-2xl font-semibold mb-6" style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}>Send a Message</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">FIRST NAME</label><input className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black" /></div>
            <div><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">LAST NAME</label><input className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black" /></div>
          </div>
          <div><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">EMAIL</label><input type="email" className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black" /></div>
          <div><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">ORDER NUMBER (OPTIONAL)</label><input className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black" placeholder="AP-2026-XXX" /></div>
          <div><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">SUBJECT</label>
            <select className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black">
              {["General Inquiry","Order Support","Returns & Refunds","Product Question","Partnership"].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">MESSAGE</label><textarea rows={5} className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black resize-none" placeholder="How can we help you?" /></div>
          <button type="submit" className="w-full bg-black text-white py-4 text-[12px] tracking-widest font-semibold hover:bg-gray-800 transition-colors">SEND MESSAGE</button>
        </form>
        <div>
          <h2 className="text-2xl font-semibold mb-6" style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}>FAQ Quick Links</h2>
          <div className="space-y-3">
            {["Where is my order?","How do I return an item?","What is your size guide?","Do you offer international shipping?","How do I use a promo code?"].map(q => (
              <button key={q} onClick={() => navigate("faq")} className="w-full flex items-center justify-between border border-[#e8e8e8] rounded p-4 text-sm hover:border-black transition-colors group">
                <span className="text-gray-700 group-hover:text-black">{q}</span>
                <ChevronRight size={16} className="text-gray-400 group-hover:text-black" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── FAQ Page ─────────────────────────────────────────────────────────────────

function FAQPage({ navigate }: { navigate: (p: Page) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const faqs = [
    { cat: "Shipping", q: "How long does standard delivery take?", a: "Standard delivery takes 5–7 business days within the US. Express (2–3 days) and overnight options are available at checkout. Free standard shipping on all orders over $150." },
    { cat: "Shipping", q: "Do you ship internationally?", a: "Yes, we ship to 180+ countries. International delivery times vary by destination (7–21 business days). Duties and taxes may apply and are the customer&apos;s responsibility." },
    { cat: "Returns", q: "What is your return policy?", a: "We offer free 30-day returns on all full-price items. Items must be unworn, unwashed, and in original packaging with all tags attached. Sale items are final sale." },
    { cat: "Returns", q: "How do I start a return?", a: "Log in to your account, go to My Orders, and select the item you wish to return. Print the prepaid label and drop it at any UPS location. Refunds are processed within 5–7 business days." },
    { cat: "Products", q: "How do I know which size to order?", a: "Visit our Size Guide for detailed measurements. Our fit runs true to size unless otherwise noted on the product page. We recommend reading customer reviews for fit insights." },
    { cat: "Products", q: "Are your products ethically made?", a: "Absolutely. Amit Pandey Studio products are selected from certified production partners that meet strict ethical and environmental standards." },
    { cat: "Orders", q: "Can I modify or cancel my order?", a: "Orders can be modified or cancelled within 1 hour of placement. After that, the order enters fulfilment and cannot be changed. Contact us immediately at hello@popculture.com." },
    { cat: "Payments", q: "What payment methods do you accept?", a: "We accept all major credit/debit cards (Visa, Mastercard, AmEx), PayPal, Apple Pay, Google Pay, and Afterpay. All transactions are SSL-encrypted." },
  ];
  const categories = [...new Set(faqs.map(f => f.cat))];
  const [activeCat, setActiveCat] = useState("Shipping");
  return (
    <div className="max-w-[800px] mx-auto px-6 py-20">
      <div className="text-center mb-12">
        <p className="text-[11px] tracking-[0.4em] text-gray-400 uppercase mb-3">Help Centre</p>
        <h1 className="text-4xl mb-4" style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}>Frequently Asked Questions</h1>
        <p className="text-gray-500 text-sm">Can&apos;t find what you&apos;re looking for? <button onClick={() => navigate("contact")} className="text-black underline">Contact our team</button></p>
      </div>
      <div className="flex gap-3 mb-8 flex-wrap">
        {categories.map(c => (
          <button key={c} onClick={() => setActiveCat(c)} className={`px-5 py-2 text-sm font-medium rounded-full border transition-colors ${activeCat === c ? "bg-black text-white border-black" : "border-[#e8e8e8] hover:border-black"}`}>{c}</button>
        ))}
      </div>
      <div className="divide-y divide-[#e8e8e8]">
        {faqs.filter(f => f.cat === activeCat).map(f => (
          <div key={f.q}>
            <button onClick={() => setOpen(open === f.q ? null : f.q)} className="w-full flex justify-between items-center py-5 text-left gap-4">
              <span className="font-medium text-sm">{f.q}</span>
              {open === f.q ? <ChevronUp size={18} className="flex-shrink-0 text-gray-400" /> : <ChevronDown size={18} className="flex-shrink-0 text-gray-400" />}
            </button>
            {open === f.q && <p className="pb-5 text-sm text-gray-600 leading-relaxed">{f.a}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Admin Sidebar ────────────────────────────────────────────────────────────

function AdminSidebar({ page, navigate, onLogout }: { page: Page; navigate: (p: Page) => void; onLogout: () => void }) {
  const navItems = [
    { icon: Home, label: "Dashboard", p: "admin-dashboard" },
    { icon: Package, label: "Products", p: "admin-products" },
    { icon: Layers, label: "Categories", p: "admin-categories" },
    { icon: ShoppingCart, label: "Orders", p: "admin-orders" },
    { icon: Users, label: "Customers", p: "admin-customers" },
    { icon: Box, label: "Inventory", p: "admin-inventory" },
    { icon: Tag, label: "Promotions", p: "admin-promotions" },
    { icon: MessageSquare, label: "Reviews", p: "admin-reviews" },
    { icon: BarChart2, label: "Analytics", p: "admin-analytics" },
    { icon: Settings, label: "Settings", p: "admin-settings" },
  ];
  return (
    <aside className="w-60 bg-[#0a0a0a] min-h-screen flex flex-col flex-shrink-0">
      <div className="p-6 border-b border-white/10">
        <div className="text-white text-lg tracking-[0.15em] font-semibold" style={{ fontFamily: "var(--font-display)" }}>POPCULTURE</div>
        <div className="text-[10px] tracking-widest text-gray-500 uppercase mt-0.5">Admin Portal</div>
      </div>
      <nav className="flex-1 p-4 space-y-0.5">
        {navItems.map(({ icon: Icon, label, p }) => (
          <button key={p} onClick={() => navigate(p as Page)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors ${page === p ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
            <Icon size={16} />{label}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-white/10">
        <button onClick={() => navigate("admin-profile")} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors mb-1 ${page === "admin-profile" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
          <User size={16} /> Profile
        </button>
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </aside>
  );
}

function AdminHeader({ title, navigate }: { title: string; navigate: (p: Page) => void }) {
  return (
    <div className="border-b border-[#e8e8e8] px-8 py-5 flex items-center justify-between bg-white">
      <h1 className="text-xl font-semibold">{title}</h1>
      <div className="flex items-center gap-3">
        <button className="relative p-2 hover:bg-gray-50 rounded-full">
          <Bell size={18} className="text-gray-500" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#c8a97e] rounded-full" />
        </button>
        <button onClick={() => navigate("admin-profile")} className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white text-xs font-semibold">AP</button>
      </div>
    </div>
  );
}

// ─── Admin Login ──────────────────────────────────────────────────────────────

function AdminLoginPage({ navigate, onLogin }: { navigate: (p: Page) => void; onLogin?: (email: string, password: string) => { ok: boolean; message?: string } }) {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("amit@popculture.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onLogin) {
      const result = onLogin(email, password);
      if (!result.ok) setError(result.message || "Invalid credentials.");
    } else {
      navigate("admin-dashboard");
    }
  };
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="text-2xl tracking-[0.2em] text-white font-semibold mb-1" style={{ fontFamily: "var(--font-display)" }}>POPCULTURE</div>
          <div className="text-[10px] tracking-widest text-gray-500 uppercase">Admin Portal</div>
        </div>
        <div className="bg-[#161616] border border-white/10 rounded-lg p-8">
          <h2 className="text-white text-xl font-semibold mb-1">Sign in</h2>
          <p className="text-gray-500 text-sm mb-6">Authorised personnel only</p>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div><label className="block text-[11px] font-semibold tracking-wide text-gray-400 mb-1.5">EMAIL</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-[#1e1e1e] border border-white/10 rounded px-4 py-3 text-sm text-white outline-none focus:border-[#c8a97e] transition-colors placeholder:text-gray-600" placeholder="amit@popculture.com" /></div>
            <div><label className="block text-[11px] font-semibold tracking-wide text-gray-400 mb-1.5">PASSWORD</label>
              <div className="relative"><input type={show ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-[#1e1e1e] border border-white/10 rounded px-4 py-3 text-sm text-white outline-none focus:border-[#c8a97e] transition-colors pr-10 placeholder:text-gray-600" placeholder="amit123" /><button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"><Eye size={16} /></button></div>
            </div>
            {error && <div className="border border-red-800 bg-red-900/30 text-red-400 rounded px-4 py-3 text-sm">{error}</div>}
            <div className="border border-white/5 rounded p-3 bg-white/5">
              <p className="text-[10px] tracking-widest text-gray-500 uppercase mb-1">Demo credentials</p>
              <p className="text-xs text-gray-400">amit@popculture.com · amit123</p>
            </div>
            <button type="submit" className="w-full bg-[#c8a97e] text-black py-4 text-[12px] tracking-widest font-semibold hover:bg-[#b8997e] transition-colors rounded">SIGN IN TO ADMIN</button>
          </form>
          <button onClick={() => navigate("home")} className="w-full mt-4 text-center text-xs text-gray-500 hover:text-gray-300">← Back to store</button>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

function AdminDashboardPage({ navigate }: { navigate: (p: Page) => void }) {
  const kpis = [
    { label: "Total Sales", value: "$127,430", change: "+18.2%", up: true, icon: DollarSign },
    { label: "Revenue", value: "$91,280", change: "+14.7%", up: true, icon: TrendingUp },
    { label: "Orders", value: "980", change: "+12.5%", up: true, icon: ShoppingCart },
    { label: "Customers", value: "14,820", change: "+8.3%", up: true, icon: Users },
    { label: "Visitors", value: "42,391", change: "+21.4%", up: true, icon: BarChart2 },
    { label: "Inventory", value: "3 low", change: "-2", up: false, icon: AlertCircle },
  ];
  return (
    <div className="flex-1 overflow-auto bg-[#fafafa]">
      <AdminHeader title="Dashboard" navigate={navigate} />
      <div className="p-8">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {kpis.map(({ label, value, change, up, icon: Icon }) => (
            <div key={label} className="bg-white border border-[#e8e8e8] rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 bg-[#f5f0e8] rounded flex items-center justify-center"><Icon size={16} className="text-[#c8a97e]" /></div>
                <span className={`text-[11px] font-semibold ${up ? "text-green-600" : "text-red-500"}`}>{change}</span>
              </div>
              <p className="text-2xl font-semibold">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-white border border-[#e8e8e8] rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-semibold">Revenue Overview</h2>
              <select className="text-xs border border-[#e8e8e8] rounded px-3 py-1.5 outline-none">
                <option>Last 12 months</option><option>Last 6 months</option><option>Last 3 months</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={MONTHLY_DATA}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0a0a0a" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#0a0a0a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9b9b9b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9b9b9b" }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]} />
                <Area type="monotone" dataKey="revenue" stroke="#0a0a0a" strokeWidth={2} fill="url(#grad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white border border-[#e8e8e8] rounded-lg p-6">
            <h2 className="font-semibold mb-4">Order Status</h2>
            <ResponsiveContainer width="100%" height={180}>
              <RechPie>
                <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                  {PIE_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => [`${v}%`]} />
              </RechPie>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {PIE_DATA.map(d => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: d.color }} /><span className="text-gray-600">{d.name}</span></div>
                  <span className="font-semibold">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-[#e8e8e8] rounded-lg p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-semibold">Recent Orders</h2>
              <button onClick={() => navigate("admin-orders")} className="text-xs text-gray-500 hover:text-black">View all</button>
            </div>
            <table className="w-full">
              <thead>
                <tr className="text-[11px] tracking-widest text-gray-400 uppercase border-b border-[#e8e8e8]">
                  <th className="text-left pb-3">Order</th><th className="text-left pb-3">Customer</th><th className="text-left pb-3 hidden md:table-cell">Date</th><th className="text-right pb-3">Amount</th><th className="text-right pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {ADMIN_ORDERS.slice(0, 5).map(o => (
                  <tr key={o.id} className="border-b border-[#f5f5f5] hover:bg-gray-50 transition-colors">
                    <td className="py-3 text-sm font-medium">{o.id}</td>
                    <td className="py-3 text-sm text-gray-600">{o.customer}</td>
                    <td className="py-3 text-xs text-gray-400 hidden md:table-cell">{o.date}</td>
                    <td className="py-3 text-sm font-semibold text-right">${o.amount}</td>
                    <td className="py-3 text-right"><StatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-white border border-[#e8e8e8] rounded-lg p-6">
            <h2 className="font-semibold mb-5">Sales by Category</h2>
            <ResponsiveContainer width="100%" height={200}>
              <RechBar data={CATEGORY_DATA} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#9b9b9b" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: "#6b6b6b" }} axisLine={false} tickLine={false} width={70} />
                <Tooltip formatter={(v: number) => [v.toLocaleString(), "Sales"]} />
                <Bar dataKey="sales" fill="#0a0a0a" radius={[0, 2, 2, 0]} />
              </RechBar>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Products ───────────────────────────────────────────────────────────

function AdminProductsPage({ navigate, products, onProductsChange, onProductSelect }: {
  navigate: (p: Page) => void;
  products: Product[];
  onProductsChange: (products: Product[]) => void;
  onProductSelect: (product: Product) => void;
}) {
  const [search, setSearch] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const openProductForm = (product?: Product) => {
    setEditingProduct(product || {
      id: Math.max(0, ...products.map(p => p.id)) + 1,
      name: "",
      brand: "Amit Pandey Studio",
      price: 199,
      category: "dresses",
      gender: "women",
      colors: ["black"],
      sizes: ["XS", "S", "M", "L"],
      image: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&h=800&fit=crop&auto=format",
      rating: 4.8,
      reviewCount: 0,
      isNew: true,
      description: "",
    });
    setFormOpen(true);
  };

  const updateEditingProduct = (patch: Partial<Product>) => {
    setEditingProduct(prev => prev ? { ...prev, ...patch } : prev);
  };

  const saveProduct = () => {
    if (!editingProduct || !editingProduct.name.trim()) return;
    const exists = products.some(p => p.id === editingProduct.id);
    onProductsChange(exists ? products.map(p => p.id === editingProduct.id ? editingProduct : p) : [editingProduct, ...products]);
    setFormOpen(false);
    setEditingProduct(null);
  };

  const deleteProduct = (id: number) => {
    onProductsChange(products.filter(p => p.id !== id));
  };

  return (
    <div className="flex-1 overflow-auto bg-[#fafafa]">
      <AdminHeader title="Product Management" navigate={navigate} />
      <div className="p-8">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} className="w-full border border-[#e8e8e8] rounded-lg pl-9 pr-4 py-2.5 text-sm outline-none focus:border-black bg-white" placeholder="Search products..." />
          </div>
          <select className="border border-[#e8e8e8] rounded-lg px-4 py-2.5 text-sm outline-none bg-white">
            <option>All Categories</option>{["tops","bottoms","outerwear","footwear","accessories","dresses"].map(c => <option key={c} className="capitalize">{c}</option>)}
          </select>
          <button onClick={() => openProductForm()} className="bg-black text-white px-5 py-2.5 text-sm font-semibold rounded-lg hover:bg-gray-800 flex items-center gap-2"><Plus size={16} /> Add Product</button>
        </div>
        {formOpen && editingProduct && (
          <div className="bg-white border border-[#e8e8e8] rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold">{products.some(p => p.id === editingProduct.id) ? "Edit Product" : "Add Product"}</h2>
              <button onClick={() => setFormOpen(false)} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">PRODUCT NAME</label><input value={editingProduct.name} onChange={e => updateEditingProduct({ name: e.target.value })} className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black" /></div>
              <div><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">BRAND</label><input value={editingProduct.brand} onChange={e => updateEditingProduct({ brand: e.target.value })} className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black" /></div>
              <div><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">PRICE</label><input type="number" value={editingProduct.price} onChange={e => updateEditingProduct({ price: Number(e.target.value) })} className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black" /></div>
              <div><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">ORIGINAL PRICE</label><input type="number" value={editingProduct.originalPrice || ""} onChange={e => updateEditingProduct({ originalPrice: e.target.value ? Number(e.target.value) : undefined })} className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black" /></div>
              <div><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">CATEGORY</label><select value={editingProduct.category} onChange={e => updateEditingProduct({ category: e.target.value })} className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black bg-white">{["tops","bottoms","outerwear","footwear","accessories","dresses"].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">GENDER</label><select value={editingProduct.gender} onChange={e => updateEditingProduct({ gender: e.target.value })} className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black bg-white">{["women","men","unisex"].map(g => <option key={g} value={g}>{g}</option>)}</select></div>
              <div><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">COLORS</label><input value={editingProduct.colors.join(", ")} onChange={e => updateEditingProduct({ colors: e.target.value.split(",").map(v => v.trim()).filter(Boolean) })} className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black" /></div>
              <div><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">SIZES</label><input value={editingProduct.sizes.join(", ")} onChange={e => updateEditingProduct({ sizes: e.target.value.split(",").map(v => v.trim()).filter(Boolean) })} className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black" /></div>
              <div className="md:col-span-2"><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">IMAGE URL</label><input value={editingProduct.image} onChange={e => updateEditingProduct({ image: e.target.value })} className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black" /></div>
              <div className="md:col-span-2"><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">DESCRIPTION</label><textarea value={editingProduct.description} onChange={e => updateEditingProduct({ description: e.target.value })} className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black min-h-24" /></div>
              <label className="flex items-center gap-2 text-sm text-gray-600"><input type="checkbox" checked={!!editingProduct.isNew} onChange={e => updateEditingProduct({ isNew: e.target.checked })} className="accent-black" /> New arrival</label>
              <label className="flex items-center gap-2 text-sm text-gray-600"><input type="checkbox" checked={!!editingProduct.isSale} onChange={e => updateEditingProduct({ isSale: e.target.checked })} className="accent-black" /> Sale item</label>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setFormOpen(false)} className="border border-[#e8e8e8] px-5 py-2.5 text-sm font-semibold rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={saveProduct} className="bg-black text-white px-5 py-2.5 text-sm font-semibold rounded-lg hover:bg-gray-800">Save Product</button>
            </div>
          </div>
        )}
        <div className="bg-white border border-[#e8e8e8] rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#e8e8e8] text-[11px] tracking-widest text-gray-400 uppercase">
                <th className="text-left px-6 py-4">Product</th>
                <th className="text-left px-4 py-4 hidden md:table-cell">Category</th>
                <th className="text-right px-4 py-4">Price</th>
                <th className="text-center px-4 py-4 hidden lg:table-cell">Stock</th>
                <th className="text-center px-4 py-4">Status</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-[#f5f5f5] hover:bg-[#fafafa] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={p.image} alt={p.name} className="w-12 h-12 object-cover rounded" />
                      <div>
                        <p className="text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.brand}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600 capitalize hidden md:table-cell">{p.category}</td>
                  <td className="px-4 py-4 text-sm font-semibold text-right">
                    {p.originalPrice ? <div><span className="text-[#c8a97e]">${p.price}</span><span className="text-xs text-gray-400 line-through ml-1">${p.originalPrice}</span></div> : `$${p.price}`}
                  </td>
                  <td className="px-4 py-4 text-center hidden lg:table-cell">
                    <span className={`text-sm font-medium ${p.reviewCount < 80 ? "text-red-500" : "text-green-600"}`}>{Math.max(10, Math.round(p.reviewCount * 0.3))}</span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <StatusBadge status={p.isSale ? "active" : p.isNew ? "active" : "active"} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => { onProductSelect(p); navigate("product"); }} className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-black"><Eye size={15} /></button>
                      <button onClick={() => openProductForm(p)} className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-black"><Edit size={15} /></button>
                      <button onClick={() => deleteProduct(p.id)} className="p-1.5 hover:bg-red-50 rounded text-gray-500 hover:text-red-500"><Trash size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-6 py-4 border-t border-[#e8e8e8] flex items-center justify-between text-sm text-gray-500">
            <span>Showing {filtered.length} of {products.length} products</span>
            <div className="flex gap-1">
              {[1,2,3].map(n => <button key={n} className={`w-8 h-8 rounded text-xs ${n === 1 ? "bg-black text-white" : "hover:bg-gray-100"}`}>{n}</button>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Categories ─────────────────────────────────────────────────────────

function AdminCategoriesPage({ navigate, products }: { navigate: (p: Page) => void; products: Product[] }) {
  const cats = [
    { name: "Tops", slug: "tops", products: products.filter(p => p.category === "tops").length, image: products.find(p => p.category === "tops")?.image || PRODUCTS[1].image, active: true },
    { name: "Bottoms", slug: "bottoms", products: products.filter(p => p.category === "bottoms").length, image: products.find(p => p.category === "bottoms")?.image || PRODUCTS[2].image, active: true },
    { name: "Outerwear", slug: "outerwear", products: products.filter(p => p.category === "outerwear").length, image: products.find(p => p.category === "outerwear")?.image || PRODUCTS[0].image, active: true },
    { name: "Footwear", slug: "footwear", products: products.filter(p => p.category === "footwear").length, image: products.find(p => p.category === "footwear")?.image || PRODUCTS[3].image, active: true },
    { name: "Accessories", slug: "accessories", products: products.filter(p => p.category === "accessories").length, image: products.find(p => p.category === "accessories")?.image || PRODUCTS[4].image, active: true },
    { name: "Dresses", slug: "dresses", products: products.filter(p => p.category === "dresses").length, image: products.find(p => p.category === "dresses")?.image || PRODUCTS[8].image, active: true },
  ];
  return (
    <div className="flex-1 overflow-auto bg-[#fafafa]">
      <AdminHeader title="Category Management" navigate={navigate} />
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <p className="text-sm text-gray-500">{cats.length} categories</p>
          <button className="bg-black text-white px-5 py-2.5 text-sm font-semibold rounded-lg hover:bg-gray-800 flex items-center gap-2"><Plus size={16} /> New Category</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {cats.map(c => (
            <div key={c.slug} className="bg-white border border-[#e8e8e8] rounded-lg overflow-hidden group">
              <div className="relative h-40 overflow-hidden">
                <img src={c.image} alt={c.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/30" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <h3 className="text-white text-xl font-semibold tracking-wide">{c.name}</h3>
                </div>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-gray-400">{c.products} products · /{c.slug}</p>
                </div>
                <div className="flex gap-2">
                  <button className="p-1.5 hover:bg-gray-100 rounded text-gray-500"><Edit size={14} /></button>
                  <button className="p-1.5 hover:bg-red-50 rounded text-gray-500 hover:text-red-500"><Trash size={14} /></button>
                </div>
              </div>
            </div>
          ))}
          <button className="border-2 border-dashed border-[#e8e8e8] rounded-lg h-56 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-black hover:text-black transition-colors">
            <Plus size={24} /><span className="text-sm font-medium">Add Category</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Orders ─────────────────────────────────────────────────────────────

function AdminOrdersPage({ navigate }: { navigate: (p: Page) => void }) {
  const [filter, setFilter] = useState("all");
  const [orders, setOrders] = useState<AdminOrder[]>(() => {
    if (typeof window === "undefined") return ADMIN_ORDERS;
    try {
      const saved = window.localStorage.getItem("amit-pandey-orders");
      return saved ? JSON.parse(saved) : ADMIN_ORDERS;
    } catch {
      return ADMIN_ORDERS;
    }
  });
  const saveOrders = (next: AdminOrder[]) => {
    setOrders(next);
    if (typeof window !== "undefined") window.localStorage.setItem("amit-pandey-orders", JSON.stringify(next));
  };
  const updateOrderStatus = (id: string, status: string) => saveOrders(orders.map(o => o.id === id ? { ...o, status } : o));
  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);
  return (
    <div className="flex-1 overflow-auto bg-[#fafafa]">
      <AdminHeader title="Order Management" navigate={navigate} />
      <div className="p-8">
        <div className="flex flex-wrap gap-2 mb-6">
          {["all","processing","shipped","delivered","cancelled"].map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-4 py-2 text-sm rounded-full border capitalize transition-colors ${filter === s ? "bg-black text-white border-black" : "border-[#e8e8e8] hover:border-black bg-white"}`}>{s === "all" ? "All Orders" : s}</button>
          ))}
          <button onClick={() => window.alert("Orders export prepared for download in this prototype.")} className="ml-auto border border-[#e8e8e8] bg-white px-4 py-2 text-sm rounded-lg flex items-center gap-2 hover:border-black"><Download size={14} /> Export</button>
        </div>
        <div className="bg-white border border-[#e8e8e8] rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#e8e8e8] text-[11px] tracking-widest text-gray-400 uppercase">
                <th className="text-left px-6 py-4">Order ID</th>
                <th className="text-left px-4 py-4">Customer</th>
                <th className="text-left px-4 py-4 hidden lg:table-cell">Product</th>
                <th className="text-left px-4 py-4 hidden md:table-cell">Date</th>
                <th className="text-right px-4 py-4">Amount</th>
                <th className="text-center px-4 py-4">Status</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id} className="border-b border-[#f5f5f5] hover:bg-[#fafafa] transition-colors">
                  <td className="px-6 py-4 text-sm font-medium">{o.id}</td>
                  <td className="px-4 py-4 text-sm text-gray-700">{o.customer}</td>
                  <td className="px-4 py-4 text-sm text-gray-500 hidden lg:table-cell">{o.product}</td>
                  <td className="px-4 py-4 text-xs text-gray-400 hidden md:table-cell">{o.date}</td>
                  <td className="px-4 py-4 text-sm font-semibold text-right">${o.amount}</td>
                  <td className="px-4 py-4 text-center">
                    <select value={o.status} onChange={e => updateOrderStatus(o.id, e.target.value)} className="border border-[#e8e8e8] rounded px-2 py-1 text-xs capitalize outline-none focus:border-black bg-white">
                      {["processing","shipped","delivered","cancelled"].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-6 py-4"><button onClick={() => updateOrderStatus(o.id, "delivered")} className="p-1.5 hover:bg-gray-100 rounded" title="Mark delivered"><Check size={15} className="text-gray-400" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Customers ──────────────────────────────────────────────────────────

function AdminCustomersPage({ navigate }: { navigate: (p: Page) => void }) {
  const [customers, setCustomers] = useState<AdminCustomer[]>(() => {
    if (typeof window === "undefined") return ADMIN_CUSTOMERS;
    try {
      const saved = window.localStorage.getItem("amit-pandey-customers");
      return saved ? JSON.parse(saved) : ADMIN_CUSTOMERS;
    } catch {
      return ADMIN_CUSTOMERS;
    }
  });
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<AdminCustomer | null>(null);
  const [viewing, setViewing] = useState<AdminCustomer | null>(null);
  const saveCustomers = (next: AdminCustomer[]) => {
    setCustomers(next);
    if (typeof window !== "undefined") window.localStorage.setItem("amit-pandey-customers", JSON.stringify(next));
  };
  const filteredCustomers = customers.filter(c => `${c.name} ${c.email} ${c.status}`.toLowerCase().includes(query.toLowerCase()));
  const saveCustomer = () => {
    if (!editing) return;
    saveCustomers(customers.map(c => c.id === editing.id ? editing : c));
    setEditing(null);
  };
  const deleteCustomer = (id: number) => {
    saveCustomers(customers.filter(c => c.id !== id));
    setViewing(null);
    setEditing(null);
  };
  const vipCount = customers.filter(c => c.status === "vip").length;
  const newThisMonth = customers.filter(c => c.joined.includes("Jun 2026")).length;
  return (
    <div className="flex-1 overflow-auto bg-[#fafafa]">
      <AdminHeader title="Customer Management" navigate={navigate} />
      <div className="p-8">
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[{ label: "Total Customers", value: customers.length.toLocaleString() }, { label: "VIP Members", value: vipCount.toLocaleString() }, { label: "New This Month", value: newThisMonth.toLocaleString() }].map(({ label, value }) => (
            <div key={label} className="bg-white border border-[#e8e8e8] rounded-lg p-5">
              <p className="text-2xl font-semibold">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
        <div className="bg-white border border-[#e8e8e8] rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e8e8e8] flex gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={query} onChange={e => setQuery(e.target.value)} className="w-full border border-[#e8e8e8] rounded-lg pl-9 pr-4 py-2 text-sm outline-none" placeholder="Search customers..." />
            </div>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#e8e8e8] text-[11px] tracking-widest text-gray-400 uppercase">
                <th className="text-left px-6 py-4">Customer</th>
                <th className="text-left px-4 py-4 hidden md:table-cell">Joined</th>
                <th className="text-right px-4 py-4">Orders</th>
                <th className="text-right px-4 py-4">Total Spent</th>
                <th className="text-center px-4 py-4">Status</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(c => (
                <tr key={c.id} className="border-b border-[#f5f5f5] hover:bg-[#fafafa] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-black rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">{c.name.split(" ").map((n: string) => n[0]).join("")}</div>
                      <div>
                        <p className="text-sm font-medium">{c.name}</p>
                        <p className="text-xs text-gray-400">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500 hidden md:table-cell">{c.joined}</td>
                  <td className="px-4 py-4 text-sm font-medium text-right">{c.orders}</td>
                  <td className="px-4 py-4 text-sm font-semibold text-right">${c.spent.toLocaleString()}</td>
                  <td className="px-4 py-4 text-center"><StatusBadge status={c.status} /></td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => setViewing(c)} className="p-1.5 hover:bg-gray-100 rounded text-gray-500"><Eye size={14} /></button>
                      <button onClick={() => setEditing(c)} className="p-1.5 hover:bg-gray-100 rounded text-gray-500"><Edit size={14} /></button>
                      <button onClick={() => deleteCustomer(c.id)} className="p-1.5 hover:bg-red-50 rounded text-gray-500 hover:text-red-500"><Trash size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(editing || viewing) && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6">
            <div className="bg-white rounded-lg border border-[#e8e8e8] w-full max-w-xl shadow-xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e8e8]">
                <h2 className="font-semibold">{editing ? "Edit Customer" : "Customer Details"}</h2>
                <button onClick={() => { setEditing(null); setViewing(null); }} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
              </div>
              {editing ? (
                <div className="p-6 grid grid-cols-2 gap-4">
                  <div><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">NAME</label><input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black" /></div>
                  <div><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">EMAIL</label><input value={editing.email} onChange={e => setEditing({ ...editing, email: e.target.value })} className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black" /></div>
                  <div><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">JOINED</label><input value={editing.joined} onChange={e => setEditing({ ...editing, joined: e.target.value })} className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black" /></div>
                  <div><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">STATUS</label><select value={editing.status} onChange={e => setEditing({ ...editing, status: e.target.value })} className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black bg-white"><option value="active">active</option><option value="vip">vip</option><option value="inactive">inactive</option></select></div>
                  <div><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">ORDERS</label><input type="number" value={editing.orders} onChange={e => setEditing({ ...editing, orders: Number(e.target.value) })} className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black" /></div>
                  <div><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">TOTAL SPENT</label><input type="number" value={editing.spent} onChange={e => setEditing({ ...editing, spent: Number(e.target.value) })} className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black" /></div>
                  <div className="col-span-2 flex justify-end gap-3 pt-2"><button onClick={() => setEditing(null)} className="border border-[#e8e8e8] px-5 py-2.5 text-sm font-semibold rounded hover:bg-gray-50">Cancel</button><button onClick={saveCustomer} className="bg-black text-white px-5 py-2.5 text-sm font-semibold rounded hover:bg-gray-800">Save Customer</button></div>
                </div>
              ) : viewing && (
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-4"><div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white text-sm font-semibold">{viewing.name.split(" ").map(n => n[0]).join("")}</div><div><p className="font-semibold">{viewing.name}</p><p className="text-sm text-gray-500">{viewing.email}</p></div></div>
                  <div className="grid grid-cols-3 gap-3 text-sm"><div className="border border-[#e8e8e8] rounded p-3"><p className="text-gray-400 text-xs">Orders</p><p className="font-semibold">{viewing.orders}</p></div><div className="border border-[#e8e8e8] rounded p-3"><p className="text-gray-400 text-xs">Spent</p><p className="font-semibold">${viewing.spent.toLocaleString()}</p></div><div className="border border-[#e8e8e8] rounded p-3"><p className="text-gray-400 text-xs">Joined</p><p className="font-semibold">{viewing.joined}</p></div></div>
                  <div className="flex justify-end gap-3"><button onClick={() => { setEditing(viewing); setViewing(null); }} className="border border-[#e8e8e8] px-5 py-2.5 text-sm font-semibold rounded hover:bg-gray-50">Edit</button><button onClick={() => deleteCustomer(viewing.id)} className="bg-red-600 text-white px-5 py-2.5 text-sm font-semibold rounded hover:bg-red-700">Delete</button></div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Admin Inventory ──────────────────────────────────────────────────────────

function AdminInventoryPage({ navigate }: { navigate: (p: Page) => void }) {
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    if (typeof window === "undefined") return INVENTORY;
    try {
      const saved = window.localStorage.getItem("amit-pandey-inventory");
      return saved ? JSON.parse(saved) : INVENTORY;
    } catch {
      return INVENTORY;
    }
  });
  const saveInventory = (next: InventoryItem[]) => {
    setInventory(next);
    if (typeof window !== "undefined") window.localStorage.setItem("amit-pandey-inventory", JSON.stringify(next));
  };
  const restockItem = (id: number, amount = 25) => saveInventory(inventory.map(item => item.id === id ? { ...item, stock: item.stock + amount, low: item.stock + amount < 20 } : item));
  const restockAll = () => saveInventory(inventory.map(item => item.low ? { ...item, stock: item.stock + 50, low: false } : item));
  const lowCount = inventory.filter(i => i.low).length;
  return (
    <div className="flex-1 overflow-auto bg-[#fafafa]">
      <AdminHeader title="Inventory Management" navigate={navigate} />
      <div className="p-8">
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[{ label: "Total SKUs", value: inventory.length.toString() }, { label: "In Stock", value: inventory.filter(i => i.stock > 0).length.toString() }, { label: "Low Stock", value: lowCount.toString(), alert: true }].map(({ label, value, alert }) => (
            <div key={label} className={`bg-white border rounded-lg p-5 ${alert ? "border-red-200" : "border-[#e8e8e8]"}`}>
              {alert && <AlertCircle size={16} className="text-red-500 mb-2" />}
              <p className={`text-2xl font-semibold ${alert ? "text-red-500" : ""}`}>{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
        {lowCount > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700"><strong>{lowCount} items</strong> are running low on stock and need restocking.</p>
            <button onClick={restockAll} className="ml-auto text-xs text-red-600 font-semibold underline">Reorder All</button>
          </div>
        )}
        <div className="bg-white border border-[#e8e8e8] rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#e8e8e8] text-[11px] tracking-widest text-gray-400 uppercase">
                <th className="text-left px-6 py-4">Product</th>
                <th className="text-left px-4 py-4 hidden md:table-cell">SKU</th>
                <th className="text-right px-4 py-4">In Stock</th>
                <th className="text-right px-4 py-4 hidden lg:table-cell">Units Sold</th>
                <th className="text-center px-4 py-4">Status</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody>
              {inventory.map(item => (
                <tr key={item.id} className={`border-b border-[#f5f5f5] hover:bg-[#fafafa] transition-colors ${item.low ? "bg-red-50/30" : ""}`}>
                  <td className="px-6 py-4 text-sm font-medium">{item.name}</td>
                  <td className="px-4 py-4 text-xs text-gray-400 font-mono hidden md:table-cell">{item.sku}</td>
                  <td className={`px-4 py-4 text-sm font-semibold text-right ${item.low ? "text-red-500" : "text-green-600"}`}>{item.stock}</td>
                  <td className="px-4 py-4 text-sm text-gray-500 text-right hidden lg:table-cell">{item.sold}</td>
                  <td className="px-4 py-4 text-center"><StatusBadge status={item.low ? "low-stock" : "active"} /></td>
                  <td className="px-6 py-4"><button onClick={() => restockItem(item.id)} className="text-xs text-black border border-[#e8e8e8] px-3 py-1.5 rounded hover:bg-gray-50">Restock +25</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Promotions ─────────────────────────────────────────────────────────

function AdminPromotionsPage({ navigate }: { navigate: (p: Page) => void }) {
  const [promotions, setPromotions] = useState<Promotion[]>(() => {
    if (typeof window === "undefined") return PROMOTIONS;
    try {
      const saved = window.localStorage.getItem("amit-pandey-promotions");
      return saved ? JSON.parse(saved) : PROMOTIONS;
    } catch {
      return PROMOTIONS;
    }
  });
  const [editing, setEditing] = useState<Promotion | null>(null);
  const savePromotions = (next: Promotion[]) => {
    setPromotions(next);
    if (typeof window !== "undefined") window.localStorage.setItem("amit-pandey-promotions", JSON.stringify(next));
  };
  const openPromotion = (promo?: Promotion) => setEditing(promo || { id: Date.now(), code: "NEWCODE", type: "Percentage", value: "10%", minOrder: "$0", uses: 0, limit: 100, expires: "Dec 31, 2026", status: "active" });
  const savePromotion = () => {
    if (!editing) return;
    const exists = promotions.some(p => p.id === editing.id);
    savePromotions(exists ? promotions.map(p => p.id === editing.id ? editing : p) : [editing, ...promotions]);
    setEditing(null);
  };
  const deletePromotion = (id: number) => savePromotions(promotions.filter(p => p.id !== id));
  return (
    <div className="flex-1 overflow-auto bg-[#fafafa]">
      <AdminHeader title="Promotions & Coupons" navigate={navigate} />
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <p className="text-sm text-gray-500">{promotions.length} promotions</p>
          <button onClick={() => openPromotion()} className="bg-black text-white px-5 py-2.5 text-sm font-semibold rounded-lg hover:bg-gray-800 flex items-center gap-2"><Plus size={16} /> Create Coupon</button>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {promotions.map(p => (
            <div key={p.id} className={`bg-white border rounded-lg p-6 ${p.status === "expired" ? "opacity-60" : "border-[#e8e8e8]"}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-lg font-bold tracking-wider">{p.code}</span>
                    <StatusBadge status={p.status} />
                  </div>
                  <p className="text-sm text-gray-500">{p.type} · {p.value} off</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openPromotion(p)} className="p-1.5 hover:bg-gray-100 rounded text-gray-500"><Edit size={14} /></button>
                  <button onClick={() => deletePromotion(p.id)} className="p-1.5 hover:bg-red-50 rounded text-gray-500 hover:text-red-500"><Trash size={14} /></button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs text-gray-500 mb-4">
                <div><p className="text-gray-400">Min Order</p><p className="font-medium text-gray-700">{p.minOrder}</p></div>
                <div><p className="text-gray-400">Uses</p><p className="font-medium text-gray-700">{p.uses}{p.limit ? `/${p.limit}` : ""}</p></div>
                <div><p className="text-gray-400">Expires</p><p className="font-medium text-gray-700">{p.expires}</p></div>
              </div>
              {p.limit && (
                <div>
                  <div className="w-full bg-[#e8e8e8] rounded-full h-1.5">
                    <div className="bg-black h-1.5 rounded-full" style={{ width: `${(p.uses / p.limit) * 100}%` }} />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">{p.uses} of {p.limit} uses</p>
                </div>
              )}
            </div>
          ))}
        </div>
        {editing && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6">
            <div className="bg-white rounded-lg border border-[#e8e8e8] w-full max-w-xl shadow-xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e8e8]"><h2 className="font-semibold">Coupon Details</h2><button onClick={() => setEditing(null)} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button></div>
              <div className="p-6 grid grid-cols-2 gap-4">
                <div><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">CODE</label><input value={editing.code} onChange={e => setEditing({ ...editing, code: e.target.value.toUpperCase() })} className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black" /></div>
                <div><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">TYPE</label><select value={editing.type} onChange={e => setEditing({ ...editing, type: e.target.value })} className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black bg-white"><option>Percentage</option><option>Fixed</option><option>Free Shipping</option></select></div>
                <div><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">VALUE</label><input value={editing.value} onChange={e => setEditing({ ...editing, value: e.target.value })} className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black" /></div>
                <div><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">MIN ORDER</label><input value={editing.minOrder} onChange={e => setEditing({ ...editing, minOrder: e.target.value })} className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black" /></div>
                <div><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">USE LIMIT</label><input type="number" value={editing.limit ?? ""} onChange={e => setEditing({ ...editing, limit: e.target.value ? Number(e.target.value) : null })} className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black" /></div>
                <div><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">EXPIRES</label><input value={editing.expires} onChange={e => setEditing({ ...editing, expires: e.target.value })} className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black" /></div>
                <div><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">STATUS</label><select value={editing.status} onChange={e => setEditing({ ...editing, status: e.target.value })} className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black bg-white"><option value="active">active</option><option value="expired">expired</option><option value="inactive">inactive</option></select></div>
                <div className="col-span-2 flex justify-end gap-3 pt-2"><button onClick={() => setEditing(null)} className="border border-[#e8e8e8] px-5 py-2.5 text-sm font-semibold rounded hover:bg-gray-50">Cancel</button><button onClick={savePromotion} className="bg-black text-white px-5 py-2.5 text-sm font-semibold rounded hover:bg-gray-800">Save Coupon</button></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Admin Reviews ────────────────────────────────────────────────────────────

function AdminReviewsPage({ navigate }: { navigate: (p: Page) => void }) {
  const [reviews, setReviews] = useState<Review[]>(() => {
    if (typeof window === "undefined") return REVIEWS;
    try {
      const saved = window.localStorage.getItem("amit-pandey-reviews");
      return saved ? JSON.parse(saved) : REVIEWS;
    } catch {
      return REVIEWS;
    }
  });
  const saveReviews = (next: Review[]) => {
    setReviews(next);
    if (typeof window !== "undefined") window.localStorage.setItem("amit-pandey-reviews", JSON.stringify(next));
  };
  const approveReview = (id: number) => saveReviews(reviews.map(r => r.id === id ? { ...r, status: "published" } : r));
  const deleteReview = (id: number) => saveReviews(reviews.filter(r => r.id !== id));
  const avgRating = reviews.length ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : "0.0";
  const pendingCount = reviews.filter(r => r.status === "pending").length;
  return (
    <div className="flex-1 overflow-auto bg-[#fafafa]">
      <AdminHeader title="Reviews Management" navigate={navigate} />
      <div className="p-8">
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[{ label: "Total Reviews", value: "2,847" }, { label: "Avg Rating", value: "4.7 ★" }, { label: "Pending", value: "12" }].map(({ label, value }) => (
            <div key={label} className="bg-white border border-[#e8e8e8] rounded-lg p-5">
              <p className="text-2xl font-semibold">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
        <div className="sr-only">Showing {reviews.length} reviews, {avgRating} average rating, {pendingCount} pending</div>
        <div className="space-y-4">
          {reviews.map(r => (
            <div key={r.id} className={`bg-white border rounded-lg p-5 ${r.status === "pending" ? "border-amber-200" : "border-[#e8e8e8]"}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white text-xs">{r.customer[0]}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{r.customer}</p>
                        <StarRating rating={r.rating} size={11} />
                      </div>
                      <p className="text-xs text-gray-400">{r.product} · {r.date}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed mt-2 ml-11">&ldquo;{r.comment}&rdquo;</p>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <StatusBadge status={r.status} />
                  <div className="flex gap-1">
                    {r.status === "pending" && <button onClick={() => approveReview(r.id)} className="text-[11px] bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded font-medium hover:bg-green-100">Approve</button>}
                    <button onClick={() => deleteReview(r.id)} className="text-[11px] bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded font-medium hover:bg-red-100">Delete</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Admin Analytics ──────────────────────────────────────────────────────────

function AdminAnalyticsPage({ navigate, products }: { navigate: (p: Page) => void; products: Product[] }) {
  const trafficData = [
    { day: "Mon", visitors: 2400, pageviews: 7200 }, { day: "Tue", visitors: 3100, pageviews: 9300 },
    { day: "Wed", visitors: 2800, pageviews: 8400 }, { day: "Thu", visitors: 4200, pageviews: 12600 },
    { day: "Fri", visitors: 5100, pageviews: 15300 }, { day: "Sat", visitors: 6800, pageviews: 20400 },
    { day: "Sun", visitors: 5600, pageviews: 16800 },
  ];
  return (
    <div className="flex-1 overflow-auto bg-[#fafafa]">
      <AdminHeader title="Analytics Dashboard" navigate={navigate} />
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[{ label: "Page Views", value: "89,420", change: "+23%" }, { label: "Unique Visitors", value: "30,182", change: "+18%" }, { label: "Bounce Rate", value: "34.2%", change: "-5%" }, { label: "Session Duration", value: "3m 42s", change: "+12%" }].map(({ label, value, change }) => (
            <div key={label} className="bg-white border border-[#e8e8e8] rounded-lg p-5">
              <p className="text-2xl font-semibold">{value}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">{label}</span>
                <span className="text-[11px] text-green-600 font-semibold">{change}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white border border-[#e8e8e8] rounded-lg p-6">
          <h2 className="font-semibold mb-5">Weekly Traffic</h2>
          <ResponsiveContainer width="100%" height={250}>
            <RechBar data={trafficData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#9b9b9b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9b9b9b" }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="visitors" name="Visitors" fill="#0a0a0a" radius={[3, 3, 0, 0]} />
              <Bar dataKey="pageviews" name="Page Views" fill="#c8a97e" radius={[3, 3, 0, 0]} />
            </RechBar>
          </ResponsiveContainer>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-[#e8e8e8] rounded-lg p-6">
            <h2 className="font-semibold mb-5">Revenue Trend</h2>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={MONTHLY_DATA.slice(6)}>
                <defs><linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#c8a97e" stopOpacity={0.2} /><stop offset="95%" stopColor="#c8a97e" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9b9b9b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9b9b9b" }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]} />
                <Area type="monotone" dataKey="revenue" stroke="#c8a97e" strokeWidth={2} fill="url(#g2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white border border-[#e8e8e8] rounded-lg p-6">
            <h2 className="font-semibold mb-5">Top Products</h2>
            <div className="space-y-3">
              {products.slice(0, 5).map((p, i) => (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="text-[11px] text-gray-400 w-4">{i+1}</span>
                  <img src={p.image} alt={p.name} className="w-8 h-8 object-cover rounded" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{p.name}</p>
                    <div className="w-full bg-[#e8e8e8] rounded-full h-1 mt-1">
                      <div className="bg-black h-1 rounded-full" style={{ width: `${100 - i * 15}%` }} />
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-gray-700">{p.reviewCount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Settings ───────────────────────────────────────────────────────────

function AdminSettingsPage({ navigate }: { navigate: (p: Page) => void }) {
  const [activeTab, setActiveTab] = useState("general");
  const tabs = [["general","General"],["shipping","Shipping"],["payments","Payments"],["notifications","Notifications"],["seo","SEO"]];
  return (
    <div className="flex-1 overflow-auto bg-[#fafafa]">
      <AdminHeader title="Store Settings" navigate={navigate} />
      <div className="p-8">
        <div className="flex gap-1 border border-[#e8e8e8] bg-white rounded-lg p-1 mb-6 inline-flex">
          {tabs.map(([id, label]) => (
            <button key={id} onClick={() => setActiveTab(id)} className={`px-4 py-2 text-sm font-medium rounded transition-colors ${activeTab === id ? "bg-black text-white" : "text-gray-500 hover:text-black"}`}>{label}</button>
          ))}
        </div>
        <div className="bg-white border border-[#e8e8e8] rounded-lg p-8 max-w-2xl">
          {activeTab === "general" && (
            <div className="space-y-5">
              <h2 className="font-semibold text-lg mb-6">General Settings</h2>
              <div><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">STORE NAME</label><input defaultValue="Amit Pandey Studio" className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black" /></div>
              <div><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">STORE EMAIL</label><input defaultValue="hello@popculture.com" className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black" /></div>
              <div><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">CURRENCY</label>
                <select className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none"><option>USD — US Dollar</option><option>GBP — British Pound</option><option>EUR — Euro</option></select>
              </div>
              <div><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">TIMEZONE</label>
                <select className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none"><option>America/New_York (EST)</option><option>America/Los_Angeles (PST)</option><option>Europe/London (GMT)</option></select>
              </div>
              <div><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">STORE ADDRESS</label><input defaultValue="Sydney, NSW, Australia" className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black" /></div>
              <div className="flex items-center justify-between border border-[#e8e8e8] rounded px-4 py-3">
                <div><p className="text-sm font-medium">Maintenance Mode</p><p className="text-xs text-gray-400">Temporarily hide the store from customers</p></div>
                <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" className="sr-only peer" /><div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-black peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:w-4 after:h-4 after:rounded-full after:transition-all" /></label>
              </div>
              <button onClick={() => window.alert("Store settings saved in this prototype.")} className="bg-black text-white px-6 py-3 text-[12px] tracking-widest font-semibold hover:bg-gray-800 transition-colors">SAVE SETTINGS</button>
            </div>
          )}
          {activeTab !== "general" && (
            <div className="text-center py-16 text-gray-400">
              <Settings size={36} className="mx-auto mb-3 text-gray-200" />
              <p className="text-sm font-medium capitalize">{activeTab} Settings</p>
              <p className="text-xs mt-1">Configuration options coming soon</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Admin Profile ────────────────────────────────────────────────────────────

function AdminProfilePage({ navigate }: { navigate: (p: Page) => void }) {
  return (
    <div className="flex-1 overflow-auto bg-[#fafafa]">
      <AdminHeader title="Admin Profile" navigate={navigate} />
      <div className="p-8 max-w-2xl">
        <div className="bg-white border border-[#e8e8e8] rounded-lg p-8 mb-6">
          <div className="flex items-center gap-6 mb-8">
            <div className="relative">
              <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center text-white text-2xl font-semibold">AP</div>
              <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border border-[#e8e8e8] rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50"><Upload size={12} /></button>
            </div>
            <div>
              <p className="text-xl font-semibold">Amit Pandey</p>
              <p className="text-sm text-gray-500">Super Administrator</p>
              <span className="inline-block mt-1 bg-black text-white text-[10px] font-semibold px-2 py-0.5">SUPER ADMIN</span>
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">FIRST NAME</label><input defaultValue="Amit" className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black" /></div>
              <div><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">LAST NAME</label><input defaultValue="Pandey" className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black" /></div>
            </div>
            <div><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">EMAIL</label><input defaultValue="amit@popculture.com" className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm outline-none focus:border-black" /></div>
            <div><label className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5">ROLE</label><input defaultValue="Super Administrator" disabled className="w-full border border-[#e8e8e8] rounded px-4 py-3 text-sm bg-[#f8f8f8] text-gray-500 cursor-not-allowed" /></div>
          </div>
          <button onClick={() => window.alert("Admin profile changes saved in this prototype.")} className="mt-6 bg-black text-white px-6 py-3 text-[12px] tracking-widest font-semibold hover:bg-gray-800 transition-colors">SAVE CHANGES</button>
        </div>
        <div className="bg-white border border-[#e8e8e8] rounded-lg p-6">
          <h2 className="font-semibold mb-5">Recent Activity</h2>
          <div className="space-y-3">
            {[
              { action: "Updated product: Red Tulle City Gown", time: "2 hours ago" },
              { action: "Processed return for order AP-2026-1048", time: "5 hours ago" },
              { action: "Added new promotional code AMIT30", time: "Yesterday at 3:41 PM" },
              { action: "Exported customer data report", time: "Jun 28, 2026" },
            ].map(({ action, time }) => (
              <div key={action} className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 bg-[#c8a97e] rounded-full mt-1.5 flex-shrink-0" />
                <div><p className="text-gray-700">{action}</p><p className="text-xs text-gray-400 mt-0.5">{time}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [products, setProducts] = useState<Product[]>(() => {
    if (typeof window === "undefined") return PRODUCTS;
    try {
      const saved = window.localStorage.getItem("amit-pandey-products");
      return saved ? JSON.parse(saved) : PRODUCTS;
    } catch {
      return PRODUCTS;
    }
  });
  const [selectedProduct, setSelectedProduct] = useState<Product>(products[0] || PRODUCTS[0]);
  const [wishlist, setWishlist] = useState<number[]>([1, 5, 9]);
  const [cart, setCart] = useState<CartItem[]>([
    { product: PRODUCTS[0], quantity: 1, size: "M", color: "black" },
    { product: PRODUCTS[3], quantity: 1, size: "41", color: "white" },
  ]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProducts() {
      try {
        const response = await fetch("/api/products", { signal: controller.signal });
        if (!response.ok) throw new Error(`Product API returned ${response.status}`);
        const apiProducts: Product[] = await response.json();
        if (!Array.isArray(apiProducts) || apiProducts.length === 0) return;

        setProducts(apiProducts);
        setSelectedProduct((current) =>
          apiProducts.find((product) => product.id === current.id) || apiProducts[0]
        );
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.warn("Using the bundled catalogue because the product API is unavailable.", error);
      }
    }

    loadProducts();
    return () => controller.abort();
  }, []);

  const navigate = (p: Page) => {
    setPage(p);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleProductsChange = async (nextProducts: Product[]) => {
    const previousProducts = products;
    setProducts(nextProducts);
    setSelectedProduct(prev => nextProducts.find(p => p.id === prev.id) || nextProducts[0] || PRODUCTS[0]);

    try {
      const removedProduct = previousProducts.find(product => !nextProducts.some(next => next.id === product.id));
      const addedProduct = nextProducts.find(product => !previousProducts.some(previous => previous.id === product.id));
      const changedProduct = nextProducts.find(product => {
        const previous = previousProducts.find(item => item.id === product.id);
        return previous && JSON.stringify(previous) !== JSON.stringify(product);
      });

      let response: Response;
      if (removedProduct) {
        response = await fetch(`/api/products/${removedProduct.id}`, { method: "DELETE" });
      } else if (addedProduct) {
        response = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(addedProduct),
        });
      } else if (changedProduct) {
        response = await fetch(`/api/products/${changedProduct.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(changedProduct),
        });
      } else {
        return;
      }

      if (!response.ok) {
        const failure = await response.json().catch(() => ({ error: "Product change failed" }));
        throw new Error(failure.details?.join(". ") || failure.error || "Product change failed");
      }

      const refreshed = await fetch("/api/products");
      if (!refreshed.ok) throw new Error("The product changed, but the catalogue could not refresh");
      const persistedProducts: Product[] = await refreshed.json();
      setProducts(persistedProducts);
      setSelectedProduct(prev => persistedProducts.find(product => product.id === prev.id) || persistedProducts[0] || PRODUCTS[0]);
    } catch (error) {
      setProducts(previousProducts);
      setSelectedProduct(prev => previousProducts.find(product => product.id === prev.id) || previousProducts[0] || PRODUCTS[0]);
      window.alert(error instanceof Error ? error.message : "Unable to save the product change");
    }
  };

  const toggleWishlist = (id: number) => {
    setWishlist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const addToCart = (product: Product, quantity = 1, size = product.sizes[0], color = product.colors[0]) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id && i.size === size && i.color === color);
      if (existing) return prev.map(i => i.product.id === product.id && i.size === size && i.color === color ? { ...i, quantity: i.quantity + quantity } : i);
      return [...prev, { product, quantity, size, color }];
    });
  };

  const removeFromCart = (index: number) => setCart(prev => prev.filter((_, i) => i !== index));
  const updateQty = (index: number, qty: number) => setCart(prev => prev.map((item, i) => i === index ? { ...item, quantity: qty } : item));
  const clearCart = () => setCart([]);

  const isAdmin = page.startsWith("admin") && page !== "admin-login";
  const isLoggedIn = !!sessionUser;
  const isAdminLoggedIn = sessionUser?.role === "admin";

  const handleLogin = (rawEmail: string, rawPassword: string) => {
    const email = rawEmail.trim().toLowerCase();
    const password = rawPassword.trim();
    const accounts = [
      { email: "customer@popculture.com", password: "customer123", role: "customer" as const, name: "Nisha Sharma" },
      { email: "amit@popculture.com", password: "amit123", role: "admin" as const, name: "Amit Pandey" },
    ];
    const account = accounts.find(a => a.email === email && a.password === password);

    if (!account) {
      return { ok: false, message: "Use customer@popculture.com / customer123 or amit@popculture.com / amit123 for this prototype." };
    }

    setSessionUser({ name: account.name, email: account.email, role: account.role });
    navigate(account.role === "admin" ? "admin-dashboard" : "dashboard");
    return { ok: true };
  };

  const handleSignup = (name: string, email: string) => {
    setSessionUser({ name, email: email || "member@popculture.com", role: "customer" });
    navigate("dashboard");
  };

  const handleLogout = () => {
    setSessionUser(null);
    navigate("home");
  };

  // Admin layout
  if (isAdmin) {
    if (!isAdminLoggedIn) {
      return <div style={{ fontFamily: "var(--font-body)" }}><AdminLoginPage navigate={navigate} onLogin={handleLogin} /></div>;
    }
    const adminPages: Record<string, React.ReactElement> = {
      "admin-dashboard": <AdminDashboardPage navigate={navigate} />,
      "admin-products": <AdminProductsPage navigate={navigate} products={products} onProductsChange={handleProductsChange} onProductSelect={setSelectedProduct} />,
      "admin-categories": <AdminCategoriesPage navigate={navigate} products={products} />,
      "admin-orders": <AdminOrdersPage navigate={navigate} />,
      "admin-customers": <AdminCustomersPage navigate={navigate} />,
      "admin-inventory": <AdminInventoryPage navigate={navigate} />,
      "admin-promotions": <AdminPromotionsPage navigate={navigate} />,
      "admin-reviews": <AdminReviewsPage navigate={navigate} />,
      "admin-analytics": <AdminAnalyticsPage navigate={navigate} products={products} />,
      "admin-settings": <AdminSettingsPage navigate={navigate} />,
      "admin-profile": <AdminProfilePage navigate={navigate} />,
    };
    return (
      <div className="flex min-h-screen" style={{ fontFamily: "var(--font-body)" }}>
        <AdminSidebar page={page} navigate={navigate} onLogout={handleLogout} />
        {adminPages[page] || <AdminDashboardPage navigate={navigate} />}
      </div>
    );
  }

  // Admin login
  if (page === "admin-login") {
    return <div style={{ fontFamily: "var(--font-body)" }}><AdminLoginPage navigate={navigate} onLogin={handleLogin} /></div>;
  }

  // Customer layout
  const noFooterPages: Page[] = ["login", "signup", "forgot-password", "checkout", "order-confirmation"];
  const noNavPages: Page[] = ["login", "signup", "forgot-password", "checkout", "order-confirmation"];

  const customerPages: Record<string, React.ReactElement> = {
    home: <HomePage navigate={navigate} products={products} onAddToCart={addToCart} wishlist={wishlist} onWishlistToggle={toggleWishlist} onProductSelect={setSelectedProduct} />,
    login: <LoginPage navigate={navigate} onLogin={handleLogin} />,
    signup: <SignupPage navigate={navigate} onSignup={handleSignup} />,
    "forgot-password": <ForgotPasswordPage navigate={navigate} />,
    dashboard: <DashboardPage navigate={navigate} products={products} wishlist={wishlist} userName={sessionUser?.name} onProductSelect={setSelectedProduct} />,
    shop: <ShopPage navigate={navigate} products={products} onAddToCart={addToCart} wishlist={wishlist} onWishlistToggle={toggleWishlist} onProductSelect={setSelectedProduct} />,
    product: <ProductDetailPage navigate={navigate} product={selectedProduct} products={products} onAddToCart={addToCart} wishlist={wishlist} onWishlistToggle={toggleWishlist} onProductSelect={setSelectedProduct} />,
    cart: <CartPage navigate={navigate} cart={cart} onRemove={removeFromCart} onQtyChange={updateQty} onProductSelect={setSelectedProduct} />,
    checkout: <CheckoutPage navigate={navigate} cart={cart} onClearCart={clearCart} />,
    "order-confirmation": <OrderConfirmationPage navigate={navigate} />,
    orders: <OrdersPage navigate={navigate} />,
    wishlist: <WishlistPage navigate={navigate} products={products} wishlist={wishlist} onWishlistToggle={toggleWishlist} onAddToCart={addToCart} onProductSelect={setSelectedProduct} />,
    profile: <ProfilePage navigate={navigate} user={sessionUser} />,
    about: <AboutPage navigate={navigate} />,
    contact: <ContactPage navigate={navigate} />,
    faq: <FAQPage navigate={navigate} />,
  };

  return (
    <div style={{ fontFamily: "var(--font-body)" }} className="bg-white">
      {!noNavPages.includes(page) && (
        <CustomerNav page={page} navigate={navigate} cartCount={cart.reduce((s, i) => s + i.quantity, 0)} wishlistCount={wishlist.length} isLoggedIn={isLoggedIn} />
      )}

      <main>
        {customerPages[page] || <HomePage navigate={navigate} products={products} onAddToCart={addToCart} wishlist={wishlist} onWishlistToggle={toggleWishlist} onProductSelect={setSelectedProduct} />}
      </main>
      {!noFooterPages.includes(page) && <CustomerFooter navigate={navigate} />}
      <style>{`
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-33.33%); } }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e0e0e0; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #c0c0c0; }
      `}</style>
    </div>
  );
}
