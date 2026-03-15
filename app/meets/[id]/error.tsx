'use client'
import { PageError } from '@/components/ui/error-boundary'
export default function MeetError({ error, reset }: { error: Error; reset: () => void }) {
  return <PageError message={error.message} reset={reset} />
}
