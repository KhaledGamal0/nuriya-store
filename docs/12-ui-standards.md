# 12 — UI standards (apply to every screen, storefront and admin)

Approved by Khaled, Oct 7 2026: clean, simple, consistent, modern. When in doubt, remove.

## Layout
- Mobile first at 390 px, then 900 px+ desktop. Side gutter 20 px mobile, 40 px desktop. Max content width 1240 px.
- Spacing only from the scale: 8 · 16 · 24 · 40 · 64 · 96 px (`--s1`…`--s6`). No one-off margins.
- One job per section. One primary button per screen.

## Type
- Headings: Instrument Serif, sentence case. Hero 44–84 px, page title 34–48 px, section 28–40 px.
- Everything else: Poppins 400/500. Body 15 px, small 13 px, labels 12–13 px uppercase with 0.12em spacing.
- Text color plum `#3C0E18`; secondary `#6E4A53`. Never pure black, never rose gold for text you must read.

## Controls (one family)
- Every control uses the same corner radius `--r` = 8 px: buttons, inputs, selects, size and color options, quantity stepper, panels, toasts.
- Minimum touch target 44 × 44 px. Primary button 52 px high, full width on mobile.
- Primary button: plum fill, white text. Secondary: plum outline. Never more than one primary per screen.
- Options (color, size): same bordered tile; selected = 1.5 px plum border. Color tiles show a small dot + the color name.
- Icon buttons: 20 px line icons, 1.5 px stroke, no background, no circle. Hover (mouse only) = 60 % opacity.
- The only circles on the site are color dots. No circular badges, buttons or hover backgrounds.

## States
- Hover effects only on devices with a mouse (`@media (hover: hover)`), so nothing sticks after a tap on phones.
- Keyboard focus: 2 px burgundy outline, only for keyboard users (`:focus-visible`).
- Errors: one short sentence under the field saying how to fix it, red `#9B1C2E`, field border turns red, focus moves to the first error.
- Loading: the button says what is happening ("Placing your order…") and is disabled.
- Empty states: one sentence + one action.

## Panels (menu, bag, size finder)
- Native `<dialog>`: traps focus, Escape closes, tap outside closes, page behind is locked.
- On open, focus goes to the panel title (no ring on the close button).
- Menu: left, 320 px max, 16 px links in groups (Shop, Help). Bag: right, 400 px max. Size finder: bottom sheet.
- Panel header: small uppercase title left, close icon right, 60 px high.

## Motion
- Durations 200–450 ms, one easing curve (`--ease`). Hero image settles in, headline rises, panels slide.
- Nothing bounces or loops. Everything turns off with "reduce motion".

## Content
- Real photos only, 4:5 for products. Alt text on every meaningful image.
- Prices "1,200 EGP". Sizes exactly "S/M" and "L/XL".
- Copy: short, warm, active voice. No exclamation marks in UI.
