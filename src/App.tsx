import { AnimatePresence, motion } from 'framer-motion'
import {
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
  Sparkles,
  UploadCloud,
  Wand2,
} from 'lucide-react'
import { type DragEvent, useMemo, useRef, useState } from 'react'
import './App.css'
import {
  convertFiles,
  createCsvBlob,
  createDocxBlob,
  createExcelBlob,
  createPdfBlob,
  createSampleResult,
  type ConversionResult,
  type ProgressEvent,
} from './lib/converter'

const supportItems = [
  { icon: FileText, label: 'PDF statements' },
  { icon: ReceiptText, label: 'Receipts' },
  { icon: FileArchive, label: 'DOCX and images' },
  { icon: FileSpreadsheet, label: 'XLSX and CSV' },
]

const workflow = [
  {
    title: 'Drop the file',
    copy: 'PDF, receipt image, spreadsheet, DOCX, TXT, or CSV.',
  },
  {
    title: 'Extract the structure',
    copy: 'Dates, descriptions, totals, balances, and document notes.',
  },
  {
    title: 'Export cleanly',
    copy: 'Excel, Google Docs-ready DOCX, CSV, and PDF outputs.',
  },
]

const metrics = [
  ['40+', 'file and table patterns'],
  ['Local', 'browser-side processing'],
  ['4', 'export formats'],
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

  const downloadBlob = async (format: 'xlsx' | 'csv' | 'docx' | 'pdf') => {
    if (!activeResult) return

    const creators = {
      xlsx: createExcelBlob,
      csv: createCsvBlob,
      docx: createDocxBlob,
      pdf: createPdfBlob,
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

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="ExtractMint home">
          <span className="brand-mark">
            <Sparkles size={18} />
          </span>
          <span>ExtractMint</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#converter">Converter</a>
          <a href="#formats">Formats</a>
          <a href="#video">Demo</a>
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
            ExtractMint.com checked via RDAP, unregistered today
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            Turn messy financial documents into clean working files.
          </motion.h1>
          <motion.p
            className="hero-lede"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            A startup-style replacement for old bank statement converters, built
            for statements, receipts, invoices, scans, and office documents.
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
          <div className="converter-card" id="converter">
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
              <span className="drop-icon">
                <Cloud size={28} />
              </span>
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
            </div>
          </div>
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
                  <div className="confidence-pill">
                    <BadgeCheck size={16} />
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
                </div>

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Amount</th>
                        <th>Balance</th>
                        <th>Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(activeResult?.rows ?? []).slice(0, 8).map((row, index) => (
                        <tr key={`${row.description}-${index}`}>
                          <td>{row.date || 'Detected'}</td>
                          <td>{row.description}</td>
                          <td>{formatAmount(row.amount)}</td>
                          <td>{formatAmount(row.balance)}</td>
                          <td>{row.category}</td>
                        </tr>
                      ))}
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
          <span className="eyebrow">Remotion + HyperFrames-ready</span>
          <h2>The walkthrough is designed as motion, not a wall of instructions.</h2>
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
        <div className="motion-preview" aria-label="Animated product flow preview">
          <motion.div
            className="scan-line"
            animate={{ x: ['-5%', '105%'] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="motion-doc">
            <span />
            <span />
            <span />
            <span />
          </div>
          <Wand2 size={30} />
          <div className="motion-sheet">
            {Array.from({ length: 16 }).map((_, index) => (
              <span key={index} />
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
          <Sparkles size={22} />
          <h3>Ready for SaaS scale</h3>
          <p>The UI leaves room for paid credits, API keys, and team workflows.</p>
        </div>
      </section>

      <footer>
        <strong>ExtractMint</strong>
        <span>Document extraction for operators, accountants, and founders.</span>
      </footer>

      {isProcessing && (
        <div className="processing-toast">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          >
            <Sparkles size={18} />
          </motion.div>
          Extracting structure...
        </div>
      )}
    </main>
  )
}

function formatAmount(value?: number) {
  if (value === undefined || Number.isNaN(value)) return '-'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

export default App
