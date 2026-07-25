# Premium Apps by Hyarax — Product and Interface Design

Status: canonical design specification

## 1. Product Direction

### Visual thesis

Interface feels like a warm, trustworthy digital-license desk: editorial hierarchy, compact operational metadata, clear pricing, visible stock, and direct fulfillment language.

### Canonical brand

- Full name: **Premium Apps by Hyarax**
- Compact UI name: **Hyarax Apps**
- Monogram: **Hx**
- Language: Indonesian
- Currency: IDR

### Not this

- Generic SaaS dashboard.
- Purple/blue gradient blobs.
- Glassmorphism.
- Colored status rails.
- Rainbow status chips.
- Fake reviews, fake urgency, fake metrics, or decorative icons without meaning.
- Equal cards added only to fill space.

## 2. Core User Flows

### Discovery

```text
Home -> Catalog -> Product detail -> Variant/duration selection
```

- Home explains product and provides catalog/category entry points.
- Catalog supports search, category filtering, product count, and honest empty state.
- Product detail prioritizes buy box on mobile and keeps warranty/terms readable below.

### Purchase

```text
Product -> Cart -> Buyer details + payment method -> Order created
-> Payment instructions -> Order tracking -> Fulfillment
```

Canonical progress vocabulary:

1. Keranjang
2. Detail & pembayaran
3. Instruksi pembayaran
4. Aktivasi

An unpaid order is “Order dibuat” or “Menunggu pembayaran,” never “Order berhasil.”

### Support

- WhatsApp FAB appears on public routes.
- Tracking and success pages include order ID in prefilled support text.
- Warranty text remains product-specific.

### Admin

```text
Login -> Orders -> Verify payment -> Fulfill
      -> Products -> Edit stock/price
      -> Settings -> Payment/support configuration
```

Admin UI uses same tokens and controls as public UI. Mobile navigation must remain usable through horizontal scroll or drawer.

## 3. Design Tokens

Source: `src/app/globals.css`.

### Color

| Semantic token | Light | Dark | Purpose |
|---|---:|---:|---|
| `--paper` | `#faf8f5` | `#12100e` | Base page/card |
| `--sand` | `#f0ebe3` | `#1c1916` | Muted surface |
| `--sand-deep` | `#e4ddd2` | `#2a2622` | Strong muted surface |
| `--ink` | `#1c1917` | `#f5f0e8` | Primary foreground |
| `--line` | `#e7e0d6` | `#2f2a25` | Borders/dividers |
| `--muted` | `#78716c` | `#a39e96` | Secondary text |
| `--focus` | `#1c1917` | `#f5f0e8` | Focus ring |
| `--status-ok` | `#3f7a4c` | `#6fbf7f` | Available |
| `--status-warn` | `#b45309` | `#e8a04a` | Limited |
| `--status-hold` | `#8a6d1f` | `#d4b45a` | Preorder/pending |

Rules:

- Use semantic tokens, not arbitrary Tailwind colors, for app states.
- Status always includes text; color is secondary.
- Product accent is limited to icon and low-opacity gallery tint.
- Red is reserved for destructive/error states.
- WhatsApp green is permitted only for WhatsApp affordance.
- Normal badges use neutral sand/ink treatment.

### Typography

- Primary: Geist Sans.
- Operational metadata: Geist Mono through `.stamp`.
- Display: 32/36 mobile, 48/51 desktop, semibold.
- Page title: 30/36, semibold.
- Section title: 20–24/28–32, semibold.
- Body: 15/24; compact body 14/22.
- Metadata: 11/14 mono uppercase.
- Prices, stock, IDs, and counts use `tabular-nums`.

Mono is for order IDs, stock, timestamps, payment data, status metadata, and SKU-like labels—not paragraphs.

### Spacing

Canonical scale: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80` px.

- Mobile gutter: 16 px.
- `sm` and above gutter: 24 px.
- Main content max width: `max-w-6xl`.
- Card padding: 16–24 px.
- Form field gap: 16 px.
- Section gap: 48 px mobile, 64–80 px desktop.

### Radius

- Small metadata: 4–6 px.
- Buttons/inputs: 8 px.
- Major surfaces/cards: 12 px.
- Pills only for count badges and floating contact action.

## 4. Shared Components

### Button

- Variants: primary, secondary/outline, ghost, danger.
- Default target height: 40–44 px; important mobile targets at least 44×44 px.
- Stable width during loading.
- Visible disabled, focus, hover, and pressed states.
- Use semantic `<a>` for navigation and `<button>` for actions; never nest a button inside a link.

### Surface

- `.surface`: primary grouped content.
- `.surface-muted`: secondary grouped content.
- Avoid nested cards when spacing/dividers communicate hierarchy.

### Badge

- Neutral metadata only: category, promotion, fulfillment type.
- Must not duplicate status.

### StatusMeta

- Semantic dot + label + optional delivery metadata.
- No colored bar/rail.
- Add `out_of_stock` semantic token treatment before production.

### ProductCard

Anatomy:

1. Accent media band.
2. Product icon.
3. Optional neutral badge.
4. Category stamp.
5. Product title and short description.
6. Status + delivery metadata.
7. Starting price and fulfillment method.

Hover: restrained 2 px lift and soft shadow; reduced motion removes movement.

### Variant selector

- Monthly families use stepper 1–12.
- Month 12 promo is explicit, not emoji-led.
- Fixed variants use radio group.
- Price, selected duration, stock, and CTA update together.
- Selection has proper `<fieldset>`/`<legend>` semantics.

### Forms

Every field includes:

- Visible label.
- Helper text when needed.
- Error with stable ID.
- `aria-invalid` and `aria-describedby` when invalid.
- Preserved input after server failure.
- Focused error summary after failed submit.

### Toast

- Maximum four stacked cart notifications.
- Same-tab and cross-tab language differs.
- `aria-live="polite"` and dismiss control.
- Never obscures checkout primary CTA or WhatsApp FAB.

## 5. State Design

Required state set for async/public surfaces:

- Loading.
- Empty.
- Out of stock.
- Validation error.
- Server/database failure.
- Submitting.
- Order created/pending payment.
- Paid/processing.
- Fulfilled.
- Failed/refunded/cancelled.
- Maintenance.

Rules:

- No fake order, product, credentials, or payment details after runtime failure.
- Error copy names object and recovery action.
- Loading skeleton reserves final dimensions.
- Empty state offers one useful next action.

## 6. Responsive Behavior

- Mobile-first.
- PDP buy box precedes long description on mobile; desktop keeps sticky side panel.
- Catalog cards: one column mobile, two tablet, three desktop.
- Tables retain horizontal scrolling; admin navigation uses drawer or scrollable nav below desktop.
- Fixed FAB and toast stacks account for safe-area insets and each other.
- Long product names, IDs, and payment values wrap or truncate without horizontal page overflow.

## 7. Dark Mode

- Theme uses CSS custom properties, not per-component dark palettes.
- Theme preference persists in `localStorage` and respects system preference on first visit.
- All surfaces, borders, status dots, focus rings, QR framing, inputs, and email-independent assets are checked in light and dark.
- Product accents keep sufficient icon contrast in both themes.

## 8. Motion

- Interaction transitions: ~200 ms ease-out.
- Route root fade: ~280 ms.
- Shared product hero/icon/name/price morph: ~420 ms.
- Directional history slide: 56 px maximum.
- Header/footer stay spatial anchors during route transitions.
- `prefers-reduced-motion` disables transforms, morphs, and nonessential animation.
- Motion communicates continuity; it never delays payment or fulfillment actions.
- View Transitions are progressive enhancement; navigation and focus behavior must remain correct when unsupported or disabled.

## 9. Accessibility

- WCAG AA contrast: 4.5:1 normal text, 3:1 large text/UI boundaries.
- Keyboard access for navigation, variant selection, cart, forms, admin actions, toast, and theme toggle.
- Visible focus on every interactive control.
- Logical heading hierarchy.
- Status never color-only.
- Dynamic cart/toast status announced politely.
- Destructive admin actions use explicit confirmation.
- QRIS includes text amount and payment alternative; QR image is not sole instruction.
- Credentials support copy control without announcing secret values unnecessarily.

## 10. Anti-AI UI Review Gate

Before merging UI work, score these 1–5:

- Generic copy.
- Decorative gradients.
- Repetitive equal card grid.
- Fake metrics/reviews.
- Random icons.
- Excessive radius/shadow.
- Missing real loading/empty/error states.

Score 3+ requires one revision. Target Generic AI Risk: 1–2/5.

## 11. Known Inconsistencies to Fix

- Remaining “Stackbay” copy/storage identifiers should be classified: customer-facing text must rename; persisted storage keys may retain compatibility until migration.
- Local amber/blue/green/rose order status chips should become one shared status component.
- Success page terminology must not call unpaid state successful.
- External QR image generation must be replaced with local/server rendering.
- Admin navigation needs narrow-screen treatment.
- Current field errors need ARIA wiring.
