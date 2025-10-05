'use client'
import Historical from '@/entities/components/Historical'
import Footer from '@/widgets/footer/footer'
import Header from '@/widgets/header/header'
import { ParallaxHero } from '@/widgets/parallax-hero/parallax-hero'

export default function Statistic() {
  return (
    <div>
      <Header />
      <ParallaxHero
        title="Historical Data"
        subtitle="By studying historical data, organizations can understand patterns and learn from past experiences to improve future outcomes."
      />
      <Historical />
      <Footer />
    </div>
  )
}
