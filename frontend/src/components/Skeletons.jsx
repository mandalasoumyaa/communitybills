import React from 'react'

export function TableRowSkeleton({ cols = 8, rows = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx} className="skeleton-row">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <td key={cIdx} style={{ padding: '16px 14px' }}>
              <div className="shimmer-effect" style={{
                height: 14,
                width: cIdx === 0 ? 50 : cIdx === 6 ? 70 : '80%',
                background: '#e2e8f0',
                borderRadius: 4,
                animation: 'pulse 1.5s infinite ease-in-out'
              }}></div>
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

export function KPICardsSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, idx) => (
        <div key={idx} className="kpi-card" style={{ minHeight: 120 }}>
          <div style={{ display: 'flex', justifyContent: 'between', marginBottom: 12 }}>
            <div className="shimmer-effect" style={{ height: 12, width: 80, background: '#e2e8f0', borderRadius: 2 }}></div>
            <div className="shimmer-effect" style={{ height: 24, width: 24, borderRadius: '50%', background: '#e2e8f0' }}></div>
          </div>
          <div className="shimmer-effect" style={{ height: 28, width: 120, background: '#e2e8f0', borderRadius: 4, marginBottom: 8 }}></div>
          <div className="shimmer-effect" style={{ height: 12, width: 60, background: '#e2e8f0', borderRadius: 2 }}></div>
        </div>
      ))}
    </>
  )
}
