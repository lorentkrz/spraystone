/**
 * Application Configuration
 * Centralized configuration for all environment variables and constants
 */

// API Keys
export const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
export const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
export const AZURE_OPENAI_API_KEY = import.meta.env.VITE_AZURE_OPENAI_API_KEY || '';
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Provider Configuration
export const TEXT_PROVIDER = import.meta.env.VITE_TEXT_PROVIDER || 'none';
export const IMAGE_PROVIDER = import.meta.env.VITE_IMAGE_PROVIDER || 'proxy-openai';

// Model Configuration
export const OPENAI_CHAT_MODEL = import.meta.env.VITE_OPENAI_CHAT_MODEL || 'gpt-4o';
export const OPENAI_IMAGE_MODEL = import.meta.env.VITE_OPENAI_IMAGE_MODEL || 'gpt-image-1.5';
export const GEMINI_TEXT_MODEL = 'gemini-2.5-flash';
export const GEMINI_IMAGE_MODEL = 'gemini-2.5-flash-image';

// Azure Endpoints
export const AZURE_IMAGE_ENDPOINT = import.meta.env.VITE_AZURE_IMAGE_GENERATIONS_ENDPOINT || '';
export const AZURE_IMAGE_EDITS_ENDPOINT = import.meta.env.VITE_AZURE_IMAGE_EDITS_ENDPOINT || '';
export const AZURE_CHAT_COMPLETIONS_ENDPOINT = import.meta.env.VITE_AZURE_CHAT_COMPLETIONS_ENDPOINT || '';

// Proxy Configuration
export const PROXY_IMAGE_ENDPOINT = import.meta.env.VITE_PROXY_IMAGE_ENDPOINT || 'http://localhost:8787/api/apply-spraystone';

// Application Settings
export const LEAD_GATING_MODE = import.meta.env.VITE_LEAD_GATING_MODE || 'before';
export const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

// Business Constants
export const PRICING = {
  MIN_PRICE_PER_SQM: 80,
  MAX_PRICE_PER_SQM: 150,
  DEFAULT_SURFACE_AREA: 100,
} as const;

export const IMAGE_SIZE = '1024x1024' as const;

// Map Configuration
export const MAP_CONFIG = {
  DEFAULT_CENTER: { lat: 50.8503, lng: 4.3517 }, // Brussels
  DEFAULT_ZOOM: 13,
  DETAIL_ZOOM: 16,
  MAP_ID: 'spraystone-map',
} as const;

// Retry Configuration
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  BASE_DELAY_MS: 1200,
  IMAGE_RETRIES: 3,
  IMAGE_BASE_DELAY_MS: 2000,
  TEXT_RETRIES: 4,
  TEXT_BASE_DELAY_MS: 1500,
} as const;

// Type exports for provider configuration
export type TextProvider = 'openai' | 'azure-openai' | 'gemini' | 'none';
export type ImageProvider = 'openai' | 'azure-openai' | 'proxy-openai' | 'gemini';
export type LeadGatingMode = 'before' | 'after';
