import Tesseract from 'tesseract.js';

/**
 * Recognizes text from an image file using Tesseract.js
 * Supports both English and Greek.
 * 
 * @param {File} imageFile The image file to process
 * @param {Function} onProgress Optional callback for progress updates (0-1)
 * @returns {Promise<string>} The extracted text
 */
export const recognizeText = async (imageFile, onProgress = () => { }) => {
    try {
        const worker = await Tesseract.createWorker({
            logger: m => {
                if (m.status === 'recognizing text') {
                    onProgress(m.progress);
                }
            }
        });

        // Load languages: English and Greek
        await worker.loadLanguage('eng+ell');
        await worker.initialize('eng+ell');

        const { data: { text } } = await worker.recognize(imageFile);

        await worker.terminate();
        return text;
    } catch (error) {
        console.error("OCR Error:", error);
        throw new Error("Failed to recognize text from image.");
    }
};
