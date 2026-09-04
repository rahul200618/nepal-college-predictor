# Nepal CEE College Predictor

An intelligent college prediction and rank estimation platform for Nepal's Medical Education Common Entrance Examination (MECEE-BL), built with **TanStack Start**, **React 19**, **Tailwind CSS**, and **Supabase**, deployed on **Cloudflare Pages**.

---

## 🎯 Features

- **Rank Estimation**: Estimate your MECEE-BL rank based on your marks with accurate interpolation from official historical distribution data.
- **College Chances & Prediction**: View High, Moderate, and Low admission chances for medical, dental, and allied health science colleges across Nepal.
- **Comprehensive Course Coverage**: Supports 16+ bachelor-level programs including MBBS, BDS, BSc Nursing, BPH, B.Pharm, BPT, BAMS, BSc MLT, BSc MIT, etc.
- **Reservation Categories**: Supports all 14 official MEC reservation quotas (Open, Female, Dalit, Aadibasi Janajati, Khas Arya, Madhesi, Tharu, Muslim, Pichhadiyako Kshettra, Apangata, Shahid, etc.).
- **Interactive UI**: Clean, mobile-first design with marks slider, instant filtering, probability badges, and college cutoff details.
- **Edge Deployment**: Fast server-side rendering (SSR) and server functions running on Cloudflare Pages edge workers via Nitro.

---

## 🛠️ Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) with [TanStack Router](https://tanstack.com/router)
- **UI / Library**: [React 19](https://react.dev/), [Radix UI](https://www.radix-ui.com/), [Lucide React](https://lucide.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Database / Backend**: [Supabase](https://supabase.com/) (PostgreSQL database with historical cutoff and merit data)
- **Server Engine**: [Nitro](https://nitro.unjs.io/) (preset: `cloudflare-pages`)
- **Hosting**: [Cloudflare Pages](https://pages.cloudflare.com/)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v20.x or higher
- **Package Manager**: `npm` (or `bun` / `pnpm`)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/nepal-college-predictor.git
   cd nepal-college-predictor
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Fill in your Supabase project credentials:
   ```env
   SUPABASE_PROJECT_ID="your_project_id"
   SUPABASE_PUBLISHABLE_KEY="your_publishable_anon_key"
   SUPABASE_URL="https://your_project_id.supabase.co"
   VITE_SUPABASE_PROJECT_ID="your_project_id"
   VITE_SUPABASE_PUBLISHABLE_KEY="your_publishable_anon_key"
   VITE_SUPABASE_URL="https://your_project_id.supabase.co"
   ```

4. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) (or the port shown in your terminal).

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts Vite dev server with hot module reloading |
| `npm run build` | Builds client assets and Nitro Cloudflare Pages worker into `dist/` |
| `npm run preview` | Runs a local preview of the built app |
| `npm run deploy` | Deploys `dist/` to Cloudflare Pages using Wrangler |
| `npm run test` | Runs test suite using Vitest |
| `npm run lint` | Runs ESLint code quality checks |
| `npm run format` | Formats code with Prettier |

---

## 🌐 Deploying to Cloudflare Pages

### Method 1: Git Integration (Recommended)

1. Connect your repository in **Cloudflare Dashboard** > **Workers & Pages** > **Create application** > **Pages**.
2. Set the **Build Configuration**:
   - **Framework preset**: `None`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/`
3. Add **Environment Variables** in project settings:
   - `NODE_VERSION`: `20`
   - `VITE_SUPABASE_URL`: `https://<your_project>.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`: `<your_publishable_key>`
   - `SUPABASE_URL`: `https://<your_project>.supabase.co`
   - `SUPABASE_PUBLISHABLE_KEY`: `<your_publishable_key>`
4. In **Settings > Functions > Compatibility flags**, ensure:
   - **Compatibility date**: `2024-09-23` or newer
   - **Compatibility flags**: `nodejs_compat`

### Method 2: Manual CLI Deployment

```bash
# 1. Log in to Cloudflare
npx wrangler login

# 2. Build the project
npm run build

# 3. Deploy dist to Cloudflare Pages
npx wrangler pages deploy dist --project-name=nepal-college-predictor --branch=main
```

---

## 🔒 Security

- `.env` files containing sensitive keys are ignored from Git via `.gitignore`.
- Always configure production environment variables directly within the Cloudflare Pages and Supabase dashboards.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
