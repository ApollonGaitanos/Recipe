import html2pdf from 'html2pdf.js';

export const generateRecipePDF = async (element, filename) => {
    const opt = {
        margin: [10, 10],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    return html2pdf().set(opt).from(element).save();
};
