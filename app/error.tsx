'use client'
import { PageError } from '@/components/ui/error-boundary'
export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html><body className="bg-[#080808]">
      <PageError message={error.message} reset={reset} />
    </body></html>
  )
}
