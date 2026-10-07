# 06 — Admin dashboard (in scope from day one)

Same brand tokens but quieter: built for speed on Khaled's phone (he packs/confirms on the go) and desktop. Arabic-friendly labels optional.

## v1 — needed at launch
**Home / Today**
- Today: new orders, to confirm (COD), to pack, with courier, revenue today/7d/30d, refused rate
- Low-stock alerts per colorway × size

**Orders**
- List with filters (status, payment method, governorate, date) + search by phone / order no.
- Order page: items, customer, address, map-free address text, totals, payment record (gateway ref, HMAC verified), timeline of every event
- Actions: confirm · cancel (reason) · mark packed · handed to courier (+ tracking no.) · delivered · refused at door · add internal note
- One-tap **WhatsApp the customer** (opens wa.me with pre-filled confirmation message in brand voice)
- Bulk: select confirmed orders → **export courier sheet** (Direction format CSV/Excel) + print packing slips
- Printable packing slip + label in brand style

**Products & stock**
- Product: names EN/AR, story, care, price, status (draft / live / sold out / coming soon)
- Variants grid colorway × size: SKU, stock, price override
- Media manager: upload originals, drag order, set type (front/back/collar/embroidery/model), alt text, focal point; auto-generates AVIF/WebP sizes
- Stock adjustments with reason (restock, damaged, gift) → logged

**Shipping**
- Zones & fees table (seeded from Direction list), turn areas on/off, COD allowed per zone, ETA text

**Discounts**
- Codes: % or fixed, min order, usage limit, per-customer limit, expiry; referral codes

**Customers**
- List: orders count, total spent, refused count (flag repeat refusers), notes, blocklist

**Content**
- Hero (image, line, button), announcement bar, Styling/Uni Fits boards, size guide, policy text EN/AR — no code changes needed

**Settings & security**
- Admin users + roles (owner, staff), 2FA, session list, audit log

## v2 — after launch
- Analytics: conversion funnel (visit → product → bag → checkout → paid/confirmed), top traffic sources (IG UTM), best colorway/size, AOV, refused rate per governorate
- Courier API integration (auto-create shipment, live tracking status) if Direction offers an API
- Waitlist / back-in-stock notifications management
- Drops scheduler (go-live time, countdown, pre-order quantity cap)
- Reviews & UGC moderation (customer photos)
- Referral program dashboard
- Abandoned checkout list (phone captured first → WhatsApp follow-up)
- Expenses & profit view (cost per piece, shipping, ads) → real margin per order
- Staff permissions granular, activity notifications (push / Telegram / WhatsApp)
