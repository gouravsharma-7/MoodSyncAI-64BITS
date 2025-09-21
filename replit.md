# Overview

MoodWise is an AI-powered mental wellness companion application that helps users track their emotional well-being through multiple touchpoints. The application combines mood tracking, journaling, AI chat support, personalized content recommendations, and therapeutic activity suggestions to provide comprehensive mental health support.

The system leverages advanced AI capabilities for sentiment analysis, tone detection, and personalized recommendations, creating a holistic platform for emotional wellness management.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Technology Stack**: React with TypeScript, built using Vite for development and bundling
- **UI Framework**: Custom component system built on Radix UI primitives with shadcn/ui styling
- **Styling**: Tailwind CSS with CSS variables for theming, supporting dark mode with warm color palette
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

**Component Architecture**: Modular component design with clear separation between UI components (`/components/ui`) and feature-specific components (`/components/[feature]`). Components are organized by feature domains (mood, journal, chat, activities, recommendations).

**Layout Structure**: Single-page application with persistent sidebar navigation and main content area. Mobile-responsive design with adaptive layouts.

## Backend Architecture

**Technology Stack**: Express.js with TypeScript running on Node.js
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Validation**: Zod schemas for runtime type validation and API contract enforcement
- **Development Setup**: Vite middleware integration for seamless development experience

**API Design**: RESTful API structure with clear endpoint organization:
- `/api/mood` - Mood tracking endpoints
- `/api/journal` - Journal entry management
- `/api/chat` - AI chat conversation handling
- `/api/recommendations` - Content recommendation system
- `/api/activities` - Activity suggestion generation
- `/api/insights` - AI-generated user insights

**Error Handling**: Centralized error handling middleware with structured error responses and appropriate HTTP status codes.

## Data Storage Solutions

**Primary Database**: PostgreSQL with Neon serverless hosting
- **Schema Design**: Relational model with proper foreign key constraints and cascading deletes
- **Core Entities**: Users, mood entries, journal entries, chat messages, user preferences, content recommendations
- **Data Types**: JSONB columns for storing complex sentiment analysis and tone detection results
- **Migration Strategy**: Drizzle Kit for schema migrations and database management

**Database Connection**: Connection pooling using Neon's serverless driver with WebSocket support for optimal performance.

## Authentication and Authorization

**Current Implementation**: Mock user system with hardcoded user ID for development
- **Future Considerations**: Designed for easy integration with authentication providers
- **Session Management**: Prepared for session-based authentication with user context

## External Service Integrations

**AI Services Architecture**:
- **Google Gemini AI**: Primary AI service for sentiment analysis, tone detection, and chat responses
  - Model: gemini-2.5-pro for advanced language understanding
  - Response format: Structured JSON outputs with confidence scores
  - Use cases: Sentiment analysis of journal entries, tone detection in chat, mood insights generation

- **OpenAI Integration**: Secondary AI service for enhanced content generation
  - Model: gpt-5 for advanced reasoning and creativity
  - Use cases: Activity suggestions based on hobbies, content recommendations, chat response enhancement

**Service Isolation**: Each AI service is isolated in separate modules (`/server/services/`) with clear interfaces and error handling.

**API Key Management**: Environment variable-based configuration for secure API key storage.

## Key Features Implementation

**Mood Tracking System**: 
- 5-point scale mood logging with optional notes
- Weekly trend visualization using Recharts
- Historical data aggregation and analysis

**AI-Powered Journal**:
- Real-time sentiment analysis of journal entries
- Emotion classification with confidence scoring
- Private journaling with AI insights

**Intelligent Chat Interface**:
- Real-time AI conversations with tone detection
- Context-aware responses based on user's emotional state
- Voice input capability (browser-dependent)

**Personalized Recommendations**:
- Mood-based content curation
- Dynamic recommendation generation
- Multi-media content support (articles, podcasts, meditations)

**Therapeutic Activities**:
- Hobby-based activity suggestions
- Mood-targeted therapeutic interventions
- Difficulty and duration matching

**AI Insights Dashboard**:
- Automated pattern recognition in mood data
- Personalized insights and suggestions
- Trend analysis and recommendations

# External Dependencies

## Core Dependencies
- **@neondatabase/serverless**: PostgreSQL serverless database connection
- **drizzle-orm**: Type-safe database ORM and query builder
- **@google/genai**: Google Gemini AI integration for sentiment analysis and chat
- **openai**: OpenAI API integration for enhanced content generation

## Frontend Dependencies
- **@tanstack/react-query**: Server state management and caching
- **wouter**: Lightweight routing for React
- **recharts**: Chart library for mood visualization
- **@radix-ui/\***: Accessible UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **react-hook-form**: Form state management
- **zod**: Runtime type validation

## Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Static type checking
- **tsx**: TypeScript execution for Node.js
- **drizzle-kit**: Database migration and schema management

## Database
- **PostgreSQL**: Primary database hosted on Neon
- **Environment**: DATABASE_URL required for connection

## AI Services
- **Google Gemini API**: Requires GEMINI_API_KEY environment variable
- **OpenAI API**: Requires OPENAI_API_KEY environment variable

## Build and Deployment
- **Node.js**: Runtime environment (ESM modules)
- **esbuild**: Production bundling for server code
- **Vite**: Client-side bundling and optimization