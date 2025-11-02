# BundLink - Smart URL Shortener for German Public Services

## Overview

BundLink is a GDPR-compliant URL shortening service designed specifically for German federal, state, and local government entities. The application provides secure link management with intelligent routing capabilities, privacy-preserving analytics, and accessibility features that meet BITV 2.0 standards. Built with a focus on trust, security, and citizen-centric design, BundLink enables government agencies to create shortened URLs with official verification, smart geographic and language-based routing, and comprehensive administrative controls.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server for fast HMR and optimized production builds
- Wouter for lightweight client-side routing instead of React Router

**UI Component System**
- shadcn/ui components built on Radix UI primitives for accessible, customizable components
- Tailwind CSS for utility-first styling with custom design tokens
- Material Design 3 principles adapted for government services (per design_guidelines.md)
- Custom theming system supporting light/dark modes with HSL-based color tokens

**State Management**
- TanStack Query (React Query) for server state management, data fetching, and cache management
- React Hook Form with Zod validation for type-safe form handling
- Context API for theme state and authentication state

**Design System**
- Inter font family for primary UI text (exceptional legibility, German character support)
- JetBrains Mono for monospace content (short codes, technical data)
- Custom spacing scale based on Tailwind units (2, 4, 6, 8, 12, 16, 20)
- Responsive grid layouts with max-width constraints for different content types

### Backend Architecture

**Server Framework**
- Express.js server with TypeScript for API endpoints and middleware
- Session-based authentication using express-session with PostgreSQL storage (connect-pg-simple)
- Custom middleware for role-based authorization (federal/state/local hierarchy)

**Authentication & Authorization**
- Replit OpenID Connect (OIDC) integration via openid-client and Passport.js
- Three-tier role system: federal > state > local with hierarchical permissions
- Session management with secure cookies and CSRF protection

**API Design**
- RESTful endpoints organized by resource (links, analytics, reports, routing rules)
- Request validation using Zod schemas from shared types
- Consistent error handling with appropriate HTTP status codes
- API response logging for debugging and audit trails

### Database Layer

**ORM & Schema**
- Drizzle ORM for type-safe database operations with PostgreSQL
- Neon serverless PostgreSQL client with WebSocket support
- Schema-first approach with shared types between frontend and backend

**Data Models**
- **Users**: Authentication, roles (federal/state/local), agency affiliation
- **Links**: Shortened URLs with metadata (title, description, custom aliases, expiration)
- **Routing Rules**: Geographic and language-based routing configurations
- **Analytics**: Click tracking with privacy-preserving anonymized data
- **Reports**: User-submitted reports for phishing/abuse detection
- **Sessions**: PostgreSQL-backed session storage for authentication

**Database Features**
- Automatic timestamps (createdAt, updatedAt) for audit trails
- UUID primary keys for security and scalability
- Indexed fields for performance (session expiration, link lookup by short code)
- JSONB fields for flexible metadata storage

### Security & Privacy

**GDPR Compliance**
- Privacy-by-design with optional analytics requiring explicit consent
- Data minimization through automatic log deletion after retention period
- Session data stored server-side in PostgreSQL (not in cookies)
- No tracking cookies by default

**Authentication Security**
- OIDC-based authentication with token refresh capabilities
- HTTP-only, secure session cookies with configurable TTL (1 week default)
- HSTS enforcement for SSL/TLS connections
- Two-factor authentication support through Replit Auth

**Authorization Model**
- Role-based access control (RBAC) with three-tier hierarchy
- Resource-level permissions (users can only access their own links or those in their jurisdiction)
- Middleware enforcement of permissions at the API layer

### Key Features Implementation

**Smart Routing**
- Geographic routing based on country detection (currently country-level only)
  - Uses X-Country-Code header for testing (fallback: DE)
  - Production deployment requires GeoIP service integration (e.g., MaxMind, ipapi.co)
  - State/region routing not yet supported (requires granular GeoIP data)
- Language-based routing with fallback mechanisms
  - Detects language from Accept-Language header
  - Supports language codes (de, en, fr) and locales (de-DE, en-US)
- Device optimization (mobile, tablet, desktop)
  - User-Agent based detection
  - Future: Deep link support for mobile apps
- Priority-based rule evaluation with fallback to default destination

**Link Preview System**
- Countdown-based redirect (5 seconds default) for user awareness
- Verification badge display showing agency ownership
- Destination URL preview before redirect
- Click tracking with analytics opt-in

**Analytics Dashboard**
- Privacy-preserving metrics without user tracking
- Aggregated statistics: total clicks, click rate, geographic distribution
- Device type breakdown
- Time-series click data visualization using Recharts

**Administrative Features**
- Bulk link creation capabilities
- Custom alias support with validation
- Link expiration controls with automatic archival
- QR code generation for offline distribution
- Link activation/deactivation toggle

## External Dependencies

### Third-Party UI Libraries
- **Radix UI**: Headless accessible component primitives (dialogs, dropdowns, tooltips, etc.)
- **Recharts**: Composable charting library for analytics visualizations
- **cmdk**: Command palette component for keyboard-driven navigation
- **Lucide React**: Icon library with consistent design system

### Database & ORM
- **@neondatabase/serverless**: Neon PostgreSQL serverless client with WebSocket support
- **Drizzle ORM**: Type-safe ORM with schema migrations via drizzle-kit
- **connect-pg-simple**: PostgreSQL session store for express-session

### Authentication
- **openid-client**: OpenID Connect client for Replit Auth integration
- **passport**: Authentication middleware with strategy-based design
- **express-session**: Session management with server-side storage

### Form & Validation
- **react-hook-form**: Performant form library with minimal re-renders
- **@hookform/resolvers**: Integration between react-hook-form and validation schemas
- **zod**: TypeScript-first schema validation with type inference
- **drizzle-zod**: Generate Zod schemas from Drizzle database schema

### Utilities
- **date-fns**: Modern date manipulation library with German locale support
- **nanoid**: Secure URL-friendly unique ID generator for short codes
- **memoizee**: Function memoization for performance optimization
- **class-variance-authority**: Type-safe variant management for component styling
- **tailwind-merge & clsx**: Utility for merging Tailwind classes with conflict resolution

### Development Tools
- **Vite**: Fast build tool with HMR and optimized bundling
- **TypeScript**: Static type checking across frontend and backend
- **@replit/vite-plugin-***: Replit-specific development plugins (error overlay, cartographer, dev banner)
- **esbuild**: Fast JavaScript bundler for server-side code compilation