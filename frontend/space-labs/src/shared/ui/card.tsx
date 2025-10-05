import * as React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
	({ className = '', ...props }, ref) => {
		return (
			<div
				ref={ref}
				className={`rounded-xl border border-blue-900/50 bg-slate-950/80 backdrop-blur-sm shadow-[0_0_30px_rgba(30,58,138,0.3)] ${className}`}
				{...props}
			/>
		)
	}
)

Card.displayName = 'Card'

const CardHeader = React.forwardRef<HTMLDivElement, CardProps>(
	({ className = '', ...props }, ref) => {
		return (
			<div
				ref={ref}
				className={`flex flex-col space-y-1.5 p-6 ${className}`}
				{...props}
			/>
		)
	}
)

CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<
	HTMLHeadingElement,
	React.HTMLAttributes<HTMLHeadingElement>
>(({ className = '', ...props }, ref) => {
	return (
		<h3
			ref={ref}
			className={`text-2xl font-semibold leading-none tracking-tight text-cyan-400 ${className}`}
			{...props}
		/>
	)
})

CardTitle.displayName = 'CardTitle'

const CardContent = React.forwardRef<HTMLDivElement, CardProps>(
	({ className = '', ...props }, ref) => {
		return <div ref={ref} className={`p-6 pt-0 ${className}`} {...props} />
	}
)

CardContent.displayName = 'CardContent'

export { Card, CardContent, CardHeader, CardTitle }