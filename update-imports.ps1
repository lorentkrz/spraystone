# PowerShell Script to Update Component Imports in App.jsx
# Run this from the project root: .\update-imports.ps1

Write-Host "Updating component imports in App.jsx..." -ForegroundColor Cyan

$appFile = "src/App.jsx"

if (-not (Test-Path $appFile)) {
    Write-Host "Error: $appFile not found!" -ForegroundColor Red
    exit 1
}

# Read the file
$content = Get-Content $appFile -Raw

# Backup original
Copy-Item $appFile "$appFile.backup" -Force
Write-Host "✓ Created backup: $appFile.backup" -ForegroundColor Green

# Replace imports - from default exports to named exports with new paths
$replacements = @{
    "import StepWrapper from './components/StepWrapper';" = "import { StepWrapper } from '@/components/step-wrapper';"
    'import StepWrapper from "./components/StepWrapper";' = 'import { StepWrapper } from "@/components/step-wrapper";'
    
    "import StepIndicator from './components/StepIndicator';" = "import { StepIndicator } from '@/components/step-indicator';"
    'import StepIndicator from "./components/StepIndicator";' = 'import { StepIndicator } from "@/components/step-indicator";'
    
    "import ImageModal from './components/ImageModal';" = "import { ImageModal } from '@/components/image-modal';"
    'import ImageModal from "./components/ImageModal";' = 'import { ImageModal } from "@/components/image-modal";'
    
    "import Step1Address from './components/Step1Address';" = "import { Step1Address } from '@/components/step-1-address';"
    'import Step1Address from "./components/Step1Address";' = 'import { Step1Address } from "@/components/step-1-address";'
    
    "import Step2FacadeType from './components/Step2FacadeType';" = "import { Step2FacadeType } from '@/components/step-2-facade-type';"
    'import Step2FacadeType from "./components/Step2FacadeType";' = 'import { Step2FacadeType } from "@/components/step-2-facade-type";'
    
    "import Step3Condition from './components/Step3Condition';" = "import { Step3Condition } from '@/components/step-3-condition';"
    'import Step3Condition from "./components/Step3Condition";' = 'import { Step3Condition } from "@/components/step-3-condition";'
    
    "import Step4Surface from './components/Step4Surface';" = "import { Step4Surface } from '@/components/step-4-surface';"
    'import Step4Surface from "./components/Step4Surface";' = 'import { Step4Surface } from "@/components/step-4-surface";'
    
    "import Step5Finish from './components/Step5Finish';" = "import { Step5Finish } from '@/components/step-5-finish';"
    'import Step5Finish from "./components/Step5Finish";' = 'import { Step5Finish } from "@/components/step-5-finish";'
    
    "import Step6Image from './components/Step6Image';" = "import { Step6Image } from '@/components/step-6-image';"
    'import Step6Image from "./components/Step6Image";' = 'import { Step6Image } from "@/components/step-6-image";'
    
    "import Step7Treatments from './components/Step7Treatments';" = "import { Step7Treatments } from '@/components/step-7-treatments';"
    'import Step7Treatments from "./components/Step7Treatments";' = 'import { Step7Treatments } from "@/components/step-7-treatments";'
    
    "import Step8Timeline from './components/Step8Timeline';" = "import { Step8Timeline } from '@/components/step-8-timeline';"
    'import Step8Timeline from "./components/Step8Timeline";' = 'import { Step8Timeline } from "@/components/step-8-timeline";'
    
    "import Step9Contact from './components/Step9Contact';" = "import { Step9Contact } from '@/components/step-9-contact';"
    'import Step9Contact from "./components/Step9Contact";' = 'import { Step9Contact } from "@/components/step-9-contact";'
    
    "import Step9Summary from './components/Step9Summary';" = "import { Step9Summary } from '@/components/step-9-summary';"
    'import Step9Summary from "./components/Step9Summary";' = 'import { Step9Summary } from "@/components/step-9-summary";'
    
    "import ResultsPage from './components/ResultsPage';" = "import { ResultsPage } from '@/components/results-page';"
    'import ResultsPage from "./components/ResultsPage";' = 'import { ResultsPage } from "@/components/results-page";'
}

foreach ($old in $replacements.Keys) {
    $new = $replacements[$old]
    if ($content -match [regex]::Escape($old)) {
        $content = $content -replace [regex]::Escape($old), $new
        Write-Host "✓ Replaced: $old" -ForegroundColor Green
    }
}

# Write updated content
Set-Content -Path $appFile -Value $content -NoNewline

Write-Host "`n✅ Import updates complete!" -ForegroundColor Green
Write-Host "✓ Backup saved as: $appFile.backup" -ForegroundColor Yellow
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Review changes in $appFile"
Write-Host "2. Run: npm run type-check"
Write-Host "3. Run: npm run dev"
Write-Host "4. Test all wizard steps"
Write-Host "5. If working, delete old .jsx files: Remove-Item src/components/*.jsx -Force"
