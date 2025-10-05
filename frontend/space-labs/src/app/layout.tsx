import { exo2, orbitron, rajdhani } from '@/shared/lib/fonts/fontspace'
import { RouterLoader } from '@/shared/ui/RouterLoader'
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
	title: 'SpaceLabs - Air Quality Monitoring',
	description: 'Global leaders in monitoring air quality from space',
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html
			lang='ru'
			className={`${orbitron.variable} ${rajdhani.variable} ${exo2.variable}`}
		>
			  <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
			<body>
				<RouterLoader />
				{children}
			</body>
		</html>
	)
}
