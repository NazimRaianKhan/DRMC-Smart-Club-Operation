# DRMC Smart Club Operation
[![CI](https://github.com/NazimRaianKhan/DRMC-Smart-Club-Operation/actions/workflows/ci.yml/badge.svg)](https://github.com/NazimRaianKhan/DRMC-Smart-Club-Operation/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

**Live Demo:** [https://drmc-smart-club-operation.vercel.app](https://drmc-smart-club-operation.vercel.app)

---

## 2. Project Description
The DRMC Smart Club Operation platform aims to centralize and automate the management of club activities, tech fests, and event registrations. It solves the problem of scattered manual processes, paper-based ticketing, and disconnected communication by providing a unified web application. The platform follows a clear hierarchical structure: **Organization** (e.g. DRMC IT Club) -> **Fest** (e.g. Tech Carnival 2026) -> **Event** (e.g. Programming Contest) -> **Registration** (Individual or Team participation).

## 3. Features
* **Directory:** Public-facing pages to explore upcoming fests, events, and schedules.
* **Registration:** Robust individual and team registration system with idempotency, waitlist management, and real-time capacity checks.
* **Organizer Tools:** Comprehensive admin dashboard to manage fests, events, participant check-ins via QR codes, and house cup points.
* **AI Features:** AI-powered intelligent search to instantly find events or answer questions, AI drafting tools for event descriptions, and AI insights.
* **Concurrency Lab:** Built-in interactive lab designed to test and demonstrate the system's ability to handle high-concurrency ticket bookings under heavy load without overselling.

## 4. Tech Stack
* **Framework:** Next.js 15 (App Router, React 19)
* **Styling:** Tailwind CSS v4, Framer Motion, Radix UI
* **Database:** Neon Serverless Postgres, Drizzle ORM
* **Caching & Rate Limiting:** Upstash Redis (Optional fallback to in-memory)
* **AI Integration:** Google Gemini & Groq (Qwen) via Vercel AI SDK

## 5. Setup Instructions

**Prerequisites:**
* Node.js v22+
* pnpm v9+
* Postgres Database (Neon or local)

**1. Clone & Install:**
```bash
git clone https://github.com/NazimRaianKhan/DRMC-Smart-Club-Operation.git
cd DRMC-Smart-Club-Operation
pnpm install
```

**2. Configure Environment:**
Copy `.env.example` to `.env.local` and add your database URL and AI API keys.
```bash
cp .env.example .env.local
```

**3. Database Migration & Seeding:**
```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

**4. Run the Application:**
```bash
pnpm dev
```
Open `http://localhost:3000` in your browser.

## 6. Deployment URL
**Live Vercel URL:** [https://drmc-smart-club-operation.vercel.app](https://drmc-smart-club-operation.vercel.app)

## 7. Demo Credentials
You can log in to the live demo using the following pre-seeded credentials:

* **Admin Account:**
  * Email: `admin@drmc-demo.test`
  * Password: `Admin@12345`
* **Organizer Account:**
  * Email: `organizer@drmc-demo.test`
  * Password: `Organizer@12345`
* **Participant Account:**
  * Email: `participant@drmc-demo.test`
  * Password: `Participant@12345`

## 8. Third-party Services/APIs
* **Vercel:** Hosting and serverless function execution.
* **Neon:** Serverless PostgreSQL database with connection pooling.
* **Upstash:** Redis for rate limiting (fallback to in-memory available).
* **Gemini (Google):** Primary AI provider for AI-powered search, drafting, and insights.
* **Groq:** Secondary AI provider used for low-latency AI responses.

## 9. AI Tools/Features Used
* **Coding Assistants Used:** Google Deepmind Antigravity (AGY) agentic coding assistant was utilized during development for rapid prototyping, CI/CD setup, bug fixing, and database schema refinement.
* **Product AI Features:**
  * **AI Search:** Users can query fests and events naturally (e.g., "What programming contests are there next month?").
  * **AI Drafting:** Organizers can generate structured markdown descriptions for their events using AI.
  * **AI Insights:** Automated analytical summaries of registration metrics.
* **Data Privacy:** No personal user data (PII) is sent to external AI providers.

## 10. Screenshots
*(Embed links to desktop/mobile screenshots of key pages here once added)*

## 11. Known Limitations
* **Neon Cold Starts:** Serverless database may take 1-3 seconds to resume from an idle state on the free tier, causing the initial page load to be slightly delayed.
* **Free-tier AI Limits:** Heavy usage of the AI search feature may encounter rate-limit errors from the free Gemini/Groq APIs.
* **Single Organization:** The platform is currently configured to serve a single root organization (e.g., DRMC IT Club). Multi-tenant support for multiple independent organizations is not fully implemented.

## 12. License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
