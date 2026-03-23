type Variant = 'blue' | 'orange' | 'green' | 'purple'

type MapNodeProps = {
  label: string
  variant: Variant
  className?: string
}

const variantClasses: Record<Variant, string> = {
  blue: 'bg-[linear-gradient(180deg,#3f8cff_0%,#2b6de6_100%)]',
  orange: 'bg-[linear-gradient(180deg,#ffb34f_0%,#f0852e_100%)]',
  green: 'bg-[linear-gradient(180deg,#4dcc8a_0%,#2ba86d_100%)]',
  purple: 'bg-[linear-gradient(180deg,#8a6bff_0%,#6b48d9_100%)]',
}

function MapNode({ label, variant, className = '' }: MapNodeProps) {
  return (
    <div
      className={`rounded-lg px-5 py-3 text-center text-lg font-semibold text-white shadow-[0_8px_16px_rgba(28,51,96,0.18)] ${variantClasses[variant]} ${className}`}
    >
      {label}
    </div>
  )
}

export default MapNode
