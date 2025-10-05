'use client'
import { gsap } from 'gsap'
import { useEffect, useRef } from 'react'

interface AccordionItem {
	id: number
	question: string
	answer: string[]
}

const accordionData: AccordionItem[] = [
	{
		id: 1,
		question: 'What are the main air pollutants that NASA tracks?',
		answer: [
			'NASA tracks a wide range of air pollutants, including nitrogen dioxide (NO₂), sulfur dioxide (SO₂), ozone (O₃), carbon monoxide (CO), and fine particulate matter (PM2.5). NASA satellites such as Aura, Aqua and Terra are equipped with instruments that measure the concentrations of these pollutants on a global scale. For example, the OMI instrument on the Aura satellite is specifically designed to measure NO₂ and SO₂ in the atmosphere.',
		],
	},
	{
		id: 2,
		question: 'How does NASA measure air quality from space?',
		answer: [
			'NASA uses satellites with a variety of spectrometers and radiometers to measure air quality. These instruments analyze how sunlight is absorbed and scattered by atmospheric particles and gases. For example, the MODIS instrument on the Terra and Aqua satellites measures aerosols in the atmosphere, and the TROPOMI instrument on the Sentinel-5P satellite (a joint project of ESA and NASA) provides high-resolution data on various pollutants.',
		],
	},
	{
		id: 3,
		question: 'What discoveries has NASA made about air pollution?',
		answer: [
			'NASA research has revealed a significant decrease in air pollution during the COVID-19 pandemic. The data showed a sharp decrease in NO₂ concentrations over industrial regions and large cities. NASA also detected the intercontinental transport of air pollutants, demonstrating that pollution from Asia can reach North America, and dust from the Sahara affects air quality in the Americas.',
		],
	},
	{
		id: 4,
		question: 'How does NASA data help in the fight against air pollution?',
		answer: [
			'NASA data is used by governments, scientists and organizations around the world to develop policies to improve air quality. They help to identify sources of pollution and assess the effectiveness of environmental measures.',
			'For example, information from satellites helps to monitor compliance with environmental standards and identify illegal emissions from industrial enterprises.',
		],
	},
	{
		id: 5,
		question: 'What new technologies is NASA developing for air monitoring?',
		answer: [
			'NASA is developing new satellite missions such as TEMPO (Tropospheric Emissions: Monitoring of Pollution), which will measure air pollution over North America with unprecedented spatial and temporal resolution. Work is also underway on the MAIA (Multi-Angle Imager for Aerosols) mission, which will study how different types of particles in the air affect human health.',
		],
	},
	{
		id: 6,
		question: 'How does NASA predict air quality?',
		answer: [
			'NASA uses sophisticated computer models that combine satellite data with ground-based measurements and meteorological information to predict air quality. The GEOS-FP (Goddard Earth Observing System Forward Processing) model provides projections of air pollution around the world, helping scientists understand how pollutants move and transform in the atmosphere.',
		],
	},
]

export default function Accordion() {
	const accordionRefs = useRef<(HTMLDivElement | null)[]>([])
	const contentRefs = useRef<(HTMLDivElement | null)[]>([])

	useEffect(() => {
		accordionRefs.current.forEach((ref, index) => {
			if (ref && contentRefs.current[index]) {
				gsap.set(contentRefs.current[index], { height: 0 })
			}
		})
	}, [])

	const toggleAccordion = (index: number): void => {
		const content = contentRefs.current[index]
		if (!content) return

		const isOpen = content.style.height !== '0px'

		accordionRefs.current.forEach((ref, i) => {
			if (i !== index && contentRefs.current[i]) {
				const otherContent = contentRefs.current[i]
				const otherPlus = accordionRefs.current[i]?.querySelector(
					'.plus'
				) as HTMLElement

				if (otherContent) {
					gsap.to(otherContent, {
						height: 0,
						duration: 0.5,
						ease: 'power2.inOut',
					})
				}

				if (otherPlus) {
					gsap.to(otherPlus, {
						rotate: 0,
						duration: 0.3,
						ease: 'power2.inOut',
					})
				}
			}
		})

		const currentPlus = accordionRefs.current[index]?.querySelector(
			'.plus'
		) as HTMLElement

		if (!isOpen) {
			gsap.to(content, {
				height: 'auto',
				duration: 0.5,
				ease: 'power2.inOut',
			})

			if (currentPlus) {
				gsap.to(currentPlus, {
					rotate: 45,
					duration: 0.3,
					ease: 'power2.inOut',
				})
			}
		} else {
			gsap.to(content, {
				height: 0,
				duration: 0.5,
				ease: 'power2.inOut',
			})

			if (currentPlus) {
				gsap.to(currentPlus, {
					rotate: 0,
					duration: 0.3,
					ease: 'power2.inOut',
				})
			}
		}
	}

	const scrollToTop = () => {
		window.scrollTo({
			top: 0,
			behavior: 'smooth',
		})
	}

	return (
		<div className='relative md:max-w-4xl w-[90%] mx-auto'>
			<div className='space-y-4 pb-32'>
				<h1 className='text-center text-4xl font-orbitron font-bold text-blue-400'>
					FAQ
				</h1>
				{accordionData.map((item, index) => (
					<div
						key={item.id}
						ref={(el: HTMLDivElement | null) => {
							accordionRefs.current[index] = el
						}}
						className='bg-transparent rounded-xl overflow-hidden border-2 border-blue-400/50 transition-all duration-300 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-400/20'
					>
						<button
							onClick={() => toggleAccordion(index)}
							className='w-full px-6 py-5 text-left flex justify-between items-center bg-gradient-to-r from-blue-500/10 to-blue-600/10 backdrop-blur-sm border-b border-blue-400/30 hover:from-blue-400/20 hover:to-blue-500/20 transition-all duration-300 group'
						>
							<span className='font-orbitron text-lg pr-4 text-white group-hover:text-blue-300 transition-colors duration-300'>
								{item.question}
							</span>
							<div className='plus text-2xl font-light min-w-6 text-center transition-all duration-300 text-blue-400 group-hover:text-blue-300 group-hover:scale-110'>
								+
							</div>
						</button>

						<div
							ref={(el: HTMLDivElement | null) => {
								contentRefs.current[index] = el
							}}
							className='overflow-hidden'
						>
							<div className='px-6 py-4 bg-blue-900/10 font-exo backdrop-blur-sm'>
								{item.answer.map((paragraph, pIndex) => (
									<p
										key={pIndex}
										className='mb-3 text-blue-300/90 leading-relaxed last:mb-0 font-light'
									>
										{paragraph}
									</p>
								))}
							</div>
						</div>
					</div>
				))}
			</div>

			<div
				onClick={scrollToTop}
				className='absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce cursor-pointer group'
				style={{ cursor: 'pointer' }}
			>
				<div className='w-6 h-10 border-2 border-blue-400 rounded-full flex justify-center group-hover:border-blue-300 group-hover:shadow-lg group-hover:shadow-blue-400/30 transition-all duration-300'>
					<div className='w-1 h-3 bg-blue-400 rounded-full mt-2 group-hover:bg-blue-300 transition-colors duration-300'></div>
				</div>
			</div>
		</div>
	)
}
