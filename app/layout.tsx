import type { Metadata } from 'next'
import { Epilogue } from 'next/font/google'

import { ToastProvider } from '@/components/app/ToastProvider'

import './globals.css'

const epilogue = Epilogue({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-app-sans',
})

export const metadata: Metadata = {
  title: 'Tastebuds',
  description: 'A place to gather. Discover something new.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${epilogue.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}
