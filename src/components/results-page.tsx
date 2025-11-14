import React, { useState } from 'react';
import { MapPin, Home, Ruler, Paintbrush, Calendar, Download, Send, Euro, Eye, Phone, Mail, Camera } from 'lucide-react';
import { generateQuotePDF } from '@/utils/pdf-generator';
import { ImageModal } from './image-modal';
import type { FormData } from '@/types';

interface ResultsPageProps {
  formData: FormData;
  imagePreview: string | null;
  generatedImage: string | null;
  result: string;
  onReset: () => void;
}

interface ParsedSections {
  assessment: string;
  visualization: string;
  recommendations: string;
  pricing: string;
  timeline: string;
  estimatedInvestment: string;
}

interface LabelMaps {
  facadeType: Record<string, string>;
  finish: Record<string, string>;
  timeline: Record<string, string>;
  treatments: Record<string, string>;
}

interface DetailCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  bgGradient: string;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({ 
  formData, 
  imagePreview, 
  generatedImage, 
  result, 
  onReset
}) => {
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState<string>('');
  const [modalDescription, setModalDescription] = useState<string>('');

  const openImageModal = (src: string, title: string, description: string): void => {
    setModalImage(src);
    setModalTitle(title);
    setModalDescription(description);
    setModalOpen(true);
  };

  const handleDownloadPDF = async (): Promise<void> => {
    try {
      await generateQuotePDF(formData, result, generatedImage, imagePreview);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  // Helpers
  const parseNumber = (s: string | number | null | undefined): number | null => {
    if (!s) return null;
    const digits = String(s).replace(/[^\d]/g, '');
    return digits ? parseInt(digits, 10) : null;
  };

  const formatCurrency = (n: number): string => new Intl.NumberFormat('en-US').format(Math.round(n));

  const parseSurfaceAreaAverage = (sa: string | number | null | undefined): number | null => {
    if (sa === undefined || sa === null) return null;
    if (typeof sa === 'number') return sa;
    const str = String(sa).trim();
    if (!str) return null;
    if (/^<\s*50/.test(str)) return 40;
    if (/^>\s*150/.test(str)) return 180;
    const range = str.match(/(\d+)\s*-\s*(\d+)/);
    if (range) {
      return (parseInt(range[1], 10) + parseInt(range[2], 10)) / 2;
    }
    const num = parseFloat(str);
    return isNaN(num) ? null : num;
  };

  const labelMaps: LabelMaps = {
    facadeType: {
      brick: 'Brick',
      render: 'Render / Plaster',
      concrete: 'Concrete Block',
      painted: 'Painted Facade',
      other: 'Other'
    },
    finish: {
      'natural-stone': 'Natural Stone (Spraystone)',
      smooth: 'Smooth Render',
      textured: 'Textured Render',
      suggest: 'Suggested by Expert',
      other: 'Other'
    },
    timeline: {
      asap: 'As soon as possible',
      '1-3months': 'In 1 to 3 months',
      '>3months': 'In more than 3 months',
      tbd: 'To be determined'
    },
    treatments: {
      'water-repellent': 'Water-repellent protection',
      'anti-stain': 'Anti-stain / Anti-pollution'
    }
  };

  const fmtLabel = (group: keyof LabelMaps, key: string | undefined): string => 
    labelMaps[group]?.[key || ''] || (key ? String(key) : '');

  const fmtSurface = (sa: string | number | null | undefined): string => {
    if (!sa && sa !== 0) return 'To be measured';
    const str = String(sa).trim();
    if (!str) return 'To be measured';
    if (/m²$/i.test(str)) return str;
    return `${str} m²`;
  };

  // Parse AI result sections and derive investment
  const parseResult = (text: string): ParsedSections => {
    const sections: Partial<ParsedSections> = {};

    const assessmentMatch = text.match(/\*?\*?FACADE ASSESSMENT\*?\*?:?\s*([\s\S]*?)(?=\*?\*?BEFORE\/AFTER|$)/i);
    const visualMatch = text.match(/\*?\*?BEFORE\/AFTER VISUALIZATION\*?\*?:?\s*([\s\S]*?)(?=\*?\*?RECOMMENDATIONS|$)/i);
    const recoMatch = text.match(/\*?\*?RECOMMENDATIONS\*?\*?:?\s*([\s\S]*?)(?=\*?\*?PRICING|$)/i);
    const pricingMatch = text.match(/\*?\*?PRICING ESTIMATE\*?\*?:?\s*([\s\S]*?)(?=\*?\*?TIMELINE|$)/i);
    const timelineMatch = text.match(/\*?\*?TIMELINE\*?\*?:?\s*([\s\S]*?)$/i);

    sections.assessment = assessmentMatch ? assessmentMatch[1].trim() : '';
    sections.visualization = visualMatch ? visualMatch[1].trim() : '';
    sections.recommendations = recoMatch ? recoMatch[1].trim() : '';
    sections.pricing = pricingMatch ? pricingMatch[1].trim() : '';
    sections.timeline = timelineMatch ? timelineMatch[1].trim() : '';

    // Derive investment range: prefer explicit TOTAL PROJECT COST, else compute from €/m² and area
    const totalRange =
      text.match(/TOTAL\s+PROJECT\s+COST[^\d]*([\d.,]+)\s*-\s*([\d.,]+)/i) ||
      text.match(/TOTAL[^\d]*([\d.,]+)\s*-\s*([\d.,]+)/i);
    if (totalRange) {
      const lo = parseNumber(totalRange[1]);
      const hi = parseNumber(totalRange[2]);
      if (lo && hi) {
        sections.estimatedInvestment = `\u20AC${formatCurrency(lo)} - \u20AC${formatCurrency(hi)}`;
      }
      return sections as ParsedSections;
    }
    const perM2 = text.match(/(?:\u20AC|\bEUR\b)?\s*([\d.,]+)\s*-\s*(?:\u20AC|\bEUR\b)?\s*([\d.,]+)\s*\/\s*m(?:\u00B2|2)/i);
    if (perM2) {
      const lo = parseNumber(perM2[1]);
      const hi = parseNumber(perM2[2]);
      const area = parseSurfaceAreaAverage(formData.surfaceArea) || 100;
      if (lo && hi) {
        sections.estimatedInvestment = `\u20AC${formatCurrency(lo * area)} - \u20AC${formatCurrency(hi * area)}`;
      }
      return sections as ParsedSections;
    }
    const single = text.match(/TOTAL\s+PROJECT\s+COST[^\d]*([\d.,]+)/i);
    if (single) {
      const v = parseNumber(single[1]);
      if (v) {
        sections.estimatedInvestment = `\u20AC${formatCurrency(v)}`;
      }
      return sections as ParsedSections;
    }
    sections.estimatedInvestment = '\u20AC3,250';
    return sections as ParsedSections;
  };

  const sections = parseResult(result);
  const estimatedPrice = sections.estimatedInvestment;

  const prettyFacade = fmtLabel('facadeType', formData.facadeType);
  const prettyFinish = fmtLabel('finish', formData.finish);
  const prettyTimeline = fmtLabel('timeline', formData.timeline);
  const prettySurface = fmtSurface(formData.surfaceArea);
  const prettyTreatments = (formData.treatments && formData.treatments.length > 0)
    ? formData.treatments.map(t => fmtLabel('treatments', t)).join(', ')
    : 'None';

  return (
    <>
      <ImageModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        imageSrc={modalImage || ''}
        title={modalTitle}
        description={modalDescription}
      />
      <div className="max-w-4xl mx-auto p-4 md:p-6 animate-fade-in-modern">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="mb-4 flex justify-center">
            <img
              src="/spraystone-logo.png"
              alt="Spraystone"
              className="h-12 w-auto"
              onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
            />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-[#2D2A26]">
            Your Spraystone Preview
          </h1>
          <p className="text-sm text-[#6B5E4F]">High-fidelity before/after visualization plus tailored advice.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
          {/* Before Image */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-all">
            <div className="relative">
              <div className="absolute top-2 left-2 z-10 bg-gray-900 text-white px-2.5 py-0.5 rounded-full text-xs font-bold">
                BEFORE
              </div>
              {imagePreview ? (
                <button
                  onClick={() =>
                    openImageModal(imagePreview, 'Current Facade', 'Your facade before Spraystone treatment')
                  }
                  className="relative w-full h-64 overflow-hidden cursor-pointer group"
                >
                  <img
                    src={imagePreview}
                    alt="Current facade"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <div className="bg-white/95 px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                      <Eye className="w-4 h-4 text-gray-900" />
                    </div>
                  </div>
                </button>
              ) : (
                <div className="w-full h-64 bg-gradient-to-br from-gray-50 to-slate-100 flex items-center justify-center border-2 border-dashed border-gray-200">
                  <div className="text-center p-4">
                    <div className="w-12 h-12 mx-auto mb-2 bg-gray-100 rounded-full flex items-center justify-center">
                      <Camera className="w-6 h-6 text-gray-500" />
                    </div>
                    <p className="text-gray-900 font-semibold text-xs mb-1">Awaiting facade photo</p>
                    <p className="text-gray-600 text-[10px] max-w-xs mx-auto">
                      Upload a clear shot so we can map the Spraystone finish perfectly.
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="p-3">
              <h3 className="text-sm font-bold text-gray-900 mb-1">Current Condition</h3>
              <p className="text-gray-600 text-xs leading-relaxed line-clamp-2">
                {sections.assessment || 'Your current facade'}
              </p>
            </div>
          </div>

          {/* After Image / Visualization */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border-2 border-green-200 hover:shadow-md transition-all">
            <div className="relative">
              <div className="absolute top-2 left-2 z-10 bg-green-600 text-white px-2.5 py-0.5 rounded-full text-xs font-bold">
                AFTER SPRAYSTONE
              </div>
              {generatedImage ? (
                <button
                  onClick={() =>
                    openImageModal(
                      generatedImage,
                      'Transformed Facade',
                      'Your facade with Spraystone natural stone finish'
                    )
                  }
                  className="relative w-full h-64 overflow-hidden cursor-pointer group"
                >
                  <img
                    src={generatedImage}
                    alt="Transformed facade"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <div className="bg-white/95 px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                      <Eye className="w-4 h-4 text-gray-900" />
                    </div>
                  </div>
                </button>
              ) : (
                <div className="w-full h-64 bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center border-2 border-dashed border-green-200">
                  <div className="text-center p-4">
                    <div className="w-12 h-12 mx-auto mb-2 bg-green-100 rounded-full flex items-center justify-center">
                      <Paintbrush className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="text-gray-900 font-semibold text-xs mb-1">Preview Coming Soon</p>
                    <p className="text-gray-600 text-[10px] max-w-xs mx-auto">
                      <strong>{prettyFinish}</strong> with natural stone texture
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="p-3">
              <h3 className="text-sm font-bold text-gray-900 mb-1">After Spraystone</h3>
              <p className="text-gray-600 text-xs leading-relaxed line-clamp-2">
                {sections.visualization || 'Professional natural stone coating applied'}
              </p>
            </div>
          </div>
        </div>
        {/* Project Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
          <DetailCard 
            icon={<MapPin className="w-4 h-4" />}
            title="Address"
            value={formData.address || 'Not provided'}
            bgGradient="from-blue-500 to-blue-600"
          />
          <DetailCard 
            icon={<Home className="w-4 h-4" />}
            title="Type"
            value={prettyFacade || 'Not specified'}
            bgGradient="from-purple-500 to-purple-600"
          />
          <DetailCard 
            icon={<Ruler className="w-4 h-4" />}
            title="Surface"
            value={prettySurface}
            bgGradient="from-orange-500 to-orange-600"
          />
          <DetailCard 
            icon={<Paintbrush className="w-4 h-4" />}
            title="Finish"
            value={prettyFinish || 'Natural Stone'}
            bgGradient="from-green-500 to-green-600"
          />
          <DetailCard 
            icon={<Calendar className="w-4 h-4" />}
            title="Timeline"
            value={prettyTimeline || 'TBD'}
            bgGradient="from-pink-500 to-pink-600"
          />
          <DetailCard 
            icon={<Paintbrush className="w-4 h-4" />}
            title="Treatments"
            value={prettyTreatments}
            bgGradient="from-teal-500 to-teal-600"
          />
        </div>

        {/* Analysis Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <h3 className="text-base font-bold text-gray-900 mb-3">Professional Analysis</h3>
          
          <div className="space-y-3">
            {/* Recommendations */}
            {sections.recommendations && (
              <div>
                <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Recommendations</h4>
                <div className="space-y-1">
                  {sections.recommendations.split('\n').map((line, i) => {
                    const cleaned = line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim();
                    return cleaned ? (
                      <div key={i} className="flex items-start text-gray-600 text-xs leading-relaxed">
                        <span className="text-green-600 mr-1.5 mt-0.5"></span>
                        <span>{cleaned}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {/* Pricing Breakdown */}
            {sections.pricing && (
              <div className="pt-3 border-t border-gray-200">
                <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Pricing Breakdown</h4>
                <div className="space-y-1">
                  {sections.pricing.split('\n').map((line, i) => {
                    const cleaned = line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim();
                    return cleaned ? (
                      <div key={i} className="flex items-start text-gray-600 text-xs">
                        <span className="text-green-600 mr-1.5 mt-0.5"></span>
                        <span>{cleaned}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {/* Timeline */}
            {sections.timeline && (
              <div className="pt-3 border-t border-gray-200">
                <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Estimated Timeline</h4>
                <p className="text-gray-800 font-medium text-xs">{sections.timeline}</p>
              </div>
            )}
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-4 shadow-sm border border-gray-200 mb-4">
          <h3 className="text-base font-bold text-gray-900 mb-3">What happens next?</h3>
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-xs">1</div>
              <div>
                <h4 className="font-semibold text-gray-900 text-xs">Review & Contact</h4>
                <p className="text-gray-600 text-[10px]">Our team will review your request within 24 hours</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-xs">2</div>
              <div>
                <h4 className="font-semibold text-gray-900 text-xs">Site Visit</h4>
                <p className="text-gray-600 text-[10px]">Free on-site consultation to confirm details</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-xs">3</div>
              <div>
                <h4 className="font-semibold text-gray-900 text-xs">Final Quote & Start</h4>
                <p className="text-gray-600 text-[10px]">Receive detailed quote and schedule your transformation</p>
              </div>
            </div>
          </div>
        </div>

        {/* Investment Card */}
        <div className="rounded-2xl p-6 shadow-lg mb-4" style={{ background: 'linear-gradient(135deg, #F5F1E8 0%, #E8DCC8 100%)', border: '2px solid #D4A574' }}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="text-sm font-semibold uppercase tracking-wide mb-1" style={{ color: '#6B5E4F' }}>Estimated Investment</div>
              <div className="text-3xl md:text-4xl font-bold" style={{ color: '#2D2A26' }}>{estimatedPrice}</div>
              <div className="mt-2 text-xs text-[#6B5E4F]">* Final quote subject to on-site assessment</div>
            </div>
            <div className="flex items-center justify-center w-20 h-20 bg-white rounded-xl shadow-md">
              <Euro className="w-10 h-10" style={{ color: '#D4A574' }} />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleDownloadPDF}
            className="button-press flex-1 flex items-center justify-center space-x-2 text-white font-semibold py-4 px-6 rounded-lg shadow-lg hover-lift"
            style={{ background: 'linear-gradient(135deg, #D4A574 0%, #C4955E 100%)' }}
          >
            <Download className="w-5 h-5" />
            <span>Download PDF Quote</span>
          </button>
          <button
            onClick={onReset}
            className="button-press flex-1 flex items-center justify-center space-x-2 bg-white font-semibold py-4 px-6 rounded-lg shadow-lg hover-lift border-2"
            style={{ borderColor: '#D4A574', color: '#2D2A26' }}
          >
            <Send className="w-5 h-5" />
            <span>New Quote</span>
          </button>
        </div>

        {/* Contact Info */}
        {(formData.email || formData.phone) && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-900 font-semibold mb-1.5">We'll contact you at:</p>
            <div className="space-y-0.5">
              {formData.email && (
                <div className="flex items-center text-xs text-blue-800">
                  <Mail className="w-3 h-3 mr-1.5" />
                  <span>{formData.email}</span>
                </div>
              )}
              {formData.phone && (
                <div className="flex items-center text-xs text-blue-800">
                  <Phone className="w-3 h-3 mr-1.5" />
                  <span>{`${formData.phonePrefix} ${formData.phone}`}</span>
                </div>
              )}
            </div>
          </div>
        )}
    </div>
    </>
  );
};

const DetailCard: React.FC<DetailCardProps> = ({ icon, title, value, bgGradient }) => (
  <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
    <div className="flex items-center space-x-3">
      <div className={`bg-gradient-to-br ${bgGradient} p-3 rounded-lg flex-shrink-0`}>
        <div className="text-white">{icon}</div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">{title}</div>
        <div className="text-sm font-bold text-gray-900 truncate">{value}</div>
      </div>
    </div>
  </div>
);







