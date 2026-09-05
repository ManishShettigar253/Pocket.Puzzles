import type { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
}

export default function Layout({ children, className = '', style }: LayoutProps) {
  return (
    <div
      className={`h-full w-full flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300 ${className}`}
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
