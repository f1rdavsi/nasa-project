'use client'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { usePollutionStore } from '@/shared/lib/store'
import gsap from 'gsap'
import { Calendar, Download, Globe, MapPin } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	ComposedChart,
	Legend,
	Line,
	LineChart,
	ReferenceLine,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts'

const COUNTRIES = [
	{ code: 'TJ', name: 'Tajikistan' },
	{ code: 'US', name: 'US' },
	{ code: 'CN', name: 'China' },
	{ code: 'IN', name: 'India' },
	{ code: 'GB', name: 'Great Britain' },
	{ code: 'DE', name: 'German' },
	{ code: 'FR', name: 'France' },
	{ code: 'JP', name: 'Japan' },
	{ code: 'BR', name: 'Brasil' },
	{ code: 'RU', name: 'Russia' },
	{ code: 'KZ', name: 'Kazakhstan' },
	{ code: 'UZ', name: 'Uzbekistan' },
]

// удалены мок-данные; используем бэкенд через Zustand

const TableSkeleton = () => (
	<div className='space-y-3 animate-pulse'>
		{[...Array(5)].map((_, i) => (
			<div key={i} className='flex gap-4'>
				{[...Array(9)].map((_, j) => (
					<div
						key={j}
						className='h-8 bg-blue-900/30 rounded flex-1 shadow-[0_0_10px_rgba(30,58,138,0.3)]'
					></div>
				))}
			</div>
		))}
	</div>
)

const ChartSkeleton = () => (
	<div className='animate-pulse'>
		<div className='h-6 bg-blue-900/30 rounded w-1/3 mb-4 shadow-[0_0_10px_rgba(30,58,138,0.3)]'></div>
		<div className='h-[300px] bg-blue-900/20 rounded shadow-[inset_0_0_20px_rgba(30,58,138,0.2)]'></div>
	</div>
)
const CustomTooltip = ({ active, payload, label }: any) => {
	if (active && payload && payload.length) {
		const keyName = payload[0].name || payload[0].dataKey
		return (
			<div className='bg-slate-800 text-cyan-100 p-2 rounded border border-blue-700 shadow-md'>
				<p className='font-orbitron text-sm'>{label}</p>
				<p>
					{keyName}: {payload[0].value}
				</p>
			</div>
		)
	}
	return null
}

export default function Historical() {
	const [selectedCountry, setSelectedCountry] = useState('TJ')
	const [isAutoDetected, setIsAutoDetected] = useState(true)
	const [startDate, setStartDate] = useState('')
	const [endDate, setEndDate] = useState('')
    const { measurements: pollutionData, loading: isLoading, setRange, setCountry, detectLocation, loadHistory } = usePollutionStore()

	const [currentPage, setCurrentPage] = useState(1)
	const itemsPerPage = 15
	const totalPages = Math.ceil(pollutionData.length / itemsPerPage)
	const indexOfLastItem = currentPage * itemsPerPage
	const indexOfFirstItem = indexOfLastItem - itemsPerPage
	const currentItems = pollutionData.slice(indexOfFirstItem, indexOfLastItem)

	const filtersRef = useRef<HTMLDivElement>(null)
	const tableRef = useRef<HTMLDivElement>(null)
	const tableBodyRef = useRef<HTMLTableSectionElement>(null)
	const chartsRef = useRef<HTMLDivElement>(null)
	const countryRef = useRef<HTMLSelectElement>(null)

	useEffect(() => {
		const today = new Date()
		const thirtyDaysAgo = new Date(today)
		thirtyDaysAgo.setDate(today.getDate() - 30)

		setStartDate(thirtyDaysAgo.toISOString().split('T')[0])
		setEndDate(today.toISOString().split('T')[0])
        setRange(thirtyDaysAgo.toISOString().split('T')[0], today.toISOString().split('T')[0])
        detectLocation().then(() => {
            loadHistory()
        })
	}, [])

	useEffect(() => {
		const ctx = gsap.context(() => {
			if (filtersRef.current)
				gsap.from(filtersRef.current, {
					opacity: 0,
					y: -40,
					duration: 0.8,
					ease: 'power3.out',
				})
			if (countryRef.current)
				gsap.from(countryRef.current, {
					opacity: 0,
					scale: 0.9,
					duration: 0.8,
					delay: 0.2,
					ease: 'back.out(1.7)',
				})
			if (tableRef.current)
				gsap.from(tableRef.current, {
					opacity: 0,
					y: 50,
					duration: 0.8,
					delay: 0.4,
					ease: 'power3.out',
				})
			if (chartsRef.current?.children) {
				gsap.from(Array.from(chartsRef.current.children), {
					opacity: 0,
					y: 60,
					scale: 0.95,
					duration: 0.8,
					stagger: 0.2,
					delay: 0.6,
					ease: 'power3.out',
				})
			}
		})
		return () => ctx.revert()
	}, [pollutionData])

	useEffect(() => {
		if (!tableBodyRef.current) return
		gsap.from(Array.from(tableBodyRef.current.children), {
			opacity: 0,
			y: 30,
			duration: 0.6,
			stagger: 0.05,
			ease: 'power3.out',
		})
	}, [currentPage, isLoading])

	const handleFilter = () => {
		if (!startDate || !endDate) return
        setRange(startDate, endDate)
        setCurrentPage(1)
        loadHistory()
	}

	const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const c = e.target.value
        setSelectedCountry(c)
        setIsAutoDetected(false)
        setCountry(c)
        setCurrentPage(1)
        loadHistory()
	}

	const downloadCSV = () => {
		if (pollutionData.length === 0) return
		const headers = ['Дата', 'AQI', 'PM2.5', 'PM10', 'CO', 'NO2', 'O3', 'SO2']
		const csvContent = [
			headers.join(','),
			...pollutionData.map(d =>
				[d.date, d.aqi, d.pm25, d.pm10, d.co, d.no2, d.o3, d.so2].join(',')
			),
		].join('\n')
		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
		const url = window.URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = `pollution-${selectedCountry}-${startDate}-to-${endDate}.csv`
		a.click()
		window.URL.revokeObjectURL(url)
	}

	// -----------------------------
	// TODO: Для графиков AQI/PM2.5/PM10:
	// Можно использовать GET /pollution/predict?country=...&start=...&end=...
	// и обновлять pollutionData
	// -----------------------------
	const getAQIColor = (aqi: number) => {
		if (aqi <= 50) return 'text-green-400'
		if (aqi <= 100) return 'text-yellow-400'
		if (aqi <= 150) return 'text-orange-400'
		if (aqi <= 200) return 'text-red-400'
		return 'text-purple-400'
	}

	const getAQIBadge = (aqi: number) => {
		if (aqi <= 50)
			return {
				text: 'Good',
				color: 'bg-green-500/20 text-green-400 border-green-500/50',
			}
		if (aqi <= 100)
			return {
				text: 'Moderately',
				color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
			}
		if (aqi <= 150)
			return {
				text: 'Unhealthy',
				color: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
			}
		if (aqi <= 200)
			return {
				text: 'Harmful',
				color: 'bg-red-500/20 text-red-400 border-red-500/50',
			}
		return {
			text: 'Dangerous',
			color: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
		}
	}

	// TODO: здесь return() с JSX без изменений

	return (
		<div className='container mx-auto px-4 py-12 space-y-8'>
			<Card
				ref={filtersRef}
				className='p-6 bg-slate-900/50 border-2  border-blue-900 shadow-[0_0_20px_rgba(30,58,138,0.6)] backdrop-blur-sm'
			>
				<div className='mb-6'>
					<label className=' text-sm font-medium font-orbitron text-cyan-400 mb-3 flex items-center gap-2'>
						<Globe className='w-5 h-5 ' />
						Select the country
						{isAutoDetected && (
							<span className='text-xs bg-cyan-500/20 px-2 py-1 rounded border border-cyan-500/50 flex items-center gap-1'>
								<MapPin className='w-3 h-3' />
								Autodetected
							</span>
						)}
					</label>
					<select
						ref={countryRef}
						value={selectedCountry}
						onChange={handleCountryChange}
						className='w-full md:w-1/2 px-4 py-3 bg-slate-950 border-2 border-blue-800 rounded-lg text-cyan-100 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 cursor-pointer'
					>
						{COUNTRIES.map(c => (
							<option key={c.code} value={c.code}>
								{c.name}
							</option>
						))}
					</select>
				</div>

				<div className='flex flex-col md:flex-row gap-4 items-end'>
					<div className='flex-1'>
						<label className='text-sm font-orbitron font-medium text-cyan-400 mb-2 flex items-center gap-2'>
							<Calendar className='w-4 h-4' /> From date
						</label>
						<input
							type='date'
							value={startDate}
							onChange={e => setStartDate(e.target.value)}
							className='w-full px-4 py-2 bg-slate-950 border-2 border-blue-800 rounded-lg text-cyan-100 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50'
						/>
					</div>

					<div className='flex-1'>
						<label className='text-sm font-orbitron font-medium text-cyan-400 mb-2 flex items-center gap-2'>
							<Calendar className='w-4 h-4' /> Until date
						</label>
						<input
							type='date'
							value={endDate}
							onChange={e => setEndDate(e.target.value)}
							className='w-full px-4 py-2 bg-slate-950 border-2 border-blue-800 rounded-lg text-cyan-100 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50'
						/>
					</div>

					<Button
						onClick={handleFilter}
						disabled={isLoading}
						className='bg-gradient-to-r  font-orbitron  from-cyan-600 to-blue-600 text-white border-2 border-cyan-400'
					>
						{isLoading ? 'Downloading...' : 'Apply filter'}
					</Button>

					<Button
						onClick={downloadCSV}
						disabled={!pollutionData.length}
						className='bg-gradient-to-r font-orbitron from-purple-600 to-pink-600 text-white border-2 border-purple-400 flex items-center'
					>
						<Download className='w-4 h-4 mr-2' /> Download CSV
					</Button>
				</div>
			</Card>

			<Card
				ref={tableRef}
				className='p-6 bg-slate-900/50 border-2 border-blue-900 shadow-[0_0_20px_rgba(30,58,138,0.6)] backdrop-blur-sm'
			>
				<h2 className='text-2xl  font-orbitron font-bold text-cyan-400 mb-6'>
					Air pollution data -{' '}
					{COUNTRIES.find(c => c.code === selectedCountry)?.name}
				</h2>
				{isLoading ? (
					<TableSkeleton />
				) : (
					<>
						<div className='overflow-x-auto'>
							<table className='w-full'>
								<thead>
									<tr className='border-b-2 border-blue-800'>
										<th className='px-4 py-3 text-left text-cyan-400 font-semibold'>
											Date
										</th>
										<th className='px-4 py-3 text-left text-cyan-400 font-semibold'>
											AQI
										</th>
										<th className='px-4 py-3 text-left text-cyan-400 font-semibold'>
											Status
										</th>
										<th className='px-4 py-3 text-left text-cyan-400 font-semibold'>
											PM2.5
										</th>
										<th className='px-4 py-3 text-left text-cyan-400 font-semibold'>
											PM10
										</th>
										<th className='px-4 py-3 text-left text-cyan-400 font-semibold'>
											CO
										</th>
										<th className='px-4 py-3 text-left text-cyan-400 font-semibold'>
											NO2
										</th>
										<th className='px-4 py-3 text-left text-cyan-400 font-semibold'>
											O3
										</th>
										<th className='px-4 py-3 text-left text-cyan-400 font-semibold'>
											SO2
										</th>
									</tr>
								</thead>
								<tbody ref={tableBodyRef}>
									{currentItems.map((row, idx) => {
										const badge = getAQIBadge(row.aqi)
										return (
											<tr
												key={idx}
												className='border-b border-blue-900/50 hover:bg-blue-950/40'
											>
												<td className='px-4 py-3 text-cyan-100'>{row.date}</td>
												<td
													className={`px-4 py-3 font-bold text-lg ${getAQIColor(
														row.aqi
													)}`}
												>
													{row.aqi}
												</td>
												<td className='px-4 py-3'>
													<span
														className={`px-2 py-1 rounded text-xs font-semibold border ${badge.color}`}
													>
														{badge.text}
													</span>
												</td>
												<td className='px-4 py-3 text-cyan-100'>{row.pm25}</td>
												<td className='px-4 py-3 text-cyan-100'>{row.pm10}</td>
												<td className='px-4 py-3 text-cyan-100'>{row.co}</td>
												<td className='px-4 py-3 text-cyan-100'>{row.no2}</td>
												<td className='px-4 py-3 text-cyan-100'>{row.o3}</td>
												<td className='px-4 py-3 text-cyan-100'>{row.so2}</td>
											</tr>
										)
									})}
								</tbody>
							</table>
						</div>

						<div className='flex justify-center font-orbitron items-center gap-2 mt-4 flex-wrap'>
							<Button
								onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
								disabled={currentPage === 1}
								className='px-3 py-1 bg-blue-700 text-white rounded'
							>
								Return
							</Button>
							{Array.from({ length: totalPages }, (_, i) => (
								<Button
									key={i}
									onClick={() => setCurrentPage(i + 1)}
									className={`px-3 py-1 rounded ${
										currentPage === i + 1
											? 'bg-cyan-500 text-white'
											: 'bg-slate-800 text-cyan-100'
									}`}
								>
									{i + 1}
								</Button>
							))}
							<Button
								onClick={() =>
									setCurrentPage(prev => Math.min(prev + 1, totalPages))
								}
								disabled={currentPage === totalPages}
								className='px-3 py-1  bg-blue-700 text-white rounded'
							>
								Next
							</Button>
						</div>
					</>
				)}
			</Card>

			<div ref={chartsRef} className='space-y-8'>
				{isLoading ? (
					<>
						<Card className='p-6'>
							<ChartSkeleton />
						</Card>
						<Card className='p-6'>
							<ChartSkeleton />
						</Card>
						<Card className='p-6'>
							<ChartSkeleton />
						</Card>
					</>
				) : (
					<>
						<Card className='p-6'>
							<h3 className='text-xl font-semibold font-orbitron text-cyan-300 mb-4'>
								Air quality index (AQI)
							</h3>
							<ResponsiveContainer width='100%' height={350}>
								<LineChart data={pollutionData}>
									<CartesianGrid
										strokeDasharray='3 3'
										stroke='#1e3a8a'
										opacity={0.2}
									/>
									<XAxis dataKey='date' stroke='#0ea5e9' />
									<YAxis stroke='#0ea5e9' />
									<Tooltip content={CustomTooltip} />
									<Legend />
									<Line
										type='monotone'
										dataKey='aqi'
										stroke='#06b6d4'
										strokeWidth={2}
									/>
								</LineChart>
							</ResponsiveContainer>
						</Card>

						<Card className='p-6'>
							<h3 className='text-xl font-orbitron font-semibold text-cyan-300 mb-4'>
								PM2.5
							</h3>
							<ResponsiveContainer width='100%' height={350}>
								<AreaChart data={pollutionData}>
									<CartesianGrid
										strokeDasharray='3 3'
										stroke='#1e3a8a'
										opacity={0.2}
									/>
									<XAxis dataKey='date' stroke='#0ea5e9' />
									<YAxis stroke='#0ea5e9' />
									<Tooltip content={CustomTooltip} />
									<Area
										type='monotone'
										dataKey='pm25'
										stroke='#facc15'
										fill='rgba(250,204,21,0.3)'
									/>
								</AreaChart>
							</ResponsiveContainer>
						</Card>

						<Card className='p-6'>
							<h3 className='text-xl font-orbitron font-semibold text-cyan-300 mb-4'>
								PM10
							</h3>
							<ResponsiveContainer width='100%' height={350}>
								<BarChart data={pollutionData}>
									<CartesianGrid
										strokeDasharray='3 3'
										stroke='#1e3a8a'
										opacity={0.2}
									/>
									<XAxis dataKey='date' stroke='#0ea5e9' />
									<YAxis stroke='#0ea5e9' />
									<Tooltip content={CustomTooltip} />
									<Bar dataKey='pm10' fill='#f87171' />
								</BarChart>
							</ResponsiveContainer>
						</Card>

						<Card className='p-6'>
							<h3 className='text-xl font-orbitron font-semibold text-cyan-300 mb-4'>
								NO2
							</h3>
							<ResponsiveContainer width='100%' height={350}>
								<ComposedChart data={pollutionData}>
									<CartesianGrid
										strokeDasharray='3 3'
										stroke='#1e3a8a'
										opacity={0.2}
									/>
									<XAxis dataKey='date' stroke='#0ea5e9' />
									<YAxis stroke='#0ea5e9' />
									<Tooltip content={CustomTooltip} />
									<Legend />
									<Bar dataKey='no2' fill='#34d399' />
									<Line
										type='monotone'
										dataKey='no2'
										stroke='#059669'
										strokeWidth={2}
									/>
								</ComposedChart>
							</ResponsiveContainer>
						</Card>

						<Card className='p-6'>
							<h3 className='text-xl font-orbitron font-semibold text-cyan-300 mb-4'>
								O3
							</h3>
							<ResponsiveContainer width='100%' height={350}>
								<AreaChart data={pollutionData}>
									<defs>
										<linearGradient id='o3Gradient' x1='0' y1='0' x2='0' y2='1'>
											<stop offset='5%' stopColor='#3b82f6' stopOpacity={0.8} />
											<stop
												offset='95%'
												stopColor='#3b82f6'
												stopOpacity={0.2}
											/>
										</linearGradient>
									</defs>
									<CartesianGrid
										strokeDasharray='3 3'
										stroke='#1e3a8a'
										opacity={0.2}
									/>
									<XAxis dataKey='date' stroke='#0ea5e9' />
									<YAxis stroke='#0ea5e9' />
									<Tooltip content={CustomTooltip} />
									<Area
										type='monotone'
										dataKey='o3'
										stroke='#3b82f6'
										fill='url(#o3Gradient)'
									/>
								</AreaChart>
							</ResponsiveContainer>
						</Card>

						<Card className='p-6'>
							<h3 className='text-xl font-orbitron font-semibold text-cyan-300 mb-4'>
								SO2
							</h3>
							<ResponsiveContainer width='100%' height={350}>
								<LineChart data={pollutionData}>
									<CartesianGrid
										strokeDasharray='3 3'
										stroke='#1e3a8a'
										opacity={0.2}
									/>
									<XAxis dataKey='date' stroke='#0ea5e9' />
									<YAxis stroke='#0ea5e9' />
									<Tooltip content={<CustomTooltip />} />
									<Line
										type='monotone'
										dataKey='so2'
										stroke='#f87171'
										strokeWidth={2}
										dot={{ r: 4, stroke: '#f87171', strokeWidth: 2 }}
									/>
								</LineChart>
							</ResponsiveContainer>
						</Card>

						<Card className='p-6'>
							<h3 className='text-xl font-orbitron font-semibold text-cyan-300 mb-4'>
								CO
							</h3>
							<ResponsiveContainer width='100%' height={350}>
								<LineChart data={pollutionData}>
									<CartesianGrid
										strokeDasharray='3 3'
										stroke='#1e3a8a'
										opacity={0.2}
									/>
									<XAxis dataKey='date' stroke='#0ea5e9' />
									<YAxis stroke='#0ea5e9' />
									<Tooltip content={<CustomTooltip />} />
									<ReferenceLine
										y={1.0}
										stroke='green'
										strokeDasharray='3 3'
										label='Safe'
									/>
									<ReferenceLine
										y={2.5}
										stroke='orange'
										strokeDasharray='3 3'
										label='Moderate'
									/>
									<ReferenceLine
										y={5.0}
										stroke='red'
										strokeDasharray='3 3'
										label='High'
									/>
									<Line
										type='monotone'
										dataKey='co'
										stroke='#fbbf24'
										strokeWidth={2}
									/>
								</LineChart>
							</ResponsiveContainer>
						</Card>
					</>
				)}
			</div>
		</div>
	)
}
