import * as React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: 'default' | 'outline' | 'ghost'
	size?: 'default' | 'sm' | 'lg'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{ className = '', variant = 'default', size = 'default', ...props },
		ref
	) => {
		const baseStyles =
			'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none'

		const variants = {
			default:
				'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-500/30 hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] hover:scale-105',
			outline:
				'border-2 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]',
			ghost: 'text-cyan-400 hover:bg-cyan-500/10',
		}

		const sizes = {
			default: 'h-10 px-6 py-2',
			sm: 'h-8 px-4 text-sm',
			lg: 'h-12 px-8 text-lg',
		}

		return (
			<button
				className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
				ref={ref}
				{...props}
			/>
		)
	}
)

Button.displayName = 'Button'

export { Button }