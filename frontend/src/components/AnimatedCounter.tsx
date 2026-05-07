import { useEffect, useRef, useState } from 'react'
import { animate } from 'framer-motion'

interface AnimatedCounterProps {
  value: number
  locale?: string
  className?: string
}

export function AnimatedCounter({
  value,
  locale = 'pt-BR',
  className,
}: AnimatedCounterProps) {
  const previousValueRef = useRef(value)
  const [displayValue, setDisplayValue] = useState(value)

  useEffect(() => {
    const controls = animate(previousValueRef.current, value, {
      duration: 0.45,
      ease: 'easeOut',
      onUpdate: (latest) => setDisplayValue(Math.round(latest)),
    })
    previousValueRef.current = value

    return () => controls.stop()
  }, [value])

  return (
    <span className={className}>
      {new Intl.NumberFormat(locale).format(displayValue)}
    </span>
  )
}
