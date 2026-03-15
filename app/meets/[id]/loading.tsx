export default function MeetLoading() {
  return (
    <div className="min-h-screen bg-[#080808]">
      <div className="border-b border-[#1a1a1a] bg-[#0D0D0D] px-6 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="h-4 w-32 bg-[#1a1a1a] rounded animate-pulse mb-2" />
          <div className="h-8 w-64 bg-[#1a1a1a] rounded animate-pulse mb-2" />
          <div className="h-4 w-48 bg-[#1a1a1a] rounded animate-pulse" />
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-[#2A2A2A] bg-[#111111] p-5">
              <div className="h-8 w-12 bg-[#1a1a1a] rounded animate-pulse mb-2" />
              <div className="h-4 w-20 bg-[#1a1a1a] rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-[#2A2A2A] bg-[#111111] p-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-[#0D0D0D]">
                  <div className="h-4 w-32 bg-[#1a1a1a] rounded animate-pulse" />
                  <div className="h-4 w-16 bg-[#1a1a1a] rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="rounded-xl border border-[#2A2A2A] bg-[#111111] p-5 h-32 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
