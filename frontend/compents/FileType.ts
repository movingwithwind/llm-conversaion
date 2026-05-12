// 🖼 图片类型
 const IMAGE_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
];

// 📄 文本类型
 const TEXT_MIME_TYPES = [
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
];

// 📄 HTML
 const HTML_MIME_TYPES = [
  'text/html',
];

// 📄 PDF
 const PDF_MIME_TYPES = [
  'application/pdf',
];

// 📄 Word
 const DOCX_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

// 📄 Excel
 const EXCEL_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export const SUPPORTED_MIME_TYPES = [
  ...IMAGE_MIME_TYPES,
  ...TEXT_MIME_TYPES,
  ...HTML_MIME_TYPES,
  ...PDF_MIME_TYPES,
  ...DOCX_MIME_TYPES,
  ...EXCEL_MIME_TYPES,
];