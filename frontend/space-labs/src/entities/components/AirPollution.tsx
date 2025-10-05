'use client'
import Air from '@/assets/images/Air.jpg'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useEffect, useRef } from 'react'

gsap.registerPlugin(ScrollTrigger)

export default function AirPollution() {
	const sectionRef = useRef<HTMLDivElement>(null)
	const textRef = useRef<HTMLDivElement>(null)
	const bgRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const ctx = gsap.context(() => {
			gsap.to(bgRef.current, {
				yPercent: -30,
				ease: 'none',
				scrollTrigger: {
					trigger: sectionRef.current,
					start: 'top bottom',
					end: 'bottom top',
					scrub: true,
				},
			})

			gsap.fromTo(
				textRef.current,
				{ y: 100, opacity: 0 },
				{
					y: 0,
					opacity: 1,
					duration: 1.2,
					ease: 'power3.out',
					scrollTrigger: {
						trigger: sectionRef.current,
						start: 'top 80%',
						end: 'bottom 20%',
						toggleActions: 'play none none reverse',
					},
				}
			)
		}, sectionRef)

		return () => ctx.revert()
	}, [])

	return (
		<section
			ref={sectionRef}
			className='relative h-[800px] flex items-center justify-center overflow-hidden'
		>
			<div
				ref={bgRef}
				className='absolute inset-0 bg-cover bg-center'
				style={{ backgroundImage: `url(${Air.src})` }}
			>
				<div className='absolute inset-0 opacity-20'>
					<div className='absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full animate-pulse'></div>
					<div className='absolute top-3/4 right-1/3 w-1 h-1 bg-blue-300 rounded-full'></div>
					<div className='absolute top-1/3 right-1/4 w-3 h-3 bg-yellow-300 rounded-full opacity-60'></div>
				</div>
			</div>

			<div
				ref={textRef}
				className='relative z-10 text-center text-white px-4 max-w-4xl'
			>
				<h1 className='text-5xl md:text-7xl font-bold mb-6 font-orbitron'>
					SPACELABS
				</h1>
				<p className='text-xl md:text-2xl mb-8 text-blue-200 font-light'>
					WORLD WIDE LEADER IN AIR QUALITY MONITORING FROM SPACE
				</p>
				<div className='w-24 h-1 bg-blue-400 mx-auto mb-8'></div>
				<p className='text-lg md:text-xl mb-8 leading-relaxed text-gray-300 max-w-2xl mx-auto'>
					Every day, millions breathe polluted air, unaware of the invisible
					threats. SpaceLabs is revolutionizing how we monitor and protect our
					atmosphere from orbit.
				</p>
			</div>
		</section>
	)
}