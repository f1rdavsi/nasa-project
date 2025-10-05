'use client'
import { exo2, orbitron, rajdhani } from '@/shared/lib/fonts/fontspace'
import { RouterLoader } from '@/shared/ui/RouterLoader'
import type { Metadata } from 'next'
import './globals.css'
import { Suspense } from 'react'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" className={`${orbitron.variable} ${rajdhani.variable} ${exo2.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <Suspense fallback={null}>
          <RouterLoader />
        </Suspense>
        {children}
      </body>
    </html>
  )
}