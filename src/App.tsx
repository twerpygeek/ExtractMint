import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowDownToLine,
  BadgeCheck,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Cloud,
  FileArchive,
  FileSpreadsheet,
  FileText,
  LockKeyhole,
  PlayCircle,
  ReceiptText,
  ShieldCheck,
  Table2,
  UploadCloud,
} from 'lucide-react'
import { type DragEvent, useMemo, useRef, useState } from 'react'
import './App.css'
import {
  convertFiles,
  createCsvBlob,
  createDocxBlob,
  createExcelBlob,
  createPdfBlob,
  createQboBlob,
  createReviewJsonBlob,
  createReviewPackZipBlob,
  createSampleResult,
  type ConversionResult,
  type ProgressEvent,
  type ValidationSummary,
} from './lib/converter'

const supportItems = [
  { icon: FileText, label: 'PDF statements' },
  { icon: ReceiptText, label: 'Receipts' },
  { icon: FileArchive, label: 'DOCX and images' },
  { icon: FileSpreadsheet, label: 'XLSX and CSV' },
]

const workflow = [
  {
    title: 'Upload the statement',
    copy: 'Choose a PDF bank statement, receipt, invoice, spreadsheet, or scan.',
  },
  {
    title: 'Read the table layout',
    copy: 'ExtractMint keeps dates, descriptions, references, withdrawals, deposits, and balances in separate columns.',
  },
  {
    title: 'Check the balance trail',
    copy: 'Running balances are preserved so you can quickly spot missing or misread transactions.',
  },
  {
    title: 'Download the file',
    copy: 'Export Excel, CSV, DOCX, PDF, or QuickBooks-ready QBO so you can reconcile immediately.',
  },
]

const metrics = [
  ['40+', 'file and table patterns'],
  ['Local', 'browser-side processing'],
  ['5', 'export formats'],
]

const faqItems = [
  {
    question: 'What does ExtractMint convert?',
    answer:
      'It converts bank statements, receipts, invoices, PDFs, DOCX files, CSV files, spreadsheets, and image scans into structured outputs.',
  },
  {
    question: 'Does it work with bank statement tables?',
    answer:
      'Yes. For text-based PDFs it reads table positions, separates withdrawal, deposit, tax, balance, reference, date, and description columns, then exports them to Excel.',
  },
  {
    question: 'Are my files uploaded to a server?',
    answer:
      'This static version processes files in your browser. The file stays on your device unless you later add a backend conversion queue.',
  },
  {
    question: 'What files can I download?',
    answer:
      'You can download Excel XLSX, CSV, Google Docs-ready DOCX, PDF summaries, and a QuickBooks-ready QBO (OFX) file from the same extracted data.',
  },
  {
    question: 'Will scanned statements always work?',
    answer:
      'Images and scans use browser OCR, so clean scans work best. Difficult scans may need a future server OCR pipeline for higher accuracy.',
  },
  {
    question: 'Can this become a paid SaaS?',
    answer:
      'Yes. The current version is a deployable static prototype. Accounts, credits, batch jobs, API access, and audit logs can be added with a backend.',
  },
]

function App() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [results, setResults] = useState<ConversionResult[]>([createSampleResult()])
  const [activeIndex, setActiveIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState<ProgressEvent>({
    fileName: 'sample-bank-statement.pdf',
    stage: 'ready',
    percent: 100,
    detail: 'Sample conversion loaded',
  })

  const activeResult = results[activeIndex] ?? results[0]
  const totals = useMemo(() => {
    const rows = results.flatMap((result) => result.rows)
    const amount = rows.reduce((sum, row) => sum + (row.amount ?? 0), 0)
    return {
      files: results.length,
      rows: rows.length,
      amount,
      confidence:
        results.length === 0
          ? 0
          : Math.round(
              results.reduce((sum, result) => sum + result.confidence, 0) /
                results.length,
            ),
    }
  }, [results])

  const processFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList)
    if (files.length === 0) return

    setIsProcessing(true)
    setActiveIndex(0)
    try {
      const converted = await convertFiles(files, setProgress)
      setResults(converted)
      setProgress({
        fileName: files.length === 1 ? files[0].name : `${files.length} files`,
        stage: 'complete',
        percent: 100,
        detail: 'Conversion package is ready',
      })
    } catch (error) {
      setProgress({
        fileName: files.length === 1 ? files[0].name : `${files.length} files`,
        stage: 'error',
        percent: 100,
        detail: error instanceof Error ? error.message : 'Conversion failed',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setIsDragging(false)
    void processFiles(event.dataTransfer.files)
  }

  const downloadBlob = async (format: 'xlsx' | 'csv' | 'docx' | 'pdf' | 'qbo') => {
    if (!activeResult) return

    const creators = {
      xlsx: createExcelBlob,
      csv: createCsvBlob,
      docx: createDocxBlob,
      pdf: createPdfBlob,
      qbo: createQboBlob,
    }
    const blob = await creators[format](activeResult)
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    const baseName = activeResult.fileName.replace(/\.[^.]+$/, '') || 'extractmint'
    anchor.href = url
    anchor.download = `${baseName}.${format}`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const downloadReviewJson = () => {
    if (!activeResult) return
    const blob = createReviewJsonBlob(activeResult)
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    const baseName = activeResult.fileName.replace(/\.[^.]+$/, '') || 'extractmint'
    anchor.href = url
    anchor.download = `${baseName}.extractmint-review.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const downloadReviewPack = async () => {
    if (results.length === 0) return
    setIsProcessing(true)
    setProgress({
      fileName: results.length === 1 ? results[0].fileName : `${results.length} files`,
      stage: 'exporting',
      percent: 92,
      detail: 'Building review pack ZIP',
    })
    try {
      const blob = await createReviewPackZipBlob(results)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      const stamp = new Date().toISOString().slice(0, 10)
      anchor.href = url
      anchor.download = `extractmint-review-pack-${stamp}.zip`
      anchor.click()
      URL.revokeObjectURL(url)
      setProgress({
        fileName: `${results.length} files`,
        stage: 'complete',
        percent: 100,
        detail: 'Review pack downloaded',
      })
    } catch (error) {
      setProgress({
        fileName: `${results.length} files`,
        stage: 'error',
        percent: 100,
        detail: error instanceof Error ? error.message : 'Review pack export failed',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="ExtractMint home">
          <span className="brand-mark">
            <LogoMark />
          </span>
          <span>ExtractMint</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#converter">Converter</a>
          <a href="#formats">Formats</a>
          <a href="#video">Demo</a>
          <a href="#faq">FAQ</a>
        </nav>
        <a className="header-action" href="#converter">
          Try it
          <ChevronRight size={16} />
        </a>
      </header>

      <section id="top" className="hero-section">
        <div className="hero-copy">
          <motion.p
            className="eyebrow"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Bank statements to Excel, right in your browser
          </motion.p>
          <motion.h1
            className="animated-headline"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <motion.span
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
            >
              Convert bank statements
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
            >
              into clean Excel.
            </motion.span>
          </motion.h1>
          <motion.p
            className="hero-lede"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Upload a PDF statement, receipt, or invoice. ExtractMint reads the
            table, keeps the balances intact, and exports Excel, CSV, DOCX, or
            PDF without sending files to a server.
          </motion.p>
          <motion.div
            className="hero-actions"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <button className="primary-button" onClick={() => inputRef.current?.click()}>
              <UploadCloud size={18} />
              Upload files
            </button>
            <a className="secondary-button" href="#video">
              <PlayCircle size={18} />
              Watch flow
            </a>
          </motion.div>
          <div className="support-strip" id="formats">
            {supportItems.map((item) => (
              <span key={item.label}>
                <item.icon size={17} />
                {item.label}
              </span>
            ))}
          </div>
        </div>

        <motion.div
          className="product-stage"
          initial={{ opacity: 0, scale: 0.96, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.55 }}
        >
          <div className="stage-glow" />
          <motion.div
            className="scan-path"
            animate={{ x: ['-18%', '118%'], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            aria-hidden="true"
          />
          <motion.div
            className="data-chip chip-pdf"
            animate={{ y: [0, -12, 0], rotate: [-4, 3, -4] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            aria-hidden="true"
          >
            PDF
          </motion.div>
          <motion.div
            className="data-chip chip-excel"
            animate={{ y: [0, 10, 0], rotate: [5, -2, 5] }}
            transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
            aria-hidden="true"
          >
            XLSX
          </motion.div>
          <motion.div
            className="data-chip chip-balance"
            animate={{ y: [0, -9, 0], scale: [1, 1.04, 1] }}
            transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
            aria-hidden="true"
          >
            RM 3,669.19
          </motion.div>
          <div className="document-stack" aria-hidden="true">
            <motion.div
              className="paper paper-left"
              animate={{ y: [-2, 7, -2], rotate: [-8, -5, -8] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="paper paper-right"
              animate={{ y: [6, -4, 6], rotate: [7, 4, 7] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
          <motion.div
            className="converter-card"
            id="converter"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="converter-toolbar">
              <span>Live extraction desk</span>
              <div>
                <i />
                <i />
                <i />
              </div>
            </div>
            <label
              className={`dropzone ${isDragging ? 'is-dragging' : ''}`}
              onDragOver={(event) => {
                event.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <input
                ref={inputRef}
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.webp,.tif,.tiff,.docx,.txt,.csv,.xlsx,.xls"
                onChange={(event) => {
                  if (event.target.files) void processFiles(event.target.files)
                }}
              />
              <motion.span
                className="drop-icon"
                animate={{ scale: [1, 1.08, 1], rotate: [0, -2, 0] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Cloud size={28} />
              </motion.span>
              <strong>Drop documents here</strong>
              <small>or click to choose files from your desktop</small>
            </label>

            <div className="progress-panel">
              <div>
                <span>{progress.stage}</span>
                <strong>{progress.fileName}</strong>
                <small>{progress.detail}</small>
              </div>
              <div className="progress-ring" aria-label={`${progress.percent}% complete`}>
                <svg viewBox="0 0 48 48">
                  <circle cx="24" cy="24" r="20" />
                  <motion.circle
                    cx="24"
                    cy="24"
                    r="20"
                    initial={false}
                    animate={{
                      pathLength: Math.min(100, Math.max(0, progress.percent)) / 100,
                    }}
                  />
                </svg>
                <span>{progress.percent}%</span>
              </div>
            </div>

            <div className="export-row">
              <button onClick={() => void downloadBlob('xlsx')} disabled={!activeResult}>
                <FileSpreadsheet size={16} />
                Excel
              </button>
              <button onClick={downloadReviewJson} disabled={!activeResult}>
                <ShieldCheck size={16} />
                Review JSON
              </button>
              <button onClick={() => void downloadReviewPack()} disabled={results.length === 0}>
                <FileArchive size={16} />
                Review pack (ZIP)
              </button>
              <button onClick={() => void downloadBlob('docx')} disabled={!activeResult}>
                <FileText size={16} />
                Google Docs
              </button>
              <button onClick={() => void downloadBlob('pdf')} disabled={!activeResult}>
                <FileText size={16} />
                PDF
              </button>
              <button onClick={() => void downloadBlob('csv')} disabled={!activeResult}>
                <ArrowDownToLine size={16} />
                CSV
              </button>
              <button onClick={() => void downloadBlob('qbo')} disabled={!activeResult}>
                <ReceiptText size={16} />
                QuickBooks (QBO)
              </button>
            </div>
          </motion.div>
        </motion.div>
      </section>

      <section className="summary-band" aria-label="Conversion summary">
        {metrics.map(([value, label], index) => (
          <motion.div
            key={label}
            initial={{ y: 14 }}
            whileInView={{ y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.06 }}
          >
            <strong>{value}</strong>
            <span>{label}</span>
          </motion.div>
        ))}
      </section>

      <section className="results-section">
        <div className="section-heading">
          <span className="eyebrow">Converted workspace</span>
          <h2>Your outputs stay readable after export.</h2>
        </div>
        <div className="workspace-grid">
          <aside className="file-list">
            <div className="mini-stat">
              <BarChart3 size={18} />
              <span>{totals.rows} rows</span>
              <strong>{totals.confidence}% confidence</strong>
            </div>
            {results.map((result, index) => (
              <button
                key={`${result.fileName}-${index}`}
                className={index === activeIndex ? 'active' : ''}
                onClick={() => setActiveIndex(index)}
              >
                <FileText size={18} />
                <span>
                  <strong>{result.fileName}</strong>
                  <small>{result.rows.length} extracted rows</small>
                </span>
              </button>
            ))}
          </aside>

          <div className="preview-panel">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeResult?.fileName ?? 'empty'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="preview-header">
                  <div>
                    <span>{activeResult?.fileType ?? 'document'}</span>
                    <h3>{activeResult?.summary.title ?? 'No file selected'}</h3>
                  </div>
                  <div className={`confidence-pill ${validationClass(activeResult?.validation.status)}`}>
                    {activeResult?.validation.status === 'review' ? (
                      <AlertTriangle size={16} />
                    ) : (
                      <BadgeCheck size={16} />
                    )}
                    {activeResult?.confidence ?? 0}% match
                  </div>
                </div>
                <div className="summary-cards">
                  <div>
                    <span>Total detected</span>
                    <strong>
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      }).format(activeResult?.summary.total ?? totals.amount)}
                    </strong>
                  </div>
                  <div>
                    <span>Likely source</span>
                    <strong>{activeResult?.summary.documentKind ?? 'Statement'}</strong>
                  </div>
                  <div>
                    <span>Export target</span>
                    <strong>Excel, DOCX, PDF</strong>
                  </div>
                  <div className="validation-card">
                    <span>Balance check</span>
                    <strong>{validationTitle(activeResult?.validation)}</strong>
                    <small>{validationDescription(activeResult?.validation)}</small>
                  </div>
                </div>

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Amount</th>
                        <th>Balance</th>
                        <th>Review</th>
                        <th>Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(activeResult?.rows ?? []).slice(0, 8).map((row, index) => {
                        const review = rowReview(activeResult?.validation, index)
                        return (
                          <tr
                            key={`${row.description}-${index}`}
                            className={review.status === 'Review' ? 'needs-review' : ''}
                          >
                            <td>{row.date || 'Detected'}</td>
                            <td>
                              {row.description}
                              {review.note ? <small className="review-note">{review.note}</small> : null}
                            </td>
                            <td>{formatAmount(row.amount)}</td>
                            <td>{formatAmount(row.balance)}</td>
                            <td>
                              <span className={`review-pill ${review.status.toLowerCase()}`}>
                                {review.status}
                              </span>
                            </td>
                            <td>{row.category}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      <section className="workflow-section" id="video">
        <div className="section-heading">
          <span className="eyebrow">How it works</span>
          <h2>From statement PDF to Excel rows you can reconcile.</h2>
        </div>
        <div className="workflow-grid">
          {workflow.map((step, index) => (
            <motion.article
              key={step.title}
              initial={{ y: 18 }}
              whileInView={{ y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
            </motion.article>
          ))}
        </div>
        <div className="process-demo" aria-label="Animated statement conversion example">
          <motion.div
            className="scan-line"
            animate={{ x: ['-5%', '105%'] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="source-statement">
            <div className="demo-label">PDF statement</div>
            <div className="statement-row">
              <span>13/03/2025</span>
              <span>POS DEBIT</span>
              <span>8.18</span>
              <span>3,272.50</span>
            </div>
            <div className="statement-row">
              <span>17/03/2025</span>
              <span>AUTOPAY CR</span>
              <span>8.18</span>
              <span>3,279.33</span>
            </div>
            <div className="statement-row">
              <span>24/03/2025</span>
              <span>TR IBG</span>
              <span>1,000.00</span>
              <span>2,275.58</span>
            </div>
          </div>
          <div className="mapping-column">
            <motion.span
              animate={{ opacity: [0.42, 1, 0.42] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            >
              detect columns
            </motion.span>
            <motion.span
              animate={{ opacity: [1, 0.42, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            >
              verify balances
            </motion.span>
          </div>
          <div className="excel-output">
            <div className="demo-label">Excel output</div>
            <div className="excel-head">
              <span>Date</span>
              <span>Description</span>
              <span>Withdrawal</span>
              <span>Deposit</span>
              <span>Balance</span>
            </div>
            {[
              ['13/03/2025', 'POS DEBIT', '8.18', '', '3,272.50'],
              ['17/03/2025', 'AUTOPAY CR', '', '8.18', '3,279.33'],
              ['24/03/2025', 'TR IBG', '1,000.00', '', '2,275.58'],
            ].map((row) => (
              <div className="excel-row" key={row.join('-')}>
                {row.map((cell, index) => (
                  <span key={`${cell}-${index}`}>{cell}</span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="trust-section">
        <div>
          <LockKeyhole size={22} />
          <h3>Private by default</h3>
          <p>Files are parsed in the browser for this static build.</p>
        </div>
        <div>
          <CheckCircle2 size={22} />
          <h3>Messy-doc tolerant</h3>
          <p>PDF text, DOCX, sheets, images, receipts, and plain text are supported.</p>
        </div>
        <div>
          <Table2 size={22} />
          <h3>Spreadsheet-first</h3>
          <p>Rows, references, withdrawals, deposits, and balances export as usable columns.</p>
        </div>
        <div>
          <ShieldCheck size={22} />
          <h3>Ready for SaaS scale</h3>
          <p>The product can grow into credits, API keys, team access, and audit logs.</p>
        </div>
      </section>

      <section className="faq-section" id="faq">
        <div className="section-heading">
          <span className="eyebrow">FAQ</span>
          <h2>What people usually want to know before trying it.</h2>
        </div>
        <div className="faq-grid">
          {faqItems.map((item, index) => (
            <motion.details
              key={item.question}
              initial={{ opacity: 0.92, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.04 }}
            >
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </motion.details>
          ))}
        </div>
      </section>

      <footer>
        <strong>
          <span className="footer-mark">
            <LogoMark />
          </span>
          ExtractMint
        </strong>
        <span>Document extraction for operators, accountants, and founders.</span>
      </footer>

      {isProcessing && (
        <div className="processing-toast">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          >
            <Table2 size={18} />
          </motion.div>
          Extracting structure...
        </div>
      )}
    </main>
  )
}

function LogoMark() {
  return (
    <svg viewBox="0 0 32 32" role="img" aria-label="ExtractMint mark">
      <path
        d="M9 4.75h10.4L24.5 10v17.25H9z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M19.5 5v5.5H25" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M12.5 14.5h8M12.5 18.5h8M12.5 22.5h8" stroke="currentColor" strokeWidth="2" />
      <path d="M15.5 13v11" stroke="currentColor" strokeWidth="1.5" opacity="0.72" />
    </svg>
  )
}

function formatAmount(value?: number) {
  if (value === undefined || Number.isNaN(value)) return '-'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

function validationTitle(validation?: ValidationSummary) {
  if (!validation) return 'Not checked'
  if (validation.status === 'valid') return 'Verified'
  if (validation.status === 'review') return 'Needs review'
  return 'Not enough data'
}

function validationDescription(validation?: ValidationSummary) {
  if (!validation) return 'Upload a file to validate running balances.'
  if (validation.status === 'valid') {
    return `${validation.checkedRows} balance transitions matched.`
  }
  if (validation.status === 'review') {
    return `${validation.issueCount} issue${validation.issueCount === 1 ? '' : 's'} flagged.`
  }
  return 'Balances or amounts were missing from the extracted rows.'
}

function validationClass(status?: ValidationSummary['status']) {
  if (status === 'valid') return 'is-valid'
  if (status === 'review') return 'is-review'
  return 'is-missing'
}

function rowReview(validation: ValidationSummary | undefined, rowIndex: number) {
  if (!validation) return { status: 'Unvalidated', note: '' }
  const issues = validation.issues.filter((issue) => issue.rowIndex === rowIndex)
  const note = issues.map((issue) => issue.message).join(' ')
  if (issues.some((issue) => issue.severity === 'error')) return { status: 'Review', note }
  if (issues.length > 0) return { status: 'Check', note }
  if (validation.checkedRows > 0) return { status: 'Verified', note: '' }
  return { status: 'Unvalidated', note: '' }
}

export default App
