# 🚀 Best Practice E-Commerce Website - Complete Build Prompt

> **For Claude Code (VS Code Extension)**
> **Date:** October 2026

---

## 📋 PROJECT OVERVIEW

Build a world-class e-commerce website following best practices from top brands (Shopify, Zara, H&M, Nike, Amazon). 

**Focus Areas:**
- ⚡ Performance (< 2s load)
- ♿ Accessibility (WCAG 2.1 AA)
- 🔒 Security
- 📱 Mobile-first
- 🛒 Full e-commerce features

---

## 🛠️ TECH STACK (2026 Best Practice)

```
Frontend:        Next.js 14+ (App Router), TypeScript, Tailwind CSS
State:           Zustand (cart, wishlist, UI)
Forms:           React Hook Form + Zod
Backend:         Next.js API Routes + Server Actions
Database:        PostgreSQL (Supabase)
ORM:             Prisma
Auth:            NextAuth.js v5
Payments:        Stripe / Paymob (Egypt)
Images:          Cloudinary
Email:           Resend
Hosting:         Vercel
```

---

## 📁 PROJECT STRUCTURE

```
src/
├── app/
│   ├── (shop)/
│   │   ├── page.tsx                 # Home
│   │   ├── products/
│   │   │   ├── page.tsx             # All products
│   │   │   └── [slug]/page.tsx      # Product detail
│   │   ├── categories/[slug]/page.tsx
│   │   ├── cart/page.tsx
│   │   ├── checkout/page.tsx
│   │   └── search/page.tsx
│   │
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── forgot-password/page.tsx
│   │
│   ├── (account)/
│   │   ├── account/page.tsx
│   │   ├── orders/page.tsx
│   │   ├── orders/[id]/page.tsx
│   │   ├── wishlist/page.tsx
│   │   └── addresses/page.tsx
│   │
│   ├── admin/
│   │   ├── page.tsx                 # Dashboard
│   │   ├── products/page.tsx
│   │   ├── orders/page.tsx
│   │   └── customers/page.tsx
│   │
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── products/route.ts
│   │   ├── orders/route.ts
│   │   ├── cart/route.ts
│   │   ├── checkout/route.ts
│   │   └── webhook/route.ts
│   │
│   ├── layout.tsx
│   ├── loading.tsx
│   ├── error.tsx
│   └── globals.css
│
├── components/
│   ├── ui/           # Button, Input, Modal, Toast, Skeleton
│   ├── layout/       # Header, Footer, MobileNav
│   ├── product/      # ProductCard, ProductGrid, Gallery, SizeSelector
│   ├── cart/         # CartDrawer, CartItem, CartSummary
│   └── checkout/     # CheckoutForm, AddressForm, PaymentForm
│
├── lib/
│   ├── prisma.ts
│   ├── auth.ts
│   ├── utils.ts
│   └── validations.ts
│
├── hooks/
│   ├── useCart.ts
│   ├── useWishlist.ts
│   └── useDebounce.ts
│
├── stores/
│   ├── cartStore.ts
│   ├── wishlistStore.ts
│   └── uiStore.ts
│
└── types/
    ├── product.ts
    ├── order.ts
    └── user.ts
```

---

## 🗄️ DATABASE SCHEMA

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?
  name          String?
  phone         String?
  password      String?
  image         String?
  role          Role      @default(CUSTOMER)
  
  addresses     Address[]
  orders        Order[]
  reviews       Review[]
  wishlist      WishlistItem[]
  cart          CartItem[]
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

enum Role {
  CUSTOMER
  ADMIN
}

model Address {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  label       String
  fullName    String
  phone       String
  street      String
  city        String
  state       String
  postalCode  String?
  country     String   @default("Egypt")
  isDefault   Boolean  @default(false)
  
  orders      Order[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Category {
  id          String    @id @default(cuid())
  name        String
  slug        String    @unique
  description String?
  image       String?
  parentId    String?
  parent      Category? @relation("CategoryToCategory", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryToCategory")
  products    Product[]
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Product {
  id           String   @id @default(cuid())
  name         String
  slug         String   @unique
  description  String
  price        Decimal  @db.Decimal(10, 2)
  comparePrice Decimal? @db.Decimal(10, 2)
  
  categoryId   String
  category     Category @relation(fields: [categoryId], references: [id])
  
  images       ProductImage[]
  variants     ProductVariant[]
  reviews      Review[]
  wishlist     WishlistItem[]
  cartItems    CartItem[]
  orderItems   OrderItem[]
  
  featured     Boolean  @default(false)
  isActive     Boolean  @default(true)
  
  metaTitle       String?
  metaDescription String?
  
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  @@index([categoryId])
  @@index([slug])
}

model ProductImage {
  id        String  @id @default(cuid())
  productId String
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  url       String
  alt       String?
  order     Int     @default(0)
}

model ProductVariant {
  id        String   @id @default(cuid())
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  size      String?
  color     String?
  colorHex  String?
  sku       String   @unique
  stock     Int      @default(0)
  price     Decimal? @db.Decimal(10, 2)
  
  cartItems  CartItem[]
  orderItems OrderItem[]
  
  @@unique([productId, size, color])
}

model CartItem {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  variantId String
  variant   ProductVariant @relation(fields: [variantId], references: [id], onDelete: Cascade)
  quantity  Int      @default(1)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([userId, variantId])
}

model Order {
  id            String        @id @default(cuid())
  orderNumber   String        @unique
  userId        String
  user          User          @relation(fields: [userId], references: [id])
  addressId     String
  address       Address       @relation(fields: [addressId], references: [id])
  items         OrderItem[]
  
  subtotal      Decimal       @db.Decimal(10, 2)
  shipping      Decimal       @db.Decimal(10, 2)
  discount      Decimal       @default(0) @db.Decimal(10, 2)
  total         Decimal       @db.Decimal(10, 2)
  
  status        OrderStatus   @default(PENDING)
  paymentStatus PaymentStatus @default(PENDING)
  paymentMethod String?
  paymentId     String?
  notes         String?
  
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  
  @@index([userId])
  @@index([orderNumber])
}

model OrderItem {
  id        String   @id @default(cuid())
  orderId   String
  order     Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId String
  product   Product  @relation(fields: [productId], references: [id])
  variantId String
  variant   ProductVariant @relation(fields: [variantId], references: [id])
  
  name      String
  price     Decimal  @db.Decimal(10, 2)
  quantity  Int
  size      String?
  color     String?
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
}

model Review {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  rating    Int
  title     String?
  comment   String?
  verified  Boolean  @default(false)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([userId, productId])
}

model WishlistItem {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  createdAt DateTime @default(now())
  
  @@unique([userId, productId])
}

model Coupon {
  id        String     @id @default(cuid())
  code      String     @unique
  type      CouponType
  value     Decimal    @db.Decimal(10, 2)
  minOrder  Decimal?   @db.Decimal(10, 2)
  maxUses   Int?
  usedCount Int        @default(0)
  isActive  Boolean    @default(true)
  expiresAt DateTime?
  
  createdAt DateTime   @default(now())
}

enum CouponType {
  PERCENTAGE
  FIXED
}

model StoreSettings {
  id              String   @id @default("settings")
  storeName       String
  storeEmail      String
  storePhone      String?
  currency        String   @default("EGP")
  freeShippingMin Decimal? @db.Decimal(10, 2)
  shippingCost    Decimal  @default(50) @db.Decimal(10, 2)
  
  updatedAt       DateTime @updatedAt
}
```

---

## 🎨 DESIGN TOKENS

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#faf5f0',
          100: '#f0e6d8',
          200: '#e0ccb0',
          300: '#d0b088',
          400: '#c09560',
          500: '#a07850',
          600: '#806040',
          700: '#604830',
          800: '#403020',
          900: '#201810',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
    },
  },
};
```

---

## 🛒 CART STORE (Zustand)

```typescript
// stores/cartStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  name: string;
  price: number;
  image: string;
  size?: string;
  color?: string;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  totalItems: () => number;
  subtotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      
      addItem: (item) => {
        const items = get().items;
        const existing = items.find((i) => i.variantId === item.variantId);
        
        if (existing) {
          set({
            items: items.map((i) =>
              i.variantId === item.variantId
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          });
        } else {
          set({ items: [...items, { ...item, quantity: 1 }] });
        }
        set({ isOpen: true });
      },
      
      removeItem: (variantId) => {
        set({ items: get().items.filter((i) => i.variantId !== variantId) });
      },
      
      updateQuantity: (variantId, quantity) => {
        if (quantity < 1) {
          get().removeItem(variantId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.variantId === variantId ? { ...i, quantity } : i
          ),
        });
      },
      
      clearCart: () => set({ items: [] }),
      toggleCart: () => set({ isOpen: !get().isOpen }),
      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    { name: 'cart-storage' }
  )
);
```

---

## ⚡ PERFORMANCE REQUIREMENTS

**Core Web Vitals:**
- LCP < 2.5s
- FID < 100ms  
- CLS < 0.1

**Implement:**
1. `next/image` with lazy loading + blur placeholder
2. Dynamic imports for heavy components
3. ISR (Incremental Static Regeneration) for products
4. Prefetch on hover
5. Optimistic UI updates
6. Edge caching

---

## ♿ ACCESSIBILITY CHECKLIST

- [ ] Semantic HTML (`<main>`, `<nav>`, `<article>`)
- [ ] Skip-to-content link
- [ ] ARIA labels on interactive elements
- [ ] Keyboard navigation (Tab, Enter, Escape)
- [ ] Focus management in modals
- [ ] Color contrast 4.5:1 minimum
- [ ] Alt text on all images
- [ ] Form labels and error messages
- [ ] `aria-live` for dynamic content

---

## 🔒 SECURITY

- [ ] Input validation with Zod
- [ ] Password hashing (bcrypt, 12 rounds)
- [ ] CSRF protection (NextAuth)
- [ ] Rate limiting (Upstash)
- [ ] Secure headers (X-Content-Type, X-Frame-Options)
- [ ] Environment variables (never expose secrets)
- [ ] Webhook signature verification

---

## 💳 PAYMENTS

### Stripe
```typescript
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: items.map(item => ({
    price_data: {
      currency: 'egp',
      product_data: { name: item.name, images: [item.image] },
      unit_amount: item.price * 100,
    },
    quantity: item.quantity,
  })),
  mode: 'payment',
  success_url: `${URL}/orders/{CHECKOUT_SESSION_ID}`,
  cancel_url: `${URL}/cart`,
  metadata: { orderId: order.id },
});
```

### Paymob (Egypt)
```typescript
// 1. Auth → 2. Create Order → 3. Get Payment Key → 4. Redirect to iframe
```

---

## 📧 NOTIFICATIONS

```typescript
// On successful payment
await sendOrderConfirmation(order.user.email, order);
await notifyAdmin(order); // Email/WhatsApp/Telegram
```

---

## 🌐 ENVIRONMENT VARIABLES

```env
# Database
DATABASE_URL="postgresql://..."

# Auth
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="openssl rand -base64 32"

# Payments
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
PAYMOB_API_KEY="..."
PAYMOB_INTEGRATION_ID="..."

# Storage
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."

# Email
RESEND_API_KEY="re_..."
ADMIN_EMAIL="admin@yourbrand.com"

# App
NEXT_PUBLIC_URL="https://yourdomain.com"
```

---

## ✅ BUILD ORDER

```
PHASE 1: Foundation (Day 1)
├── npx create-next-app@latest --typescript --tailwind
├── Setup Prisma + database schema
├── Configure Tailwind with brand colors
├── Create base UI components
└── Create Header + Footer

PHASE 2: Core Pages (Day 2-3)
├── Home page (hero + featured)
├── Products listing with filters
├── Product detail page
├── Cart drawer
└── Auth (login/register)

PHASE 3: Checkout (Day 4)
├── Checkout flow
├── Address management
├── Payment integration
├── Order confirmation
└── Order history

PHASE 4: Admin (Day 5)
├── Admin dashboard
├── Product CRUD
├── Order management
└── Customer list

PHASE 5: Polish (Day 6-7)
├── Search
├── Wishlist
├── Reviews
├── Email notifications
├── SEO + Performance
└── Testing
```

---

## 🚀 DEPLOYMENT

```bash
# 1. Push to GitHub
git init && git add . && git commit -m "Initial commit"
git remote add origin <repo-url>
git push -u origin main

# 2. Vercel
# Import from GitHub → Add env vars → Deploy

# 3. Database
# Supabase → Copy connection string → Add to Vercel
npx prisma migrate deploy

# 4. Domain
# Vercel Settings → Domains → Add your domain
# Update DNS at registrar
```

---

## 🎯 COMMAND FOR CLAUDE CODE

Copy everything above into Claude Code and say:

> "Build this e-commerce for my brand. Start with Phase 1. My brand colors are [YOUR COLORS]. Ask me for content when needed."

---

**Total Cost: ~$1/month to start, scales with growth.**

**Time to Build: 5-7 days with Claude Code.**
