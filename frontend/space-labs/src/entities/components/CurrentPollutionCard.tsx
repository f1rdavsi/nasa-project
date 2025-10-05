'use client'
import { AlertTriangle, Droplets, Factory, MapPin, Wind } from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { fetchCurrentPollutionByCoords } from '@/shared/lib/api'

function getAQIInfo(aqi: number) {
	if (aqi <= 50)
		return {
			label: 'Good',
			color: '#22c55e',
			description: 'Air quality is considered satisfactory.',
		}
	if (aqi <= 100)
		return {
			label: 'Moderate',
			color: '#eab308',
			description: 'Air quality is acceptable.',
		}
	if (aqi <= 150)
		return {
			label: 'Unhealthy for Sensitive Groups',
			color: '#f97316',
			description: 'May cause issues for sensitive people.',
		}
	if (aqi <= 200)
		return {
			label: 'Unhealthy',
			color: '#ef4444',
			description: 'Everyone may begin to experience effects.',
		}
	if (aqi <= 300)
		return {
			label: 'Very Unhealthy',
			color: '#8b5cf6',
			description: 'Health alert for everyone.',
		}
	return {
		label: 'Hazardous',
		color: '#7f1d1d',
		description: 'Serious health effects for the entire population.',
	}
}

function formatPollutantValue(value: number, _type: string) {
	return `${value} µg/m³`
}

function Skeleton({ className }: { className?: string }) {
	return (
		<div
			className={`bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${className}`}
		/>
	)
}

export function CurrentPollutionCard() {
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null)
	const [aqi, setAqi] = useState<number | null>(null)
	const [pollutants, setPollutants] = useState<Record<string, number>>({})

	useEffect(() => {
		const fetchData = async () => {
			try {
				setIsLoading(true)
				setError(null)

				const position = await new Promise<GeolocationPosition>((resolve, reject) => {
					if (!navigator.geolocation) {
						reject(new Error('Geolocation is not supported'))
						return
					}
					navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 })
				})

				const lat = position.coords.latitude
				const lon = position.coords.longitude
				setCoords({ lat, lon })

				const res = await fetchCurrentPollutionByCoords({ lat, lon, radius_m: 10000 })
				setAqi(res.aqi)
				const byParam: Record<string, number> = {}
				for (const m of res.measurements || []) {
					const key = String(m.parameter || '').toLowerCase()
					if (typeof m.value === 'number') byParam[key] = m.value
				}
				setPollutants(byParam)
			} catch (err) {
				console.error('Error fetching pollution data:', err)
				setError('Failed to load pollution data')
			} finally {
				setIsLoading(false)
			}
		}

		fetchData()
	}, [])

	if (isLoading) {
		return (
			<div className='w-full border rounded-lg bg-white dark:bg-gray-900'>
				<div className='p-4'>
					<Skeleton className='h-8 w-64' />
					<Skeleton className='h-4 w-48 mt-2' />
				</div>
				<div className='p-4 space-y-4'>
					<Skeleton className='h-32 w-full' />
					<div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
						{[...Array(6)].map((_, i) => (
							<Skeleton key={i} className='h-24' />
						))}
					</div>
				</div>
			</div>
		)
	}

	if (error || aqi === null) {
		return (
			<div className='w-full border rounded-lg bg-white dark:bg-gray-900 p-12 text-center'>
				<AlertTriangle className='w-12 h-12 text-gray-400 mx-auto mb-4' />
				<p className='text-gray-500'>{error || 'No pollution data available for your location.'}</p>
			</div>
		)
	}

	const aqiInfo = getAQIInfo(aqi)

	return (
		<div
			className='w-full border-2 rounded-lg '
			style={{ borderColor: aqiInfo.color }}
		>
			<div className='p-4 flex items-start  justify-between'>
				<div>
					<h2 className='text-2xl flex  items-center gap-2 font-bold'>
						<MapPin className='w-6 h-6' />
					{coords ? `${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}` : 'Your Location'}
					</h2>
					<p className='text-sm text-gray-500 mt-2'>Real-time air quality data</p>
				</div>
				<div className='text-right'>
					<div
						className='text-4xl font-bold font-[family-name:var(--font-orbitron)]'
						style={{ color: aqiInfo.color }}
					>
						{aqi}
					</div>
					<div
						className='text-sm font-medium mt-1'
						style={{ color: aqiInfo.color }}
					>
						{aqiInfo.label}
					</div>
				</div>
			</div>

			<div className='p-4 space-y-6'>
				<div className='p-4 rounded-lg bg-gray-100 dark:bg-gray-800'>
					<p className='text-sm text-gray-600 dark:text-gray-300'>
						{aqiInfo.description}
					</p>
				</div>

				<div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
					<PollutantCard
						icon={<Droplets className='w-5 h-5' />}
						label='PM2.5'
						value={formatPollutantValue(pollutants.pm25 ?? 0, 'pm25')}
						color='#f59e0b'
					/>
					<PollutantCard
						icon={<Droplets className='w-5 h-5' />}
						label='PM10'
						value={formatPollutantValue(pollutants.pm10 ?? 0, 'pm10')}
						color='#f97316'
					/>
					<PollutantCard
						icon={<Wind className='w-5 h-5' />}
						label='NO₂'
						value={formatPollutantValue(pollutants.no2 ?? 0, 'no2')}
						color='#ef4444'
					/>
					<PollutantCard
						icon={<Wind className='w-5 h-5' />}
						label='O₃'
						value={formatPollutantValue(pollutants.o3 ?? 0, 'o3')}
						color='#3b82f6'
					/>
					<PollutantCard
						icon={<Factory className='w-5 h-5' />}
						label='SO₂'
						value={formatPollutantValue(pollutants.so2 ?? 0, 'so2')}
						color='#8b5cf6'
					/>
					<PollutantCard
						icon={<Factory className='w-5 h-5' />}
						label='CO'
						value={formatPollutantValue(pollutants.co ?? 0, 'co')}
						color='#ec4899'
					/>
				</div>
			</div>
		</div>
	)
}

interface PollutantCardProps {
	icon: React.ReactNode
	label: string
	value: string
	color: string
}

function PollutantCard({ icon, label, value, color }: PollutantCardProps) {
	return (
		<div className='p-4 rounded-lg bg-white dark:bg-gray-800 border hover:border-primary/50 transition-colors'>
			<div className='flex items-center gap-2 mb-2' style={{ color }}>
				{icon}
				<span className='text-sm font-medium'>{label}</span>
			</div>
			<div className='text-xl font-bold font-[family-name:var(--font-orbitron)]'>
				{value}
			</div>
		</div>
	)
}
