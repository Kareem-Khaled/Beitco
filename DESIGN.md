# DESIGN.md  -  Beitco Design System

> **Egyptian real estate social network.** Arabic-first, RTL-default, mobile-first.
> Drop this file in the project root so any AI agent generates visually consistent UI.

---

## 1. Visual Theme & Atmosphere

Beitco is a warm, trust-forward real estate social network designed for the Egyptian market. The design blends **marketplace clarity** (inspired by Airbnb's property listings) with **social feed warmth** (inspired by Pinterest's cozy browsing). Every screen feels like scrolling through a trusted community  -  not a cold classifieds site.

The foundation is a clean white canvas (`#FFFFFF`) with **Trust Blue** (`#1A56DB`) as the primary brand color  -  chosen to convey reliability in a market where real estate scams erode trust. **Egyptian Gold** (`#F59E0B`) serves as the premium/accent  -  a cultural nod to Egyptian heritage and warmth. **Success Green** (`#059669`) represents growth and money (Egyptian pound).

Arabic is the primary language. All layouts are **RTL by default** using CSS logical properties (`padding-inline-start`, not `padding-left`). The typography uses **IBM Plex Arabic** for Arabic text and **Inter** for English  -  both are clean, professional, and excellent at small sizes. Numbers use **IBM Plex Mono** for prices and statistics, giving financial data a trustworthy, precise feel.

The 5-tier permission system has a visual language: verification badges (✅), tier-specific CTA labels ("نشر" for verified, "إرسال للموافقة" for members), and subtle color coding. The UI adapts to the user's tier  -  not just hiding features, but contextually guiding users toward verification.

**Key Characteristics:**
- Arabic-first, RTL-default  -  CSS logical properties everywhere
- Warm white canvas with Trust Blue (`#1A56DB`) as primary brand accent
- Egyptian Gold (`#F59E0B`) for premium tiers, featured content, and cultural warmth
- IBM Plex Arabic + Inter  -  professional, readable at all sizes
- Photography-first listing cards (Airbnb-inspired marketplace pattern)
- Social feed with mixed content: text posts, images, videos, listings (Pinterest-inspired density)
- Trust indicators everywhere: verification badges, tier labels, approval status
- Three-layer card shadows for warm, natural elevation
- Generous border-radius: 6px buttons, 12px cards, 24px featured, pill avatars
- Bottom navigation (thumb-zone optimized for mobile)
- Dark mode support via CSS variables and Tailwind `dark:` variant

---

## 2. Color Palette & Roles

### Primary Brand
- **Trust Blue** (`#1A56DB`): Primary CTA, brand accent, links, active navigation  -  conveys reliability
- **Trust Blue Dark** (`#1E40AF`): Hover/pressed state for primary buttons
- **Trust Blue Light** (`#DBEAFE`): Light tint for backgrounds, selected states, chips

### Secondary & Accent
- **Success Green** (`#059669`): Success states, verified badges, price indicators, "available" status
- **Success Green Dark** (`#047857`): Hover state for green elements
- **Success Green Light** (`#D1FAE5`): Light tint for success backgrounds
- **Egyptian Gold** (`#F59E0B`): Premium tier badge, featured listings, star ratings, cultural accent
- **Egyptian Gold Dark** (`#D97706`): Hover state for gold elements
- **Egyptian Gold Light** (`#FEF3C7`): Light tint for premium/featured backgrounds

### Semantic
- **Error Red** (`#DC2626`): Form errors, destructive actions, flagged content
- **Error Red Light** (`#FEE2E2`): Error background tint
- **Warning Amber** (`#F59E0B`): Warnings, pending approval indicators (shares gold)
- **Info Blue** (`#3B82F6`): Informational banners, tooltips

### Text
- **Primary Text** (`#0F172A`): Headlines, body text  -  near-black, warm
- **Secondary Text** (`#64748B`): Descriptions, timestamps, metadata
- **Tertiary Text** (`#94A3B8`): Placeholders, disabled labels
- **Inverse Text** (`#F8FAFC`): Text on dark/colored surfaces

### Surface & Background
- **Page Background** (`#FFFFFF`): Main canvas
- **Surface** (`#F8FAFC`): Cards, elevated containers, input backgrounds
- **Surface Hover** (`#F1F5F9`): Hover state for interactive surfaces
- **Border** (`#E2E8F0`): Card borders, dividers, input borders
- **Border Focus** (`#1A56DB`): Focused input border (2px ring)

### Dark Mode
- **Page Background Dark** (`#0F172A`): Main canvas
- **Surface Dark** (`#1E293B`): Cards, containers
- **Surface Hover Dark** (`#334155`): Hover state
- **Border Dark** (`#334155`): Borders, dividers
- **Text Primary Dark** (`#F8FAFC`): Primary text
- **Text Secondary Dark** (`#94A3B8`): Secondary text

### Tier Colors (Permission System)
- **Tier 1  -  Admin**: Trust Blue (`#1A56DB`) badge outline
- **Tier 2  -  Verified Contributor**: Success Green (`#059669`) ✅ badge
- **Tier 3  -  Trusted Member**: Egyptian Gold (`#F59E0B`) badge
- **Tier 4  -  New User**: Secondary Text (`#64748B`)  -  no badge, subtle prompt to verify
- **Tier 5  -  Restricted**: Error Red (`#DC2626`) indicator (admin view only)

---

## 3. Typography Rules

### Font Families
- **Arabic**: `IBM Plex Arabic`, fallbacks: `Cairo, Noto Sans Arabic, Tahoma, Arial, sans-serif`
- **English**: `Inter`, fallbacks: `-apple-system, system-ui, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif`
- **Monospace** (prices/stats): `IBM Plex Mono`, fallbacks: `Menlo, Monaco, Consolas, monospace`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display | IBM Plex Arabic | 32px (2rem) | 700 | 1.25 | -0.5px | Property prices, hero numbers |
| H1 | IBM Plex Arabic | 24px (1.5rem) | 700 | 1.33 | -0.3px | Page titles, section headers |
| H2 | IBM Plex Arabic | 20px (1.25rem) | 600 | 1.40 | normal | Card titles, listing names |
| H3 | IBM Plex Arabic | 18px (1.125rem) | 600 | 1.44 | normal | Sub-headings, group names |
| Body | IBM Plex Arabic | 16px (1rem) | 400 | 1.50 | normal | Post content, descriptions |
| Body Medium | IBM Plex Arabic | 16px (1rem) | 500 | 1.50 | normal | Emphasized body, names |
| Caption | IBM Plex Arabic | 14px (0.875rem) | 400 | 1.43 | normal | Timestamps, metadata, labels |
| Caption Medium | IBM Plex Arabic | 14px (0.875rem) | 500 | 1.43 | normal | Button labels, tab names |
| Micro | IBM Plex Arabic | 12px (0.75rem) | 400 | 1.33 | normal | Badges, counters, fine print |
| Price | IBM Plex Mono | 20px (1.25rem) | 600 | 1.20 | -0.2px | Property prices, financial data |
| Price Large | IBM Plex Mono | 28px (1.75rem) | 700 | 1.14 | -0.5px | Hero price display |
| Stat | IBM Plex Mono | 14px (0.875rem) | 500 | 1.29 | normal | Follower counts, view counts |

### Principles
- **Arabic-first sizing**: All sizes tuned for Arabic readability. Arabic text tends to be wider/taller than Latin  -  line heights are generous (1.33–1.50).
- **Weight range 400–700**: No thin weights. Arabic fonts need substance for readability. 400 for body, 500 for emphasis, 600 for sub-heads, 700 for headlines.
- **Monospace for money**: Property prices, statistics, and numerical data use IBM Plex Mono. This creates visual distinction and trust  -  numbers look precise and professional.
- **Negative tracking on headlines**: -0.3px to -0.5px on Display/H1 creates intimate, confident headings.
- **Never truncate Arabic mid-word**: Arabic characters connect  -  truncation must happen at word boundaries. Use `overflow-wrap: break-word` and `word-break: normal`.

---

## 4. Component Stylings

### Buttons

**Primary (Trust Blue)**
- Background: `#1A56DB`
- Text: `#FFFFFF`
- Padding: 10px 24px
- Radius: 6px
- Font: 14px weight 500
- Hover: `#1E40AF` background
- Active: scale(0.98) + `#1E40AF`
- Focus: 2px ring `#1A56DB` with 2px offset
- Disabled: opacity 0.5, cursor not-allowed

**Secondary (Outline)**
- Background: transparent
- Text: `#1A56DB`
- Border: 1px solid `#E2E8F0`
- Padding: 10px 24px
- Radius: 6px
- Hover: `#F8FAFC` background
- Active: `#F1F5F9` background

**Gold / Premium**
- Background: `#F59E0B`
- Text: `#FFFFFF`
- Padding: 10px 24px
- Radius: 6px
- Hover: `#D97706`
- Use: "Upgrade tier", featured listing CTA, premium features

**Destructive**
- Background: `#DC2626`
- Text: `#FFFFFF`
- Radius: 6px
- Hover: `#B91C1C`
- Use: Delete, block, reject actions

**Ghost / Text**
- Background: transparent
- Text: `#64748B`
- No border
- Hover: `#F1F5F9` background
- Use: Tertiary actions, "Cancel", "Skip"

**Icon Button (Circle)**
- Background: `#F1F5F9`
- Icon: `#0F172A`
- Radius: 50%
- Size: 40px × 40px (44px touch target)
- Hover: `#E2E8F0` background
- Use: Like, share, bookmark, back navigation

### Cards

**Post Card**
- Background: `#FFFFFF`
- Border: 1px solid `#E2E8F0`
- Radius: 12px
- Shadow: `0 1px 3px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.06)`
- Padding: 16px
- Hover (on desktop): shadow `0 2px 8px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.1)`
- Structure:
  - Author row: avatar (40px circle) + name (500 weight) + tier badge + timestamp
  - Content: text body, media (images/video), listing embed
  - Action bar: ❤️ Like · 💬 Comment · ↗ Share · 🔖 Save (right-to-left for RTL)

**Listing Card (Marketplace)**
- Background: `#FFFFFF`
- Radius: 12px
- Shadow: three-layer (`0 0 0 1px rgba(0,0,0,0.04), 0 2px 6px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.08)`)
- Structure:
  - Image carousel on top (aspect ratio 4:3, radius 12px top corners only)
  - Heart/save icon overlay (top-left in RTL)
  - Price badge overlay (bottom-left in RTL): monospace, white text on dark scrim
  - Below image: title (H3, 600 weight), location (caption, secondary text), bedrooms/bathrooms/area icons
  - Agent avatar + name (small, bottom of card)

**Chat Bubble**
- Own messages: `#1A56DB` background, white text, radius `12px 12px 4px 12px` (RTL)
- Other messages: `#F1F5F9` background, primary text, radius `12px 12px 12px 4px` (RTL)
- Timestamp: micro text, centered between message groups
- Read receipt: small checkmarks in secondary text color

### Inputs

**Text Input**
- Background: `#FFFFFF`
- Border: 1px solid `#E2E8F0`
- Radius: 6px
- Padding: 12px 16px
- Font: 16px (prevents iOS zoom)
- Focus: border `#1A56DB`, 2px ring `rgba(26,86,219,0.2)`
- Error: border `#DC2626`, ring `rgba(220,38,38,0.2)`, error text below in 12px red
- Label: 14px weight 500, above input, `margin-block-end: 6px`
- Text direction: `dir="rtl"` for Arabic fields, `dir="ltr"` for phone/email

**Search Bar**
- Background: `#F8FAFC`
- Border: 1px solid `#E2E8F0`
- Radius: 9999px (pill)
- Padding: 12px 20px
- Search icon: inline-start, `#94A3B8`
- Placeholder: `#94A3B8`, "ابحث في بيتكو..." (Search in Beitco...)
- Focus: border `#1A56DB`, white background

**OTP Input**
- 6 individual boxes, 48px × 56px each
- Border: 2px solid `#E2E8F0`
- Radius: 8px
- Font: IBM Plex Mono, 24px, weight 600, centered
- Focus: border `#1A56DB`
- Filled: border `#059669`
- Gap: 8px between boxes
- Direction: always LTR (numbers read left-to-right)

### Navigation

**Bottom Tab Bar (Mobile)**
- Background: `#FFFFFF`
- Border-top: 1px solid `#E2E8F0`
- Height: 56px + safe area inset
- 5 tabs: الرئيسية (Home) · استكشاف (Explore) · ＋ (Create) · العقارات (Listings) · حسابي (Profile)
- Active: Trust Blue (`#1A56DB`) icon + label
- Inactive: `#94A3B8` icon + label
- Create button (center): 48px circle, Trust Blue background, white + icon, raised -12px
- Font: 10px weight 500

**Top Header**
- Background: `#FFFFFF`
- Border-bottom: 1px solid `#E2E8F0`
- Height: 56px
- Logo (بيتكو) inline-end, notification bell + chat icon inline-start
- Sticky position

**Feed Tabs**
- Horizontal scroll, below header
- Active tab: Trust Blue text + 2px bottom border
- Inactive: `#64748B` text
- Tabs: "لك" (For You) · "المتابَعين" (Following) · "📹 فيديو" (Videos)
- Font: 14px weight 500

### Badges & Tags

**Verification Badge**
- Tier 2 (Verified): ✅ green circle, 16px, inline after name
- Tier 3 (Member): small gold dot or outline badge
- Admin: blue shield icon

**Post Status Tags**
- Published: no tag needed
- Pending: `#FEF3C7` background, `#D97706` text, "قيد المراجعة" (Under review)
- Rejected: `#FEE2E2` background, `#DC2626` text, "مرفوض" (Rejected)
- Featured: `#FEF3C7` background, `#D97706` text, star icon, "مميز" (Featured)

**Property Tags**
- للبيع (For Sale): `#DBEAFE` background, `#1A56DB` text
- للإيجار (For Rent): `#D1FAE5` background, `#059669` text
- Type tags: pill shape, `#F1F5F9` background, `#64748B` text

### Image Treatment
- Listing photos: 4:3 aspect ratio in cards, carousel with dot indicators
- Post images: flexible aspect ratio (max 4:5 portrait, max 16:9 landscape)
- Avatars: always circular (50% radius), sizes: 32px (inline), 40px (post), 48px (comment), 80px (profile), 120px (profile header)
- Image loading: blur-up placeholder (`next/image` blur technique)
- Heart/save overlay: 36px circle, semi-transparent white background, icon on top-start (RTL)

---

## 5. Layout Principles

### Spacing System (4px base)
```
xs:   4px     -  tight gaps (badge padding, icon spacing)
sm:   8px     -  compact spacing (between inline elements)
md:   16px    -  standard spacing (card padding, section gaps)
lg:   24px    -  comfortable spacing (between cards in feed)
xl:   32px    -  section separators
2xl:  48px    -  major section breaks
3xl:  64px    -  page-level padding top/bottom
```

### Grid & Container
- **Mobile** (<768px): Single column, 16px horizontal padding
- **Tablet** (768–1023px): 2-column listing grid, 24px padding
- **Desktop** (1024–1439px): Centered content max-width 680px (feed), sidebar 320px
- **Large Desktop** (1440px+): 3-column listing grid, max-width 1280px

### Feed Layout
- Single-column feed of post cards (like Instagram/Twitter)
- 16px gap between post cards
- Pull-to-refresh at top
- Infinite scroll with cursor-based pagination
- Skeleton loading: 3 placeholder cards while loading

### Listing Grid
- Responsive columns: 1 (mobile) → 2 (tablet) → 3 (desktop)
- 16px gap between cards
- Image carousel on each card
- Masonry layout NOT used  -  uniform card heights for RTL grid alignment

### RTL Layout Rules
- **ALL positioning uses CSS logical properties**:
  - `margin-inline-start` NOT `margin-left`
  - `padding-inline-end` NOT `padding-right`
  - `inset-inline-start` NOT `left`
  - `border-start-start-radius` NOT `border-top-left-radius`
  - `float: inline-start` NOT `float: left`
- **Flexbox**: `flex-direction: row` auto-reverses in RTL  -  no manual flipping needed
- **Icons**: Directional icons (arrows, chevrons, reply) must flip in RTL. Non-directional icons (heart, star, home) do NOT flip.
- **HTML**: `<html lang="ar" dir="rtl">` as default. English sections use `dir="ltr"` attribute.
- **Numbers**: Always LTR. Wrap in `<span dir="ltr">` or use `unicode-bidi: isolate`.
- **Phone fields**: Always LTR input with `dir="ltr"`.

### Whitespace Philosophy
- **Social-feed rhythm**: Post cards have generous 16px gaps  -  enough breathing room to distinguish posts, tight enough to feel like a flowing feed.
- **Listing browse pace**: Listing grid is denser  -  3 columns on desktop with 16px gaps. Users are comparison shopping.
- **Chat density**: Messages are compact with 4px between consecutive messages from the same sender, 16px between different senders.
- **Content-first**: The UI chrome (headers, tabs, nav) is minimal and neutral. Content (posts, listings, images) provides all the visual energy.

### Border Radius Scale
```
sm:    6px     -  buttons, inputs, small elements
md:    12px    -  post cards, listing cards, containers
lg:    16px    -  modals, bottom sheets, featured cards
xl:    24px    -  featured listing cards, hero elements
pill:  9999px  -  search bar, avatars, pill badges
circle: 50%    -  avatar images, icon buttons, FAB
```

---

## 6. Depth & Elevation

| Level | Shadow | Use |
|-------|--------|-----|
| Level 0 (Flat) | None | Page background, inline content |
| Level 1 (Card) | `0 1px 3px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.06)` | Post cards, listing cards |
| Level 2 (Raised) | `0 2px 8px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.1)` | Hover cards, dropdown menus |
| Level 3 (Overlay) | `0 8px 24px rgba(0,0,0,0.12), 0 16px 48px rgba(0,0,0,0.08)` | Modals, bottom sheets, dialogs |
| Level 4 (Top) | `0 12px 32px rgba(0,0,0,0.16), 0 24px 64px rgba(0,0,0,0.1)` | Floating action button, toast notifications |

**Shadow Philosophy**: Shadows are warm and graduated  -  two layers each (subtle ambient + primary lift). Never use pure black (`#000000`) shadows  -  always use `rgba(0,0,0,0.04–0.16)`. Shadows provide gentle elevation without feeling heavy. In dark mode, shadows are minimal  -  use border `#334155` for card separation instead.

---

## 7. Do's and Don'ts

### Do
- Use CSS logical properties for ALL positioning (`inline-start`, `inline-end`, `block-start`, `block-end`)
- Set `dir="rtl"` on `<html>` as the default
- Use IBM Plex Arabic for all Arabic text  -  never fall back to system Arabic fonts in mocks
- Use IBM Plex Mono for prices and statistics  -  monospace numbers look trustworthy
- Apply Trust Blue (`#1A56DB`) for primary CTAs  -  it's the singular brand action color
- Show tier badges next to usernames everywhere (posts, comments, profiles, listings)
- Use 4:3 aspect ratio for listing images  -  consistent card heights
- Use skeleton loading for all async content (never empty blank states)
- Provide Arabic placeholder text in all designs: "ابحث..." not "Search..."
- Use `gap` property for spacing in flex/grid  -  never margin hacks
- Respect safe area insets on mobile (bottom nav, notch)
- Use `next/image` with `blur` placeholder for all images

### Don't
- Don't use `left`, `right`, `margin-left`, `padding-right`  -  always logical properties
- Don't use pure black (`#000000`) for text  -  always `#0F172A` (warm near-black)
- Don't use thin font weights (300) for Arabic  -  minimum 400
- Don't truncate Arabic text mid-character  -  word boundaries only
- Don't hardcode text direction  -  always use `dir` attributes and logical CSS
- Don't mix Arabic and English fonts in the same line without proper `unicode-bidi`
- Don't use masonry layout for listings  -  uniform heights work better for RTL grids
- Don't place primary actions at the top of the screen on mobile  -  thumb zone is bottom
- Don't use color alone to convey meaning  -  always pair with icons or text (accessibility)
- Don't auto-play videos with sound  -  always muted until explicit user interaction
- Don't show empty states without a CTA  -  "No posts yet? Follow some contributors!" not just "No posts"

---

## 8. Responsive Behavior

### Breakpoints
| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile (default) | 320–767px | Single column, bottom tab nav, 16px padding |
| Tablet | 768–1023px | 2-column listing grid, side-by-side in some views |
| Desktop | 1024–1439px | Centered feed (680px) + sidebar (320px), top nav |
| Large Desktop | 1440px+ | 3-column listing grid, max-width 1280px container |

### Touch Targets
- All interactive elements: minimum 44px × 44px touch target
- Bottom nav icons: 48px touch area
- Like/comment/share buttons: 40px icon button with 44px touch area
- Post card: full-card tap navigates to detail (mobile)
- Listing card images: carousel swipe on mobile, hover arrows on desktop

### Collapsing Strategy
- Navigation: bottom tab bar (mobile) → top horizontal nav (desktop)
- Feed: single column at all sizes (content max-width 680px on desktop)
- Listing grid: 1 → 2 → 3 columns
- Profile: stacked header (mobile) → side-by-side (desktop)
- Chat: full-screen conversation (mobile) → split panel (desktop)
- Admin: stacked cards (mobile) → dashboard grid (desktop)
- Create button: center FAB in bottom nav (mobile) → button in top nav (desktop)

### Image Behavior
- Listing photos: responsive `srcset`, WebP with JPEG fallback
- Always maintain aspect ratio  -  never stretch
- Lazy loading with blur-up placeholder
- Carousel: swipe on mobile, arrow buttons on desktop
- Video: inline autoplay muted in feed, full player on tap

---

## 9. Agent Prompt Guide

### Quick Color Reference
```
Brand:         #1A56DB (Trust Blue)
Brand Hover:   #1E40AF
Green:         #059669 (Success/Verified)
Gold:          #F59E0B (Premium/Featured)
Error:         #DC2626
Background:    #FFFFFF (light) / #0F172A (dark)
Surface:       #F8FAFC (light) / #1E293B (dark)
Text:          #0F172A (light) / #F8FAFC (dark)
Text Secondary:#64748B
Border:        #E2E8F0 (light) / #334155 (dark)
```

### Quick Font Reference
```
Arabic:    font-family: 'IBM Plex Arabic', Cairo, sans-serif
English:   font-family: 'Inter', system-ui, sans-serif
Prices:    font-family: 'IBM Plex Mono', monospace
```

### Example Component Prompts

- **Post Card**: "Create an RTL post card: white bg, 12px radius, two-layer shadow. Author row: 40px circular avatar (right side), name in IBM Plex Arabic 16px weight 500, green ✅ badge, timestamp in 14px #64748B (left side). Content body below in 16px weight 400. Action bar at bottom: heart, comment, share, bookmark icons in 40px circle buttons."

- **Listing Card**: "Build an RTL listing card: 12px radius, three-layer shadow. 4:3 image carousel on top with dot indicators. Price overlay bottom-right: IBM Plex Mono 20px weight 600 white on dark scrim. Below: title in IBM Plex Arabic 18px weight 600, location in 14px #64748B with map pin icon. Row of bed/bath/area icons. Agent avatar 32px circle + name at bottom."

- **OTP Screen**: "Design RTL OTP verification: centered layout. Phone number display in LTR IBM Plex Mono. 6 OTP boxes (48×56px, 8px gap, always LTR). 2px border #E2E8F0, focused box border #1A56DB. 'Resend in 30s' caption below in #64748B. Primary button 'تأكيد' (Confirm) full-width at bottom."

- **Chat Conversation**: "Build RTL chat view: own messages right-aligned in #1A56DB blue bubbles with white text (radius 12 12 4 12). Other messages left-aligned in #F1F5F9 bubbles with dark text (radius 12 12 12 4). Message input at bottom: white bg, pill radius, send button in Trust Blue."

- **Bottom Navigation**: "Create mobile bottom tab bar: white bg, top border #E2E8F0, 56px height. 5 tabs RTL: Home, Explore, Create (raised 48px blue circle), Listings, Profile. Active = #1A56DB, inactive = #94A3B8. Arabic labels below icons at 10px."

- **Admin Dashboard**: "Build admin stats grid: 4 cards in responsive grid. Each card: white bg, 12px radius, shadow level 1. Stat number in IBM Plex Mono 28px weight 700. Label in IBM Plex Arabic 14px #64748B. Small trend indicator (green up arrow or red down)."

### Iteration Guide
1. **Start with Arabic**  -  all text should be Arabic first, English is the afterthought
2. **RTL everything**  -  use `dir="rtl"`, CSS logical properties, flex auto-reverses
3. **Trust Blue for actions**  -  primary buttons, links, active states. One brand color.
4. **Gold for premium**  -  featured badges, upgrade CTAs, star ratings
5. **Green for trust**  -  verified badges, success states, available listings
6. **Monospace for money**  -  prices, stats, counts. It looks precise and trustworthy.
7. **12px radius on cards**  -  warm and rounded, not sharp, not pill-shaped
8. **Bottom nav on mobile**  -  thumb-zone first. No hamburger menus.
9. **Skeleton loading everywhere**  -  never show blank screens while data loads
10. **Permission-aware UI**  -  show/hide/modify CTAs based on user's tier level

---

## 10. Beitco-Specific Patterns

### Permission-Aware UI
The UI adapts based on the user's permission tier:

| Tier | Create Post Button | Post Flow | Badge |
|------|-------------------|-----------|-------|
| Tier 1 (Admin) | "نشر" (Publish)  -  blue | Auto-publish | 🛡 Blue shield |
| Tier 2 (Verified) | "نشر" (Publish)  -  blue | Auto-publish | ✅ Green check |
| Tier 3 (Member) | "إرسال للموافقة" (Submit)  -  gold outline | Pending review | 🔶 Gold dot |
| Tier 4 (New User) | Hidden / "تحقق للنشر" (Verify to post) | Cannot post | None |
| Tier 5 (Restricted) | Hidden | Cannot interact | 🚫 (admin view) |

### Empty States
Every empty state has:
1. An illustration or icon (subtle, not overwhelming)
2. Arabic headline explaining what goes here
3. A CTA to take action: "تابع خبراء لترى منشوراتهم" (Follow experts to see their posts)

### Loading States
- **Skeleton screens** for all lists (feed, listings, comments, chat)
- **Spinner** only for single-item operations (posting, sending message)
- **Optimistic updates** for likes, follows, saves (instant UI, background API call)
- **Progress bar** for image/video uploads

### Listing-Specific
- Prices displayed in Egyptian Pound: `٢,٥٠٠,٠٠٠ ج.م` or `2,500,000 EGP`
- Area in square meters: `١٨٠ م²`
- Property features as icon + number grid: 🛏 ٣ · 🚿 ٢ · 📐 ١٨٠م²
- "Call Agent" and "WhatsApp" buttons on listing detail (green)
- Map view with location pin (when available)
