import React from 'react';
import { User, Mail, Phone } from 'lucide-react';

const Step8Contact = ({ formData, onChange }) => {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-3 text-center">
          How can we contact you?
        </h2>
        <p className="text-gray-600 text-center">
          We'll send you the detailed analysis and personalized quote
        </p>
      </div>

      <div className="space-y-5 max-w-xl mx-auto">
        <div className="relative">
          <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={onChange}
            placeholder="Full Name"
            className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
          />
        </div>

        <div className="relative">
          <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={onChange}
            placeholder="Email Address *"
            required
            className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
          />
        </div>

        <div className="relative">
          <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <div className="absolute left-12 top-1/2 transform -translate-y-1/2 text-gray-600 font-medium pointer-events-none">
            +32
          </div>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={onChange}
            placeholder="123 456 789"
            className="w-full pl-20 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6">
          <p className="text-blue-900 text-sm">
            <strong>Privacy notice:</strong> Your information will only be used to provide you with a personalized quote and will not be shared with third parties.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Step8Contact;
