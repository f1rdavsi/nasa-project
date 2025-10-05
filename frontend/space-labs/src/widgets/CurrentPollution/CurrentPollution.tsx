'use client'

import { CurrentPollutionCard } from '@/entities/components/CurrentPollutionCard'

export function CurrentPollutionSection() {
	return (
		<section id='current-pollution' className='py-20 bg-background'>
			<div className='container mx-auto px-4'>
				<div className='text-center mb-12'>
					<h2 className='text-4xl md:text-5xl font-bold font-[family-name:var(--font-orbitron)] mb-4'>
						Current Air Quality
					</h2>
					<p className='text-lg text-muted-foreground max-w-2xl mx-auto'>
						Real-time pollution data for your location from NASA satellites
					</p>
				</div>

				<div className='max-w-4xl mx-auto'>
					<CurrentPollutionCard />
				</div>
			</div>
		</section>
	)
}