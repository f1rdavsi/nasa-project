'use client'
import { Github, Linkedin, Mail, MapPin, Phone } from 'lucide-react'
import { useRef } from 'react'

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
		cardRef.current.style.transform =
			'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)'
	}

	return (
		<div
			ref={cardRef}
			className='rounded-xl hover:shadow-lg hover:shadow-blue-400/20 transition-shadow duration-300'
			onMouseMove={handleMouseMove}
			onMouseLeave={handleMouseLeave}
		>
			{children}
		</div>
	)
}

export function ContactInfo() {
	return (
		<div className='space-y-7 align-center'>
			<Card3D>
				<div className='bg-blue-900/10 border-2 mt-10 border-blue-400/50 rounded-xl backdrop-blur-sm p-10 space-y-4'>
					<div className='flex items-start gap-3'>
						<MapPin className='w-5 h-5 text-blue-400 mt-0.5' />
						<div>
							<h3 className='font-orbitron font-semibold text-white mb-1'>
								Address
							</h3>
							<p className='font-exo text-blue-300/90 text-sm'>
								Dushanbe
								<br />
								Mayakovskiy str.
							</p>
						</div>
					</div>

					<div className='flex items-start gap-3'>
						<Mail className='w-5 h-5 text-blue-400 mt-0.5' />
						<div>
							<h3 className='font-orbitron font-semibold text-white mb-1'>
								Email
							</h3>
							<a
								href='mailto:maks88821@gmail.com'
								className='font-exo text-blue-300/90 text-sm hover:text-blue-400 transition-colors'
							>
								maks88821@gmail.com
							</a>
						</div>
					</div>

					<div className='flex items-start gap-3'>
						<Phone className='w-5 h-5 text-blue-400 mt-0.5' />
						<div>
							<h3 className='font-orbitron font-semibold text-white mb-1'>
								Phone
							</h3>
							<a
								href='tel:+992175333325'
								className='font-exo text-blue-300/90 text-sm hover:text-blue-400 transition-colors'
							>
								+992 175 3333 25
							</a>
						</div>
					</div>
				</div>
			</Card3D>

			<Card3D>
				<div className='bg-blue-900/10 border-2 border-blue-400/50 rounded-xl backdrop-blur-sm p-5'>
					<h3 className='font-orbitron font-semibold text-white mb-4'>
						Follow Us
					</h3>
					<div className='flex gap-4'>
						<a
							href='https://github.com/f1rdavsi/SpaceLabs'
							className='w-10 h-10 rounded-full bg-blue-900/20 flex items-center justify-center hover:bg-blue-400 hover:text-white transition-all'
						>
							<Github className='w-5 h-5' />
						</a>
						<a
							href='https://www.linkedin.com/in/abdullozodahasansadullo'
							className='w-10 h-10 rounded-full bg-blue-900/20 flex items-center justify-center hover:bg-blue-400 hover:text-white transition-all'
						>
							<Linkedin className='w-5 h-5' />
						</a>
						<a
							href='mailto:maks88821@gmail.com'
							className='w-10 h-10 rounded-full bg-blue-900/20 flex items-center justify-center hover:bg-blue-400 hover:text-white transition-all'
						>
							<Mail className='w-5 h-5' />
						</a>
					</div>
				</div>
			</Card3D>

			<Card3D>
				<div className='bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-2 border-blue-400/50 rounded-xl backdrop-blur-sm p-5'>
					<h3 className='font-orbitron font-semibold text-white mb-2'>
						SpaceLabs team
					</h3>
					<div className='font-orbitron text-blue-300/90 text-lg space-y-1'>
						<p>Firdavs</p>
						<p>&ensp;&ensp;Hasan</p>
						<p>&ensp;&ensp;&ensp;Husein</p>
						<p>&emsp;&emsp;&emsp;Muhsin</p>
					</div>
				</div>
			</Card3D>
		</div>
	)
}