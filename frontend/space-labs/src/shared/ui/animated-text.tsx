'use client'

interface LoaderCardProps {
	loadingText?: string
	words: string[]
	interval?: number
}

export default function LoaderCard({
	loadingText = 'loading',
	words,
	interval = 2.5,
}: LoaderCardProps) {
	const wordDuration = interval
	const cycleDuration = words.length * wordDuration

	return (
		<div className='px-2 py-1 rounded-xl'>
			<div className='flex items-center text-[25px] font-medium font-[Poppins]'>
				<h3 className='text-5xl md:text-6xl font-bold font-orbitron'>
					{loadingText}
				</h3>
				<div className='relative  ml-2 h-[100px] w-[300px] flex items-center'>
					{words.map((word, index) => (
						<h3
							key={index}
							className='absolute left-0 text-5xl md:text-6xl font-bold font-orbitron text-[#956afa]'
							style={{
								animation: `wordSwitch ${cycleDuration}s infinite`,
								animationDelay: `${index * wordDuration}s`,
								animationFillMode: 'both',
							}}
						>
							{word}
						</h3>
					))}
				</div>
			</div>

			<style jsx>{`
				@keyframes wordSwitch {
					0% {
						transform: translateY(120%);
						opacity: 0;
					}
					10% {
						transform: translateY(0);
						opacity: 1;
					}
					15% {
						transform: translateY(0);
						opacity: 1;
					}
					20% {
						transform: translateY(-120%);
						opacity: 0;
					}
					100% {
						transform: translateY(-120%);
						opacity: 0;
					}
				}
			`}</style>
		</div>
	)
}
