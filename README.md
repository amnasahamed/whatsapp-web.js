# 🚀 WhatsApp Command Center

**AI-Powered WhatsApp Business Hub** - Self-hosted, multi-LLM support, team collaboration, and automation platform built on top of whatsapp-web.js.

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-%5E5.0.0-blue.svg)](https://www.typescriptlang.org/)

---

## ✨ Features

### 🤖 **Multi-LLM AI Integration**
- **OpenAI** (GPT-4, GPT-4 Turbo, GPT-3.5)
- **Anthropic** (Claude 3 Opus, Sonnet, Haiku)
- **Google Gemini** (Gemini Pro, Gemini Pro Vision)
- **Custom LLMs** (Ollama, LM Studio, vLLM, any OpenAI-compatible API)
- Automatic failover and retry logic
- Hot-swappable providers
- Token usage tracking and cost estimation

### 💬 **WhatsApp Features**
- Send/receive messages (text, media, documents)
- Group management
- Contact management with custom fields and tags
- Message scheduling and broadcasting
- Media handling (images, videos, audio, documents)
- Location and contact card sharing
- Polls and reactions
- Multi-account support

### 👥 **Team Collaboration**
- Shared inbox for team members
- Conversation assignment
- Internal notes and tags
- Role-based access control (Owner, Admin, Manager, Agent, Viewer)
- Real-time updates via WebSocket

### 🔄 **Automation & Workflows**
- No-code automation builder
- Trigger-based workflows
- AI-powered auto-responses
- Custom webhook integrations
- Scheduled messages and campaigns

### 📊 **Analytics & Monitoring**
- Message volume tracking
- Response time metrics
- AI usage and costs
- Contact engagement analytics
- Custom reports

### 🔒 **Security & Privacy**
- Self-hosted (complete data ownership)
- End-to-end encryption (WhatsApp native)
- Role-based permissions
- API key management
- Activity logging and audit trails

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                CLIENT LAYER (Next.js 14 App Router)         │
│           React 18 + TailwindCSS + shadcn/ui                │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                    API LAYER (tRPC + Next.js)               │
│         WebSocket Server (Socket.io) + NextAuth.js          │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│              SERVICE LAYER (Business Logic)                 │
│  WhatsApp Manager | AI Orchestrator | Automation Engine    │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│         INTEGRATION LAYER (External Services)               │
│  whatsapp-web.js | OpenAI | Anthropic | Gemini | Custom    │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│              DATA LAYER (PostgreSQL + Redis)                │
│         Prisma ORM | BullMQ | Socket.io Adapter            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18.0.0
- **PostgreSQL** ≥ 15
- **Redis** ≥ 7
- **Google Chrome** (for Puppeteer)

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd whatsapp-command-center
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Setup database**
```bash
npm run db:push
npm run db:seed
```

5. **Run development server**
```bash
npm run dev
```

6. **Open your browser**
```
http://localhost:3000
```

---

## 📝 Configuration

### Environment Variables

Key configuration options in `.env`:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/whatsapp_cc"

# Redis
REDIS_URL="redis://localhost:6379"

# AI Providers (configure at least one)
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...
CUSTOM_LLM_ENDPOINT=http://localhost:11434/api/generate

# Default AI Provider
DEFAULT_AI_PROVIDER=openai  # openai | anthropic | gemini | custom

# Authentication
NEXTAUTH_SECRET=your-secret-key-min-32-chars
JWT_SECRET=your-jwt-secret

# WhatsApp
WHATSAPP_SESSION_PATH=./.wwebjs_auth
PUPPETEER_HEADLESS=true
```

See `.env.example` for full configuration options.

---

## 🔧 Tech Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | Next.js 14, React 18, TypeScript, TailwindCSS, shadcn/ui |
| **Backend** | Next.js API Routes, tRPC, NextAuth.js |
| **Database** | PostgreSQL 15+, Prisma ORM, Redis |
| **WhatsApp** | whatsapp-web.js, Puppeteer |
| **AI/LLM** | OpenAI, Anthropic, Google Generative AI, Custom |
| **Queue** | BullMQ, ioredis |
| **WebSocket** | Socket.io |
| **Logging** | Pino |
| **Testing** | Vitest, Playwright |
| **DevOps** | Docker, Docker Compose |

---

## 📚 Project Structure

```
whatsapp-command-center/
├── src/
│   ├── app/                    # Next.js 14 App Router
│   │   ├── (auth)/            # Authentication pages
│   │   ├── (dashboard)/       # Dashboard pages
│   │   └── api/               # API routes
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── inbox/            # Inbox components
│   │   ├── automation/       # Automation builder
│   │   └── settings/         # Settings components
│   ├── lib/
│   │   ├── services/         # Business logic
│   │   │   ├── ai/          # AI providers
│   │   │   ├── whatsapp/    # WhatsApp service
│   │   │   ├── automation/  # Automation engine
│   │   │   └── team/        # Team management
│   │   ├── utils/           # Utilities
│   │   ├── db/              # Database clients
│   │   └── trpc/            # tRPC routers
│   ├── types/               # TypeScript types
│   ├── config/              # Configuration
│   ├── hooks/               # React hooks
│   └── stores/              # State management
├── prisma/
│   └── schema.prisma        # Database schema
├── docker/                  # Docker configuration
├── tests/                   # Test files
└── docs/                    # Documentation
```

---

## 🤖 AI Provider Setup

### OpenAI (GPT-4)
1. Get API key: https://platform.openai.com/api-keys
2. Add to `.env`:
```bash
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4-turbo-preview
```

### Anthropic (Claude)
1. Get API key: https://console.anthropic.com/
2. Add to `.env`:
```bash
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

### Google Gemini
1. Get API key: https://makersuite.google.com/app/apikey
2. Add to `.env`:
```bash
GEMINI_API_KEY=AIza...
GEMINI_MODEL=gemini-pro
```

### Custom LLM (Ollama, LM Studio)
```bash
CUSTOM_LLM_ENDPOINT=http://localhost:11434/api/generate
CUSTOM_LLM_MODEL=llama2
```

---

## 🐳 Docker Deployment

### Development
```bash
docker-compose -f docker-compose.dev.yml up
```

### Production
```bash
docker-compose up -d
```

---

## 📊 Current Implementation Status

### ✅ Completed
- [x] Project structure and configuration
- [x] Database schema (Prisma)
- [x] AI abstraction layer (OpenAI, Anthropic, Gemini, Custom)
- [x] AI Orchestrator with failover
- [x] Logger, error handling, database clients
- [x] TypeScript types and interfaces

### 🚧 In Progress
- [ ] WhatsApp client service
- [ ] Next.js API routes
- [ ] WebSocket server
- [ ] React UI components
- [ ] Authentication system
- [ ] Automation engine
- [ ] Team collaboration
- [ ] Analytics dashboard

### 📋 Planned
- [ ] Unit and E2E tests
- [ ] Docker setup
- [ ] Deployment guides
- [ ] API documentation

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

---

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

---

## ⚠️ Disclaimer

This project is not affiliated with WhatsApp or Meta. It uses whatsapp-web.js which is an unofficial WhatsApp Web client. Use at your own risk - WhatsApp may block accounts using unofficial clients.

---

## 🙏 Acknowledgments

- [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js) - WhatsApp Web API client
- [Next.js](https://nextjs.org/) - React framework
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Prisma](https://www.prisma.io/) - Database ORM

---

## 📞 Support

- **Documentation**: [docs/](./docs/)
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)

---

**Built with ❤️ for small businesses who can't afford expensive WhatsApp Business API costs**
