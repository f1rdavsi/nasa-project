'use client'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export function useRouterLoading() {
	const pathname = usePathname()
	const searchParams = useSearchParams()
	const [isLoading, setIsLoading] = useState(false)

	useEffect(() => {
		setIsLoading(true)
		const timer = setTimeout(() => setIsLoading(false), 800)

		return () => clearTimeout(timer)
	}, [pathname, searchParams])

	return isLoading
}