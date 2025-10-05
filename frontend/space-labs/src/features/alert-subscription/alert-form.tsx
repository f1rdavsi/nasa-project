'use client'

import { useState, useRef } from 'react'
import { Bell, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '@/shared/lib/api'

function Card3D({ children }: { children: React.ReactNode }) {
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!cardRef.current) return

    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const centerX = rect.width / 2
    const centerY = rect.height / 2

    const maxRotate = 12
    const rotateY = ((x - centerX) / centerX) * maxRotate
    const rotateX = ((centerY - y) / centerY) * maxRotate

    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`
  }

  const handleMouseLeave = () => {
    if (!cardRef.current) return
    cardRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)'
  }

  return (
    <div
      ref={cardRef}
      className="rounded-xl hover:shadow-lg hover:shadow-blue-400/20 transition-shadow duration-300"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}>
      {children}
    </div>
  )
}

export function AlertForm() {
  const [telegramId, setTelegramId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const id = telegramId.trim()

    if (!id) return toast.error('Please enter your Telegram ID')
    if (!/^\d+$/.test(id)) return toast.error('Telegram ID must be a number')

    setIsSubmitting(true)

    try {
      // Send via shared axios instance which uses baseURL and interceptors
      await api.post('/api/subscribe', { telegramId: id })

      toast.success('Successfully subscribed to air quality alerts!')
      setTelegramId('')
    } catch (error) {
      console.error(error)
      toast.error('Failed to subscribe. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card3D>
      <div className="md:max-w-2xl w-[90%] mx-auto mt-10 rounded-xl border-2 border-blue-400/50 overflow-hidden backdrop-blur-sm transition-all duration-300">
        <div className="flex items-center gap-3 px-6 py-5 bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-b border-blue-400/30 backdrop-blur-sm">
          <Bell className="w-5 h-5 text-blue-400" />
          <h2 className="font-orbitron text-lg font-bold text-white">Subscribe to Air Quality Alerts</h2>
        </div>
        <div className="px-6 py-5 bg-blue-900/10 backdrop-blur-sm space-y-4">
          <p className="text-blue-300/90 font-exo text-sm leading-relaxed">
            Get notified via Telegram when air quality in your area reaches unhealthy levels.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex flex-col space-y-1">
              <label htmlFor="telegram-id" className="text-blue-300/80 font-exo text-sm">
                Telegram ID
              </label>
              <input
                id="telegram-id"
                type="text"
                placeholder="Enter your Telegram ID"
                value={telegramId}
                onChange={e => setTelegramId(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 rounded-md border border-blue-400/30 bg-blue-900/20 text-white placeholder:text-blue-300/50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-all"
              />
              <p className="text-xs text-blue-300/70">
                Dont know your Telegram ID?{' '}
                <a
                  href="https://t.me/userinfobot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline">
                  Find it here
                </a>
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-gradient-to-r from-blue-500/40 to-blue-600/40 hover:from-blue-500/60 hover:to-blue-600/60 text-white font-orbitron transition-all disabled:opacity-50">
              {isSubmitting ? 'Subscribing...' : 'Subscribe'}
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="mt-4 p-4 rounded-md bg-blue-900/10 font-exo text-blue-300/90 space-y-1">
            <h4 className="font-semibold text-sm">What youll receive:</h4>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Real-time alerts when AQI exceeds 100 (Unhealthy)</li>
              <li>Daily air quality summaries</li>
              <li>Severe pollution warnings</li>
              <li>Health recommendations based on air quality</li>
            </ul>
          </div>
        </div>
      </div>
    </Card3D>
  )
}