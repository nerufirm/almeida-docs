import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PdfMapping {
  fieldId: string;
  x: number;
  y: number;
  fontSize?: number;
  maxWidth?: number;
}

export interface DocumentSchema {
  id: string;
  name: string;
  pdfMappings: PdfMapping[];
}

export interface LabeledField {
  label: string;
  value: string;
}

export interface PdfSections {
  employeeInfo: LabeledField[];
  formData: LabeledField[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const MARGIN = 50;
const CONTENT_WIDTH = A4_WIDTH - MARGIN * 2;

// Colors
const COLOR_TITLE = rgb(0.35, 0.22, 0.15);       // #5A3825
const COLOR_SECTION = rgb(0.35, 0.22, 0.15);
const COLOR_LABEL = rgb(0.63, 0.50, 0.44);        // #A08070
const COLOR_VALUE = rgb(0.2, 0.2, 0.2);           // #333
const COLOR_LINE = rgb(0.91, 0.83, 0.79);         // #E8D4CA
const COLOR_BG_HEADER = rgb(1.0, 0.96, 0.94);     // #FFF5F0
const COLOR_BG_SECTION = rgb(0.96, 0.94, 0.92);   // #F5F0EB

// ---------------------------------------------------------------------------
// Font loader
// ---------------------------------------------------------------------------

async function loadFonts(pdfDoc: Awaited<ReturnType<typeof PDFDocument.create>>): Promise<{ font: PDFFont; boldFont: PDFFont }> {
  pdfDoc.registerFontkit(fontkit);
  try {
    const fontResponse = await fetch('/NotoSansJP-Regular.otf');
    const fontBytes = await fontResponse.arrayBuffer();
    const font = await pdfDoc.embedFont(fontBytes);
    return { font, boldFont: font };
  } catch {
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    return { font, boldFont };
  }
}

// ---------------------------------------------------------------------------
// Drawing helpers
// ---------------------------------------------------------------------------

function drawRoundedRect(
  page: PDFPage,
  x: number,
  y: number,
  w: number,
  h: number,
  fillColor: ReturnType<typeof rgb>,
): void {
  page.drawRectangle({
    x,
    y,
    width: w,
    height: h,
    color: fillColor,
    borderWidth: 0,
    opacity: 1,
  });
}

function drawHorizontalLine(
  page: PDFPage,
  x: number,
  y: number,
  width: number,
): void {
  page.drawLine({
    start: { x, y },
    end: { x: x + width, y },
    thickness: 0.5,
    color: COLOR_LINE,
  });
}

/**
 * Draw text that wraps within maxWidth, returning the number of lines used.
 */
function drawWrappedText(
  page: PDFPage,
  text: string,
  font: PDFFont,
  fontSize: number,
  x: number,
  y: number,
  maxWidth: number,
  color: ReturnType<typeof rgb>,
): number {
  const chars = text.split('');
  const lines: string[] = [];
  let currentLine = '';

  for (const char of chars) {
    const candidate = currentLine + char;
    const width = font.widthOfTextAtSize(candidate, fontSize);
    if (width > maxWidth && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = char;
    } else {
      currentLine = candidate;
    }
  }
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }
  if (lines.length === 0) lines.push('');

  const lineHeight = fontSize * 1.6;
  for (let i = 0; i < lines.length; i++) {
    page.drawText(lines[i], {
      x,
      y: y - i * lineHeight,
      size: fontSize,
      font,
      color,
    });
  }

  return lines.length;
}

// ---------------------------------------------------------------------------
// Structured PDF generation
// ---------------------------------------------------------------------------

export async function generatePdf(
  _templatePdfBytes: Uint8Array | null,
  _formData: Record<string, string | number | boolean>,
  schema: DocumentSchema,
  sections?: PdfSections,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const { font, boldFont } = await loadFonts(pdfDoc);

  // If no sections provided, fall back to simple key-value rendering
  if (!sections) {
    return generateSimplePdf(pdfDoc, _formData, schema, font, boldFont);
  }

  let page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
  let cursorY = A4_HEIGHT - MARGIN;

  function ensureSpace(needed: number): void {
    if (cursorY - needed < MARGIN + 30) {
      // Add page number to current page
      const pages = pdfDoc.getPages();
      drawPageNumber(page, font, pages.length);
      // New page
      page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
      cursorY = A4_HEIGHT - MARGIN;
    }
  }

  function drawPageNumber(p: PDFPage, f: PDFFont, num: number): void {
    const label = `- ${num} -`;
    const tw = f.widthOfTextAtSize(label, 8);
    p.drawText(label, {
      x: (A4_WIDTH - tw) / 2,
      y: 25,
      size: 8,
      font: f,
      color: COLOR_LABEL,
    });
  }

  // === Document Title ===
  // Header background
  drawRoundedRect(page, MARGIN - 10, cursorY - 35, CONTENT_WIDTH + 20, 45, COLOR_BG_HEADER);

  const titleText = schema.name;
  const titleWidth = boldFont.widthOfTextAtSize(titleText, 16);
  const titleX = (A4_WIDTH - titleWidth) / 2;
  page.drawText(titleText, {
    x: titleX,
    y: cursorY - 22,
    size: 16,
    font: boldFont,
    color: COLOR_TITLE,
  });

  cursorY -= 60;

  // === Date line ===
  const today = new Date();
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日 作成`;
  const dateWidth = font.widthOfTextAtSize(dateStr, 9);
  page.drawText(dateStr, {
    x: MARGIN + CONTENT_WIDTH - dateWidth,
    y: cursorY,
    size: 9,
    font,
    color: COLOR_LABEL,
  });
  cursorY -= 20;

  // === Section: 基本情報 ===
  if (sections.employeeInfo.length > 0) {
    ensureSpace(30);
    // Section header
    drawRoundedRect(page, MARGIN - 5, cursorY - 15, CONTENT_WIDTH + 10, 22, COLOR_BG_SECTION);
    page.drawText('申請者基本情報', {
      x: MARGIN + 5,
      y: cursorY - 10,
      size: 11,
      font: boldFont,
      color: COLOR_SECTION,
    });
    cursorY -= 30;

    // Two-column layout for basic info
    const colWidth = (CONTENT_WIDTH - 20) / 2;
    const items = sections.employeeInfo;

    for (let i = 0; i < items.length; i += 2) {
      ensureSpace(35);

      // Left column
      const left = items[i];
      page.drawText(left.label, {
        x: MARGIN + 5,
        y: cursorY,
        size: 8,
        font,
        color: COLOR_LABEL,
      });
      const leftLines = drawWrappedText(page, left.value || '-', font, 10, MARGIN + 5, cursorY - 14, colWidth - 10, COLOR_VALUE);

      // Right column (if exists)
      let rightLines = 1;
      if (i + 1 < items.length) {
        const right = items[i + 1];
        page.drawText(right.label, {
          x: MARGIN + colWidth + 15,
          y: cursorY,
          size: 8,
          font,
          color: COLOR_LABEL,
        });
        rightLines = drawWrappedText(page, right.value || '-', font, 10, MARGIN + colWidth + 15, cursorY - 14, colWidth - 10, COLOR_VALUE);
      }

      const maxLines = Math.max(leftLines, rightLines);
      cursorY -= 14 + maxLines * 16 + 6;

      drawHorizontalLine(page, MARGIN, cursorY + 2, CONTENT_WIDTH);
      cursorY -= 4;
    }

    cursorY -= 10;
  }

  // === Section: 申請内容 ===
  if (sections.formData.length > 0) {
    ensureSpace(30);
    drawRoundedRect(page, MARGIN - 5, cursorY - 15, CONTENT_WIDTH + 10, 22, COLOR_BG_SECTION);
    page.drawText('申請内容', {
      x: MARGIN + 5,
      y: cursorY - 10,
      size: 11,
      font: boldFont,
      color: COLOR_SECTION,
    });
    cursorY -= 30;

    for (const item of sections.formData) {
      ensureSpace(40);

      page.drawText(item.label, {
        x: MARGIN + 5,
        y: cursorY,
        size: 8,
        font,
        color: COLOR_LABEL,
      });

      const lines = drawWrappedText(page, item.value || '-', font, 10, MARGIN + 5, cursorY - 14, CONTENT_WIDTH - 10, COLOR_VALUE);
      cursorY -= 14 + lines * 16 + 6;

      drawHorizontalLine(page, MARGIN, cursorY + 2, CONTENT_WIDTH);
      cursorY -= 4;
    }
  }

  // Page numbers
  const allPages = pdfDoc.getPages();
  for (let i = 0; i < allPages.length; i++) {
    drawPageNumber(allPages[i], font, i + 1);
  }

  const pdfBytes = await pdfDoc.save();
  return new Uint8Array(pdfBytes);
}

// ---------------------------------------------------------------------------
// Simple fallback (coordinates-based)
// ---------------------------------------------------------------------------

async function generateSimplePdf(
  pdfDoc: Awaited<ReturnType<typeof PDFDocument.create>>,
  formData: Record<string, string | number | boolean>,
  schema: DocumentSchema,
  font: PDFFont,
  boldFont: PDFFont,
): Promise<Uint8Array> {
  const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);

  // Frame
  page.drawRectangle({
    x: 20, y: 20,
    width: A4_WIDTH - 40, height: A4_HEIGHT - 40,
    borderColor: rgb(0.6, 0.6, 0.6), borderWidth: 1, opacity: 0,
  });

  // Title
  const titleWidth = boldFont.widthOfTextAtSize(schema.name, 16);
  page.drawText(schema.name, {
    x: (A4_WIDTH - titleWidth) / 2,
    y: A4_HEIGHT - 50,
    size: 16, font: boldFont, color: COLOR_TITLE,
  });

  // Fields at mapped coordinates
  for (const mapping of schema.pdfMappings) {
    const rawValue = formData[mapping.fieldId];
    if (rawValue === undefined || rawValue === null) continue;
    const text = String(rawValue);
    const fontSize = mapping.fontSize ?? 10;

    page.drawText(text, {
      x: mapping.x,
      y: mapping.y,
      size: fontSize,
      font,
      color: COLOR_VALUE,
    });
  }

  const pdfBytes = await pdfDoc.save();
  return new Uint8Array(pdfBytes);
}

// ---------------------------------------------------------------------------
// Download helper (browser only)
// ---------------------------------------------------------------------------

export function downloadPdf(pdfBytes: Uint8Array, filename: string): void {
  const blob = new Blob([pdfBytes.slice().buffer as ArrayBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';

  document.body.appendChild(anchor);
  anchor.click();

  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
