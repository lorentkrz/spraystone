import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import { toFile } from 'openai/uploads';

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

// POST /api/apply-spraystone
// Body: { imageBase64: string (no data: prefix), prompt?: string, size?: '1024x1024' | '512x512' | '256x256' }
app.post('/api/apply-spraystone', async (req, res) => {
  try {
    const { imageBase64, prompt, size = '1024x1024' } = req.body || {};
    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 required' });
    }
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OPENAI_API_KEY is not set on the server' });
    }

    const openai = new OpenAI({ apiKey });

    // Convert base64 to a file for the edits endpoint
    const imageFile = await toFile(Buffer.from(imageBase64, 'base64'), 'facade.png');

    // Try image edits first (preserves original facade, applies Spraystone)
    const edits = await openai.images.edits({
      model: 'gpt-image-1',
      image: imageFile,
      prompt: prompt || 'Apply natural stone appearance (Spraystone finish) to exterior walls. Preserve architecture, windows, doors, trims. Photorealistic, high quality.',
      size
    });

    const b64 = edits?.data?.[0]?.b64_json || null;
    if (!b64) {
      return res.status(502).json({ error: 'No image returned from OpenAI' });
    }

    res.json({ output: b64 });
  } catch (err) {
    console.error('apply-spraystone error:', err);
    res.status(500).send(typeof err?.message === 'string' ? err.message : String(err));
  }
});

const port = process.env.PORT || 8787;
app.listen(port, () => {
  console.log(`Spraystone proxy listening at http://localhost:${port}`);
});
