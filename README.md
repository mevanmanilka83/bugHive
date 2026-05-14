# BugHive

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1-purple?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ecf8e?style=for-the-badge&logo=supabase)](https://supabase.com)

A modern community-driven platform for discovering, reporting, and solving real bugs with AI-powered suggestions and collaborative workspaces.

## Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Initialize database
pnpm db:push

# Start dev server
pnpm dev
```

Visit `http://localhost:3000` to get started.

## Features

- 🐛 **Bug Reporting** - Share real issues with rich formatting and images
- 🏷️ **Smart Tagging** - Organize by technology, domain, and custom tags
- 🤖 **AI Solutions** - Get AI-powered suggestions for fixing bugs
- 👥 **Collaboration** - Cluster related bugs and work with teams
- 🔔 **Real-time Updates** - Stay notified of activity and contributions
- 🏆 **Gamification** - Earn recognition and climb leaderboards
- 📊 **Analytics** - Track trends and contributor stats

## Tech Stack

Next.js 15 • React 19 • TypeScript • Tailwind CSS • Supabase • Prisma • Auth.js • Google GenAI

## Development

```bash
pnpm dev       # Start dev server with Turbopack
pnpm build     # Build for production
pnpm test      # Run tests
```

## Environment Setup

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

NEXTAUTH_SECRET=
NEXTAUTH_URL=

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=

GOOGLE_GENAI_API_KEY=
```

## Project Structure

```
app/              # Next.js routes & pages
components/       # React components
lib/             # Utilities & helpers
supabase/        # Database migrations
test/            # Test files
```

## Contributing

Contributions are welcome! Please submit a Pull Request with your improvements.

## License

MIT
