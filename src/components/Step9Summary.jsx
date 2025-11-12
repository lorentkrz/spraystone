import React from 'react';
import { CheckCircle, MapPin, Home, Ruler, Paintbrush, Calendar, Image as ImageIcon, User, Mail } from 'lucide-react';

const Step9Summary = ({ formData, imagePreview }) => {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-10 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-4xl font-bold text-gray-900 mb-3">
          Review Your Project Details
        </h2>
        <p className="text-gray-500">
          Please confirm your information before we generate your personalized quote
        </p>
      </div>

      <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden">
        {/* Image Preview */}
        {imagePreview && (
          <div className="p-4 border-b border-gray-200">
            <img src={imagePreview} alt="Facade" className="w-full h-48 object-cover rounded-xl" />
          </div>
        )}

        {/* Details Grid */}
        <div className="p-6 space-y-4">
          <DetailRow icon={<MapPin className="w-5 h-5" />} label="Address" value={formData.address || 'Not provided'} />
          <DetailRow icon={<Home className="w-5 h-5" />} label="Facade Type" value={formData.facadeType || 'Not specified'} />
          <DetailRow icon={<Ruler className="w-5 h-5" />} label="Surface Area" value={formData.surfaceArea ? `${formData.surfaceArea} m²` : 'To be measured'} />
          <DetailRow icon={<Paintbrush className="w-5 h-5" />} label="Finish" value={formData.finish || 'Natural stone'} />
          <DetailRow icon={<Calendar className="w-5 h-5" />} label="Timeline" value={formData.timeline || 'To be determined'} />
          <DetailRow icon={<User className="w-5 h-5" />} label="Name" value={formData.name || 'Not provided'} />
          <DetailRow icon={<Mail className="w-5 h-5" />} label="Email" value={formData.email || 'Not provided'} />
        </div>
      </div>

      <div className="mt-8 bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <p className="text-green-900 font-medium mb-2">Ready to generate your personalized quote!</p>
        <p className="text-green-700 text-sm">
          Click "Generate My Estimate" below to receive your AI-powered facade transformation analysis
        </p>
      </div>
    </div>
  );
};

const DetailRow = ({ icon, label, value }) => (
  <div className="flex items-center space-x-4 py-2">
    <div className="text-green-600">{icon}</div>
    <div className="flex-1">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="font-medium text-gray-900">{value}</div>
    </div>
  </div>
);

export default Step9Summary;
