# Codex Prompt for Ghar Se Daftar

Act as a Senior Frontend Architect, Product Engineer, Security Engineer, and UX Designer.

You are working inside an existing Next.js App Router project named **Ghar Se Daftar**.

Brand positioning:

> Ghar Ka Khana, Ab Daftar Tak.

This is a premium Pakistani homemade meal subscription platform. It connects verified home chefs, especially household women, with office professionals who want healthy homemade lunch instead of fast food.

This is not a fast-food app. This is not a restaurant marketplace. It should feel like a premium SaaS product combined with a high-end homemade food brand.

## Existing Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn-style UI components
- Framer Motion
- Prisma ORM
- PostgreSQL / Supabase
- Supabase Auth or Auth.js
- React Hook Form + Zod
- TanStack Query where useful

## Design System

Colors:

- Primary: #355E3B
- Secondary: #8B5A2B
- Background: #F8F4EC
- Accent: #D4A373
- Text: #1F241F
- Muted: #6F756C
- Border: #E7DDCF

Typography:

- Headings: Playfair Display
- Body: Inter

UI style:

- Premium, warm, modern, trustworthy
- Large whitespace
- Rounded cards
- Soft shadows
- Cream backgrounds
- Pakistani identity without looking outdated
- Subtle Framer Motion animations only

## Important Product Decision

The weekly menu should have **two curated meal options per day**, not unlimited customization. This gives customers choice while keeping operations manageable.

Monday:
Option A: Chicken Achari + 2 Roti + Salad
Option B: Daal Chawal + Kachumber Salad

Tuesday:
Option A: Daal Mash + 2 Roti + Mint Raita
Option B: Kabab Pulao + Mint Raita + Salad

Wednesday:
Option A: Seasonal Sabzi + 2 Roti + Salad
Option B: Haleem + Naan/Roti + Salad

Thursday:
Option A: Kadhi Chawal + Salad
Option B: Aloo Qeema + 2 Roti + Salad

Friday:
Option A: Chicken Biryani + Mint Raita + Salad
Option B: Chicken Pulao + Raita + Salad

Saturday Add-on:
Option A: Chicken White Karahi + 2 Roti + Salad
Option B: Chana Pulao + Raita + Salad

Pricing:

- Single Meal: Rs.350
- Weekly Office Plan: Rs.1,750 for 5 working days
- Monthly Subscription: Rs.6,500
- Saturday add-on: Rs.350 per meal

## Required Implementation Tasks

### 1. Make the landing page production-level

Improve the current landing page sections:

1. Hero Section
2. Why Choose Ghar Se Daftar
3. How It Works
4. Story Section: Ammi’s Kitchen to Office
5. Weekly Menu Section
6. Meal Details Section
7. Subscription Plans
8. Corporate Packages
9. Home Chef Showcase
10. Testimonials
11. FAQ
12. WhatsApp Order CTA
13. Footer

Add responsive desktop/tablet/mobile polish.

### 2. Add Framer Motion animations

Use subtle animations:

- Fade-up section reveal
- Staggered cards
- Hero card slow entrance
- Button hover micro-interactions
- Mobile nav animation

Do not make the site flashy.

### 3. Connect forms properly

Convert subscription and corporate forms to React Hook Form + Zod.
Create server actions or API routes that:

- Validate input server-side
- Save to PostgreSQL via Prisma
- Create audit log records
- Return proper success/error messages
- Rate limit public submissions

### 4. Implement authentication

Choose one approach and implement cleanly:

Option A: Supabase Auth
Option B: Auth.js

Requirements:

- Customer login
- Corporate admin login
- Home chef login
- Ops admin login
- Super admin role
- Admin MFA placeholder/requirement
- Server-side role checks
- Protected dashboard routes

Never store tokens in localStorage.

### 5. Build dashboards

Build production-quality dashboard pages for:

Customer:

- Active subscription
- Today’s meal
- Weekly menu selection
- Pause/resume
- Delivery address
- Order history
- Support shortcut

Corporate:

- Employees
- Daily meal count
- Weekly selections
- Monthly invoice
- Delivery slot
- Bulk ordering

Admin:

- Customers
- Subscriptions
- Orders
- Menu management
- Chef management
- Corporate accounts
- Payments
- Complaints
- Audit logs

Chef:

- Assigned meals
- Quantity
- Pickup time
- Quality checklist
- Earnings

### 6. Build menu management

Admin should be able to:

- Create menu week
- Add menu days
- Add two options per day
- Mark Saturday as add-on
- Set availability
- Assign meal options to chefs
- View daily production count

### 7. Database and Prisma

Use the existing Prisma schema as the baseline. Improve it if needed, but preserve these concepts:

- User
- Profile
- Address
- Company
- CompanyEmployee
- HomeChef
- Kitchen
- MenuWeek
- MenuDay
- MenuOption
- Subscription
- SubscriptionItem
- Order
- OrderItem
- Payment
- Invoice
- DeliveryZone
- Delivery
- Complaint
- AuditLog

Add indexes for high-traffic queries.

### 8. Security hardening

Apply:

- Zod validation on every input
- Server-side authorization
- Role-based access control
- Secure cookies
- CSRF protection where needed
- Webhook signature verification
- Strong security headers
- Rate limiting strategy
- Audit logs
- No secrets in frontend
- No sensitive data exposed in client components

Add comments where production Cloudflare WAF/rate limiting should be configured.

### 9. SEO

Add:

- Metadata for all marketing pages
- FAQ schema
- LocalBusiness schema
- Organization schema
- City landing page structure
- Open Graph metadata
- Sitemap/robots setup

SEO keywords:

- homemade lunch delivery Pakistan
- office lunch subscription Lahore
- ghar ka khana delivery
- homemade Pakistani food subscription
- corporate lunch service Pakistan
- healthy office lunch Lahore
- home chef meals Pakistan

### 10. Reliability

Add:

- `/api/health`
- error boundaries
- loading states
- skeleton states
- empty states
- form-level error handling
- logging placeholders
- monitoring notes for Sentry and uptime monitoring

## Coding Rules

- Use TypeScript strictly.
- Keep Server Components by default.
- Use Client Components only when needed.
- Do not create huge components; split by feature.
- Keep business logic in `features/*` or `lib/*`.
- Use accessible labels and semantic HTML.
- Keep mobile UX excellent.
- Do not introduce unrelated libraries unless necessary.
- Do not remove the brand identity.

## First Task

Start by reviewing the project structure and then implement production-level subscription and corporate request flows with Prisma persistence, Zod validation, user feedback, and audit logs.
