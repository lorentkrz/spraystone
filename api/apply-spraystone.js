import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

// POST /api/apply-spraystone
// Body (single):
//   { imageBase64: string (no data: prefix), imageMimeType?: string, prompt: string, size?: '1024x1024'|'512x512'|'256x256', materialReferenceBase64?: string, materialReferenceMimeType?: string, selections?: any }
// Body (batch):
//   { imageBase64: string, imageMimeType?: string, prompt: string, size?: '1024x1024'|'512x512'|'256x256', finishIds: string[], materialReferences: Array<{ base64: string, mimeType?: string }> }
app.post('/api/apply-spraystone', async (req, res) => {
  try {
    const {
      imageBase64,
      imageMimeType,
      prompt,
      materialReferenceBase64,
      materialReferenceMimeType,
      materialReferences,
      finishIds,
      selections,
      size
    } = req.body || {};
    if (!imageBase64 || !prompt) {
      return res.status(400).json({ error: 'imageBase64 and prompt required' });
    }
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OPENAI_API_KEY is not set on the server' });
    }

    const allowedSizes = new Set(['1024x1024', '512x512', '256x256']);
    const safeSize = typeof size === 'string' && allowedSizes.has(size) ? size : '512x512';

    const isBatch =
      Array.isArray(finishIds) &&
      finishIds.length > 0 &&
      Array.isArray(materialReferences) &&
      materialReferences.length === finishIds.length;

    const openai = new OpenAI({ apiKey });

    const selectionJson = selections ? JSON.stringify(selections) : null;
    const promptWithContext = selectionJson ? `${prompt} Selection context JSON: ${selectionJson}` : prompt;
    const model = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1.5';
    const outputCount = isBatch ? finishIds.length : 1;

    const inferExt = (mime) => {
      const safe = String(mime || '').toLowerCase();
      if (safe.includes('jpeg') || safe.includes('jpg')) return 'jpg';
      if (safe.includes('png')) return 'png';
      if (safe.includes('webp')) return 'webp';
      return 'png';
    };

    const uploadMime =
      typeof imageMimeType === 'string' && imageMimeType.trim() ? imageMimeType.trim() : 'image/png';
    const uploadExt = inferExt(uploadMime);

    const form = new FormData();
    form.append('model', model);
    form.append('prompt', promptWithContext);
    form.append('size', safeSize);
    form.append('n', String(outputCount));
    if (!model.startsWith('gpt-image')) {
      form.append('response_format', 'b64_json');
    }
    form.append(
      'image[]',
      new Blob([Buffer.from(imageBase64, 'base64')], { type: uploadMime }),
      `upload.${uploadExt}`
    );

    if (isBatch) {
      for (let i = 0; i < materialReferences.length; i++) {
        const ref = materialReferences[i];
        if (!ref?.base64) continue;
        const refMime =
          typeof ref?.mimeType === 'string' && ref.mimeType.trim()
            ? ref.mimeType.trim()
            : 'image/png';
        const refExt = inferExt(refMime);
        form.append(
          'image[]',
          new Blob([Buffer.from(ref.base64, 'base64')], { type: refMime }),
          `reference-${i + 1}.${refExt}`
        );
      }
    } else if (materialReferenceBase64) {
      const refMime =
        typeof materialReferenceMimeType === 'string' && materialReferenceMimeType.trim()
          ? materialReferenceMimeType.trim()
          : 'image/png';
      const refExt = inferExt(refMime);
      form.append(
        'image[]',
        new Blob([Buffer.from(materialReferenceBase64, 'base64')], { type: refMime }),
        `reference.${refExt}`
      );
    }

    const response = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`
      },
      body: form
    });

    const json = await response.json();

    const data = Array.isArray(json?.data) ? json.data : [];

    const toBase64 = async (item) => {
      if (!item) return null;
      if (item?.b64_json) return item.b64_json;
      if (item?.url) {
        const imageResponse = await fetch(item.url);
        if (!imageResponse.ok) {
          throw new Error(`Unable to fetch image URL: ${imageResponse.status}`);
        }
        const arrayBuffer = await imageResponse.arrayBuffer();
        return Buffer.from(arrayBuffer).toString('base64');
      }
      return null;
    };

    if (isBatch) {
      const outputsByFinish = {};
      for (let i = 0; i < finishIds.length; i++) {
        const finishId = finishIds[i];
        const b64 = await toBase64(data[i]);
        if (b64) outputsByFinish[finishId] = b64;
      }

      if (!Object.keys(outputsByFinish).length) {
        return res.status(502).json({ error: 'No images returned from OpenAI' });
      }

      return res.json({ outputsByFinish });
    }

    const outputBase64 = await toBase64(data[0]);
    if (!outputBase64) {
      return res.status(502).json({ error: 'No image returned from OpenAI' });
    }

    return res.json({ output: outputBase64 });
  } catch (err) {
    console.error('apply-spraystone error:', err);
    res.status(500).send(typeof err?.message === 'string' ? err.message : String(err));
  }
});

const port = process.env.PORT || 8787;
app.listen(port, () => {
  console.log(`Spraystone proxy listening at http://localhost:${port}`);
});
