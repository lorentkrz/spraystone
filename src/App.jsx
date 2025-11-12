import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import StepIndicator from './components/StepIndicator';
import Step1Address from './components/Step1Address';
import Step2FacadeType from './components/Step2FacadeType';
import Step3Condition from './components/Step3Condition';
import Step4Surface from './components/Step4Surface';
import Step5Finish from './components/Step5Finish';
import Step6Image from './components/Step6Image';
import Step7Treatments from './components/Step7Treatments';
import Step8Timeline from './components/Step8Timeline';
import Step9Contact from './components/Step9Contact';
import ResultsPage from './components/ResultsPage';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
// Lead capture mode: 'before' = require contact before results (Option A), 'after' = ask contact after results (Option B)
const LEAD_GATING_MODE = import.meta.env.VITE_LEAD_GATING_MODE || 'before';
// DEV_MODE: Set to true to use mock data when API/quota endpoints are not ready
const DEV_MODE = (import.meta.env.VITE_DEV_MODE === 'true');
const IMAGE_PROVIDER = import.meta.env.VITE_IMAGE_PROVIDER || 'proxy-openai';
// Only used if IMAGE_PROVIDER === 'openai' (not recommended for prod)
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
// Azure image endpoints (used only if IMAGE_PROVIDER === 'azure-openai')
const AZURE_IMAGE_ENDPOINT = import.meta.env.VITE_AZURE_IMAGE_GENERATIONS_ENDPOINT || '';
const AZURE_IMAGE_EDITS_ENDPOINT = import.meta.env.VITE_AZURE_IMAGE_EDITS_ENDPOINT || '';
const AZURE_OPENAI_API_KEY = import.meta.env.VITE_AZURE_OPENAI_API_KEY || '';
// Text analysis provider; 'none' uses mock text to avoid exposing keys in frontend
const TEXT_PROVIDER = import.meta.env.VITE_TEXT_PROVIDER || 'none';
const OPENAI_CHAT_MODEL = import.meta.env.VITE_OPENAI_CHAT_MODEL || 'gpt-4o';
const AZURE_CHAT_COMPLETIONS_ENDPOINT = import.meta.env.VITE_AZURE_CHAT_COMPLETIONS_ENDPOINT || '';
// Proxy endpoint for image generation
const PROXY_IMAGE_ENDPOINT = import.meta.env.VITE_PROXY_IMAGE_ENDPOINT || 'http://localhost:8787/api/apply-spraystone';

function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    address: '',
    facadeType: '',
    condition: '',
    surfaceArea: '',
    finish: '',
    treatments: [],
    timeline: '',
    name: '',
    email: '',
    phone: ''
  });

  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [imageGenerating, setImageGenerating] = useState(false);

  const totalSteps = 9;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const fileToBase64NoPrefix = async (file) => {
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.replace(/^data:.+;base64,/, ''));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleTreatmentChange = (treatment) => {
    if (treatment === '__clear_all__') {
      setFormData(prev => ({ ...prev, treatments: [] }));
      return;
    }
    setFormData(prev => ({
      ...prev,
      treatments: prev.treatments.includes(treatment)
        ? prev.treatments.filter(t => t !== treatment)
        : [...prev.treatments, treatment]
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageRemove = () => {
    setUploadedImage(null);
    setImagePreview(null);
  };

  const fileToGenerativePart = async (file) => {
    const base64EncodedData = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: {
        data: base64EncodedData,
        mimeType: file.type
      }
    };
  };

  // Retry helper with exponential backoff (handles transient 429/5xx like 503)
  const withRetry = async (fn, { retries = 3, baseDelayMs = 1200, onRetry } = {}) => {
    let attempt = 0;
    let lastErr;
    while (attempt < retries) {
      try {
        return await fn();
      } catch (err) {
        lastErr = err;
        const msg = typeof err?.message === 'string' ? err.message : '';
        // Do not retry on non-transient 4xx (except 429 Too Many Requests)
        if (/\b(400|401|403|404|422)\b/.test(msg) && !/\b429\b/.test(msg)) {
          break;
        }
        attempt++;
        if (attempt >= retries) break;
        const delay = Math.round(baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 400);
        if (onRetry) onRetry(attempt, retries, err);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
    throw lastErr;
  };

  const generateImagePrompt = () => {
    const finishMap = {
      'natural-stone': 'authentic natural stone coating with visible aggregate, beige/cream/tan tones, realistic stone texture',
      'smooth': 'smooth uniform plaster-like spray finish, modern clean look',
      'textured': 'decorative textured spray finish with subtle depth and pattern',
      'suggest': 'natural stone appearance with visible aggregate particles and warm neutral tones'
    };
    const finish = finishMap[formData.finish] || 'authentic natural stone coating with visible aggregate, beige/cream/tan tones';
    const t = formData.treatments && formData.treatments.length ? formData.treatments.join(', ') : 'none';
    const area = (() => {
      const v = parseSurfaceAreaAverage(formData.surfaceArea);
      return isNaN(v) ? 'unknown' : `${v} m²`;
    })();
    const facade = formData.facadeType || 'residential facade';
    const condition = formData.condition || 'good condition';
    return [
      'Photorealistic architectural visualization of the SAME building facade after professional Spraystone application.',
      `Project context: facade type ${facade}, current condition ${condition}, approx surface ${area}.`,
      `Target finish: ${finish}.`,
      `Treatments requested: ${t}.`,
      'Key requirements: preserve architecture exactly (windows, doors, frames, columns, roofline, balconies, railings, steps). Do not change geometry, landscaping, vehicles, or sky framing.',
      'Only alter wall surface material to look like a premium Spraystone natural stone coating with realistic stone aggregate, natural color variation, and depth.',
      'Lighting/style: professional architectural photography, daylight, balanced contrast, crisp detail, high resolution, realistic materials.',
      'Composition: same perspective and proportions as the source facade image; show full elevation if possible.',
      'Quality: ultra-detailed, clean edges around trims, no artifacts around windows/doors, consistent texture scale across surfaces.'
    ].join(' ');
  };

  const generatePrompt = () => {
    return `You are a facade renovation expert for Spraystone. Analyze the provided facade image and give a SHORT, practical estimate.

**CLIENT INFO:**
- Address: ${formData.address || 'Not provided'}
- Facade Type: ${formData.facadeType || 'Unknown'}
- Condition: ${formData.condition || 'Not specified'}
- Surface Area: ${formData.surfaceArea || 'To estimate'} m²
- Desired Finish: ${formData.finish || 'Natural stone (Spraystone)'}
- Treatments: ${formData.treatments.join(', ') || 'None'}
- Timeline: ${formData.timeline || 'TBD'}

Provide a CONCISE analysis (max 400 words) with:

1. **FACADE ASSESSMENT** (2-3 sentences):
   - Actual facade type & condition
   - Current issues visible

2. **BEFORE/AFTER VISUALIZATION** (3-4 sentences):
   - How it looks NOW (color, texture, state)
   - How it will look AFTER with Spraystone natural stone finish
   - Specific transformation details (what changes visually)

3. **RECOMMENDATIONS** (bullet points):
   - Prep work needed
   - Best Spraystone finish for this facade
   - Value of requested treatments

4. **PRICING ESTIMATE**:
   - Estimate total surface area from photo if not provided
   - Price range: €80-150/m² (including prep, coating, treatments)
   - TOTAL PROJECT COST in € (be specific, e.g., "€6,500 - €9,800")

5. **TIMELINE**: Realistic duration (e.g., "3-4 weeks")

Keep it SHORT, practical, and focused on the visual transformation and pricing. No long letters or formalities.`;
  };

  const generateImageFromUpload = async (updateProgress) => {
    if (!uploadedImage || !imagePreview) {
      console.log('No image to transform');
      return;
    }
    
    setImageGenerating(true);
    
    try {
      const imagePrompt = generateImagePrompt();
      if (updateProgress) updateProgress('Generating transformed facade with AI...');
      if (IMAGE_PROVIDER === 'azure-openai') {
        if (!AZURE_IMAGE_ENDPOINT || !AZURE_OPENAI_API_KEY) {
          setError('Azure OpenAI image generation is not configured');
          setGeneratedImage(null);
          return;
        }
        // Try edits first to transform the uploaded facade image
        let b64 = null;
        try {
          const form = new FormData();
          form.append('prompt', imagePrompt);
          form.append('size', '1024x1024');
          form.append('n', '1');
          form.append('response_format', 'b64_json');
          form.append('image', uploadedImage);
          const editsJson = await withRetry(
            async () => {
              // Try Bearer first, then fallback to api-key
              let r = await fetch(AZURE_IMAGE_EDITS_ENDPOINT, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${AZURE_OPENAI_API_KEY}` },
                body: form
              });
              if (r.status === 401 || r.status === 403) {
                r = await fetch(AZURE_IMAGE_EDITS_ENDPOINT, {
                  method: 'POST',
                  headers: { 'api-key': AZURE_OPENAI_API_KEY },
                  body: form
                });
              }
              if (!r.ok) {
                throw new Error(`Azure Edits ${r.status}: ${await r.text()}`);
              }
              return r.json();
            },
            {
              retries: 3,
              baseDelayMs: 2000,
              onRetry: (attempt, total) => {
                if (updateProgress) updateProgress(`Generating image... retry ${attempt}/${total}`);
              }
            }
          );
          b64 = editsJson?.data?.[0]?.b64_json || null;
        } catch (editsErr) {
          console.warn('Azure edits failed, falling back to generations:', editsErr?.message || editsErr);
        }

        if (!b64) {
          const payload = {
            model: 'dall-e-3',
            prompt: imagePrompt,
            size: '1024x1024',
            style: 'vivid',
            quality: 'standard',
            n: 1,
            response_format: 'b64_json'
          };
          const genJson = await withRetry(
            async () => {
              // Try Bearer first, then fallback to api-key
              let r = await fetch(AZURE_IMAGE_ENDPOINT, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${AZURE_OPENAI_API_KEY}`
                },
                body: JSON.stringify(payload)
              });
              if (r.status === 401 || r.status === 403) {
                r = await fetch(AZURE_IMAGE_ENDPOINT, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'api-key': AZURE_OPENAI_API_KEY
                  },
                  body: JSON.stringify(payload)
                });
              }
              if (!r.ok) {
                throw new Error(`Azure Generations ${r.status}: ${await r.text()}`);
              }
              return r.json();
            },
            {
              retries: 3,
              baseDelayMs: 2000,
              onRetry: (attempt, total) => {
                if (updateProgress) updateProgress(`Generating image... retry ${attempt}/${total}`);
              }
            }
          );
          b64 = genJson?.data?.[0]?.b64_json || null;
        }

        if (b64) {
          setGeneratedImage(`data:image/png;base64,${b64}`);
        } else {
          setGeneratedImage(null);
        }
      } else if (IMAGE_PROVIDER === 'openai') {
        if (!OPENAI_API_KEY) {
          setError('OpenAI API key missing');
          setGeneratedImage(null);
          return;
        }

        const form = new FormData();
        form.append('model', 'gpt-image-1');
        form.append('image', uploadedImage);
        form.append('prompt', imagePrompt);
        form.append('size', '1024x1024');
        form.append('n', '1');

        try {
          const data = await withRetry(
            async () => {
              const r = await fetch('https://api.openai.com/v1/images/edits', {
                method: 'POST',
                headers: { 
                  'Authorization': `Bearer ${OPENAI_API_KEY}`
                },
                body: form,
              });
              if (!r.ok) {
                throw new Error(`OpenAI ${r.status}: ${await r.text()}`);
              }
              return r.json();
            },
            {
              retries: 3,
              baseDelayMs: 2000,
              onRetry: (attempt, total) => {
                if (updateProgress) updateProgress(`Generating image... retry ${attempt}/${total}`);
              }
            }
          );
          const img = data?.data?.[0];
          const b64 = img?.b64_json;
          const url = img?.url;
          if (b64) {
            setGeneratedImage(`data:image/png;base64,${b64}`);
          } else if (url) {
            setGeneratedImage(url);
          } else {
            setGeneratedImage(null);
          }
        } catch (err) {
          const msg = typeof err?.message === 'string' ? err.message : '';
          if (msg.includes('must be verified') || /OpenAI\s403/.test(msg)) {
            // Fallback to Gemini image generation if available
            if (API_KEY) {
              try {
                const genAI = new GoogleGenerativeAI(API_KEY);
                const imageModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image' });
                const imagePart = await fileToGenerativePart(uploadedImage);
                const prompt = [
                  { text: imagePrompt },
                  imagePart
                ];
                const result = await withRetry(
                  () => imageModel.generateContent(prompt),
                  {
                    retries: 2,
                    baseDelayMs: 1500,
                    onRetry: (attempt, total) => {
                      if (updateProgress) updateProgress(`Generating image with fallback... retry ${attempt}/${total}`);
                    }
                  }
                );
                const response = await result.response;
                let imageGenerated = false;
                for (const part of response.candidates[0].content.parts) {
                  if (part.inlineData) {
                    const imageData = part.inlineData.data;
                    const mimeType = part.inlineData.mimeType || 'image/png';
                    setGeneratedImage(`data:${mimeType};base64,${imageData}`);
                    imageGenerated = true;
                    break;
                  }
                }
                if (!imageGenerated) {
                  setGeneratedImage(null);
                }
                return; // exit openai branch after fallback
              } catch (gErr) {
                throw err; // let outer catch handle original OpenAI error messaging
              }
            } else {
              throw err;
            }
          } else {
            throw err;
          }
        }
      } else if (IMAGE_PROVIDER === 'proxy-openai') {
        const base64 = await fileToBase64NoPrefix(uploadedImage);
        const resp = await withRetry(
          async () => {
            const r = await fetch(PROXY_IMAGE_ENDPOINT, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ imageBase64: base64, prompt: imagePrompt, size: '1024x1024' })
            });
            if (!r.ok) throw new Error(`Proxy ${r.status}: ${await r.text()}`);
            return r.json();
          },
          { retries: 3, baseDelayMs: 1200,
            onRetry: (a,t)=>{ if (updateProgress) updateProgress(`Generating image... retry ${a}/${t}`);} }
        );
        const b64 = resp?.output;
        if (b64) {
          setGeneratedImage(`data:image/png;base64,${b64}`);
        } else {
          setGeneratedImage(null);
        }
      } else {
        const genAI = new GoogleGenerativeAI(API_KEY);
        const imageModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image' });
        const imagePart = await fileToGenerativePart(uploadedImage);
        const prompt = [
          { text: imagePrompt },
          imagePart
        ];
        const result = await withRetry(
          () => imageModel.generateContent(prompt),
          {
            retries: 3,
            baseDelayMs: 2000,
            onRetry: (attempt, total) => {
              if (updateProgress) updateProgress(`Generating image... retry ${attempt}/${total}`);
            }
          }
        );
        const response = await result.response;
        let imageGenerated = false;
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const imageData = part.inlineData.data;
            const mimeType = part.inlineData.mimeType || 'image/png';
            setGeneratedImage(`data:${mimeType};base64,${imageData}`);
            imageGenerated = true;
            break;
          }
        }
        if (!imageGenerated) {
          setGeneratedImage(null);
        }
      }
      
    } catch (error) {
      console.error('Image generation error:', error);
      console.error('Error details:', error.message);
      setGeneratedImage(null);
      const msg = typeof error?.message === 'string' ? error.message : '';
      if (msg.includes('must be verified') || msg.includes('OpenAI 403')) {
        setError('OpenAI requires organization verification to use gpt-image-1. Please verify your org at https://platform.openai.com/settings/organization/general (propagation may take ~15 minutes).');
      } else {
        setError('Image generation failed. Please try again later.');
      }
    } finally {
      setImageGenerating(false);
    }
  };

  const generateMockAnalysis = () => {
    const surface = parseSurfaceAreaAverage(formData.surfaceArea) || 100;
    const lowPrice = Math.round(surface * 80);
    const highPrice = Math.round(surface * 150);
    
    return `**FACADE ASSESSMENT**:
The facade appears to be a ${formData.facadeType || 'painted'} facade in ${formData.condition || 'good'} condition. The current surface shows typical aging with some minor weathering. The structure is sound and suitable for Spraystone application.

**BEFORE/AFTER VISUALIZATION**:
Currently, your facade presents a standard painted finish with minimal texture. After Spraystone treatment with natural stone finish, it will display authentic stone texture with visible aggregate particles in warm beige and cream tones. The transformation will add depth, character, and premium aesthetic appeal while maintaining architectural integrity.

**RECOMMENDATIONS**:
- Surface preparation: thorough cleaning and minor crack repair recommended
- Best finish: Natural Stone (Spraystone) with ${formData.finish || 'natural-stone'} texture
- ${formData.treatments.includes('water-repellent') ? 'Water-repellent protection will extend facade lifespan significantly' : 'Consider water-repellent treatment for long-term protection'}
- ${formData.treatments.includes('anti-stain') ? 'Anti-stain treatment will keep facade cleaner for longer' : 'Anti-pollution treatment recommended for urban environments'}

**PRICING ESTIMATE**:
- Estimated surface area: ${surface} m²
- Price range: €80-150/m² (including prep, coating, treatments)
- **TOTAL PROJECT COST: €${lowPrice.toLocaleString()} - €${highPrice.toLocaleString()}**

**TIMELINE**: 
Realistic project duration: 3-4 weeks from approval to completion, including preparation, application, and curing time.`;
  };

  const parseSurfaceAreaAverage = (sa) => {
    if (!sa) return 100;
    if (typeof sa === 'number') return sa;
    const str = String(sa).trim();
    if (/^<\s*50/.test(str)) return 40;
    if (/^>\s*150/.test(str)) return 180;
    const range = str.match(/(\d+)\s*-\s*(\d+)/);
    if (range) return (parseInt(range[1]) + parseInt(range[2])) / 2;
    const num = parseFloat(str);
    return isNaN(num) ? 100 : num;
  };

  const handleSubmit = async () => {
    if (!uploadedImage) {
      setError('Please upload a facade image');
      return;
    }

    if (LEAD_GATING_MODE === 'before' && !formData.email) {
      setError('Please provide your email address');
      return;
    }

    setLoading(true);
    setError(null);
    setLoadingProgress('Preparing image...');

    try {
      if (DEV_MODE) {
        // Development mode: use mock data
        setLoadingProgress('Generating mock analysis...');
        await new Promise(r => setTimeout(r, 1500));
        const mockText = generateMockAnalysis();
        setResult(mockText);
        setLoadingProgress('Complete!');
        return;
      }

      // Production mode: text analysis via provider
      const textPrompt = generatePrompt();
      let text = '';
      if (TEXT_PROVIDER === 'azure-openai') {
        if (!AZURE_CHAT_COMPLETIONS_ENDPOINT || !AZURE_OPENAI_API_KEY) {
          setLoadingProgress('Chat not configured, using quick estimate...');
          text = generateMockAnalysis();
        } else {
        setLoadingProgress('Analyzing facade with ChatGPT (Azure)...');
        const chatJson = await withRetry(
          async () => {
            const r = await fetch(AZURE_CHAT_COMPLETIONS_ENDPOINT, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AZURE_OPENAI_API_KEY}`
              },
              body: JSON.stringify({
                messages: [
                  { role: 'system', content: 'You are a facade renovation expert for Spraystone. Be concise and precise.' },
                  { role: 'user', content: textPrompt }
                ],
                temperature: 0.6,
                max_tokens: 900
              })
            });
            if (!r.ok) {
              throw new Error(`Azure Chat ${r.status}: ${await r.text()}`);
            }
            return r.json();
          },
          {
            retries: 4,
            baseDelayMs: 1500,
            onRetry: (attempt, total) => setLoadingProgress(`Analyzing facade... retry ${attempt + 1}/${total}`)
          }
        );
        text = chatJson?.choices?.[0]?.message?.content || '';
        }
      } else if (TEXT_PROVIDER === 'openai') {
        if (!OPENAI_API_KEY) {
          setLoadingProgress('Chat key missing, using quick estimate...');
          text = generateMockAnalysis();
        } else {
        setLoadingProgress('Analyzing facade with ChatGPT...');
        const chatJson = await withRetry(
          async () => {
            const r = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
              },
              body: JSON.stringify({
                model: OPENAI_CHAT_MODEL,
                messages: [
                  { role: 'system', content: 'You are a facade renovation expert for Spraystone. Be concise and precise.' },
                  { role: 'user', content: textPrompt }
                ],
                temperature: 0.6,
                max_tokens: 900
              })
            });
            if (!r.ok) {
              throw new Error(`OpenAI Chat ${r.status}: ${await r.text()}`);
            }
            return r.json();
          },
          {
            retries: 4,
            baseDelayMs: 1500,
            onRetry: (attempt, total) => setLoadingProgress(`Analyzing facade... retry ${attempt + 1}/${total}`)
          }
        );
        text = chatJson?.choices?.[0]?.message?.content || '';
        }
      } else {
        // Fallback to Gemini if explicitly selected
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        setLoadingProgress('Analyzing facade...');
        const aiResult = await withRetry(
          () => model.generateContent([textPrompt]),
          {
            retries: 5,
            baseDelayMs: 2000,
            onRetry: (attempt, total) => setLoadingProgress(`Analyzing facade... retry ${attempt + 1}/${total}`)
          }
        );
        const response = await aiResult.response;
        text = response.text();
      }
      
      // Generate transformed image
      setLoadingProgress('Creating stone finish visualization...');
      await generateImageFromUpload(setLoadingProgress);

      setLoadingProgress('Complete!');
      setResult(text);
    } catch (err) {
      console.error('Error:', err);
      setError(`Failed to generate analysis: ${err.message}`);
    } finally {
      setLoading(false);
      setLoadingProgress('');
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setFormData({
      address: '',
      facadeType: '',
      condition: '',
      surfaceArea: '',
      finish: '',
      treatments: [],
      timeline: '',
      name: '',
      email: '',
      phone: ''
    });
    setUploadedImage(null);
    setImagePreview(null);
    setGeneratedImage(null);
    setResult(null);
    setError(null);
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 1: return true; // optional
      case 2: return formData.facadeType !== '';
      case 3: return formData.condition !== '';
      case 4: return formData.surfaceArea !== '';
      case 5: return formData.finish !== '';
      case 6: return uploadedImage !== null;
      case 7: return true; // treatments optional
      case 8: return formData.timeline !== '';
      case 9: return LEAD_GATING_MODE === 'before' ? formData.email !== '' : true;
      default: return false;
    }
  };

  const nextStep = () => {
    if (canGoNext() && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1Address formData={formData} onChange={handleInputChange} />;
      case 2:
        return <Step2FacadeType formData={formData} onChange={handleInputChange} />;
      case 3:
        return <Step3Condition formData={formData} onChange={handleInputChange} />;
      case 4:
        return <Step4Surface formData={formData} onChange={handleInputChange} />;
      case 5:
        return <Step5Finish formData={formData} onChange={handleInputChange} onTreatmentChange={handleTreatmentChange} />;
      case 6:
        return <Step6Image imagePreview={imagePreview} onImageUpload={handleImageUpload} onImageRemove={handleImageRemove} />;
      case 7:
        return <Step7Treatments formData={formData} onTreatmentChange={handleTreatmentChange} />;
      case 8:
        return <Step8Timeline formData={formData} onChange={handleInputChange} />;
      case 9:
        return <Step9Contact formData={formData} onChange={handleInputChange} />;
      default:
        return null;
    }
  };

  if (result) {
    return (
      <div className="py-8 min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50">
        <ResultsPage 
          formData={formData} 
          imagePreview={imagePreview} 
          generatedImage={generatedImage}
          result={result} 
          onReset={resetForm}
          onRetryImage={generateImageFromUpload}
        />
      </div>
    );
  }

  // Dev shortcut to skip to results with mock data
  const skipToResults = () => {
    setFormData({
      address: '123 Main Street, 1000 Brussels',
      facadeType: 'brick',
      condition: 'moderate',
      surfaceArea: '100',
      finish: 'natural-stone',
      treatments: ['water-repellent'],
      timeline: '1-3months',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+32 123 456 789'
    });
    setResult(`**FACADE ASSESSMENT**: Your brick facade shows moderate wear. Surface preparation will be needed before coating application.

**BEFORE/AFTER VISUALIZATION**: The transformation will provide a natural stone texture with visible aggregate and warm earth tones.

**RECOMMENDATIONS**:
- Surface cleaning and repair
- Water-repellent base treatment
- Spraystone natural stone finish
- Anti-pollution protection

**PRICING ESTIMATE**:
- Material cost: €45-65/m²
- Labor: €35-45/m²
- TOTAL PROJECT COST: €8,000 - €11,000

**TIMELINE**: Project can be completed in 3-5 working days depending on weather conditions.`);
  };

  return (
    <div className="px-4 py-8 min-h-screen" style={{ background: 'linear-gradient(135deg, #F5F1E8 0%, #E8DCC8 100%)' }}>
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold" style={{ color: '#2D2A26' }}>
            Spraystone Facade Simulator
          </h1>
          <p style={{ color: '#6B5E4F' }}>Transform your facade with professional visualization</p>
        </div>

        {/* Main Card */}
        <div className="p-8 bg-white rounded-2xl border shadow-xl" style={{ borderColor: '#D4A574' }}>
          <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />

          {/* Step Content */}
          <div 
            key={currentStep}
            className="mx-auto mb-8 max-w-3xl animate-fade-in-modern"
          >
            {renderStep()}
          </div>

          {/* Error Message */}
          {error && (
            <div className="px-4 py-3 mb-6 text-red-700 bg-red-50 rounded-xl border-2 border-red-200">
              {error}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-6 border-t">
            <div className="flex items-center space-x-2">
              <button
                onClick={prevStep}
                disabled={currentStep === 1 || loading}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                  currentStep === 1 || loading
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </button>
              
              {/* Dev Shortcut Button */}
              {DEV_MODE && (
                <button
                  onClick={skipToResults}
                  className="px-4 py-3 text-sm font-medium text-purple-700 bg-purple-100 rounded-lg transition-colors hover:bg-purple-200"
                  title="Dev: Skip to Results"
                >
                  ⚡ Skip
                </button>
              )}
            </div>

            {currentStep < totalSteps ? (
              <button
                onClick={nextStep}
                disabled={!canGoNext() || loading}
                className={`button-press flex items-center space-x-2 px-8 py-3 rounded-lg font-medium ${
                  canGoNext() && !loading
                    ? 'text-white shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                style={canGoNext() && !loading ? {
                  background: 'linear-gradient(135deg, #D4A574 0%, #C4955E 100%)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                } : {}}
              >
                <span>Continue</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canGoNext() || loading}
                className={`button-press flex items-center space-x-2 px-8 py-3 rounded-lg font-medium ${
                  canGoNext() && !loading
                    ? 'text-white shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                style={canGoNext() && !loading ? {
                  background: 'linear-gradient(135deg, #D4A574 0%, #C4955E 100%)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                } : {}}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{loadingProgress || 'Analyzing...'}</span>
                  </>
                ) : (
                  <>
                    <span>Generate My Estimate</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-600">
          <p className="text-sm">© 2024 Spraystone - Professional Facade Transformation</p>
        </div>
      </div>
    </div>
  );
}

export default App;
