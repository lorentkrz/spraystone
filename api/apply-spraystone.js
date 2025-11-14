import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

// POST /api/apply-spraystone
// Body: { imageBase64: string (no data: prefix), prompt?: string, size?: '1024x1024' | '512x512' | '256x256' }
app.post('/api/apply-spraystone', async (req, res) => {
  try {
    const { imageBase64, prompt, materialReferenceBase64, selections } = req.body || {};
    if (!imageBase64 || !prompt) {
      return res.status(400).json({ error: 'imageBase64 and prompt required' });
    }
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OPENAI_API_KEY is not set on the server' });
    }

    const openai = new OpenAI({ apiKey });

    const selectionJson = selections ? JSON.stringify(selections) : null;
    const promptWithContext = selectionJson ? `${prompt} Selection context JSON: ${selectionJson}` : prompt;
    const form = new FormData();
    form.append('model', 'gpt-image-1');
    form.append('prompt', promptWithContext);
    form.append('size', '1024x1024');
    form.append(
      'image[]',
      new Blob([Buffer.from(imageBase64, 'base64')], { type: 'image/png' }),
      'upload.png'
    );
    if (materialReferenceBase64) {
      form.append(
        'image[]',
        new Blob([Buffer.from(materialReferenceBase64, 'base64')], { type: 'image/png' }),
        'reference.png'
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

    const outputBase64 = json?.data?.[0]?.b64_json || null;

    if (!outputBase64) {
      return res.status(502).json({ error: 'No image returned from OpenAI' });
    }

    res.json({ output: outputBase64 });
  } catch (err) {
    console.error('apply-spraystone error:', err);
    res.status(500).send(typeof err?.message === 'string' ? err.message : String(err));
  }
});

const port = process.env.PORT || 8787;
app.listen(port, () => {
  console.log(`Spraystone proxy listening at http://localhost:${port}`);
});
