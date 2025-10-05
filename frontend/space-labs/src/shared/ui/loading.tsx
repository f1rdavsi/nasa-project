'use client'
import '@/app/globals.css'

export default function EarthLoader() {
	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-600'>
			<div className='absolute inset-0 overflow-hidden'>
				<div className='absolute -inset-10 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse'></div>
				<div className='absolute top-1/4 left-1/4 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl animate-ping'></div>
				<div className='absolute bottom-1/4 right-1/4 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl animate-pulse'></div>
			</div>

			<div className='relative flex flex-col items-center justify-center space-y-8'>
				<div className='relative'>
					<div className='absolute -inset-8 border-2 border-blue-400/30 rounded-full animate-spin-slow'>
						<div className='absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 w-3 h-3 bg-blue-400 rounded-full'></div>
					</div>

					<div className='relative w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 via-blue-600 to-green-500 shadow-2xl overflow-hidden animate-rotate-3d'>
						<div className='absolute inset-0 bg-gradient-to-br from-green-400/40 to-green-600/40 rounded-full'></div>
						<div className='absolute top-1/4 left-1/4 w-8 h-8 bg-green-500/60 rounded-full blur-sm'></div>
						<div className='absolute bottom-1/3 right-1/4 w-12 h-6 bg-green-500/70 rounded-full blur-sm'></div>
						<div className='absolute top-1/3 left-1/3 w-16 h-6 bg-white/30 rounded-full blur-sm animate-pulse'></div>
						<div className='absolute bottom-1/4 right-1/3 w-12 h-4 bg-white/20 rounded-full blur-sm animate-pulse delay-300'></div>
						<div className='absolute inset-0 rounded-full bg-gradient-to-r from-blue-400/20 to-transparent shadow-[inset_0_0_50px_rgba(59,130,246,0.3)]'></div>
					</div>

					<div className='absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4'>
						<div className='w-6 h-3 bg-gray-300 rounded-full animate-orbit'>
							<div className='absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-400 rounded-full'></div>
						</div>
					</div>
				</div>

				<div className='text-center space-y-4'>
					<h2 className='text-2xl font-bold font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 animate-pulse'>
						SpaceLabs
					</h2>
					<div className='flex space-x-2 justify-center'>
						<div className='w-2 h-2 bg-blue-400 rounded-full animate-bounce'></div>
						<div className='w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-150'></div>
						<div className='w-2 h-2 bg-cyan-400 rounded-full animate-bounce delay-300'></div>
					</div>
					<p className='text-white/70 text-sm font-light animate-pulse'>
						Loading data about air pollution...
					</p>
				</div>

				<div className='w-64 h-1 bg-white/20 rounded-full overflow-hidden'>
					<div className='h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-progress'></div>
				</div>
			</div>

			<div className='absolute inset-0'>
				{[...Array(20)].map((_, i) => (
					<div
						key={i}
						className='absolute w-1 h-1 bg-white rounded-full animate-twinkle'
						style={{
							top: `${Math.random() * 100}%`,
							left: `${Math.random() * 100}%`,
							animationDelay: `${Math.random() * 3}s`,
							animationDuration: `${2 + Math.random() * 2}s`,
						}}
					/>
				))}
			</div>
		</div>
	)
}