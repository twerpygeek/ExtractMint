import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'

const steps = [
  ['Upload', 'Statements, receipts, invoices, scans'],
  ['Extract', 'Dates, totals, descriptions, balances'],
  ['Export', 'Excel, Google Docs-ready DOCX, PDF'],
]

export function ExtractMintExplainer() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const pulse = spring({ frame, fps, config: { damping: 14 } })
  const scanX = interpolate(frame % 90, [0, 90], [-12, 112])

  return (
    <AbsoluteFill
      style={{
        background:
          'linear-gradient(135deg, #102029 0%, #173d38 48%, #f7f1e6 100%)',
        color: '#fffdf7',
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
            'radial-gradient(circle at 20% 18%, rgba(18,185,129,.32), transparent 28%), radial-gradient(circle at 80% 75%, rgba(216,139,38,.3), transparent 24%)',
        }}
      />
      <div style={{ position: 'relative', padding: 72 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 48,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              display: 'grid',
              placeItems: 'center',
              background: '#b7ffe4',
              color: '#102029',
              fontSize: 28,
              fontWeight: 900,
              transform: `scale(${0.92 + pulse * 0.08})`,
            }}
          >
            E
          </div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>ExtractMint</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 58 }}>
          <div>
            <div
              style={{
                color: '#b7ffe4',
                fontSize: 20,
                fontWeight: 800,
                letterSpacing: 2,
                textTransform: 'uppercase',
                marginBottom: 18,
              }}
            >
              How it works
            </div>
            <h1
              style={{
                maxWidth: 610,
                margin: 0,
                fontSize: 78,
                lineHeight: 0.92,
                letterSpacing: 0,
              }}
            >
              From messy document to clean spreadsheet.
            </h1>
          </div>

          <div
            style={{
              position: 'relative',
              display: 'grid',
              gridTemplateColumns: '1fr 96px 1fr',
              gap: 20,
              alignItems: 'center',
              minHeight: 430,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 28,
                bottom: 28,
                left: `${scanX}%`,
                width: 80,
                background:
                  'linear-gradient(90deg, transparent, rgba(183,255,228,.34), transparent)',
              }}
            />
            <DocumentCard />
            <div
              style={{
                display: 'grid',
                placeItems: 'center',
                width: 96,
                height: 96,
                borderRadius: 999,
                background: '#b7ffe4',
                color: '#102029',
                fontSize: 36,
                fontWeight: 900,
                transform: `rotate(${interpolate(frame, [0, 150], [0, 24])}deg)`,
              }}
            >
              →
            </div>
            <SheetCard />
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 18,
            marginTop: 46,
          }}
        >
          {steps.map(([title, copy], index) => {
            const opacity = interpolate(frame, [index * 22, index * 22 + 18], [0.25, 1], {
              extrapolateRight: 'clamp',
            })
            return (
              <div
                key={title}
                style={{
                  opacity,
                  padding: 24,
                  border: '1px solid rgba(255,255,255,.16)',
                  borderRadius: 22,
                  background: 'rgba(255,255,255,.1)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <div style={{ color: '#b7ffe4', fontWeight: 900, marginBottom: 8 }}>
                  0{index + 1}
                </div>
                <div style={{ fontSize: 30, fontWeight: 850, marginBottom: 8 }}>
                  {title}
                </div>
                <div style={{ color: 'rgba(255,253,247,.78)', fontSize: 18 }}>{copy}</div>
              </div>
            )
          })}
        </div>
      </div>
    </AbsoluteFill>
  )
}

function DocumentCard() {
  return (
    <div
      style={{
        height: 330,
        borderRadius: 24,
        background: '#fffdf7',
        color: '#102029',
        padding: 28,
        boxShadow: '0 34px 80px rgba(0,0,0,.25)',
      }}
    >
      <div style={{ width: '52%', height: 15, borderRadius: 999, background: '#12b981' }} />
      {[82, 68, 90, 48].map((width, index) => (
        <div
          key={width}
          style={{
            width: `${width}%`,
            height: 12,
            borderRadius: 999,
            marginTop: 24,
            background: index === 3 ? 'rgba(216,139,38,.34)' : '#e2e8df',
          }}
        />
      ))}
    </div>
  )
}

function SheetCard() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 2,
        height: 330,
        padding: 2,
        borderRadius: 24,
        background: '#fffdf7',
        boxShadow: '0 34px 80px rgba(0,0,0,.25)',
        overflow: 'hidden',
      }}
    >
      {Array.from({ length: 28 }).map((_, index) => (
        <div
          key={index}
          style={{
            background:
              index % 4 === 0 || index === 11 || index === 18 ? '#b7ffe4' : '#edf1ea',
          }}
        />
      ))}
    </div>
  )
}
