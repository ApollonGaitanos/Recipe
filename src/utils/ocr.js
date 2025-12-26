import { createWorker } from 'tesseract.js';

/**
 * Recognizes text from an image file using Tesseract.js
 * Supports both English and Greek.
 * 
 * @param {File} imageFile The image file to process
 * @param {Function} onProgress Optional callback for progress updates
 * @returns {Promise<string>} The extracted text
 */
export const recognizeText = async (imageFile, onProgress = () => { }) => {
    try {
        // Tesseract v6/v7: createWorker(langs, oem, options)
        // OEM 1 = LSTM (Neural Nets), which is the default and good for accuracy.
        const worker = await createWorker('eng+ell', 1, {
            logger: m => {
                onProgress({ status: m.status, progress: m.progress || 0 });
            }
        });

        // Worker is already initialized with 'eng+ell' by createWorker
        const { data: { text } } = await worker.recognize(imageFile);

        await worker.terminate();
        return text;
    } catch (error) {
        console.error("OCR Error:", error);
        throw new Error("Failed to recognize text from image.");
    }
};
