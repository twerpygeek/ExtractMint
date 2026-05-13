export type ProgressStage =
  | 'ready'
  | 'reading'
  | 'ocr'
  | 'extracting'
  | 'exporting'
  | 'complete'
  | 'error'

export type ProgressEvent = {
  fileName: string
  stage: ProgressStage
  percent: number
  detail: string
}

export type ExtractedRow = {
  date?: string
  description: string
  amount?: number
  balance?: number
  category: string
  confidence: number
  source: string
}

export type ConversionResult = {
  fileName: string
  fileType: string
  rawText: string
  rows: ExtractedRow[]
  confidence: number
  processedAt: string
  summary: {
    title: string
    documentKind: string
    total: number
    vendor?: string
    notes: string[]
  }
}

type ProgressCallback = (event: ProgressEvent) => void

const datePattern =
  /(?:\b\d{4}[-/.]\d{1,2}[-/.]\d{1,2}\b|\b\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}\b|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{2,4}\b)/i
const amountPattern =
  /[-+]?(?:[$€£]\s*)?\(?\d{1,3}(?:,\d{3})+(?:\.\d{2})?\)?|[-+]?(?:[$€£]\s*)?\(?\d+\.\d{2}\)?|[-+]?[$€£]\s*\(?\d+\)?/g

export async function convertFiles(files: File[], onProgress: ProgressCallback) {
  const results: ConversionResult[] = []

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index]
    const basePercent = Math.round((index / files.length) * 100)

    onProgress({
      fileName: file.name,
      stage: 'reading',
      percent: basePercent,
      detail: 'Reading file contents',
    })

    const rawText = await extractText(file, (event) => {
      onProgress({
        ...event,
        percent: Math.min(
          96,
          Math.round(basePercent + event.percent / Math.max(files.length, 1)),
        ),
      })
    })

    onProgress({
      fileName: file.name,
      stage: 'extracting',
      percent: Math.min(98, basePercent + 18),
      detail: 'Finding rows, totals, and document signals',
    })

    results.push(parseRawText(rawText, file.name, file.type || extensionOf(file.name)))
  }

  return results
}

export function createSampleResult(): ConversionResult {
  const sample = `
ExtractMint Business Checking
Statement period Apr 01 2026 - Apr 30 2026
04/02/2026 STRIPE PAYOUT INV-1082 8,420.00 24,991.20
04/05/2026 AWS CLOUD SERVICES (842.10) 24,149.10
04/08/2026 CLIENT ACME RETAINER 12,500.00 36,649.10
04/12/2026 NOTION LABS (96.00) 36,553.10
04/15/2026 PAYROLL RUN (7,840.00) 28,713.10
04/22/2026 WIRE INCOMING NORTHSTAR 9,600.00 38,313.10
04/28/2026 TOTAL FEES (45.00) 38,268.10
Ending balance 38,268.10
`

  return parseRawText(sample, 'sample-bank-statement.pdf', 'application/pdf')
}

export async function createExcelBlob(result: ConversionResult) {
  const ExcelJS = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'ExtractMint'
  workbook.created = new Date()

  const summary = workbook.addWorksheet('Summary')
  summary.columns = [
    { header: 'File', key: 'file', width: 34 },
    { header: 'Kind', key: 'kind', width: 18 },
    { header: 'Confidence', key: 'confidence', width: 16 },
    { header: 'Total', key: 'total', width: 16 },
    { header: 'Processed', key: 'processed', width: 26 },
  ]
  summary.addRow({
    file: result.fileName,
    kind: result.summary.documentKind,
    confidence: `${result.confidence}%`,
    total: result.summary.total,
    processed: result.processedAt,
  })

  const rows = workbook.addWorksheet('Rows')
  rows.columns = [
    { header: 'Date', key: 'date', width: 18 },
    { header: 'Description', key: 'description', width: 46 },
    { header: 'Amount', key: 'amount', width: 16 },
    { header: 'Balance', key: 'balance', width: 16 },
    { header: 'Category', key: 'category', width: 18 },
    { header: 'Confidence', key: 'confidence', width: 16 },
    { header: 'Source', key: 'source', width: 18 },
  ]
  result.rows.forEach((row) => {
    rows.addRow({
      date: row.date ?? '',
      description: row.description,
      amount: row.amount ?? '',
      balance: row.balance ?? '',
      category: row.category,
      confidence: `${row.confidence}%`,
      source: row.source,
    })
  })
  ;[summary, rows].forEach((sheet) => {
    sheet.getRow(1).font = { bold: true }
    sheet.views = [{ state: 'frozen', ySplit: 1 }]
  })

  const buffer = await workbook.xlsx.writeBuffer()
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

export function createCsvBlob(result: ConversionResult) {
  const rows = [
    ['Date', 'Description', 'Amount', 'Balance', 'Category', 'Confidence', 'Source'],
    ...result.rows.map((row) => [
      row.date ?? '',
      row.description,
      String(row.amount ?? ''),
      String(row.balance ?? ''),
      row.category,
      `${row.confidence}%`,
      row.source,
    ]),
  ]
  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
        .join(','),
    )
    .join('\n')

  return new Blob([csv], { type: 'text/csv;charset=utf-8' })
}

export async function createDocxBlob(result: ConversionResult) {
  const {
    Document,
    HeadingLevel,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
  } = await import('docx')
  const tableRows = [
    new TableRow({
      children: ['Date', 'Description', 'Amount', 'Balance', 'Type'].map(
        (label) =>
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })],
          }),
      ),
    }),
    ...result.rows.map(
      (row) =>
        new TableRow({
          children: [
            row.date ?? '',
            row.description,
            money(row.amount),
            money(row.balance),
            row.category,
          ].map((value) => new TableCell({ children: [new Paragraph(value)] })),
        }),
    ),
  ]

  const document = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: result.summary.title,
            heading: HeadingLevel.TITLE,
          }),
          new Paragraph(`Source file: ${result.fileName}`),
          new Paragraph(`Detected type: ${result.summary.documentKind}`),
          new Paragraph(`Confidence: ${result.confidence}%`),
          new Paragraph(''),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: tableRows,
          }),
        ],
      },
    ],
  })

  return Packer.toBlob(document)
}

export function createPdfBlob(result: ConversionResult) {
  return createPdfBlobAsync(result)
}

async function createPdfBlobAsync(result: ConversionResult) {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
  const margin = 44
  let y = margin

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(22)
  pdf.text(result.summary.title, margin, y)
  y += 30

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(10)
  pdf.text(`Source: ${result.fileName}`, margin, y)
  y += 16
  pdf.text(`Detected type: ${result.summary.documentKind}`, margin, y)
  y += 16
  pdf.text(`Confidence: ${result.confidence}%`, margin, y)
  y += 28

  pdf.setFont('helvetica', 'bold')
  pdf.text('Date', margin, y)
  pdf.text('Description', margin + 82, y)
  pdf.text('Amount', margin + 350, y)
  pdf.text('Balance', margin + 440, y)
  y += 12
  pdf.line(margin, y, 552, y)
  y += 18

  pdf.setFont('helvetica', 'normal')
  result.rows.slice(0, 28).forEach((row) => {
    if (y > 742) {
      pdf.addPage()
      y = margin
    }
    pdf.text(row.date ?? '-', margin, y)
    pdf.text(pdf.splitTextToSize(row.description, 245), margin + 82, y)
    pdf.text(money(row.amount), margin + 350, y)
    pdf.text(money(row.balance), margin + 440, y)
    y += 24
  })

  return pdf.output('blob')
}

async function extractText(file: File, onProgress: ProgressCallback) {
  const extension = extensionOf(file.name)

  if (file.type === 'application/pdf' || extension === 'pdf') {
    return extractPdfText(file, onProgress)
  }

  if (file.type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'tif', 'tiff'].includes(extension)) {
    return extractImageText(file, onProgress)
  }

  if (extension === 'docx') {
    return extractDocxText(file)
  }

  if (['xlsx', 'xls'].includes(extension)) {
    return extractWorkbookText(file)
  }

  return file.text()
}

async function extractPdfText(file: File, onProgress: ProgressCallback) {
  const [pdfjs, worker] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.mjs?url'),
  ])
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjs.getDocument({ data: buffer }).promise
  const chunks: string[] = []

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber)
    const content = await page.getTextContent()
    const text = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .filter(Boolean)
      .join(' ')
    chunks.push(`Page ${pageNumber}\n${text}`)
    onProgress({
      fileName: file.name,
      stage: 'reading',
      percent: Math.round((pageNumber / pdf.numPages) * 72),
      detail: `Read page ${pageNumber} of ${pdf.numPages}`,
    })
  }

  return chunks.join('\n')
}

async function extractImageText(file: File, onProgress: ProgressCallback) {
  const { recognize } = await import('tesseract.js')
  const result = await recognize(file, 'eng', {
    logger: (message) => {
      if (message.status === 'recognizing text') {
        onProgress({
          fileName: file.name,
          stage: 'ocr',
          percent: Math.round((message.progress ?? 0) * 90),
          detail: 'Running receipt OCR',
        })
      }
    },
  })

  return result.data.text
}

async function extractDocxText(file: File) {
  const mammoth = await import('mammoth/mammoth.browser')
  const buffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer: buffer })
  return result.value
}

async function extractWorkbookText(file: File) {
  const ExcelJS = await import('exceljs')
  const buffer = await file.arrayBuffer()
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)
  const chunks: string[] = []
  workbook.worksheets.forEach((sheet) => {
    chunks.push(`Sheet ${sheet.name}`)
    sheet.eachRow((row) => {
      const values = Array.isArray(row.values) ? row.values.slice(1) : []
      chunks.push(values.map(cellToText).join(' '))
    })
  })
  return chunks.join('\n')
}

function parseRawText(rawText: string, fileName: string, fileType: string): ConversionResult {
  const normalized = rawText
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  const lines = normalized
    .split(/\r?\n|(?<=\d{2})\s{2,}/)
    .map((line) => line.trim())
    .filter(Boolean)

  const rows = lines.flatMap((line, index) => parseLine(line, index + 1))
  const fallbackRows = rows.length > 0 ? rows : buildFallbackRows(lines)
  const summary = summarize(lines, fallbackRows, fileName)
  const confidence = scoreConfidence(fileType, fallbackRows, normalized)

  return {
    fileName,
    fileType,
    rawText: normalized,
    rows: fallbackRows,
    confidence,
    processedAt: new Date().toISOString(),
    summary,
  }
}

function parseLine(line: string, lineNumber: number): ExtractedRow[] {
  const date = line.match(datePattern)?.[0]
  const amountMatches = line.match(amountPattern) ?? []
  const parsedAmounts = amountMatches.map(parseAmount).filter(isFinite)

  if (!date && !looksLikeReceiptTotal(line)) return []
  if (parsedAmounts.length === 0) return []

  const amount = parsedAmounts.length > 1 ? parsedAmounts.at(-2) : parsedAmounts.at(-1)
  const balance = parsedAmounts.length > 1 ? parsedAmounts.at(-1) : undefined
  const description = cleanDescription(line, date, amountMatches)

  return [
    {
      date,
      description: description || line.slice(0, 90),
      amount,
      balance,
      category: classifyLine(line),
      confidence: date ? 92 : 78,
      source: `Line ${lineNumber}`,
    },
  ]
}

function buildFallbackRows(lines: string[]): ExtractedRow[] {
  const usefulLines = lines
    .filter((line) => line.length > 6)
    .slice(0, 10)
    .map((line, index) => ({
      description: line,
      amount: line.match(amountPattern)?.map(parseAmount).filter(isFinite).at(-1),
      category: classifyLine(line),
      confidence: 54,
      source: `Line ${index + 1}`,
    }))

  return usefulLines.length > 0
    ? usefulLines
    : [
        {
          description: 'No extractable text found. Try a clearer scan or server OCR mode.',
          category: 'Review',
          confidence: 20,
          source: 'Document',
        },
      ]
}

function summarize(lines: string[], rows: ExtractedRow[], fileName: string) {
  const firstMeaningful = lines.find((line) => /[a-z]/i.test(line)) ?? fileName
  const totalLine =
    lines.find((line) => /\b(total|ending balance|amount due|grand total|balance due)\b/i.test(line)) ??
    ''
  const total =
    totalLine.match(amountPattern)?.map(parseAmount).filter(isFinite).at(-1) ??
    rows.reduce((sum, row) => sum + Math.abs(row.amount ?? 0), 0)
  const lower = `${fileName} ${lines.slice(0, 15).join(' ')}`.toLowerCase()
  const documentKind = lower.includes('receipt')
    ? 'Receipt'
    : lower.includes('invoice')
      ? 'Invoice'
      : lower.includes('statement') || rows.some((row) => row.balance !== undefined)
        ? 'Statement'
        : 'Document'

  return {
    title: firstMeaningful.slice(0, 72),
    documentKind,
    total,
    vendor: firstMeaningful,
    notes: [
      `${rows.length} structured rows detected`,
      totalLine ? `Total signal: ${totalLine.slice(0, 90)}` : 'No explicit total line found',
    ],
  }
}

function scoreConfidence(fileType: string, rows: ExtractedRow[], rawText: string) {
  let score = 46
  if (fileType.includes('pdf') || fileType === 'pdf') score += 8
  if (rawText.length > 180) score += 12
  if (rows.length >= 3) score += 18
  if (rows.some((row) => row.date)) score += 10
  if (rows.some((row) => row.balance !== undefined)) score += 8
  return Math.max(20, Math.min(98, score))
}

function cleanDescription(line: string, date?: string, amountMatches: string[] = []) {
  let description = line
  if (date) description = description.replace(date, '')
  amountMatches.forEach((amount) => {
    description = description.replace(amount, '')
  })
  return description.replace(/\s{2,}/g, ' ').replace(/[-–—|]/g, ' ').trim()
}

function looksLikeReceiptTotal(line: string) {
  return /\b(total|subtotal|tax|amount due|balance due|paid)\b/i.test(line)
}

function classifyLine(line: string) {
  const lower = line.toLowerCase()
  if (/\b(total|balance|amount due|grand total)\b/.test(lower)) return 'Total'
  if (/\b(visa|mastercard|amex|card|pos|debit)\b/.test(lower)) return 'Card'
  if (/\b(payroll|salary|wages)\b/.test(lower)) return 'Payroll'
  if (/\b(stripe|paypal|payout|deposit|incoming|wire)\b/.test(lower)) return 'Income'
  if (/\b(fee|charge|subscription|aws|google|notion|software)\b/.test(lower)) return 'Expense'
  return 'Transaction'
}

function parseAmount(value: string) {
  const isNegative = value.includes('(') || value.trim().startsWith('-')
  const numeric = Number(value.replace(/[^\d.]/g, ''))
  return isNegative ? -numeric : numeric
}

function cellToText(value: unknown) {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  if (typeof value === 'object' && 'text' in value) {
    return String((value as { text: unknown }).text)
  }
  if (typeof value === 'object' && 'result' in value) {
    return String((value as { result: unknown }).result)
  }
  return String(value)
}

function extensionOf(fileName: string) {
  return fileName.split('.').pop()?.toLowerCase() ?? ''
}

function money(value?: number) {
  if (value === undefined || Number.isNaN(value)) return '-'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}
