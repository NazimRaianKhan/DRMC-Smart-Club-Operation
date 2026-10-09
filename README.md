# 1. DRMC Tech Carnival Platform

![CI](https://github.com/organization/drmc-tech-carnival/actions/workflows/ci.yml/badge.svg)
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Demo](https://img.shields.io/badge/Live-Demo-success)

# 2. Project description
The DRMC Tech Carnival Platform is a comprehensive, multi-lingual (English and Bengali) event management system built specifically for handling the 9th DRMC International Tech Carnival 2026. It solves the problem of organizing complex technology festivals by providing a structured, hierarchical management system and robust registration logic to prevent overselling.

The core data hierarchy follows:
**Organization -> Fest -> Event -> Registration**
- **Organization**: The top-level entity managing the platform.
- **Fest**: A specific festival (e.g., 9th DRMC Tech Carnival).
- **Event**: Individual competitions or workshops within a fest (e.g., Web Development, Programming Contest).
- **Registration**: Participant or team enrollments for specific events.

# 3. Features
- **Directory**: Public-facing fest and event directories with full bilingual support.
- **Registration**: Robust registration system with waitlisting, team support, strict capacity enforcement, direct Google Calendar integration, and printable QR code tickets.
- **Organizer tools**: Admin dashboard for managing fests, events, participant data exports (CSV), and an on-site QR scanner / manual check-in system.
- **AI features**: AI-assisted event drafting, automatic Bengali translation, AI-powered semantic search, Admin AI insights/analytics, and a public Q&A assistant for events.
- **Concurrency Lab**: A visual testing environment (`/lab`) proving that the database handles hundreds of simultaneous registrations perfectly without overselling.
- **House Cup Leaderboard**: Gamified system tracking points across DRMC Houses (`/house-cup`).

# 4. Tech Stack
- **Framework**: Next.js 16 (App Router, Server Actions)
- **Styling**: Tailwind CSS v4, Framer Motion
- **Database**: Neon Serverless Postgres
- **ORM**: Drizzle ORM
- **Caching & Rate Limiting**: Upstash Redis
- **AI/LLM**: Google Gemini / Groq

# 5. Setup instructions
**Prerequisites:**
- Node.js 22+
- pnpm 9+
- A Neon Postgres database URL
- An Upstash Redis REST URL and Token
- A Gemini API Key and/or Groq API Key

**Installation:**
```bash
git clone https://github.com/organization/drmc-tech-carnival.git
cd drmc-tech-carnival
pnpm install
```

**Environment Variables:**
Create a `.env.local` file based on `.env.example`:
```env
DATABASE_URL="postgres://user:password@hostname/dbname"
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."
AUTH_SECRET="your-32-char-secret"
GEMINI_API_KEY="your-gemini-key"
```

**Database Setup:**
```bash
pnpm run db:generate
pnpm run db:migrate
pnpm run db:seed
```

**Run Development Server:**
```bash
pnpm dev
```

# 6. Deployment URL
The application is deployed on Vercel:
**[https://drmc-tech-carnival.vercel.app](https://drmc-tech-carnival.vercel.app)** *(Replace with actual URL once deployed)*

**Vercel Deployment Instructions:**
1. Connect the GitHub repository to Vercel.
2. Add all environment variables from `.env.example` to the Vercel project settings.
3. Set `DEMO_MODE=true` in Vercel to allow seamless testing.
4. The build command (`next build`) and output directory (`.next`) are automatically configured by Vercel.

# 7. Demo credentials
The database seeder provisions the following accounts for testing:
- **Admin**: `admin@example.com` | Password: `password`
- **Organizer**: `organizer@example.com` | Password: `password`
- **Participant**: `participant@example.com` | Password: `password`

# 8. Third-party services/APIs
- **Vercel**: Hosting, Edge Network, and CI/CD Pipeline.
- **Neon**: Serverless PostgreSQL database.
- **Upstash**: Serverless Redis for rate-limiting and caching.
- **Google Gemini / Groq**: Large Language Models powering the AI features.

# 9. AI tools/features used
**Development Assistant:**
- Google Antigravity (Advanced Agentic Coding AI) was used extensively to plan, architect, implement, and debug the codebase throughout the hackathon.

**Product AI Features:**
- **AI Event Drafting**: Organizers can generate event descriptions from brief prompts.
- **AI Translation**: Automatic generation of Bengali translations for events and fests.
- **AI Search**: Semantic search allowing users to find events by querying natural language concepts.
- **AI Insights**: Dashboard widget generating analytical insights on registration data.
- **Event Q&A Assistant**: Public chatbot on event pages answering user questions based strictly on the event's context and FAQs.

*Privacy Note: No personal user data (names, emails, student IDs, etc.) is ever sent to the AI models. All AI features rely solely on public event metadata or aggregated anonymous statistics.*

# 10. Screenshots
*Replace with actual image links after deployment*
- [Desktop Landing Page](#)
- [Event Registration Flow](#)
- [Admin Dashboard & Insights](#)
- [QR Scanner Check-in](#)
- [Concurrency Lab Visualization](#)

# 11. Known limitations
- **Neon Cold Starts**: The first database request after a period of inactivity may experience a slight delay (typically <1s) due to serverless scale-to-zero.
- **Free-Tier AI Limits**: AI features may hit rate limits if too many users attempt to draft events or use the Q&A assistant simultaneously on the free-tier Gemini/Groq keys.
- **Single Organization**: The platform is currently optimized for a single organizing body (e.g., DRMC IT Club). Multi-tenant organization support is not fully implemented.

# 12. License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
