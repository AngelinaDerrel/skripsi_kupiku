export async function downloadPdfFromElement(element, filename) {
  const { default: html2pdf } = await import('html2pdf.js');
  await html2pdf()
    .set({
      margin: 0,
      filename,
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    })
    .from(element)
    .save();
}
