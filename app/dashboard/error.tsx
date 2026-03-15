'use client'
import { PageError } from '@/components/ui/error-boundary'
export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  return <PageError message={error.message} reset={reset} />
}
