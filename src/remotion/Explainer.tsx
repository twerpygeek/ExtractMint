import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'

const steps = [
  ['Upload', 'Add a PDF bank statement'],
  ['Detect', 'Find date, description, reference, withdrawal, deposit, balance'],
  ['Check', 'Preserve running balances for review'],
  ['Export', 'Download Excel, CSV, DOCX, or PDF'],
]

const rows = [
  ['13/03/2025', 'POS DEBIT', '8.18', '', '3,272.50'],
  ['17/03/2025', 'AUTOPAY CR', '', '8.18', '3,279.33'],
  ['24/03/2025', 'TR IBG', '1,000.00', '', '2,275.58'],
]

export function ExtractMintExplainer() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const pulse = spring({ frame, fps, config: { damping: 18 } })
  const scanX = interpolate(frame % 96, [0, 96], [-10, 110])

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #fbfaf6 0%, #f2f5ed 100%)',
        color: '#102029',
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 15% 16%, rgba(18,185,129,.16), transparent 26%), radial-gradient(circle at 78% 72%, rgba(216,139,38,.16), transparent 24%)',
        }}
      />
      <div style={{ position: 'relative', padding: 70 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 44 }}>
          <LogoTile scale={0.92 + pulse * 0.08} />
          <div style={{ fontSize: 30, fontWeight: 850 }}>ExtractMint</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '0.82fr 1.18fr', gap: 54 }}>
          <div>
            <div
              style={{
                color: '#087a65',
                fontSize: 20,
                fontWeight: 850,
                letterSpacing: 2,
                textTransform: 'uppercase',
                marginBottom: 18,
              }}
            >
              Statement to spreadsheet
            </div>
            <h1
              style={{
                maxWidth: 650,
                margin: 0,
                fontSize: 82,
                lineHeight: 0.94,
                letterSpacing: 0,
              }}
            >
              What the converter actually does.
            </h1>
            <p
              style={{
                margin: '28px 0 0',
                maxWidth: 620,
                color: '#52636a',
                fontSize: 28,
                lineHeight: 1.35,
              }}
            >
              It reads the bank statement table, keeps transaction numbers in their own
              columns, then exports a workbook ready for reconciliation.
            </p>
          </div>

          <div
            style={{
              position: 'relative',
              display: 'grid',
              gridTemplateColumns: '0.9fr 140px 1.1fr',
              gap: 22,
              alignItems: 'center',
              minHeight: 430,
              padding: 26,
              borderRadius: 30,
              background: '#102029',
              boxShadow: '0 34px 90px rgba(16,32,41,.2)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${scanX}%`,
                width: 100,
                background:
                  'linear-gradient(90deg, transparent, rgba(183,255,228,.24), transparent)',
              }}
            />
            <StatementCard />
            <div style={{ display: 'grid', gap: 12, zIndex: 1 }}>
              <PipelinePill label="detect columns" />
              <PipelinePill label="check balances" delay={0.3} />
            </div>
            <WorkbookCard />
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
            marginTop: 42,
          }}
        >
          {steps.map(([title, copy], index) => {
            const opacity = interpolate(frame, [index * 18, index * 18 + 18], [0.3, 1], {
              extrapolateRight: 'clamp',
            })
            return (
              <div
                key={title}
                style={{
                  opacity,
                  padding: 22,
                  border: '1px solid rgba(16,32,41,.08)',
                  borderRadius: 18,
                  background: 'rgba(255,255,255,.74)',
                }}
              >
                <div style={{ color: '#087a65', fontWeight: 900, marginBottom: 8 }}>
                  0{index + 1}
                </div>
                <div style={{ fontSize: 26, fontWeight: 850, marginBottom: 8 }}>{title}</div>
                <div style={{ color: '#52636a', fontSize: 17, lineHeight: 1.35 }}>{copy}</div>
              </div>
            )
          })}
        </div>
      </div>
    </AbsoluteFill>
  )
}

function LogoTile({ scale }: { scale: number }) {
  return (
    <div
      style={{
        width: 58,
        height: 58,
        borderRadius: 14,
        display: 'grid',
        placeItems: 'center',
        background: '#f7fbf5',
        color: '#102029',
        boxShadow: 'inset 0 0 0 2px rgba(16,32,41,.12)',
        transform: `scale(${scale})`,
      }}
    >
      <svg width="34" height="34" viewBox="0 0 32 32">
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
    </div>
  )
}

function PipelinePill({ label, delay = 0 }: { label: string; delay?: number }) {
  const frame = useCurrentFrame()
  const opacity = interpolate((frame + delay * 30) % 60, [0, 30, 60], [0.45, 1, 0.45])

  return (
    <div
      style={{
        opacity,
        border: '1px solid rgba(183,255,228,.24)',
        borderRadius: 999,
        padding: '13px 12px',
        color: '#d9fff0',
        fontSize: 14,
        fontWeight: 820,
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: 1,
      }}
    >
      {label}
    </div>
  )
}

function StatementCard() {
  return (
    <div
      style={{
        zIndex: 1,
        borderRadius: 20,
        overflow: 'hidden',
        background: '#fffdf7',
        color: '#102029',
      }}
    >
      <div style={{ padding: 16, borderBottom: '1px solid #e2e8df', color: '#617078', fontSize: 14, fontWeight: 800 }}>
        PDF statement
      </div>
      {rows.map((row) => (
        <div
          key={row.join('-')}
          style={{
            display: 'grid',
            gridTemplateColumns: '0.9fr 1fr .7fr .8fr',
            gap: 8,
            padding: '14px 16px',
            borderBottom: '1px solid #e8ece7',
            fontSize: 13,
          }}
        >
          <span>{row[0]}</span>
          <span>{row[1]}</span>
          <span style={{ textAlign: 'right' }}>{row[2] || row[3]}</span>
          <span style={{ textAlign: 'right' }}>{row[4]}</span>
        </div>
      ))}
    </div>
  )
}

function WorkbookCard() {
  return (
    <div
      style={{
        zIndex: 1,
        borderRadius: 20,
        overflow: 'hidden',
        background: '#fffdf7',
        color: '#102029',
      }}
    >
      <div style={{ padding: 16, borderBottom: '1px solid #e2e8df', color: '#617078', fontSize: 14, fontWeight: 800 }}>
        Excel output
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '.75fr 1fr .8fr .72fr .8fr',
          color: '#087a65',
          fontSize: 12,
          fontWeight: 850,
        }}
      >
        {['Date', 'Description', 'Withdrawal', 'Deposit', 'Balance'].map((header) => (
          <span key={header} style={{ padding: 10, borderRight: '1px solid #dfe7df', borderBottom: '1px solid #dfe7df', background: '#eaf7ef' }}>
            {header}
          </span>
        ))}
      </div>
      {rows.map((row) => (
        <div
          key={row.join('-')}
          style={{
            display: 'grid',
            gridTemplateColumns: '.75fr 1fr .8fr .72fr .8fr',
            fontSize: 12,
          }}
        >
          {[row[0], row[1], row[2], row[3], row[4]].map((cell, index) => (
            <span
              key={`${cell}-${index}`}
              style={{
                minHeight: 38,
                padding: 10,
                borderRight: '1px solid #dfe7df',
                borderBottom: '1px solid #dfe7df',
                background: index >= 2 ? '#f3f8f1' : '#fbfdf8',
                textAlign: index >= 2 ? 'right' : 'left',
              }}
            >
              {cell}
            </span>
          ))}
        </div>
      ))}
    </div>
  )
}
