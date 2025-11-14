import React from 'react';
import { Upload } from 'lucide-react';

interface Step6ImageProps {
  imagePreview: string | null;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageRemove: () => void;
}

export const Step6Image: React.FC<Step6ImageProps> = ({ imagePreview, onImageUpload, onImageRemove }) => {
  return (
    <div>
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Upload a photo of your current facade</h2>
        <p className="text-gray-600">For generating a before/after visualization</p>
      </div>

      {!imagePreview ? (
        <label htmlFor="file-upload" className="block">
          <div className="w-full rounded-2xl border-2 border-dashed border-green-300 p-12 text-center bg-white hover:bg-green-50 transition cursor-pointer">
            <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <Upload className="w-6 h-6 text-green-600" />
            </div>
            <div className="font-medium text-gray-900">Click to upload photo</div>
            <div className="text-sm text-gray-500">JPG, PNG (Max 10MB)</div>
          </div>
          <input id="file-upload" type="file" accept="image/*" onChange={onImageUpload} className="hidden" />
        </label>
      ) : (
        <div className="space-y-4">
          <img src={imagePreview} alt="Preview" className="w-full h-80 object-cover rounded-2xl border border-gray-200" />
          <div className="text-center">
            <button onClick={onImageRemove} className="text-sm text-gray-600 underline hover:text-gray-900 transition">
              Remove photo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
