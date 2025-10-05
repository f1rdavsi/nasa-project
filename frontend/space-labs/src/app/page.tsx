'use client'
import AirPollution from '@/entities/components/AirPollution'
import Accordion from '@/shared/ui/Accourdion'
import EarthLoader from '@/shared/ui/loading'
import { CurrentPollutionSection } from '@/widgets/CurrentPollution/CurrentPollution'
import Footer from '@/widgets/footer/footer'
import Header from '@/widgets/header/header'
import dynamic from 'next/dynamic'
import { Suspense } from "react";
const EarthPollutionScene = dynamic(() => import('@/shared/config/EarthScene'), {
  ssr: false,
  loading: () => <EarthLoader />,
})

export default function Home() {
  return (
    <Suspense fallback={null}>
      <Header />
      <EarthPollutionScene />
      <CurrentPollutionSection />
      <AirPollution />
      <Accordion />
      <Footer />
    </Suspense>
  )
}
