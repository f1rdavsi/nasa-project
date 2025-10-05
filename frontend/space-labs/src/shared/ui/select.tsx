import * as React from 'react'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
	({ className = '', children, ...props }, ref) => {
		return (
			<select
				ref={ref}
				className={`flex h-10 w-full rounded-lg border border-cyan-500/50 bg-slate-900/50 px-3 py-2 text-sm text-cyan-400 placeholder:text-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] ${className}`}
				{...props}
			>
				{children}
			</select>
		)
	}
)

Select.displayName = 'Select'

export { Select }