'use client'

import { cx } from '@/lib/app/format'

export function AnimatedNumber({
  className,
  value,
}: {
  className?: string
  value: number
}) {
  return (
    <span className={className}>
      <span className={cx('inline-block tb-count-refresh', className)} key={value}>
        {value}
      </span>
    </span>
  )
}
