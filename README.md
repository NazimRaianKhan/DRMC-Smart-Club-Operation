# 1. DRMC Tech Carnival Platform

![CI Status](https://github.com/NazimRaianKhan/DRMC-Smart-Club-Operation/actions/workflows/ci.yml/badge.svg)
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)
![Live Demo](https://img.shields.io/badge/Live_Demo-Online-success?style=flat-square)

## 2. Project description

The DRMC Tech Carnival Platform is an enterprise-grade, internationalized event management ecosystem engineered to streamline the orchestration of the 9th DRMC International Tech Carnival 2026. This platform resolves the administrative and technical bottlenecks traditionally associated with large-scale technology festivals by providing a robust, highly scalable infrastructure capable of processing high-volume concurrent registrations without data anomalies.

The system enforces a strict hierarchical data architecture to maintain organizational integrity:
- **Organization**: The apex administrative body overseeing the platform's operations.
- **Fest**: A distinct, overarching festival entity (e.g., the 9th DRMC Tech Carnival).
- **Event**: Individualized competitions, workshops, or seminars hosted under the umbrella of a Fest.
- **Registration**: Granular records of individual or team enrollments, strictly bound by transactional capacity constraints.

## 3. Features

- **Centralized Directory**: Public-facing, fully localized (English and Bengali) directories facilitating the discovery of Fests and affiliated Events.
- **Transactional Registration System**: A resilient registration engine featuring automated waitlist provisioning, dynamic team formation, strict capacity enforcement, native Google Calendar integration, and cryptographic QR code generation for verifiable ticketing.
- **Organizer Tooling**: A comprehensive administrative dashboard empowering organizers to manage event lifecycles, execute bulk data exports (CSV format), and operate an on-site hardware-agnostic QR scanning interface for attendee check-ins.
- **Artificial Intelligence Integration**: A suite of LLM-powered utilities, including automated drafting of event specifications, native semantic translation to Bengali, natural language event discovery (AI Search), aggregate administrative insights, and a public-facing conversational Q&A assistant for user inquiries.
- **Concurrency Laboratory**: A dedicated, interactive testing environment (`/lab`) designed to mathematically prove the system's resilience by processing hundreds of simultaneous, heavily concurrent registration transactions without overselling capacity.
- **House Cup Leaderboard**: A gamified, real-time leaderboard tracking cumulative institutional points allocated to DRMC Houses based on administrative metrics and participant performance.

## 4. Tech Stack

- **Application Framework**: Next.js 16 (App Router paradigm, Server Actions)
- **Styling and Animation**: Tailwind CSS v4, Framer Motion
- **Relational Database**: Neon Serverless PostgreSQL
- **Object-Relational Mapping (ORM)**: Drizzle ORM
- **Language Models**: Google Gemini & Groq API

## 5. Setup instructions

### Prerequisites
- Node.js (Version 22.0.0 or higher)
- pnpm package manager (Version 9.0.0 or higher)
- A PostgreSQL database connection URI (e.g., Neon)
- Active API keys for Google Gemini and Groq

### Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/NazimRaianKhan/DRMC-Smart-Club-Operation.git
cd DRMC-Smart-Club-Operation
pnpm install --frozen-lockfile
```

### Environment Configuration
Copy the sample environment file and populate it with production credentials:
```bash
cp .env.example .env.local
```
Ensure the following variables are defined within `.env.local`:
```env
DATABASE_URL="postgresql://user:password@hostname/dbname?sslmode=require"
AUTH_SECRET="your-cryptographically-secure-32-char-secret"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-flash-latest"
GROQ_API_KEY="your-groq-api-key"
GROQ_MODEL="qwen/qwen3.8-27b"
DEMO_MODE=true
```

### Database Initialization
Generate the schema, apply migrations, and execute the production seeder:
```bash
pnpm run db:generate
pnpm run db:migrate
pnpm run db:seed
```

### Execution
Initiate the local development server:
```bash
pnpm dev
```

## 6. Deployment URL

The production application is actively hosted and served via the Vercel Edge Network:
**[https://drmc-smart-club-operation.vercel.app](https://drmc-smart-club-operation.vercel.app)**

## 7. Demo credentials

The database seeder automatically provisions the following standardized accounts to facilitate immediate evaluation of administrative and user-level interfaces:

- **Administrator**: `admin@drmc-demo.test` | Password: `Admin@12345`
- **Organizer**: `organizer@drmc-demo.test` | Password: `Organizer@12345`
- **Participant**: `participant@drmc-demo.test` | Password: `Participant@12345`

## 8. Third-party services/APIs

- **Vercel**: Provides the underlying infrastructure for hosting, Edge Network distribution, and automated CI/CD pipelines.
- **Neon**: Supplies the serverless PostgreSQL database architecture.
- **Google Gemini & Groq**: Delivers the Large Language Models required to facilitate the platform's generative AI and semantic analysis features.

## 9. AI tools/features used

### Development Disclosure
The development of this platform was heavily augmented by **Google Antigravity** (Advanced Agentic Coding AI). This coding assistant was utilized for architectural planning, code generation, and iterative debugging throughout the hackathon lifecycle.

### Product Features
- **AI Event Drafting**: Organizers may supply rudimentary prompts to programmatically generate comprehensive event documentation.
- **AI Localization**: Automated, context-aware semantic translation of event metadata into Bengali.
- **Semantic Search**: Users may query the directory using natural language, leveraging embeddings to retrieve conceptually relevant events.
- **Administrative Insights**: The dashboard consumes aggregated registration metrics to output strategic, data-driven recommendations for organizers.
- **Public Q&A Assistant**: A stateless chatbot embedded on event pages, strictly instructed to answer user queries using only the provided event metadata and FAQs.

*Privacy and Compliance: The platform enforces strict data boundaries. No personally identifiable information (PII) such as user names, emails, or student IDs is transmitted to external AI models. Generative features operate exclusively on public event metadata or highly anonymized statistical aggregates.*

## 10. Screenshots

*(Screenshots to be added here prior to final submission)*
- [Desktop Landing Interface](#)
- [Registration Transaction Flow](#)
- [Administrative Dashboard and AI Insights](#)
- [Hardware-Agnostic QR Check-in Module](#)
- [Concurrency Laboratory Visualization Grid](#)

## 11. Known limitations

- **Neon Infrastructure Cold Starts**: Due to the scale-to-zero nature of serverless PostgreSQL, the initial database transaction following a prolonged period of inactivity may incur a minor latency penalty (typically <1000ms).
- **Provider API Quotas**: Iterative use of generative AI utilities (e.g., the Public Q&A Assistant or Event Drafting) may briefly encounter `429 Too Many Requests` responses if global throughput exceeds the constraints of the free-tier Gemini/Groq API keys.
- **Single-Tenant Architecture**: The system logic is currently optimized for a monolithic organizational structure (i.e., the DRMC IT Club). True multi-tenant organizational segregation is not fully supported in this iteration.

## 12. License

This project is licensed under the MIT License.
