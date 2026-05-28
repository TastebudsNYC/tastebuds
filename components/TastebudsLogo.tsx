import Image from 'next/image'

import { cx } from '@/lib/app/format'

type LogoSize = 'sm' | 'md' | 'lg'
type LogoTheme = 'dark' | 'light'

const LOGO_SRC = '/branding/tastebuds-logo.png'
const LOGO_WIDTH = 1254
const LOGO_HEIGHT = 405

const sizes = {
  sm: {
    logoWidth: 220,
    markWidth: 58,
    tagline: 'text-[0.6rem] tracking-[0.28em]',
  },
  md: {
    logoWidth: 280,
    markWidth: 72,
    tagline: 'text-[0.68rem] tracking-[0.3em]',
  },
  lg: {
    logoWidth: 420,
    markWidth: 104,
    tagline: 'text-[0.8rem] tracking-[0.32em]',
  },
} satisfies Record<
  LogoSize,
  { logoWidth: number; markWidth: number; tagline: string }
>

type TastebudsMarkProps = {
  className?: string
  size?: LogoSize | number
  theme?: LogoTheme
}

function getHeightFromWidth(width: number) {
  return Math.round((width / LOGO_WIDTH) * LOGO_HEIGHT)
}

function resolveMarkWidth(size: LogoSize | number | undefined) {
  if (typeof size === 'number') {
    return size
  }

  return sizes[size ?? 'md'].markWidth
}

export function TastebudsMark({
  className,
  size = 'md',
}: TastebudsMarkProps) {
  const markWidth = resolveMarkWidth(size)
  const markHeight = getHeightFromWidth(markWidth)

  return (
    <span
      aria-label="Tastebuds mark"
      className={cx('inline-flex overflow-hidden', className)}
      role="img"
      style={{ width: markWidth, height: markHeight }}
    >
      <Image
        alt=""
        aria-hidden="true"
        draggable={false}
        height={markHeight}
        priority
        src={LOGO_SRC}
        style={{ maxWidth: 'none' }}
        unoptimized
        width={markHeight * (LOGO_WIDTH / LOGO_HEIGHT)}
      />
    </span>
  )
}

type TastebudsLogoProps = {
  className?: string
  showTagline?: boolean
  showWordmark?: boolean
  size?: LogoSize
  theme?: LogoTheme
}

export function TastebudsLogo({
  className,
  showTagline = false,
  showWordmark = true,
  size = 'md',
}: TastebudsLogoProps) {
  const config = sizes[size]
  const logoHeight = getHeightFromWidth(config.logoWidth)

  return (
    <div aria-label="Tastebuds" className={cx('inline-flex flex-col', className)}>
      {showWordmark ? (
        <Image
          alt="Tastebuds"
          draggable={false}
          height={logoHeight}
          priority
          src={LOGO_SRC}
          unoptimized
          width={config.logoWidth}
        />
      ) : (
        <TastebudsMark size={size} />
      )}
      {showTagline ? (
        <div
          className={cx(
            'mt-1 whitespace-nowrap font-semibold uppercase text-[color:var(--accent)]',
            config.tagline
          )}
        >
          A PLACE TO GATHER. DISCOVER SOMETHING NEW.
        </div>
      ) : null}
    </div>
  )
}
