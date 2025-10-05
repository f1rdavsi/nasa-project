'use client'

import { Mail, Send } from 'lucide-react'
import { useRef, useState } from 'react'
import toast from 'react-hot-toast'

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

export function ContactForm() {
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		subject: '',
		message: '',
	})
	const [isSubmitting, setIsSubmitting] = useState(false)

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		setFormData(prev => ({
			...prev,
			[e.target.name]: e.target.value,
		}))
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!formData.name || !formData.email || !formData.message) {
			toast.error('Please fill in all required fields')
			return
		}

		setIsSubmitting(true)

		try {
			// Здесь ты можешь вставить настоящий fetch-запрос
			await new Promise(resolve => setTimeout(resolve, 1000))
			toast.success("Message sent successfully! We'll get back to you soon.")
			setFormData({ name: '', email: '', subject: '', message: '' })
		} catch (error) {
			console.error(error)
			toast.error('Failed to send message. Please try again.')
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<Card3D>
			<div className='md:max-w-2xl w-[90%] mx-auto mt-10 rounded-xl border-2 border-blue-400/50 overflow-hidden backdrop-blur-sm transition-all duration-300'>
				<div className='flex items-center gap-3 px-6 py-5 bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-b border-blue-400/30 backdrop-blur-sm'>
					<Mail className='w-5 h-5 text-blue-400' />
					<h2 className='font-orbitron text-lg font-bold text-white'>
						Send us a Message
					</h2>
				</div>
				<div className='px-6 py-5 bg-blue-900/10 backdrop-blur-sm space-y-4'>
					<p className='text-blue-300/90 font-exo text-sm leading-relaxed'>
						Have questions or feedback? Wed love to hear from you!
					</p>

					<form onSubmit={handleSubmit} className='space-y-3'>
						<div className='grid md:grid-cols-2 gap-4'>
							<div className='flex flex-col space-y-1'>
								<label
									htmlFor='name'
									className='text-blue-300/80 font-exo text-sm'
								>
									Name <span className='text-blue-400'>*</span>
								</label>
								<input
									id='name'
									name='name'
									type='text'
									placeholder='Your name'
									value={formData.name}
									onChange={handleChange}
									disabled={isSubmitting}
									required
									className='w-full px-3 py-2 rounded-md border border-blue-400/30 bg-blue-900/20 text-white placeholder:text-blue-300/50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-all'
								/>
							</div>

							<div className='flex flex-col space-y-1'>
								<label
									htmlFor='email'
									className='text-blue-300/80 font-exo text-sm'
								>
									Email <span className='text-blue-400'>*</span>
								</label>
								<input
									id='email'
									name='email'
									type='email'
									placeholder='your.email@example.com'
									value={formData.email}
									onChange={handleChange}
									disabled={isSubmitting}
									required
									className='w-full px-3 py-2 rounded-md border border-blue-400/30 bg-blue-900/20 text-white placeholder:text-blue-300/50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-all'
								/>
							</div>
						</div>

						<div className='flex flex-col space-y-1'>
							<label
								htmlFor='subject'
								className='text-blue-300/80 font-exo text-sm'
							>
								Subject
							</label>
							<input
								id='subject'
								name='subject'
								type='text'
								placeholder='What is this about?'
								value={formData.subject}
								onChange={handleChange}
								disabled={isSubmitting}
								className='w-full px-3 py-2 rounded-md border border-blue-400/30 bg-blue-900/20 text-white placeholder:text-blue-300/50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-all'
							/>
						</div>

						<div className='flex flex-col space-y-1'>
							<label
								htmlFor='message'
								className='text-blue-300/80 font-exo text-sm'
							>
								Message <span className='text-blue-400'>*</span>
							</label>
							<textarea
								id='message'
								name='message'
								placeholder='Tell us more...'
								value={formData.message}
								onChange={handleChange}
								disabled={isSubmitting}
								required
								rows={5}
								className='w-full px-3 py-2 rounded-md border border-blue-400/30 bg-blue-900/20 text-white placeholder:text-blue-300/50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-all'
							/>
						</div>

						<button
							type='submit'
							disabled={isSubmitting}
							className='w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-gradient-to-r from-blue-500/40 to-blue-600/40 hover:from-blue-500/60 hover:to-blue-600/60 text-white font-orbitron transition-all disabled:opacity-50'
						>
							{isSubmitting ? 'Sending...' : 'Send Message'}
							<Send className='w-4 h-4' />
						</button>
					</form>
				</div>
			</div>
		</Card3D>
	)
}
