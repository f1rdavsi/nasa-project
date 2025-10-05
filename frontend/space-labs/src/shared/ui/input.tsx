import * as React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	({ className = '', ...props }, ref) => {
		return (
			<input
				ref={ref}
				className={`flex h-10 w-full rounded-lg border border-cyan-500/50 bg-slate-900/50 px-3 py-2 text-sm text-cyan-400 placeholder:text-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] ${className}`}
				{...props}
			/>
		)
	}
)

Input.displayName = 'Input'

export { Input }