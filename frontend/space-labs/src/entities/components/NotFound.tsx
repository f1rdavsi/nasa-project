'use client'
import Link from 'next/link'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const NotFound = () => {
  const starfieldRef = useRef<HTMLCanvasElement>(null)
  const miniEarthRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    // ... твой three.js код без изменений ...
  }, [])

  return (
    <div className="min-h-screen text-[#e8eef9] font-['Inter',system-ui] overflow-hidden">
      <canvas ref={starfieldRef} className="fixed inset-0 w-full h-full pointer-events-none z-[-1]" />
      <main className="relative min-h-screen grid place-items-center px-5 py-10">
        <section className="grid gap-7 text-center max-w-4xl w-full">
          <h1 className="text-[clamp(28px,3vw,40px)] font-orbitron tracking-wide text-[#e8eef9] text-shadow-lg shadow-cyan-400/15">
            Page not found
          </h1>
          <div className="grid grid-cols-1 sm:grid-cols-3 items-center justify-items-center gap-4 sm:gap-6">
            <span className="text-[clamp(80px,18vw,200px)] font-extrabold bg-gradient-to-b from-[#ced6e0] via-[#8c98a9_55%] to-[#6b7687] bg-clip-text text-transparent">
              4
            </span>
            <div className="w-[clamp(90px,18vw,220px)] h-[clamp(90px,18vw,220px)] rounded-full relative overflow-hidden">
              <canvas ref={miniEarthRef} className="w-full h-full block" />
            </div>
            <span className="text-[clamp(80px,18vw,200px)] font-extrabold bg-gradient-to-b from-[#ced6e0] via-[#8c98a9_55%] to-[#6b7687] bg-clip-text text-transparent">
              4
            </span>
          </div>
          <p className="mx-auto max-w-3xl text-[#9aa7bd] text-[clamp(14px,1.6vw,16px)] leading-relaxed tracking-wide font-exo">
            The requested page is not available. Perhaps it was moved, deleted or never existed. You can return to the
            main page and continue navigation.
          </p>
          <div className="flex gap-3.5 justify-center items-center">
            <Link
              href="/"
              className="inline-flex px-6 py-3 rounded-xl bg-gradient-to-r from-blue-400/30 to-blue-600/30 
                         hover:from-blue-400/30 hover:to-blue-500/30 text-white hover:text-blue-200 font-orbitron no-underline 
                         shadow-lg shadow-cyan-500/35 transition-all duration-150 ease-in-out
                         hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cyan-500/45
                         active:translate-y-0 active:shadow-md active:shadow-cyan-500/30">
              Back to main page
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}

export default NotFound
