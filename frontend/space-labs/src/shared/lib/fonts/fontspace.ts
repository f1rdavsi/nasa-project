import { Exo_2, Orbitron, Rajdhani } from 'next/font/google'

export const orbitron = Orbitron({
	subsets: ['latin'],
	display: 'swap',
	variable: '--font-orbitron',
})

export const rajdhani = Rajdhani({
	subsets: ['latin'],
	display: 'swap',
	weight: ['300', '400', '500', '600', '700'],
	variable: '--font-rajdhani',
})

export const exo2 = Exo_2({
	subsets: ['latin', 'cyrillic'],
	display: 'swap',
	variable: '--font-exo',
})
