# Tutoring Platform

A full-stack tutoring platform where an admin (teacher) creates lessons with materials, and students browse, purchase, and access lesson content. Built with Next.js 14, Supabase, Stripe, and Bunny.net.

## Features

**Students:**
- Register/login with email and password
- Browse available lessons (free and paid)
- Purchase lessons via Stripe one-time payment
- Access lesson materials (PDFs, images, videos)
- Join live sessions via Google Meet
- Upload homework and view teacher feedback

**Admin (Teacher):**
- Dashboard with stats (students, lessons, revenue, pending reviews)
- Create/edit/delete lessons with materials
- Upload videos via Bunny.net CDN
- Review, approve, or reject homework with feedback
- View all students and their activity

## Tech Stack

- **Framework:** Next.js 14 (App Router, TypeScript)
- **Styling:** TailwindCSS 3
- **Database & Auth:** Supabase (PostgreSQL + Auth + Storage + RLS)
- **Payments:** Stripe (one-time checkout)
- **Video CDN:** Bunny.net (storage + delivery)
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Stripe](https://stripe.com) account (test mode)
- A [Bunny.net](https://bunny.net) account (optional, for video uploads)

### 1. Clone and install

```bash
git clone https://github.com/lucadumitrascu-create/tutoring-platform.git
cd tutoring-platform
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `supabase/schema.sql` to create tables, RLS policies, triggers, and storage buckets
3. If updating an existing deployment, also run `supabase/patch-security.sql`

### 3. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.local.example .env.local
```

### 4. Set up Stripe webhook

1. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Run: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
3. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET` in `.env.local`

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Create an admin user

1. Register a new account at `/auth/register`
2. In your Supabase dashboard, go to **Table Editor > users**
3. Find your user and change the `role` field from `student` to `admin`
4. Log out and log back in — you'll be redirected to the admin dashboard

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL (found in Settings > API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only, never expose) |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_test_...` for test mode) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (`pk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (`whsec_...`) |
| `BUNNY_API_KEY` | Bunny.net storage API key |
| `BUNNY_STORAGE_ZONE_NAME` | Bunny.net storage zone name |
| `BUNNY_CDN_URL` | Bunny.net CDN pull zone URL (`https://your-zone.b-cdn.net`) |
| `NEXT_PUBLIC_APP_URL` | Your app URL (`http://localhost:3000` locally, your domain in production) |

## Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add all environment variables from `.env.local` in the Vercel dashboard (Settings > Environment Variables)
4. Set `NEXT_PUBLIC_APP_URL` to your Vercel production URL
5. Deploy

### Production Stripe webhook

After deploying, create a webhook endpoint in the [Stripe Dashboard](https://dashboard.stripe.com/webhooks):
- **URL:** `https://your-domain.vercel.app/api/stripe/webhook`
- **Events:** `checkout.session.completed`
- Copy the signing secret to `STRIPE_WEBHOOK_SECRET` in Vercel env vars

## Project Structure

```
src/
├── app/
│   ├── (admin)/admin/       # Admin pages (dashboard, lessons, students, homework)
│   ├── (student)/           # Student pages (dashboard, lessons, checkout)
│   ├── (public)/auth/       # Login and register
│   ├── api/                 # API routes (Stripe, Bunny, auth)
│   └── page.tsx             # Landing page
├── components/layout/       # Navbar and Sidebar
├── lib/                     # Supabase clients, Stripe instance
└── types/                   # TypeScript type definitions
```
