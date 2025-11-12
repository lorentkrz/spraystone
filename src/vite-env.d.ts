/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string;
  readonly VITE_OPENAI_API_KEY: string;
  readonly VITE_AZURE_OPENAI_API_KEY: string;
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
  readonly VITE_TEXT_PROVIDER: string;
  readonly VITE_IMAGE_PROVIDER: string;
  readonly VITE_OPENAI_CHAT_MODEL: string;
  readonly VITE_AZURE_IMAGE_GENERATIONS_ENDPOINT: string;
  readonly VITE_AZURE_IMAGE_EDITS_ENDPOINT: string;
  readonly VITE_AZURE_CHAT_COMPLETIONS_ENDPOINT: string;
  readonly VITE_PROXY_IMAGE_ENDPOINT: string;
  readonly VITE_LEAD_GATING_MODE: string;
  readonly VITE_DEV_MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
