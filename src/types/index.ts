/**
 * Type Definitions for Spraystone Facade Simulator
 */

import type { ChangeEvent } from 'react';

// Form Data Types
export interface FormData {
  address: string;
  facadeType: FacadeType;
  condition: Condition;
  surfaceArea: string;
  finish: Finish;
  treatments: Treatment[];
  timeline: Timeline;
  name: string;
  email: string;
  phonePrefix: string;
  phone: string;
}

export type FacadeType = 'brick' | 'render' | 'concrete' | 'painted' | 'other' | '';
export type Condition = 'excellent' | 'good' | 'moderate' | 'poor' | '';
export type Finish = 'natural-stone' | 'smooth' | 'textured' | 'suggest' | 'other' | '';
export type Treatment = 'water-repellent' | 'anti-stain';
export type Timeline = 'asap' | '1-3months' | '>3months' | 'tbd' | '';

// Component Props Types
export interface StepProps {
  formData: FormData;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export interface Step1AddressProps extends StepProps {}

export interface Step5FinishProps extends StepProps {}

export interface Step6ImageProps {
  imagePreview: string | null;
  onImageUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  onImageRemove: () => void;
}

export interface Step7TreatmentsProps {
  formData: FormData;
  onTreatmentChange: (treatment: Treatment | '__clear_all__') => void;
}

export interface ResultsPageProps {
  formData: FormData;
  imagePreview: string | null;
  generatedImage: string | null;
  result: string;
  onReset: () => void;
}

export interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string | null;
  title: string;
  description: string;
}

export interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

// Google Maps Types
export interface AddressParts {
  street: string;
  number: string;
  postalCode: string;
  city: string;
}

export interface MapConfig {
  center: google.maps.LatLngLiteral;
  zoom: number;
  mapId: string;
  mapTypeControl: boolean;
  streetViewControl: boolean;
  fullscreenControl: boolean;
}

// AI Response Types
export interface AITextResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

export interface AIImageResponse {
  data?: Array<{
    b64_json?: string;
    url?: string;
  }>;
}

export interface GenerativeAIPart {
  inlineData: {
    data: string;
    mimeType: string;
  };
}

// Retry Configuration
export interface RetryOptions {
  retries?: number;
  baseDelayMs?: number;
  onRetry?: (attempt: number, total: number, error?: Error) => void;
}

// PDF Generation Types
export interface PDFData {
  formData: FormData;
  result: string;
  generatedImage: string | null;
  uploadedImage: string | null;
}

// Parsed Result Sections
export interface ParsedResult {
  assessment: string;
  visualization: string;
  recommendations: string;
  pricing: string;
  timeline: string;
  investment: {
    low: number | null;
    high: number | null;
  };
}

// Facade Type Configuration
export interface FacadeTypeConfig {
  id: FacadeType;
  label: string;
  gradient: string;
  icon: string;
}

// Condition Configuration
export interface ConditionConfig {
  id: Condition;
  label: string;
  description: string;
  color: string;
}

// Finish Configuration
export interface FinishConfig {
  id: Finish;
  label: string;
  description: string;
}

// Treatment Configuration
export interface TreatmentConfig {
  id: Treatment;
  label: string;
  description: string;
}

// Timeline Configuration
export interface TimelineConfig {
  id: Timeline;
  label: string;
  icon: string;
}
