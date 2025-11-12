# Spraystone Facade Simulator - Complete Documentation

## Project Overview

A modern, TypeScript-based React application for generating facade renovation estimates with AI-powered visualization and analysis. Built with React 18, TypeScript, Tailwind CSS v4, and integrated with multiple AI providers (OpenAI, Azure OpenAI, Google Gemini).

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Getting Started](#getting-started)
3. [Architecture](#architecture)
4. [Configuration](#configuration)
5. [Component Structure](#component-structure)
6. [AI Integration](#ai-integration)
7. [Deployment](#deployment)
8. [Development Guidelines](#development-guidelines)

---

## Tech Stack

### Core
- **React 18.2** - UI framework
- **TypeScript 5.3** - Type safety and developer experience
- **Vite 5** - Build tool and dev server
- **Tailwind CSS v4** - Utility-first CSS framework

### AI & APIs
- **OpenAI GPT-4o & gpt-image-1** - Text analysis and image generation
- **Google Gemini AI** - Alternative text/image generation
- **Azure OpenAI** - Enterprise AI endpoints
- **Google Maps API** - Address autocomplete and mapping

### Libraries
- **jsPDF & jspdf-autotable** - PDF generation
- **Lucide React** - Icon library
- **Express** - Proxy server for image generation

---

## Getting Started

### Prerequisites
```bash
Node.js >= 18.0.0
npm or yarn
```

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start proxy server (for image generation)
npm run server

# Build for production
npm run build

# Type checking
npm run type-check
```

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Required
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
VITE_OPENAI_API_KEY=your_openai_key

# Optional (depending on providers)
VITE_GEMINI_API_KEY=your_gemini_key
VITE_AZURE_OPENAI_API_KEY=your_azure_key
VITE_AZURE_IMAGE_GENERATIONS_ENDPOINT=your_azure_endpoint
VITE_AZURE_IMAGE_EDITS_ENDPOINT=your_azure_edits_endpoint
VITE_AZURE_CHAT_COMPLETIONS_ENDPOINT=your_azure_chat_endpoint

# Configuration
VITE_TEXT_PROVIDER=openai # openai | azure-openai | gemini | none
VITE_IMAGE_PROVIDER=openai # openai | azure-openai | proxy-openai | gemini
VITE_LEAD_GATING_MODE=before # before | after
VITE_DEV_MODE=false # true | false
VITE_PROXY_IMAGE_ENDPOINT=http://localhost:8787/api/apply-spraystone
```

---

## Architecture

### Project Structure

```
src/
├── config/
│   └── index.ts          # Centralized configuration
├── components/
│   ├── step-1-address.tsx
│   ├── step-2-facade-type.tsx
│   └── ...               # All components in kebab-case
├── utils/
│   └── pdf-generator.ts  # PDF generation utilities
├── app.tsx               # Main application component
├── main.tsx              # Application entry point
└── vite-env.d.ts         # Vite environment types

api/
└── apply-spraystone.ts   # Express proxy server

docs/
└── README.md             # This file
```

### Key Design Patterns

1. **Configuration Management**: All environment variables and constants centralized in `src/config/index.ts`
2. **Component Naming**: Kebab-case for all component files (e.g., `step-1-address.tsx`)
3. **Type Safety**: Full TypeScript coverage with strict mode
4. **State Management**: React hooks (useState, useRef) for local state
5. **Error Handling**: Retry logic with exponential backoff for API calls

---

## Configuration

All configuration is managed through `src/config/index.ts`:

### API Keys
- Gemini, OpenAI, Azure OpenAI, Google Maps

### Provider Selection
- **TEXT_PROVIDER**: Chooses AI provider for text analysis
- **IMAGE_PROVIDER**: Chooses AI provider for image generation

### Business Constants
- Pricing ranges (€80-150/m²)
- Map configuration (Brussels center, zoom levels)
- Retry logic (max retries, delay settings)

---

## Component Structure

### Main Application Flow

```
app.tsx
  ├── step-indicator.tsx (progress bar)
  ├── step-1-address.tsx (Google Maps integration)
  ├── step-2-facade-type.tsx
  ├── step-3-condition.tsx
  ├── step-4-surface.tsx
  ├── step-5-finish.tsx
  ├── step-6-image.tsx (upload)
  ├── step-7-treatments.tsx
  ├── step-8-timeline.tsx
  ├── step-9-contact.tsx
  └── results-page.tsx (final output)
```

### Step Components

Each step component:
- Receives `formData` and `onChange` props
- Validates input before allowing progression
- Uses consistent styling with Tailwind CSS
- Fully typed with TypeScript interfaces

---

## AI Integration

### Text Analysis

Supports multiple providers:
1. **OpenAI GPT-4o** - Highest quality, recommended for production
2. **Azure OpenAI** - Enterprise-grade with SLA
3. **Gemini** - Cost-effective alternative
4. **Mock Data** - Development fallback

### Image Generation

1. **OpenAI gpt-image-1** - Advanced image edits
2. **Azure OpenAI** - Enterprise endpoint
3. **Proxy Server** - Backend proxy to hide keys
4. **Gemini** - Experimental image generation

### Retry Logic

- Exponential backoff for transient errors
- Selective retry (skip 4xx except 429)
- Configurable retry counts and delays
- Progress updates during retries

---

## Deployment

### Build for Production

```bash
npm run build
```

Output: `dist/` directory

### Environment Setup

1. Set all required environment variables
2. Configure CDN or hosting (Vercel, Netlify, etc.)
3. Deploy proxy server separately if using `proxy-openai` provider
4. Ensure Google Maps API key has correct domain restrictions

### Production Checklist

- [ ] All API keys configured
- [ ] DEV_MODE=false
- [ ] Correct TEXT_PROVIDER and IMAGE_PROVIDER set
- [ ] Google Maps API quota sufficient
- [ ] Error monitoring configured
- [ ] Analytics integrated (optional)

---

## Development Guidelines

### Code Style

- **TypeScript strict mode** enabled
- **ESLint + Prettier** recommended
- **Kebab-case** for all component files
- **PascalCase** for component names
- **camelCase** for variables and functions

### Component Guidelines

```typescript
// Good
export const StepOneAddress: React.FC<Props> = ({ formData, onChange }) => {
  // Implementation
};

// File: step-1-address.tsx
```

### Type Safety

```typescript
// Define props interfaces
interface StepProps {
  formData: FormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

// Use const assertions for constants
const PRICING = {
  MIN_PRICE_PER_SQM: 80,
  MAX_PRICE_PER_SQM: 150,
} as const;
```

### State Management

```typescript
// Use proper typing for state
const [loading, setLoading] = useState<boolean>(false);
const [result, setResult] = useState<string | null>(null);
```

---

## Troubleshooting

### Common Issues

1. **Google Maps not loading**
   - Check API key in `.env.local`
   - Verify Places API is enabled
   - Check console for specific errors

2. **AI generation failing**
   - Verify provider API keys
   - Check quota/billing status
   - Review retry logic in console

3. **TypeScript errors**
   - Run `npm run type-check`
   - Ensure all dependencies installed
   - Check `tsconfig.json` settings

4. **Tailwind styles not applying**
   - Verify Vite plugin configured
   - Check content paths in `tailwind.config.ts`
   - Hard refresh browser (Ctrl+Shift+R)

---

## Migration Notes

### v1.0 → v2.0 Changes

1. **TypeScript Migration**: Full codebase converted from JavaScript
2. **Component Naming**: All components renamed to kebab-case
3. **Config Extraction**: Configuration centralized in `src/config/`
4. **Tailwind v4**: Upgraded to Tailwind CSS v4 with Vite plugin
5. **Documentation**: Consolidated into `docs/` folder

### Breaking Changes

- Import paths changed (now using `@/` aliases)
- Component file names changed (kebab-case)
- Configuration moved to dedicated file
- Tailwind config format updated for v4

---

## Support & Contributing

For issues, questions, or contributions:
1. Check this documentation first
2. Review code comments in source files
3. Test changes with `npm run type-check`
4. Ensure all steps complete successfully before creating PR

---

## License

© 2024 Spraystone - Professional Facade Transformation
