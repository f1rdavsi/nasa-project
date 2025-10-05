import ContactMessage from '@/entities/components/ContactMessage'
import { AlertForm } from '@/features/alert-subscription/alert-form'
import { ContactForm } from '@/features/contact-form/contact-form'
import { ContactInfo } from '@/widgets/contact-info/contact-info'
import Footer from '@/widgets/footer/footer'
import Header from '@/widgets/header/header'
import { ParallaxHero } from '@/widgets/parallax-hero/parallax-hero'

export default function ContactsPage() {
	return (
		<>
			<Header />
			<ParallaxHero
				title='Get in Touch'
				subtitle="Have questions about air quality? Want to subscribe to alerts? We're here to help."
			/>

			<section className='py-20 bg-blue-900/5 '>
				<div className='container mx-auto px-4 flex justify-center'>
					<div className='flex flex-col lg:flex-row gap-8 w-full max-w-6xl'>
						<div className='lg:w-1/3 w-full flex justify-center lg:justify-space'>
							<ContactInfo />
						</div>

						<div className='lg:w-2/3 w-full flex flex-col gap-8 items-center lg:items-stretch'>
							<div className='w-full max-w-xl'>
								<AlertForm />
							</div>
							<div className='w-full max-w-xl'>
								<ContactForm />
							</div>
						</div>
					</div>
				</div>
			</section>

			<ContactMessage />
			<Footer />
		</>
	)
}
