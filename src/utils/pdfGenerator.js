import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateQuotePDF = (formData, result, generatedImage, uploadedImage) => {
  const doc = new jsPDF();
  
  // Company branding
  doc.setFillColor(34, 139, 34); // Green
  doc.rect(0, 0, 210, 30, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont(undefined, 'bold');
  doc.text('SPRAYSTONE', 20, 20);
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text('Facade Renovation Estimate', 20, 26);
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
  
  // Date
  doc.setFontSize(10);
  const today = new Date().toLocaleDateString('en-GB');
  doc.text(`Date: ${today}`, 150, 40);
  
  // Client Information
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('Client Information', 20, 50);
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  let yPos = 58;
  
  if (formData.name) {
    doc.text(`Name: ${formData.name}`, 20, yPos);
    yPos += 6;
  }
  if (formData.email) {
    doc.text(`Email: ${formData.email}`, 20, yPos);
    yPos += 6;
  }
  if (formData.phone) {
    doc.text(`Phone: ${formData.phone}`, 20, yPos);
    yPos += 6;
  }
  if (formData.address) {
    doc.text(`Address: ${formData.address}`, 20, yPos);
    yPos += 6;
  }
  
  yPos += 4;
  
  // Project Details
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('Project Details', 20, yPos);
  yPos += 8;
  
  // Create table data
  const projectData = [
    ['Facade Type', formData.facadeType || 'N/A'],
    ['Current Condition', formData.condition || 'N/A'],
    ['Surface Area', formData.surfaceArea || 'N/A'],
    ['Desired Finish', formData.finish || 'N/A'],
    ['Treatments', formData.treatments?.join(', ') || 'None'],
    ['Timeline', formData.timeline || 'N/A']
  ];
  
  doc.autoTable({
    startY: yPos,
    head: [['Item', 'Details']],
    body: projectData,
    theme: 'striped',
    headStyles: { fillColor: [34, 139, 34] },
    margin: { left: 20, right: 20 }
  });
  
  yPos = doc.lastAutoTable.finalY + 10;
  
  // Analysis Results
  if (result) {
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Professional Analysis', 20, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    
    // Split analysis text into lines
    const analysisLines = doc.splitTextToSize(result, 170);
    doc.text(analysisLines, 20, yPos);
    yPos = yPos + (analysisLines.length * 5) + 10;
  }
  
  // Add new page for images if needed
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }
  
  // Before/After Images
  if (uploadedImage || generatedImage) {
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Visualization', 20, yPos);
    yPos += 8;
    
    const imgWidth = 80;
    const imgHeight = 60;
    
    if (uploadedImage) {
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('Before:', 20, yPos);
      yPos += 5;
      
      try {
        doc.addImage(uploadedImage, 'JPEG', 20, yPos, imgWidth, imgHeight);
      } catch (e) {
        console.error('Error adding before image:', e);
      }
    }
    
    if (generatedImage) {
      const xOffset = uploadedImage ? 110 : 20;
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('After:', xOffset, yPos);
      yPos += 5;
      
      try {
        doc.addImage(generatedImage, 'PNG', xOffset, yPos, imgWidth, imgHeight);
      } catch (e) {
        console.error('Error adding after image:', e);
      }
    }
    
    yPos += imgHeight + 10;
  }
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('This is an automated estimate. Final pricing may vary after on-site inspection.', 20, 285);
  doc.text('Contact us at info@spraystone.be | www.spraystone.be', 20, 290);
  
  // Save PDF
  const fileName = `Spraystone_Quote_${formData.name || 'Client'}_${today.replace(/\//g, '-')}.pdf`;
  doc.save(fileName);
};
