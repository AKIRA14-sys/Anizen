# ANIZEN - Modern Anime Discovery & Streaming Platform

ANIZEN is a modern, responsive anime discovery and video streaming web application built with Next.js (App Router), TypeScript, Tailwind CSS, and Lucide React icons. It features a dark cinematic aesthetic with signature orange accents (`#ff6b00`), an automatic swipeable hero carousel, real metadata from AniList GraphQL, episode listings from Aniweeb API, and local watchlist management.

---

## 🌟 Key Features

### 1. Cinematic Multi-Slide Hero Carousel
- **Auto-Rotation:** Automatically advances slides every 6 seconds with interaction pause and reduced-motion support.
- **Gesture Support:** Touch swipe support (left/right) for mobile devices and entry-level Android smartphones.
- **Controls & Indicators:** Interactive desktop navigation arrows, pagination dots, and direct action buttons ("Watch Now", "Add to Watchlist").

### 2. Anime Discovery & Homepage Rails
- **Trending Now:** Highlighting popular titles currently trending.
- **New This Season:** Displays currently airing anime based on current seasonal year and season parameters.
- **Genre Explorer:** Direct category pills for Action, Adventure, Comedy, Fantasy, Sci-Fi, Romance, and more.
- **Top Rated:** Curated top-rated series based on AniList score metrics.

### 3. Live Explore & Search
- **Debounced Search:** Instant title search without excessive GraphQL API calls.
- **Genre Filters & Sorting:** Dynamic filtering across genres and sorting by Popularity, Score, Trending, and Recency.
- **Suspense-Wrapped Querying:** Deep-linkable search state using Next.js App Router query params.

### 4. Detailed Anime Pages
- **Rich Metadata:** Displays high-res cover and banner artwork, score, airing status, release season/year, studio metadata, and full synopsis.
- **Episode Browser:** Dynamic episode selection grid linked directly to Aniweeb API.
- **Watchlist Toggle:** One-click add/remove saved state saved to browser storage.

### 5. Watch Page & Embedded Player
- **Aniweeb Integration:** Embedded player interface supporting Sub/Dub track query toggling (`track=sub|dub`).
- **Episode Navigator:** Previous/Next episode quick jump and full episode drawer list.
- **Error Fallback Handling:** Informative states when an episode or stream provider is unavailable.

### 6. Local Watchlist Persistence
- **Client-Side Storage:** Browser `localStorage` management with zero user account requirement.
- **Responsive Management:** Instant removal, dynamic count badges, and direct route shortcuts.

---

## 🚀 Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Anime Metadata API:** [AniList GraphQL API](https://graphql.anilist.co)
- **Episode Provider API:** [Aniweeb API](https://api.aniweeb.net/docs)
- **Deployment Platform:** Vercel

---

## 📁 Repository Structure

```
.
├── app/
│   ├── anime/[id]/         # Anime details page with episode listing
│   ├── explore/            # Live search, genre filtering & sorting
│   ├── watch/[id]/         # Video watch page & episode stream player
│   ├── watchlist/          # Saved anime watchlist manager
│   ├── globals.css         # Global Tailwind styles & dark theme
│   ├── layout.tsx          # Root layout with Navbar & Footer
│   └── page.tsx            # Homepage with Hero Carousel & Discovery Rails
├── components/
│   ├── AnimeCard.tsx       # Reusable poster card component
│   ├── AnimeRail.tsx       # Horizontal scrolling collection rail
│   ├── GenreSection.tsx    # Genre pills and discovery grid
│   ├── HeroCarousel.tsx    # Auto-rotating touch-swipeable hero banner
│   ├── Navbar.tsx          # Mobile-responsive navigation header
│   └── Footer.tsx          # Site footer
├── lib/
│   ├── anilist.ts          # AniList GraphQL query service
│   ├── aniweeb.ts          # Aniweeb API episode & embed helper
│   └── watchlist.ts        # Browser localStorage manager
├── types/
│   └── anime.ts            # TypeScript interfaces and data models
├── public/                 # Static assets and icons
├── next.config.mjs         # Next.js configuration (remote image patterns)
└── README.md
```

---

## 🛠️ Local Development & Setup

### Prerequisites
- Node.js 18.x or later
- npm or yarn

### Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd anizen
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Verification

ANIZEN has been thoroughly verified using standard automated and visual browser testing tools:

- **Type Check:** Verified clean compilation via `npx tsc --noEmit`.
- **Production Build:** Verified with `npm run build` producing optimized Next.js App Router server and static pages.
- **Visual E2E Verification:** Tested via Playwright automation across desktop and mobile viewports, verifying hero auto-rotation, search filtering, anime detail fetching, and video playback rendering.

---

## ⚡ Deployment to Vercel

ANIZEN is fully optimized for Vercel deployment without requiring server-side databases or paid credentials.

### Step-by-Step Vercel Deployment Instructions

1. **Push Changes to GitHub:**
   Ensure all code changes are committed and pushed to your GitHub repository branch.

2. **Connect to Vercel:**
   - Log into your [Vercel Dashboard](https://vercel.com).
   - Click **"Add New..."** -> **"Project"**.
   - Select your GitHub repository (`ANIZEN`).

3. **Build Settings:**
   - **Framework Preset:** Next.js
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)
   - **Install Command:** `npm install` (default)

4. **Environment Variables:**
   - No secret environment variables are required. Public API endpoints (AniList GraphQL & Aniweeb) are configured with graceful client fallbacks.

5. **Deploy:**
   - Click **"Deploy"**. Vercel will build and deploy the Next.js App Router application.
   - Once deployed, open the generated domain URL (e.g. `https://anizen.vercel.app`) to access the live site.

---

## 📄 License

This project is created for demonstration and portfolio purposes. All anime metadata is retrieved via the open AniList GraphQL API. All media assets belong to their respective creators and rights holders.
