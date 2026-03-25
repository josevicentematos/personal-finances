interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
}

export function Spinner({ size = 'md' }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }

  return (
    <div
      className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-blue-600 border-t-transparent`}
    />
  )
}

export function PageSpinner() {
  return (
    <div className="flex justify-center py-12">
      <Spinner size="lg" />
    </div>
  )
}
