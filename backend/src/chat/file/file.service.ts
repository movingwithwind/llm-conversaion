import { BadRequestException, Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

export type ProcessedFile =
  | {
      type: 'image';
      mime: string;
      base64: string;
      detail: 'auto' | 'low' | 'high';
      url: string;
      size: number;
    }
  | { type: 'text'; text: string; url: string; size: number };

@Injectable()
export class FileService {
  async processFile(file: Express.Multer.File): Promise<ProcessedFile> {
    const mime = file.mimetype;

    // 使用同一个文件名，原文件和处理结果双存
    const baseDir = path.join(process.cwd(), 'public', 'uploads');
    const originalDir = path.join(baseDir, 'original');
    const processedDir = path.join(baseDir, 'processed');
    if (!fs.existsSync(originalDir)) {
      fs.mkdirSync(originalDir, { recursive: true });
    }
    if (!fs.existsSync(processedDir)) {
      fs.mkdirSync(processedDir, { recursive: true });
    }

    const ext = path.extname(file.originalname) || '';
    const filename = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}${ext}`;

    const originalPath = path.join(originalDir, filename);
    fs.writeFileSync(originalPath, file.buffer); // 保存原始文件

    const processedTextPath = path.join(processedDir, `${filename}.txt`);

    // url 只存文件名，后续可通过该名定位 original/processed 两个文件
    const url = filename;

    // 🖼 图片
    if (mime.startsWith('image/')) {
      return {
        type: 'image',
        mime,
        base64: file.buffer.toString('base64'),
        detail: 'auto',
        url,
        size: file.size,
      };
    }

    // 📄 通用文本（txt / md / json / csv）
    if (mime.startsWith('text/') || mime === 'application/json') {
      const text = file.buffer.toString('utf-8');
      fs.writeFileSync(processedTextPath, text, 'utf-8'); // 保存处理结果
      return {
        type: 'text',
        text,
        url,
        size: file.size,
      };
    }

    // 📄 HTML
    if (mime === 'text/html') {
      const html = file.buffer.toString('utf-8');
      const $ = cheerio.load(html);
      const text = $('body').text();
      fs.writeFileSync(processedTextPath, text, 'utf-8'); // 保存处理结果
      return {
        type: 'text',
        text,
        url,
        size: file.size,
      };
    }

    // 📄 PDF（兼容 ESM / CJS）
    if (mime === 'application/pdf') {
      const pdfModule = await import('pdf-parse');

      type PdfParseFn = (data: Buffer) => Promise<{ text: string }>;

      const pdfParse: PdfParseFn =
        (pdfModule as unknown as { default?: PdfParseFn }).default ??
        (pdfModule as unknown as PdfParseFn);

      const data = await pdfParse(file.buffer);
      fs.writeFileSync(processedTextPath, data.text, 'utf-8'); // 保存处理结果

      return {
        type: 'text',
        text: data.text,
        url,
        size: file.size,
      };
    }

    // 📄 DOCX
    if (
      mime ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const result = await mammoth.extractRawText({ buffer: file.buffer });

      fs.writeFileSync(processedTextPath, result.value, 'utf-8'); // 保存处理结果
      return {
        type: 'text',
        text: result.value,
        url,
        size: file.size,
      };
    }

    // 📄 Excel
    if (
      mime ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      let text = '';

      workbook.SheetNames.forEach((name) => {
        const sheet = workbook.Sheets[name];
        text += XLSX.utils.sheet_to_csv(sheet) + '\n';
      });

      fs.writeFileSync(processedTextPath, text, 'utf-8'); // 保存处理结果

      return {
        type: 'text',
        text,
        url,
        size: file.size,
      };
    }

    throw new BadRequestException(`不支持的文件类型: ${mime}`);
  }

  async processFiles(files: Express.Multer.File[]): Promise<ProcessedFile[]> {
    return Promise.all(files.map((file) => this.processFile(file)));
  }

  /**
   * 根据数据库里保存的 url（文件名）读取已处理结果（文本或图片）。
   * 如果不存在处理文件，则返回 undefined。
   */
  getProcessedByUrl(url: string): ProcessedFile | undefined {
    const baseDir = path.join(process.cwd(), 'public', 'uploads');
    const processedPath = path.join(baseDir, 'processed', `${url}.txt`);
    const originalPath = path.join(baseDir, 'original', url);

    if (fs.existsSync(processedPath)) {
      const text = fs.readFileSync(processedPath, 'utf-8');
      const stats = fs.statSync(processedPath);

      return {
        type: 'text',
        text,
        url,
        size: stats.size,
      };
    }

    if (fs.existsSync(originalPath)) {
      const img = fs.readFileSync(originalPath);
      const stats = fs.statSync(originalPath);
      const ext = path.extname(originalPath).toLowerCase();
      const mime = this.getMimeFromExt(ext);

      return {
        type: 'image',
        mime,
        base64: img.toString('base64'),
        detail: 'auto',
        url,
        size: stats.size,
      };
    }
  }

  getProcessedByUrls(urls: string[]): ProcessedFile[] {
    return urls
      .map((url) => this.getProcessedByUrl(url))
      .filter((item): item is ProcessedFile => Boolean(item));
  }

  private getMimeFromExt(ext: string): string {
    switch (ext) {
      case '.png':
        return 'image/png';
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.gif':
        return 'image/gif';
      case '.webp':
        return 'image/webp';
      case '.bmp':
        return 'image/bmp';
      case '.svg':
        return 'image/svg+xml';
      default:
        return 'application/octet-stream';
    }
  }
}
