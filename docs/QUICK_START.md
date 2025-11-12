# Quick Start Guide - TypeScript Migration

## 🚀 Immediate Next Steps

### 1. Install Dependencies
```bash
npm install

# If Tailwind v4 beta has issues, use this temporary fix:
npm install -D @tailwindcss/vite@next tailwindcss@next

# Or stick with Tailwind v3 temporarily:
npm install -D tailwindcss@^3.4.0 @vitejs/plugin-react
# Then update vite.config.ts to not use @tailwindcss/vite
```

### 2. Choose Your Migration Path

**Option A: Gradual Migration (Recommended)**
- Keep `.jsx` files alongside new `.tsx` files
- Convert components one at a time
- Test each conversion before proceeding

**Option B: Full Migration**
- Rename all components at once
- Convert all to TypeScript simultaneously
- Requires more debugging upfront

### 3. Component Conversion Order (Gradual)

**Easy → Hard:**

1. ✅ **step-indicator.tsx** (done as example in migration guide)
2. **step-2-facade-type.tsx** (✅ already converted - see file)
3. **step-3-condition.tsx** (similar to step-2)
4. **step-4-surface.tsx** (simple input)
5. **step-6-image.tsx** (file upload)
6. **step-7-treatments.tsx** (checkbox logic)
7. **step-8-timeline.tsx** (radio selection)
8. **step-9-contact.tsx** (form validation)
9. **step-5-finish.tsx** (combined logic)
10. **image-modal.tsx** (modal state)
11. **step-1-address.tsx** (Google Maps - complex)
12. **results-page.tsx** (data parsing - complex)
13. **app.tsx** (main app - most complex)
14. **main.tsx** (entry point - simple)

### 4. Conversion Template

For each component, follow this pattern:

```bash
# 1. Copy the original
cp src/components/StepX.jsx src/components/step-x.tsx

# 2. Edit the new file:
#    - Add types from @/types
#    - Add React.FC<Props> typing
#    - Update onChange to use proper event types
#    - Export as named export

# 3. Test
npm run type-check
npm run dev

# 4. If working, delete old .jsx file
rm src/components/StepX.jsx
```

## 📋 Pre-Migration Checklist

- [ ] Backup project (git commit or zip)
- [ ] Dependencies installed successfully
- [ ] `npm run type-check` works (may show errors in old .jsx files)
- [ ] `npm run dev` starts without crashing
- [ ] Read MIGRATION_GUIDE.md fully

## 🔧 Configuration Files Created

All these files are now in your project:

### Core TypeScript
- ✅ `tsconfig.json` - TypeScript configuration
- ✅ `tsconfig.node.json` - Node configuration
- ✅ `src/vite-env.d.ts` - Vite environment types

### Application Structure
- ✅ `src/config/index.ts` - Centralized configuration
- ✅ `src/types/index.ts` - All type definitions

### Build Tools
- ✅ `vite.config.ts` - Vite + Tailwind v4 config
- ✅ `tailwind.config.ts` - Tailwind v4 config
- ✅ `package.json` - Updated with TypeScript deps

### Documentation
- ✅ `docs/README.md` - Complete project documentation
- ✅ `docs/MIGRATION_GUIDE.md` - Step-by-step conversion guide
- ✅ `docs/QUICK_START.md` - This file

### Example Conversion
- ✅ `src/components/step-2-facade-type.tsx` - Example of converted component

## 🎯 Testing Each Conversion

After converting each component:

```bash
# 1. Type check
npm run type-check

# 2. Build test
npm run build

# 3. Dev server
npm run dev

# 4. Manual testing in browser
#    - Navigate to the converted step
#    - Test all interactions
#    - Check console for errors
```

## 🐛 Troubleshooting

### Issue: `Cannot find module '@tailwindcss/vite'`

**Solution 1:** Use Tailwind v4 alpha
```bash
npm install -D @tailwindcss/vite@4.0.0-alpha.25 tailwindcss@4.0.0-alpha.25
```

**Solution 2:** Revert to Tailwind v3 (stable)
```bash
npm install -D tailwindcss@^3.4.0 autoprefixer@^10.4.16 postcss@^8.4.32
```

Then update `vite.config.ts`:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.js',
  },
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

And create `postcss.config.js`:
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### Issue: Import path errors

**Fix:** Ensure path aliases work:
```typescript
// ✅ Good
import { FormData } from '@/types';
import { GEMINI_API_KEY } from '@/config';

// ❌ Bad
import { FormData } from '../types';
import { GEMINI_API_KEY } from '../../config';
```

### Issue: Event handler type errors

**Fix:** Use proper React event types:
```typescript
onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
  // handler
}}
```

## 📦 What's Already Configured

### Path Aliases (in tsconfig.json)
```typescript
"@/*": ["src/*"]
"@/components/*": ["src/components/*"]
"@/utils/*": ["src/utils/*"]
"@/config/*": ["src/config/*"]
```

### Strict Type Checking
- ✅ Strict mode enabled
- ✅ No unused locals
- ✅ No unused parameters
- ✅ No fallthrough cases

### Tailwind Custom Theme
- ✅ Spraystone brand colors
- ✅ Custom animations
- ✅ Modern fade-in effects

## 🎨 New Features Available

### 1. Centralized Config
```typescript
// Import anywhere:
import { 
  GEMINI_API_KEY, 
  IMAGE_PROVIDER,
  PRICING,
  MAP_CONFIG 
} from '@/config';
```

### 2. Type Safety
```typescript
// Types for everything:
import type { FormData, StepProps, FacadeType } from '@/types';
```

### 3. Better IDE Support
- Auto-completion for props
- Type checking on save
- Refactoring support
- Jump to definition

## 🔄 Rollback Strategy

If you need to revert:

```bash
# 1. Checkout previous commit
git checkout HEAD~1

# 2. Or manually remove TypeScript files
rm tsconfig.json tsconfig.node.json
rm src/vite-env.d.ts
rm -rf src/config src/types
rm vite.config.ts tailwind.config.ts

# 3. Restore old package.json
git checkout HEAD~1 -- package.json

# 4. Reinstall
npm install
```

## ✅ Success Criteria

Migration is complete when:

- [ ] All components renamed to kebab-case.tsx
- [ ] All imports using named exports
- [ ] `npm run type-check` shows 0 errors
- [ ] `npm run build` completes successfully
- [ ] All wizard steps work in browser
- [ ] Google Maps autocomplete works
- [ ] Image generation works
- [ ] PDF generation works
- [ ] No console errors in browser

## 📚 Additional Resources

- **Main Docs**: See `docs/README.md`
- **Migration Guide**: See `docs/MIGRATION_GUIDE.md`
- **Type Definitions**: See `src/types/index.ts`
- **Config Reference**: See `src/config/index.ts`

## 🎯 Recommended Migration Timeline

**Day 1:**
- Install dependencies
- Convert 3-4 simple components
- Test thoroughly

**Day 2:**
- Convert remaining step components
- Test wizard flow

**Day 3:**
- Convert complex components (Address, Results)
- Full integration testing

**Day 4:**
- Convert main App component
- Final testing and cleanup

**Day 5:**
- Documentation updates
- Delete old .jsx files
- Production deployment

## 🚨 Important Notes

1. **Do NOT delete .jsx files** until .tsx version is tested
2. **Commit after each successful conversion** 
3. **Test in browser**, not just type-check
4. **Keep old docs** until migration complete
5. **Update imports gradually** as you convert

## Need Help?

1. Check `docs/MIGRATION_GUIDE.md` for detailed patterns
2. Look at `step-2-facade-type.tsx` for reference
3. Run `npm run type-check` to see specific errors
4. Check browser console for runtime errors

---

**Ready to start?** Begin with the simple components and work your way up! 🚀
