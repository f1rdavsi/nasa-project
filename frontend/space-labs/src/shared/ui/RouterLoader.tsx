'use client'
import { useRouterLoading } from '../lib/hooks/useRouterLoading'
import EarthLoader from './loading'

export function RouterLoader() {
  const isLoading = useRouterLoading()

  if (!isLoading) return null

  return <EarthLoader />
}