'use client'

import { useEffect, useState } from 'react'

import { cx } from '@/lib/app/format'

export function AnimatedNumber({
  className,
  value,
}: {
  className?: string
  value: number
}) {
  const [isFresh, setIsFresh] = useState(false)

  useEffect(() => {
    setIsFresh(true)
    const timeoutId = window.setTimeout(() => setIsFresh(false), 320)

    return () => window.clearTimeout(timeoutId)
  }, [value])

  return (
    <span className={cx(isFresh ? 'tb-count-refresh' : '', className)}>
      {value}
    </span>
  )
}
