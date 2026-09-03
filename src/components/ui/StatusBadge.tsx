interface StatusBadgeProps {
  status: string
  size?: 'sm' | 'md'
}

const variants: Record<string, { bg: string; text: string; border: string }> = {
  'Completed':         { bg: '#DCE8DF', text: '#718A78', border: '#B8CFC0' },
  'Review Required':   { bg: '#FAE0DC', text: '#A94350', border: '#F0B5A8' },
  'Expert Review':     { bg: '#FCEAE5', text: '#E9684F', border: '#F0B5A8' },
  'Draft':             { bg: '#F5EDE8', text: '#8C7470', border: '#DDCCC7' },
  'Official':          { bg: '#A94350', text: '#FFFFFF', border: '#A94350' },
  'Verified':          { bg: '#E5EEE6', text: '#6B8F71', border: '#B8D4BB' },
  'Current':           { bg: '#E5EEE6', text: '#6B8F71', border: '#B8D4BB' },
  'Historical':        { bg: '#F5EDE8', text: '#8C7470', border: '#DDCCC7' },
  'Pending':           { bg: '#FCEAE5', text: '#E9684F', border: '#F0B5A8' },
  'Assigned':          { bg: '#FAE0DC', text: '#A94350', border: '#F0B5A8' },
  'Under Review':      { bg: '#FCEAE5', text: '#E9684F', border: '#F0B5A8' },
  'Resolved':          { bg: '#DCE8DF', text: '#718A78', border: '#B8CFC0' },
  'Low':               { bg: '#DCE8DF', text: '#718A78', border: '#B8CFC0' },
  'Moderate':          { bg: '#FCEAE5', text: '#E9684F', border: '#F0B5A8' },
  'High':              { bg: '#FAE0DC', text: '#A94350', border: '#F0B5A8' },
  'Likely':            { bg: '#FCEAE5', text: '#E9684F', border: '#F0B5A8' },
  'Compliant':         { bg: '#DCE8DF', text: '#718A78', border: '#B8CFC0' },
  'Overlap Detected':  { bg: '#FCEAE5', text: '#A94350', border: '#F0B5A8' },
  'Reference Detected':{ bg: '#FAE0DC', text: '#A94350', border: '#F0B5A8' },
  'No Overlap':        { bg: '#DCE8DF', text: '#718A78', border: '#B8CFC0' },
  'AYUSH':             { bg: '#FCEAE5', text: '#E9684F', border: '#F0B5A8' },
}

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const v = variants[status] ?? { bg: '#F5EDE8', text: '#8C7470', border: '#DDCCC7' }
  const padding = size === 'md' ? '4px 10px' : '2px 8px'
  const fontSize = size === 'md' ? '12px' : '11px'

  return (
    <span
      style={{
        backgroundColor: v.bg,
        color: v.text,
        border: `1px solid ${v.border}`,
        padding,
        fontSize,
        fontWeight: 600,
        borderRadius: '6px',
        whiteSpace: 'nowrap',
        display: 'inline-block',
        fontFamily: 'Manrope, system-ui, sans-serif',
        letterSpacing: '0.01em',
      }}
    >
      {status}
    </span>
  )
}
