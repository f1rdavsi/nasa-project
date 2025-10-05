'use client'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useEffect, useRef, useState } from 'react'

gsap.registerPlugin(ScrollTrigger)

interface ParallaxHeroProps {
	title: string
	subtitle: string
}

interface Particle {
	left: string
	top: string
	animationDelay: string
	animationDuration: string
}

export function ParallaxHero({ title, subtitle }: ParallaxHeroProps) {
	const containerRef = useRef<HTMLDivElement>(null)
	const titleRef = useRef<HTMLHeadingElement>(null)
	const subtitleRef = useRef<HTMLParagraphElement>(null)
	const image1Ref = useRef<HTMLDivElement>(null)
	const image2Ref = useRef<HTMLDivElement>(null)
	const image3Ref = useRef<HTMLDivElement>(null)

	const [particles, setParticles] = useState<Particle[]>([])

	useEffect(() => {
		const generated = Array.from({ length: 30 }).map(() => ({
			left: `${Math.random() * 100}%`,
			top: `${Math.random() * 100}%`,
			animationDelay: `${Math.random() * 3}s`,
			animationDuration: `${2 + Math.random() * 3}s`,
		}))
		setParticles(generated)
	}, [])

	useEffect(() => {
		const ctx = gsap.context(() => {
			gsap.from(titleRef.current, {
				opacity: 0,
				y: 50,
				duration: 1,
				ease: 'power3.out',
			})

			gsap.from(subtitleRef.current, {
				opacity: 0,
				y: 30,
				duration: 1,
				delay: 0.3,
				ease: 'power3.out',
			})

			gsap.to(image1Ref.current, {
				y: 100,
				scrollTrigger: {
					trigger: containerRef.current,
					start: 'top top',
					end: 'bottom top',
					scrub: 1,
				},
			})

			gsap.to(image2Ref.current, {
				y: 150,
				scrollTrigger: {
					trigger: containerRef.current,
					start: 'top top',
					end: 'bottom top',
					scrub: 1,
				},
			})

			gsap.to(image3Ref.current, {
				y: 80,
				scrollTrigger: {
					trigger: containerRef.current,
					start: 'top top',
					end: 'bottom top',
					scrub: 1,
				},
			})
		})

		return () => ctx.revert()
	}, [])

	return (
		<div
			ref={containerRef}
			className='relative w-[90%] m-auto h-[60vh] min-h-[500px] overflow-hidden cosmic-bg flex items-center'
		>
			<div
				ref={image1Ref}
				className='absolute top-20 left-10 w-32 h-32 opacity-20'
			></div>
			<div
				ref={image2Ref}
				className='absolute top-40 right-20 w-48 h-48 opacity-15'
			></div>
			<div
				ref={image3Ref}
				className='absolute bottom-20 left-1/3 w-40 h-40 opacity-10'
			></div>

			<div className='container mx-auto px-4 relative z-10'>
				<div className='max-w-3xl'>
					<h1
						ref={titleRef}
						className='text-5xl md:text-7xl font-bold font-[family-name:var(--font-orbitron)] mb-6 text-balance'
					>
						{title}
					</h1>
					<p
						ref={subtitleRef}
						className='text-xl md:text-2xl text-muted-foreground text-pretty'
					>
						{subtitle}
					</p>
				</div>
			</div>

			<div className='absolute inset-0 pointer-events-none'>
				{particles.map((p, i) => (
					<div
						key={i}
						className='absolute w-1 h-1 bg-white rounded-full animate-twinkle'
						style={{
							left: p.left,
							top: p.top,
							animationDelay: p.animationDelay,
							animationDuration: p.animationDuration,
						}}
					/>
				))}
			</div>
		</div>
	)
}