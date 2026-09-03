import type { RiskLevel } from '@/data/mockData'

interface RiskMeterProps {
  level: RiskLevel
  showLabel?: boolean
}

const segments: { level: RiskLevel; color: string }[] = [
  { level: 'Low',             color: '#718A78' },
  { level: 'Moderate',        color: '#E9684F' },
  { level: 'High',            color: '#CF5A3D' },
  { level: 'Review Required', color: '#A94350' },
]

export default function RiskMeter({ level, showLabel = true }: RiskMeterProps) {
  const activeIdx = segments.findIndex(s => s.level === level)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', gap: '3px' }}>
        {segments.map((s, i) => (
          <div
            key={s.level}
            style={{
              flex: 1,
              height: '5px',
              borderRadius: '3px',
              backgroundColor: i <= activeIdx ? s.color : '#F2DDD7',
              transition: 'background-color 0.2s',
            }}
          />
        ))}
      </div>
      {showLabel && (
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: segments[activeIdx]?.color ?? '#7A9285',
            fontFamily: 'Manrope, system-ui, sans-serif',
          }}
        >
          {level}
        </span>
      )}
    </div>
  )
}
