'use client'
import Link from 'next/link'

const Footer = () => {
	const currentYear = new Date().getFullYear()

	const footerSections = [
		{
			title: 'Explore',
			links: [
				{ href: '/', label: 'Home' },
				{ href: '/historical', label: 'Historical Data' },
				{ href: '/prediction', label: 'Prediction' },
				{ href: '/contacts', label: 'Contacts' },
			],
			className: 'lg:col-span-1 py-2',
		},
		{
			title: 'More information',
			links: [
				{ href: 'https://www.facebook.com/NASA/', label: 'Facebook' },
				{ href: 'https://www.pinterest.com/nasa/', label: 'Pinterest' },
				{ href: 'https://nasa.tumblr.com/', label: 'Tumblr' },
				{ href: 'https://www.reddit.com/user/nasa', label: 'Reddit' },
			],
			className: 'lg:col-span-1 py-2',
		},
		{
			title: 'Contacts',
			content: (
				<div className='space-y-4 mb-8'>
					<div className='text-gray-300 font-exo'>
						<span>Email:</span> maks88821@gmail.com
					</div>
					<div className='text-gray-300 font-exo'>
						<span>Telephone:</span> +992 175 3333 25
					</div>
					<div className='text-gray-300 font-exo'>
						<span>Address:</span> Dushanbe, Mayakovskiy str.
					</div>
					<div className='text-gray-300 font-exo'>
						<span>Request time:</span> Every day, 9:00-18:00
					</div>
				</div>
			),
			className: 'lg:col-span-1 py-2',
		},
	]

	const socialLinks = [
		{
			href: 'https://youtu.be/-p_w0BkJqaQ',
			label: 'YouTube',
			color: 'hover:text-red-500',
			icon: (
				<svg className='w-7 h-7' fill='currentColor' viewBox='0 0 24 24'>
					<path d='M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z' />
				</svg>
			),
		},
		{
			href: 'https://t.me/muhsin_behbudov',
			label: 'Telegram',
			color: 'hover:text-blue-400',
			icon: (
				<svg className='w-7 h-7' fill='currentColor' viewBox='0 0 24 24'>
					<path d='M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.14.141-.259.259-.374.261l.213-3.053 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.136-.954l11.566-4.458c.538-.196 1.006.128.832.941z' />
				</svg>
			),
		},
		{
			href: 'https://www.instagram.com/nasa/',
			label: 'Instagram',
			color: 'hover:text-pink-500',
			icon: (
				<svg className='w-7 h-7' fill='currentColor' viewBox='0 0 24 24'>
					<path d='M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' />
				</svg>
			),
		},
	]

	return (
		<footer className='bg-black text-white py-16 px-8 border-t border-gray-800'>
			<div className='max-w-7xl mx-auto'>
				<div className='grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8'>
					<div>
						<div className='mb-6'>
							<div className='flex-shrink-0 mb-3'>
								<Link href={`/`}>
									<div className='group cursor-pointer relative w-[55%]'>
										<div
											className='absolute -inset-2 bg-gradient-to-r from-blue-400/20 to-purple-500/20 
                  rounded-lg blur opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out'
										/>
										<h1 className='text-2xl font-bold relative transition-all duration-500 font-orbitron'>
											<span className='relative'>
												<span
													className='text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 
                      group-hover:from-blue-300 group-hover:to-purple-400 
                      transition-all duration-500 ease-in-out relative'
												>
													Space
													<span
														className='absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-300 to-purple-400 
                        group-hover:w-full transition-all duration-500 ease-out'
													/>
												</span>
												<span
													className='text-gray-400 dark:text-gray-300 group-hover:text-gray-100 
                      transition-colors duration-500 ease-in-out'
												>
													Labs
												</span>
											</span>
										</h1>
									</div>
								</Link>
							</div>
							<blockquote className='text-gray-200 font-exo border-l-4 border-blue-500 pl-6 py-4 leading-relaxed'>
								Earth is not an inheritance received from ancestors, but a loan
								taken from descendants
							</blockquote>
						</div>
					</div>

					{footerSections.map((section, index) => (
						<div key={index} className={section.className}>
							<h4 className='text-xl font-orbitron mb-6 font-bold text-blue-300'>
								{section.title}
							</h4>

							{section.links ? (
								<div className='space-y-4'>
									{section.links.map((link, linkIndex) => (
										<a
											key={linkIndex}
											href={link.href}
											className='block text-gray-300 hover:text-white transition-all duration-300 hover:translate-x-2 transform font-exo'
										>
											{link.label}
										</a>
									))}
								</div>
							) : (
								<>
									{section.content}

									{section.title === 'Contacts' && (
										<div className='flex space-x-6'>
											{socialLinks.map((social, socialIndex) => (
												<a
													key={socialIndex}
													href={social.href}
													target='_blank'
													rel='noopener noreferrer'
													className={`text-gray-400 ${social.color} transition-all duration-300 transform hover:scale-125`}
													aria-label={social.label}
												>
													{social.icon}
												</a>
											))}
										</div>
									)}
								</>
							)}
						</div>
					))}
				</div>

				<div className='border-t border-gray-800 font-exo pt-5 text-center'>
					<p className='text-gray-500 text-lg'>
						© {currentYear} SpaceLabs. All rights reserved.
					</p>
					<p className='text-gray-500 text-sm mt-2'>
						Copying materials only with the permission of the copyright holder.
					</p>
				</div>
			</div>
		</footer>
	)
}

export default Footer