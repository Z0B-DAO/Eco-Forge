interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
}

const SIZES = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-12 w-12 border-3",
}

export function LoadingSpinner({ size = "md" }: LoadingSpinnerProps) {
  return (
    <div
      className={`${SIZES[size]} animate-spin rounded-full border-white/20 border-t-white`}
    />
  )
}
