'use client'
import Air from '@/assets/images/Air.jpg'
import LoaderCard from '@/shared/ui/animated-text'

export default function ContactMessage() {
	return (
		<section
			style={{ backgroundImage: `url(${Air.src})` }}
			className='min-h-screen flex flex-col items-center justify-center text-center px-4 space-y-8'
		>
			<div className='space-y-4'>
				<LoaderCard
					loadingText='We are'
					words={['SpaceLabs', 'Muhsin', 'Hasan', 'Husein', 'Firdavs']}
					interval={3}
				/>{' '}
			</div>

			<p className='text-lg md:text-2xl text-white-700'>
				By protecting the environment today, we are building a healthy and safe
				world for future generations.
			</p>
		</section>
	)
}
