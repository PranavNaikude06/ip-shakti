import type { ReactNode } from 'react'

interface MetricCardProps {
  label: string
  value: number | string
  trend?: number
  icon: ReactNode
  accent?: string
  featured?: boolean
}

export default function MetricCard({ label, value, trend, icon, accent = '#E9684F', featured = false }: MetricCardProps) {
  const trendPositive = trend !== undefined && trend > 0
  const trendNegative = trend !== undefined && trend < 0

  return (
    <div
      style={{
        background: '#FFFDF8',
        borderRadius: '8px',
        border: `1px solid ${featured ? '#F0B5A8' : '#DFC0B7'}`,
        borderTop: featured ? `3px solid ${accent}` : `1px solid ${featured ? '#F0B5A8' : '#DFC0B7'}`,
        boxShadow: '0 1px 2px rgba(23, 63, 42, 0.06)',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: '10px',
          fontWeight: 600,
          color: '#7A9285',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          fontFamily: 'Manrope, system-ui, sans-serif',
        }}>
          {label}
        </span>
        <span style={{ color: accent, display: 'flex', alignItems: 'center', opacity: 0.85 }}>{icon}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
        <span style={{
          fontSize: '40px',
          fontWeight: 400,
          fontFamily: "'DM Serif Display', Georgia, serif",
          color: '#173F2A',
          lineHeight: 1,
          letterSpacing: '-0.02em',
        }}>
          {value}
        </span>
      </div>
      {trend !== undefined && trend !== 0 ? (
        <span style={{
          fontSize: '11px',
          fontWeight: 500,
          color: trendPositive ? '#E9684F' : trendNegative ? '#CF5A3D' : '#7A9285',
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
          fontFamily: 'Manrope, system-ui, sans-serif',
        }}>
          {trendPositive ? '↑' : '↓'} {Math.abs(trend)} vs last month
        </span>
      ) : (
        <span style={{ fontSize: '11px', color: '#C4AFA9', fontFamily: 'Manrope, system-ui, sans-serif' }}>No change</span>
      )}
    </div>
  )
}
