import Prediction from '@/entities/components/Prediction'
import Footer from '@/widgets/footer/footer'
import Header from '@/widgets/header/header'
import { ParallaxHero } from '@/widgets/parallax-hero/parallax-hero'

export default function Statistic() {
	return (
		<div>
			<Header />
			<ParallaxHero
				title='Prediction'
				subtitle='Prediction is the process of using data and models to estimate future events or outcomes. It helps individuals and organizations make informed decisions, anticipate problems, and plan strategies effectively.'
			/>
			<Prediction />
			<Footer />
		</div>
	)
}
