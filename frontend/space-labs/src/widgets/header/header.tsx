'use client'
import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

let globalAudio: HTMLAudioElement | null = null
let globalIsMusicPlaying = false

const Header = () => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [isAnimating, setIsAnimating] = useState(false)
	const [isStatsOpen, setIsStatsOpen] = useState(false)
	const [isMusicPlaying, setIsMusicPlaying] = useState(false)
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
	const closeTimeout = useRef<NodeJS.Timeout | null>(null)
	const pathname = usePathname()
	const router = useRouter()

	useEffect(() => {
		if (!globalAudio) {
			globalAudio = new Audio('/music/antent_music.mp3')
			globalAudio.loop = true

			globalAudio.addEventListener('canplaythrough', () => {
				console.log('Музыка готова к воспроизведению')
			})

			globalAudio.addEventListener('error', e => {
				console.error('Ошибка загрузки музыки:', e)
			})
		}

		setIsMusicPlaying(globalIsMusicPlaying)
		if (globalIsMusicPlaying && globalAudio) {
			globalAudio.play().catch(error => {
				console.error('Ошибка воспроизведения:', error)
				globalIsMusicPlaying = false
				setIsMusicPlaying(false)
			})
		}
	}, [])

	const handleMusicToggle = () => {
		if (!globalAudio) return

		const newMusicState = !globalIsMusicPlaying

		if (newMusicState) {
			globalAudio
				.play()
				.then(() => {
					globalIsMusicPlaying = true
					setIsMusicPlaying(true)
				})
				.catch(error => {
					console.error('Ошибка воспроизведения музыки:', error)
					globalIsMusicPlaying = false
					setIsMusicPlaying(false)
				})
		} else {
			globalAudio.pause()
			globalIsMusicPlaying = false
			setIsMusicPlaying(false)
		}
	}

	const handlePageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		const value = event.target.value
		if (value) {
			router.push(value)
			setIsMobileMenuOpen(false)
		}
	}

	const navigationItems = [
		{ id: 1, label: 'Home', href: `/` },
		{ id: 2, label: 'Stats', href: `#`, dropdown: true },
		{ id: 3, label: 'Contacts', href: `/contacts` },
	]

	const dropdownItems = [
		{ label: 'Historical Data', href: '/historical' },
		{ label: 'Prediction', href: '/prediction' },
	]

	const openDropdown = () => {
		if (closeTimeout.current) clearTimeout(closeTimeout.current)
		setIsStatsOpen(true)
	}

	const closeDropdown = () => {
		closeTimeout.current = setTimeout(() => {
			setIsStatsOpen(false)
		}, 300)
	}

	return (
		<header
			className='fixed top-0 left-0 right-0 z-50 
      bg-gradient-to-r from-white/20 via-white/10 to-white/20 
      dark:from-gray-900/40 dark:via-black/30 dark:to-gray-900/40
      backdrop-blur-md border-b border-white/20 dark:border-gray-800 
      shadow-2xl shadow-blue-500/10 dark:shadow-purple-500/5
      transition-all duration-700 ease-out'
		>
			<div
				className='absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5 
        opacity-0 hover:opacity-100 transition-opacity duration-1000 ease-in-out'
			/>

			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative'>
				<div className='flex justify-between items-center h-16'>
					<div className='flex-shrink-0'>
						<Link href={`/`}>
							<div className='group cursor-pointer relative'>
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
											className='text-gray-400 group-hover:text-gray-100 
                      transition-colors duration-500 ease-in-out'
										>
											Labs
										</span>
									</span>
								</h1>
							</div>
						</Link>
					</div>

					<div className='flex items-center space-x-4'>
						<div className='md:hidden'>
							<select
								onChange={handlePageChange}
								value={pathname}
								className='relative w-2 py-1 px-2 font-orbitron text-xs tracking-wide
                  bg-transparent backdrop-blur-xl border border-white/30 rounded-lg
                  text-white transition-all duration-400 ease-out
                  focus:outline-none focus:ring-1 focus:ring-white/50
                  hover:bg-white/10 cursor-pointer min-w-[120px]'
							>
								<option value='/' className='bg-gray-900 text-white'>
									Home
								</option>
								<option value='/historical' className='bg-gray-900 text-white'>
									Historical Data
								</option>
								<option value='/prediction' className='bg-gray-900 text-white'>
									Prediction
								</option>
								<option value='/contacts' className='bg-gray-900 text-white'>
									Contacts
								</option>
							</select>
						</div>

						<nav className='hidden md:flex space-x-4 relative'>
							{navigationItems.map(item =>
								item.dropdown ? (
									<div
										key={item.id}
										className='relative'
										onMouseEnter={openDropdown}
										onMouseLeave={closeDropdown}
									>
										<button
											className={`
                        relative py-2 px-4 font-orbitron text-sm tracking-wide flex items-center gap-1
                        transition-all duration-400 ease-out rounded-lg
                        ${
													isStatsOpen
														? 'text-blue-500 bg-white/10 shadow-inner'
														: 'text-gray-700'
												}
                        hover:text-blue-500 
                        hover:bg-white/10
                        hover:shadow-lg hover:shadow-blue-500/10
                        group
                      `}
										>
											<div
												className='absolute inset-0 bg-gradient-to-r from-blue-400/10 to-purple-500/10 
                        rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-400 ease-out'
											/>

											<span className='relative z-10'>{item.label}</span>
											<ChevronDown
												className={`w-4 h-4 transition-all duration-400 ease-out ${
													isStatsOpen
														? 'rotate-180 transform scale-110'
														: 'rotate-0'
												} group-hover:scale-110`}
											/>
										</button>

										<div
											className={`absolute left-0 mt-2 w-64 rounded-xl shadow-2xl overflow-hidden
                         dark:from-gray-900/40 border border-white/30
                        backdrop-blur-xl transition-all duration-400 ease-out transform origin-top
                        ${
													isStatsOpen
														? 'scale-100 opacity-100 translate-y-0'
														: 'scale-95 opacity-0 -translate-y-2 pointer-events-none'
												}`}
										>
											<div
												className='absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 
                        pointer-events-none'
											/>

											<Link
												href='/historical'
												className={`relative flex items-center gap-3 px-6 py-4 text-sm font-medium 
                          transition-all duration-300 ease-out group
                          ${
														pathname === '/historical'
															? 'text-blue-500 text-whi bg-blue-50/60'
															: 'text-gray-700'
													}
                          hover:text-blue-500 hover:bg-blue-50/40
                          hover:pl-8`}
											>
												<div
													className='absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-purple-500 
                          transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300 ease-out'
												/>

												<span className='relative text-white'>
													Historical Data
													<span
														className='absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 
                            group-hover:w-full transition-all duration-300 ease-out'
													/>
												</span>
											</Link>

											<Link
												href='/prediction'
												className={`relative flex items-center gap-3 px-6 py-4 text-sm font-medium 
                          transition-all duration-300 ease-out group
                          ${
														pathname === '/prediction'
															? 'text-blue-500 bg-blue-50/60'
															: 'text-gray-700'
													}
                          hover:text-blue-500 hover:bg-blue-50/40
                          hover:pl-8`}
											>
												<div
													className='absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-purple-500 
                          transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300 ease-out'
												/>

												<span className='relative text-white'>
													Prediction
													<span
														className='absolute bottom-0 left-0 w-0 h-0.5 bg-purple-400 
                            group-hover:w-full transition-all duration-300 ease-out'
													/>
												</span>
											</Link>
										</div>
									</div>
								) : (
									<Link
										key={item.id}
										href={item.href}
										className={`
                      relative py-2 px-4 font-orbitron text-sm tracking-wide
                      transition-all duration-400 ease-out rounded-lg
                      group
                      ${
												pathname === item.href
													? 'text-blue-500 bg-white/10'
													: 'text-gray-700'
											}
                      hover:text-blue-500
                      hover:bg-white/10
                    `}
									>
										<div
											className='absolute inset-0 bg-gradient-to-r from-blue-400/10 to-purple-500/10 
                      rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-400 ease-out'
										/>

										<span className='relative z-10'>{item.label}</span>

										<span
											className={`
                        absolute bottom-0 left-1/2 transform -translate-x-1/2
                        h-0.5 w-0 rounded-full
                        bg-gradient-to-r from-blue-400 to-purple-500
                        transition-all duration-500 ease-out
                        group-hover:w-4/5
                        ${pathname === item.href ? 'w-4/5' : ''}
                      `}
										/>

										{pathname === item.href && (
											<div className='absolute inset-0 rounded-lg bg-blue-500/5 blur-sm' />
										)}
									</Link>
								)
							)}
						</nav>

						<div className='flex items-center space-x-3'>
							<button
								onClick={handleMusicToggle}
								className='cursor-pointer relative w-12 h-7 rounded-full 
                  bg-gradient-to-r from-blue-400 to-purple-500 
                  transition-all duration-500 ease-out
                  focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:ring-offset-2 focus:ring-offset-background 
                  shadow-lg hover:shadow-blue-500/40 hover:shadow-xl
                  hover:scale-105 active:scale-95
                  group'
								aria-label={
									isMusicPlaying ? 'Выключить музыку' : 'Включить музыку'
								}
							>
								<div
									className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-lg transform transition-all duration-500 ease-out
                    ${isMusicPlaying ? 'translate-x-5' : 'translate-x-0.5'}
                    group-hover:scale-110 flex items-center justify-center`}
								>
									{isMusicPlaying ? (
										<svg
											className='w-2.5 h-2.5 text-blue-500'
											fill='currentColor'
											viewBox='0 0 20 20'
										>
											<path
												fillRule='evenodd'
												d='M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.784L4.728 14H2a1 1 0 01-1-1V7a1 1 0 011-1h2.728l3.655-2.784a1 1 0 011.617.784zm4.6 1.224a1 1 0 011.414 0A7.972 7.972 0 0117 10a7.972 7.972 0 01-1.603 4.7 1 1 0 01-1.414-1.4A5.972 5.972 0 0015 10a5.972 5.972 0 00-1.017-3.3 1 1 0 010-1.4zm2.828 2.828a1 1 0 111.414 1.414 3.987 3.987 0 010 5.656 1 1 0 01-1.414-1.414 1.987 1.987 0 000-2.828 1 1 0 010-2.828z'
												clipRule='evenodd'
											/>
										</svg>
									) : (
										<svg
											className='w-2.5 h-2.5 text-gray-500'
											fill='currentColor'
											viewBox='0 0 20 20'
										>
											<path
												fillRule='evenodd'
												d='M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.784L4.728 14H2a1 1 0 01-1-1V7a1 1 0 011-1h2.728l3.655-2.784a1 1 0 011.617.784zm4.6 1.224a1 1 0 011.414 0A7.972 7.972 0 0117 10a7.972 7.972 0 01-1.603 4.7 1 1 0 01-1.414-1.4A5.972 5.972 0 0015 10a5.972 5.972 0 00-1.017-3.3 1 1 0 010-1.4zm2.828 2.828a1 1 0 111.414 1.414 3.987 3.987 0 010 5.656 1 1 0 01-1.414-1.414 1.987 1.987 0 000-2.828 1 1 0 010-2.828z'
												clipRule='evenodd'
											/>
											<line
												x1='3'
												y1='17'
												x2='17'
												y2='3'
												stroke='currentColor'
												strokeWidth='1.5'
											/>
										</svg>
									)}

									<div
										className='absolute inset-0 rounded-full bg-gradient-to-r from-blue-400/20 to-purple-500/20 
                    opacity-0 group-hover:opacity-100 transition-opacity duration-300'
									/>
								</div>

								{isMusicPlaying && (
									<>
										<div className='absolute top-0.5 left-1.5 w-0.5 h-0.5 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100' />
										<div className='absolute bottom-0.5 right-2.5 w-0.5 h-0.5 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-200' />
									</>
								)}
							</button>
						</div>
					</div>
				</div>
			</div>
		</header>
	)
}

export default Header