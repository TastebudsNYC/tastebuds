'use client'

import { useSearchParams } from 'next/navigation'

import { EmailPasswordLoginScreen } from '@/components/auth/EmailPasswordLoginScreen'

export default function SignupContinuePage() {
  const searchParams = useSearchParams()
  const initialEmail = searchParams.get('email')?.trim() ?? ''

  return <EmailPasswordLoginScreen initialEmail={initialEmail} variant="continue" />
}
