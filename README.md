# Tulsi Art

A small-business storefront for a handmade-goods seller: a private admin panel to manage stock, and a public catalogue where customers order over WhatsApp.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | [Next.js 16](https://nextjs.org) (App Router, React 19, Server Actions) |
| Language | TypeScript |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Database, Auth & Storage | [Supabase](https://supabase.com) (Postgres + Auth + Storage) |
| Image compression | [browser-image-compression](https://github.com/Donaldcwl/browser-image-compression) |
| Hosting | [Vercel](https://vercel.com) |

## Features

- **Admin panel with product management** — add, edit and paginate products behind an email/password login. Each product gets an auto-generated ID, a description, a quantity and an optional cost price.
- **Client-facing catalogue** — a public gallery of everything still in stock, with a swipeable fullscreen photo viewer. Sold items disappear automatically.
- **Photo upload with compression** — photos are compressed in the browser before upload (max 400 KB, 1920 px longest edge), so uploads stay fast and Supabase storage stays small. Multiple photos per product; the first one becomes the cover.
- **Mark sold flow** — one tap marks an item sold, removes it from the catalogue, deletes its non-cover photos from storage to reclaim space, and writes a sales record. Reversible via **Mark Available**.
- **Sales log** — live item count, items sold this month, total inventory cost, and a full product history with dates and cost prices.
- **Storage usage tracker** — a live bar in the admin header showing how much of the Supabase free-tier storage budget is used, colour-coded green → amber → red as it fills.
- **WhatsApp ordering** — every product links straight to WhatsApp with a pre-filled message containing the item photo, so there's no cart, no checkout and no payment integration to maintain.

## Project Structure

```
.
├── app/
│   ├── layout.tsx              # Root layout, fonts, metadata
│   ├── globals.css             # Tailwind + design tokens
│   ├── page.tsx                # Public catalogue (store front page)
│   ├── ProductGrid.tsx         # Product grid + fullscreen photo viewer + WhatsApp links
│   └── admin/
│       ├── page.tsx            # Product list, pagination, storage bar
│       ├── actions.ts          # Server Actions: add / edit / mark sold / settings
│       ├── AdminHeader.tsx     # Admin nav (Store · Sales · Settings · Logout)
│       ├── AddProductModal.tsx # New-product form with client-side compression
│       ├── EditProductDrawer.tsx
│       ├── MarkSoldButton.tsx  # Mark sold / mark available, with confirmation
│       ├── LogoutButton.tsx
│       ├── login/page.tsx      # Supabase email/password sign-in
│       ├── sales/page.tsx      # Sales log and stats
│       └── settings/           # Store name, WhatsApp number, store instructions
├── lib/
│   ├── supabase.ts             # Browser client (anon key)
│   ├── supabase-server.ts      # Server client, cookie-based sessions
│   └── supabase-admin.ts       # Service-role client for server-side reads/writes
├── proxy.ts                    # Route middleware — guards /admin/*, redirects to login
├── next.config.ts
└── SETUP.md                    # Detailed Supabase setup walkthrough
```

## Getting Started

### Prerequisites

- Node.js 20 or newer
- A [Supabase](https://supabase.com) project (free tier is enough)

### Installation

```bash
git clone https://github.com/Namrata-Modha/tulsiart.git
cd tulsiart
npm install
```

### Supabase setup

See **[SETUP.md](SETUP.md)** for the full step-by-step walkthrough. In short, the project expects:

- Four tables — `products`, `product_images`, `sales`, `owner_info`
- A **public** storage bucket named `product-images`
- One admin user created in **Authentication → Users** (this is the only account that can sign in; there is no sign-up page)

### Environment variables

Create a `.env.local` file in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

| Variable | Where to find it | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | Safe to expose |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API | Safe to expose; used for login and session checks |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API | **Secret.** Bypasses row-level security — server-side only, never commit it |

`.env.local` is gitignored.

### Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the catalogue, or [http://localhost:3000/admin](http://localhost:3000/admin) for the admin panel.

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint |

## Deployment (Vercel)

1. Push the repository to GitHub.
2. In Vercel, choose **Add New → Project** and import the repository. Next.js is detected automatically — no build settings to change.
3. Under **Settings → Environment Variables**, add all three variables from `.env.local` for the Production, Preview and Development environments.
4. Click **Deploy**.

Every push to `main` deploys to production; pull requests get their own preview URL. After changing an environment variable, redeploy for it to take effect.

Once deployed, open `/admin/settings` and set the store name and WhatsApp number — the catalogue reads both from there.

## How to Use

### Admin flow

1. **Sign in** at `/admin/login` with the email and password of the Supabase user you created.
2. **Set up the store** under **Settings**: store name, WhatsApp number (with country code) and an optional line of instructions shown to customers.
3. **Add a product** with **+ Add Product**: pick one or more photos, write a short description, set the quantity, and optionally record what the materials cost. Photos are compressed in the browser as they upload, and the first photo becomes the cover.
4. **Edit** any product to change its description, quantity or cost price, or to replace its photos.
5. **Mark Sold** when an item sells. It leaves the catalogue, its extra photos are deleted to free up storage, and it's recorded in the sales log. Tap **Mark Available** to undo.
6. **Check the Sales page** for how many items are live, how many sold this month, and what the current inventory cost.
7. **Watch the storage bar** at the top of the products page. When it turns amber or red, mark sold items or remove old products to free space.

### Client flow

1. A customer opens the store link — no account, no login.
2. They browse the grid of available items and tap any photo to view it fullscreen, swiping between shots.
3. They tap **Message to order** (or **WhatsApp Us**), which opens WhatsApp with a message already written, including the photo of the item they picked.
4. The rest — price, delivery, payment — happens in the WhatsApp conversation.

## License

[MIT](LICENSE) © Namrata Modha
