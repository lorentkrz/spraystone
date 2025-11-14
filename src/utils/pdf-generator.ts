import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { FormData } from '@/types';

const LOGO_PATH = '/spraystone-logo.png';
let logoCache: string | null = null;

const loadLogo = async (): Promise<string | null> => {
  if (logoCache) return logoCache;
  try {
    const response = await fetch(LOGO_PATH);
    const blob = await response.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string) || '');
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    logoCache = dataUrl;
    return dataUrl;
  } catch {
    return null;
  }
};

const findInvestmentRange = (text: string): string | null => {
  const explicit = text.match(/TOTAL\s+PROJECT\s+COST[^\u20ac]*\u20ac\s*([\d.,]+)\s*-\s*\u20ac\s*([\d.,]+)/i);
  if (explicit) {
    return `€${explicit[1]} - €${explicit[2]}`;
  }
  const perSqm = text.match(/\u20ac\s*([\d.,]+)\s*-\s*\u20ac\s*([\d.,]+)\s*\/?\s*m\u00b2/i);
  if (perSqm) {
    return `€${perSqm[1]} - €${perSqm[2]} / m²`;
  }
  return null;
};

const formatPhone = (data: FormData): string => {
  if (!data.phone) return '—';
  return `${data.phonePrefix || ''} ${data.phone}`.trim();
};

export const generateQuotePDF = async (
  formData: FormData,
  result: string,
  generatedImage: string | null,
  uploadedImage: string | null
): Promise<void> => {
  const doc = new jsPDF();
  const today = new Date().toLocaleDateString('en-GB');
  const investmentRange = findInvestmentRange(result) || 'Pending on-site validation';
  const logoData = typeof window !== 'undefined' ? await loadLogo() : null;

  doc.setFillColor(245, 241, 232);
  doc.rect(0, 0, 210, 297, 'F');

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(10, 10, 190, 32, 4, 4, 'F');
  if (logoData) {
    doc.addImage(logoData, 'PNG', 14, 14, 32, 18);
  }
  doc.setTextColor(45, 42, 38);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Spraystone Facade Estimate', 50, 24);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Generated automatically from your simulator session', 50, 32);
  doc.text(`Date: ${today}`, 150, 32);

  const projectData = [
    ['Client', formData.name || '—'],
    ['Email', formData.email || '—'],
    ['Phone', formatPhone(formData)],
    ['Address', formData.address || '—'],
    ['Facade type', formData.facadeType || '—'],
    ['Condition', formData.condition || '—'],
    ['Surface area', formData.surfaceArea ? `${formData.surfaceArea} m²` : 'To be measured'],
    ['Desired finish', formData.finish || 'Natural stone'],
    ['Treatments', formData.treatments?.length ? formData.treatments.join(', ') : 'None'],
    ['Timeline', formData.timeline || 'To be determined']
  ];

  autoTable(doc, {
    startY: 52,
    head: [['Item', 'Details']],
    body: projectData,
    theme: 'striped',
    headStyles: { fillColor: [212, 165, 116], textColor: 255, fontSize: 11 },
    bodyStyles: { textColor: 45, fontSize: 10 },
    styles: { cellPadding: 3 },
    margin: { left: 10, right: 10 }
  });

  let yPos = (doc as any).lastAutoTable.finalY + 10;

  if (result) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(45, 42, 38);
    doc.text('Professional analysis', 10, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(70, 70, 70);
    const analysisLines = doc.splitTextToSize(result, 190);
    doc.text(analysisLines, 10, yPos);
    yPos += analysisLines.length * 5 + 10;
  }

  if (yPos > 220) {
    doc.addPage();
    yPos = 20;
  }

  if (uploadedImage || generatedImage) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(45, 42, 38);
    doc.text('Visualization', 10, yPos);
    yPos += 6;
    const width = 90;
    const height = 60;

    if (uploadedImage) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('Before', 10, yPos);
      try {
        doc.addImage(uploadedImage, 'JPEG', 10, yPos + 2, width, height);
      } catch (error) {
        console.warn('Unable to render before image', error);
      }
    }

    if (generatedImage) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('After', 110, yPos);
      try {
        doc.addImage(generatedImage, 'PNG', 110, yPos + 2, width, height);
      } catch (error) {
        console.warn('Unable to render after image', error);
      }
    }

    yPos += height + 10;
  }

  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(45, 42, 38);
  doc.text('Estimated investment', 10, yPos);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(investmentRange, 10, yPos + 8);
  doc.setTextColor(120, 120, 120);
  doc.text('*Subject to on-site measurements & preparation requirements', 10, yPos + 14);

  doc.setTextColor(140, 124, 104);
  doc.setFontSize(8);
  doc.text('This estimate is generated automatically. Final pricing may vary after on-site inspection.', 10, 285);
  doc.text('Contact: info@spraystone.be · www.spraystone.be', 10, 290);

  const fileName = `Spraystone_Quote_${formData.name || 'Client'}_${today.replace(/\//g, '-')}.pdf`;
  doc.save(fileName);
};


