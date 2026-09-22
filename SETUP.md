# Supabase Setup

Everything Tulsi Art needs on the Supabase side: four tables, row-level security policies, a storage bucket for product photos, and a single admin user.

The whole thing takes about ten minutes. You only do it once.

---

## 1. Create the project

1. Sign in at [supabase.com](https://supabase.com) and click **New project**.
2. Give it a name (e.g. `tulsiart`), set a database password, and pick the region closest to you.
3. Wait for provisioning to finish — a minute or two.

The free tier is plenty: 500 MB database and 1 GB file storage, which is roughly 150 compressed product photos.

---

## 2. Create the tables

Open **SQL Editor** in the sidebar, paste the whole script below, and click **Run**.

```sql
-- Tulsi Art — schema
-- Safe to run on a fresh project.

create extension if not exists "uuid-ossp" with schema extensions;

-- ── Products ──────────────────────────────────────────────────────────
create table public.products (
  id          uuid        primary key default extensions.uuid_generate_v4(),
  name        text        not null,
  description text,
  quantity    integer     not null default 1,
  is_sold     boolean     not null default false,
  cost_price  numeric,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── Product photos ────────────────────────────────────────────────────
-- One row per uploaded photo. Deleting a product deletes its photo rows.
create table public.product_images (
  id            uuid        primary key default extensions.uuid_generate_v4(),
  product_id    uuid        not null references public.products(id) on delete cascade,
  image_url     text        not null,
  is_cover      boolean     not null default false,
  display_order integer     not null default 1,
  created_at    timestamptz not null default now()
);

-- ── Sales log ─────────────────────────────────────────────────────────
-- product_name is stored alongside the id so the log survives product deletion.
create table public.sales (
  id           uuid        primary key default extensions.uuid_generate_v4(),
  product_id   uuid        references public.products(id) on delete set null,
  product_name text        not null,
  sold_at      timestamptz not null default now()
);

-- ── Store details ─────────────────────────────────────────────────────
-- Holds exactly one row, managed from /admin/settings.
create table public.owner_info (
  id             uuid        primary key default extensions.uuid_generate_v4(),
  name           text        not null,
  contact_number text        not null,
  instructions   text,
  updated_at     timestamptz not null default now()
);
```

### What each table is for

| Table | Purpose |
| --- | --- |
| `products` | One row per item. `is_sold` controls whether it appears in the public catalogue; `cost_price` is admin-only and never shown to customers. |
| `product_images` | Public URLs of the uploaded photos. `is_cover` marks the one shown in the grid; `display_order` sets the order in the fullscreen viewer. |
| `sales` | Written when an item is marked sold, and deleted if it's marked available again. Powers the "sold this month" figure. |
| `owner_info` | Store name, WhatsApp number and the instruction line shown under the store title. |

---

## 3. Turn on row-level security

Still in the SQL Editor, run this second script.

```sql
-- Tulsi Art — row-level security

alter table public.products       enable row level security;
alter table public.product_images enable row level security;
alter table public.sales          enable row level security;
alter table public.owner_info     enable row level security;

-- ── Products ──
create policy "Public read products"  on public.products for select to anon, authenticated using (true);
create policy "Admin insert products" on public.products for insert to authenticated with check (true);
create policy "Admin update products" on public.products for update to authenticated using (true);
create policy "Admin delete products" on public.products for delete to authenticated using (true);

-- ── Product photos ──
create policy "Public read images"  on public.product_images for select to anon, authenticated using (true);
create policy "Admin insert images" on public.product_images for insert to authenticated with check (true);
create policy "Admin update images" on public.product_images for update to authenticated using (true);
create policy "Admin delete images" on public.product_images for delete to authenticated using (true);

-- ── Store details ──
create policy "Public read owner info"  on public.owner_info for select to anon, authenticated using (true);
create policy "Admin insert owner info" on public.owner_info for insert to authenticated with check (true);
create policy "Admin update owner info" on public.owner_info for update to authenticated using (true);

-- ── Sales log — admin only, never public ──
create policy "Admin read sales"   on public.sales for select to authenticated using (true);
create policy "Admin insert sales" on public.sales for insert to authenticated with check (true);
create policy "Admin delete sales" on public.sales for delete to authenticated using (true);
```

Products, photos and store details are publicly readable; the sales log is not. Writes are limited to signed-in users.

> **Note on the service-role key.** The app reads and writes through the service-role key on the server, which bypasses RLS entirely — access control for the admin panel comes from the login guard in [`proxy.ts`](proxy.ts), not from these policies. The policies still matter: they are what protects your data if anything ever queries the database with the public anon key.

---

## 4. Create the storage bucket

1. Go to **Storage → Buckets → New bucket**.
2. Name it exactly **`product-images`**.
3. Turn **Public bucket** **on** — customers' browsers load these photos directly.
4. Under the bucket's settings, optionally set:
   - **File size limit:** `20 MB`
   - **Allowed MIME types:** `image/jpeg`, `image/png`, `image/webp`

The name must match exactly, or uploads will fail.

No storage policies are needed: reads are public because the bucket is public, and uploads and deletions go through the service-role key on the server.

Photos are stored as `<product-id>/<index>-<timestamp>.jpg`, so each product's photos sit in their own folder.

---

## 5. Create the admin user

There is no sign-up page. The one admin account is created by hand:

1. Go to **Authentication → Users → Add user → Create new user**.
2. Enter the email and a strong password.
3. Tick **Auto Confirm User**, so you can sign in immediately without a confirmation email.
4. Click **Create user**.

These are the credentials you'll use at `/admin/login`. To change the password later, use **Authentication → Users**, then **Reset password** on that user.

---

## 6. Copy the API keys

Go to **Project Settings → API** and copy these into your `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

| Key | Sensitivity |
| --- | --- |
| Project URL | Public |
| `anon` / publishable key | Public — safe in the browser |
| `service_role` / secret key | **Secret.** Full database access, ignores every RLS policy. Server-side only. Never commit it, never paste it into client code, and never share it. |

If the service-role key is ever exposed, rotate it in **Project Settings → API** and update it everywhere you've set it, including Vercel.

---

## 7. Check it works

```bash
npm run dev
```

1. Open [http://localhost:3000/admin](http://localhost:3000/admin) — you should be redirected to the login page.
2. Sign in with the user you created.
3. Go to **Settings** and save your store name and WhatsApp number (digits with country code, e.g. `919876543210`). This creates the single `owner_info` row.
4. Back on **Products**, add a product with a photo or two.
5. Open [http://localhost:3000](http://localhost:3000) — the item should appear, and **Message to order** should open WhatsApp with a pre-filled message.

---

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Redirected to login in a loop | `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` is wrong or missing. |
| "Invalid login credentials" | Wrong password, or the user was created without **Auto Confirm User** ticked. |
| Upload fails with a bucket error | The bucket isn't named exactly `product-images`, or it doesn't exist. |
| Photos upload but show as broken images | The bucket isn't public. Turn on **Public bucket** in its settings. |
| Product saves but the store page is empty | The item is marked sold, or the photo rows weren't created — check `product_images` in the Table Editor. |
| Store shows "Store" instead of your name, and no WhatsApp link | No `owner_info` row yet. Save the Settings form once. |
| `permission denied for table …` | RLS is on but the policies in step 3 weren't created, or `SUPABASE_SERVICE_ROLE_KEY` is missing. |

## Notes on limits

- **Storage.** The admin panel's storage bar assumes a budget of 150 photos as a proxy for the 1 GB free tier. That number lives in [`app/admin/page.tsx`](app/admin/page.tsx) as `STORAGE_MAX_IMAGES` — raise it if you upgrade your plan.
- **Marking sold reclaims space.** Only the cover photo is kept when an item sells; the rest are deleted from storage.
- **Upload size.** Photos are compressed to about 400 KB in the browser before upload, and Server Actions are capped at 10 MB per request in [`next.config.ts`](next.config.ts) — roughly 20 photos at once.
- **Free-tier pausing.** Supabase pauses free projects after a week of inactivity. If the store suddenly goes blank, check the dashboard and restore the project.
