# JSX to TypeScript Conversion Guide

## Remaining Files to Convert

Run this checklist as you convert each file:

### Components (14 files)
- [ ] `src/components/ImageModal.jsx` → `image-modal.tsx`
- [ ] `src/components/ResultsPage.jsx` → `results-page.tsx`
- [ ] `src/components/Step1Address.jsx` → `step-1-address.tsx`
- [ ] `src/components/Step3Condition.jsx` → `step-3-condition.tsx`
- [ ] `src/components/Step4Surface.jsx` → `step-4-surface.tsx`
- [ ] `src/components/Step5Finish.jsx` → `step-5-finish.tsx`
- [ ] `src/components/Step6Image.jsx` → `step-6-image.tsx`
- [ ] `src/components/Step7Treatments.jsx` → `step-7-treatments.tsx`
- [ ] `src/components/Step8Timeline.jsx` → `step-8-timeline.tsx`
- [ ] `src/components/Step9Contact.jsx` → `step-9-contact.tsx`
- [ ] `src/components/Step9Summary.jsx` → `step-9-summary.tsx`
- [ ] `src/components/StepIndicator.jsx` → `step-indicator.tsx`
- [ ] `src/components/StepWrapper.jsx` → `step-wrapper.tsx`
- [x] `src/components/Step2FacadeType.jsx` → `step-2-facade-type.tsx` ✅

### Main Files (2 files)
- [ ] `src/App.jsx` → `app.tsx`
- [ ] `src/main.jsx` → `main.tsx`

### Utils (1 file)
- [ ] `src/utils/pdfGenerator.js` → `pdf-generator.ts`

### API (1 file)
- [ ] `api/apply-spraystone.js` → `apply-spraystone.ts`

## Conversion Process

### For Each Component:

1. **Create New File**
   ```bash
   # Create the new TypeScript file with kebab-case name
   # Example: Step1Address.jsx → step-1-address.tsx
   ```

2. **Add Type Imports**
   ```typescript
   import React from 'react';
   import type { StepProps } from '@/types';
   // Or specific props interface
   ```

3. **Convert Component**
   ```typescript
   // Old (JSX)
   const ComponentName = ({ formData, onChange }) => {
     return <div>...</div>;
   };
   export default ComponentName;
   
   // New (TSX)
   export const ComponentName: React.FC<StepProps> = ({ formData, onChange }) => {
     return <div>...</div>;
   };
   ```

4. **Add Event Types**
   ```typescript
   // Input change
   onChange={(e: React.ChangeEvent<HTMLInputElement>) => {}}
   
   // Button click
   onClick={(e: React.MouseEvent<HTMLButtonElement>) => {}}
   
   // Form submit
   onSubmit={(e: React.FormEvent<HTMLFormElement>) => {}}
   ```

5. **Add State Types**
   ```typescript
   const [value, setValue] = useState<string>('');
   const [data, setData] = useState<FormData | null>(null);
   const [loading, setLoading] = useState<boolean>(false);
   ```

6. **Test**
   ```bash
   npm run type-check
   npm run dev
   # Test the component in browser
   ```

7. **Update Imports**
   Update any files that import this component:
   ```typescript
   // Old
   import ComponentName from './components/ComponentName';
   
   // New
   import { ComponentName } from '@/components/component-name';
   ```

8. **Delete Old File**
   Only after the TypeScript version is tested and working:
   ```bash
   rm src/components/OldComponentName.jsx
   ```

## Quick Reference

### Component Template
```typescript
import React from 'react';
import type { StepProps } from '@/types';

export const ComponentName: React.FC<StepProps> = ({ formData, onChange }) => {
  // State with types
  const [state, setState] = useState<string>('');
  
  // Event handlers with types
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
    // handler logic
  };
  
  return (
    <div>
      {/* JSX */}
    </div>
  );
};
```

### Common Types
```typescript
// From @/types
FormData
StepProps
FacadeType
Condition
Finish
Treatment
Timeline

// React events
React.ChangeEvent<HTMLInputElement>
React.ChangeEvent<HTMLTextAreaElement>
React.MouseEvent<HTMLButtonElement>
React.FormEvent<HTMLFormElement>
React.FocusEvent<HTMLInputElement>
```

### Configuration Imports
```typescript
// Old
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// New
import { GEMINI_API_KEY } from '@/config';
```

## Automated Conversion Script (PowerShell)

Save this as `convert-component.ps1`:

```powershell
param(
    [Parameter(Mandatory=$true)]
    [string]$ComponentName
)

$oldPath = "src\components\$ComponentName.jsx"
$newName = $ComponentName -replace '([A-Z])', '-$1' `
    | ForEach-Object { $_.ToLower().TrimStart('-') }
$newPath = "src\components\$newName.tsx"

if (Test-Path $oldPath) {
    Copy-Item $oldPath $newPath
    Write-Host "Created $newPath"
    Write-Host "Now edit the file to add TypeScript types"
    Write-Host "After testing, delete $oldPath"
} else {
    Write-Host "Error: $oldPath not found"
}
```

Usage:
```powershell
.\convert-component.ps1 Step1Address
# Creates step-1-address.tsx from Step1Address.jsx
```

## Final Steps

After all files are converted:

1. **Type Check**
   ```bash
   npm run type-check
   # Should show 0 errors
   ```

2. **Build Test**
   ```bash
   npm run build
   # Should complete successfully
   ```

3. **Full Application Test**
   - Test all 9 steps of the wizard
   - Test Google Maps autocomplete
   - Test image upload and generation
   - Test PDF generation
   - Verify no console errors

4. **Cleanup**
   - Delete all `.jsx` files
   - Delete `vite.config.js` (keep only `.ts`)
   - Delete `tailwind.config.js` (keep only `.ts`)
   - Update README with TypeScript info

5. **Commit**
   ```bash
   git add .
   git commit -m "Complete TypeScript migration with kebab-case components"
   git push
   ```

## Tips

1. **Start Simple** - Convert easy components first
2. **One at a Time** - Test each conversion before moving on
3. **Use Reference** - Look at `step-2-facade-type.tsx` for guidance
4. **Check Types** - Run `npm run type-check` frequently
5. **Test in Browser** - Type checking isn't enough
6. **Commit Often** - Git commit after each successful conversion

## Need Help?

- **Type Errors**: Check `src/types/index.ts` for available types
- **Event Types**: Search "React TypeScript events" in docs
- **Config Issues**: Verify `tsconfig.json` paths configuration
- **Import Errors**: Use `@/` aliases, check path aliases in vite.config.ts
