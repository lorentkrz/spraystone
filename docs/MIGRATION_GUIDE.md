# Migration Guide: JavaScript to TypeScript + Kebab-case

## Overview

This guide covers the migration from JavaScript (v1.x) to TypeScript (v2.0) with kebab-case component naming.

## Step-by-Step Migration Process

### 1. Install Dependencies

```bash
npm install
```

This will install:
- TypeScript 5.3
- Tailwind CSS v4
- Type definitions (@types/*)
- tsx for running TypeScript files

### 2. Component Renaming Pattern

**Old (PascalCase.jsx)** → **New (kebab-case.tsx)**

```
Step1Address.jsx → step-1-address.tsx
Step2FacadeType.jsx → step-2-facade-type.tsx
ImageModal.jsx → image-modal.tsx
ResultsPage.jsx → results-page.tsx
```

### 3. Component Conversion Template

#### Before (JavaScript):
```javascript
import React from 'react';

const Step2FacadeType = ({ formData, onChange }) => {
  return (
    <div>
      {/* component content */}
    </div>
  );
};

export default Step2FacadeType;
```

#### After (TypeScript):
```typescript
import React from 'react';
import type { StepProps } from '@/types';

export const Step2FacadeType: React.FC<StepProps> = ({ formData, onChange }) => {
  return (
    <div>
      {/* component content */}
    </div>
  );
};
```

### 4. Import Updates

#### Old imports:
```javascript
import Step1Address from './components/Step1Address';
import { ArrowRight } from 'lucide-react';
```

#### New imports:
```typescript
import { Step1Address } from '@/components/step-1-address';
import { ArrowRight } from 'lucide-react';
import type { FormData } from '@/types';
import { GEMINI_API_KEY, IMAGE_PROVIDER } from '@/config';
```

### 5. Configuration Migration

#### Old (in App.jsx):
```javascript
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const IMAGE_PROVIDER = import.meta.env.VITE_IMAGE_PROVIDER || 'proxy-openai';
```

#### New (import from config):
```typescript
import { GEMINI_API_KEY, IMAGE_PROVIDER } from '@/config';
```

### 6. Type Annotations

#### State:
```typescript
// Before
const [loading, setLoading] = useState(false);
const [result, setResult] = useState(null);

// After
const [loading, setLoading] = useState<boolean>(false);
const [result, setResult] = useState<string | null>(null);
```

#### Props:
```typescript
// Before
const MyComponent = ({ data, onChange }) => { ... };

// After
interface MyComponentProps {
  data: FormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({ data, onChange }) => { ... };
```

#### Functions:
```typescript
// Before
const handleSubmit = async () => { ... };

// After
const handleSubmit = async (): Promise<void> => { ... };
```

### 7. Event Handlers

```typescript
// Input change
const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
  const { name, value } = e.target;
  setFormData(prev => ({ ...prev, [name]: value }));
};

// Button click
const handleClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
  e.preventDefault();
  // logic
};

// File upload
const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
  const file = e.target.files?.[0];
  if (file) {
    // process file
  }
};
```

### 8. API Calls with Types

```typescript
interface APIResponse {
  data?: Array<{
    b64_json?: string;
    url?: string;
  }>;
}

const callAPI = async (): Promise<APIResponse> => {
  const response = await fetch('/api/endpoint');
  return response.json();
};
```

## Component-by-Component Checklist

- [ ] **step-indicator.tsx** - Simple, no complex types
- [ ] **step-1-address.tsx** - Google Maps types needed
- [ ] **step-2-facade-type.tsx** - Uses FacadeType enum
- [ ] **step-3-condition.tsx** - Uses Condition enum
- [ ] **step-4-surface.tsx** - Simple string input
- [ ] **step-5-finish.tsx** - Uses Finish enum + treatments
- [ ] **step-6-image.tsx** - File upload handling
- [ ] **step-7-treatments.tsx** - Treatment array handling
- [ ] **step-8-timeline.tsx** - Uses Timeline enum
- [ ] **step-9-contact.tsx** - Form validation
- [ ] **results-page.tsx** - Complex with parsed data
- [ ] **image-modal.tsx** - Simple modal
- [ ] **app.tsx** - Main application (most complex)
- [ ] **main.tsx** - Entry point (minimal changes)

## Common Patterns

### 1. Array Mapping with Types

```typescript
interface Item {
  id: string;
  label: string;
}

const items: Item[] = [...];

items.map((item: Item) => (
  <div key={item.id}>{item.label}</div>
));
```

### 2. Optional Chaining

```typescript
// Safe navigation
const value = data?.property?.nestedProperty ?? 'default';

// Array access
const firstItem = array?.[0];
```

### 3. Type Guards

```typescript
const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};
```

### 4. Async/Await with Error Handling

```typescript
const fetchData = async (): Promise<string> => {
  try {
    const response = await fetch('/api');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};
```

## File Organization

```
src/
├── config/
│   └── index.ts              # All environment config
├── types/
│   └── index.ts              # All type definitions
├── components/
│   ├── step-1-address.tsx    # Kebab-case naming
│   ├── step-2-facade-type.tsx
│   └── ...
├── utils/
│   └── pdf-generator.ts      # Utility functions
├── app.tsx                   # Main component
├── main.tsx                  # Entry point
└── vite-env.d.ts            # Vite types
```

## Testing Your Migration

### 1. Type Check
```bash
npm run type-check
```

Should show 0 errors.

### 2. Build
```bash
npm run build
```

Should complete without errors.

### 3. Dev Server
```bash
npm run dev
```

Should start without issues.

### 4. Runtime Testing
- Test each step of the wizard
- Verify Google Maps autocomplete
- Test image upload
- Test PDF generation
- Verify AI integrations

## Common Migration Issues

### Issue 1: Import Paths
**Error**: `Cannot find module '@/components/step-1-address'`

**Fix**: Ensure path aliases are configured in `tsconfig.json` and `vite.config.ts`

### Issue 2: Missing Types
**Error**: `Property 'X' does not exist on type 'Y'`

**Fix**: Add proper type definitions in `src/types/index.ts`

### Issue 3: Event Handler Types
**Error**: `Type 'Event' is not assignable to parameter`

**Fix**: Use specific React event types:
```typescript
React.ChangeEvent<HTMLInputElement>
React.MouseEvent<HTMLButtonElement>
React.FormEvent<HTMLFormElement>
```

### Issue 4: Null/Undefined
**Error**: `Object is possibly 'null' or 'undefined'`

**Fix**: Use optional chaining and null coalescing:
```typescript
const value = obj?.property ?? 'default';
```

## Rollback Plan

If migration issues occur:

1. Keep old `.jsx` files until conversion is verified
2. Git commit after each successful component conversion
3. Use feature branches for gradual migration
4. Test thoroughly before deleting old files

## Post-Migration Cleanup

After successful migration:

1. Delete all `.jsx` files
2. Delete `vite.config.js` (replaced with `.ts`)
3. Delete `tailwind.config.js` (replaced with `.ts`)
4. Move old documentation to `docs/archive/`
5. Update README with new instructions

## Additional Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs)
