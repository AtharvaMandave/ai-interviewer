const pdfParseLib = require('pdf-parse');
const mammoth = require('mammoth');

const pdfParse = pdfParseLib;

/**
 * Extract text from uploaded resume file
 * @param {Object} file - The file object from multer
 * @returns {Promise<string>} The extracted text
 */
async function extractTextFromFile(file) {
    if (!file) {
        throw new Error('No file provided');
    }

    try {
        if (file.mimetype === 'application/pdf') {
            const data = await pdfParse(file.buffer);
            return data.text;
        } else if (
            file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            file.mimetype === 'application/msword'
        ) {
            const result = await mammoth.extractRawText({ buffer: file.buffer });
            return result.value;
        } else if (file.mimetype === 'text/plain') {
            return file.buffer.toString('utf-8');
        } else {
            throw new Error('Unsupported file type. Please upload PDF, DOCX, or TXT.');
        }
    } catch (error) {
        console.error('Text extraction error:', error);
        throw new Error(`Failed to extract text: ${error.message}`);
    }
}

module.exports = { extractTextFromFile };
