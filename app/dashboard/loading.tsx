export default function DashboardLoading() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-7 w-56 bg-[#1a1a1a] rounded animate-pulse mb-2" />
          <div className="h-4 w-40 bg-[#1a1a1a] rounded animate-pulse" />
        </div>
        <div className="h-9 w-28 bg-[#1a1a1a] rounded-lg animate-pulse" />
      </div>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-xl border border-[#2A2A2A] bg-[#111111] p-5 animate-pulse">
            <div className="h-8 w-12 bg-[#1a1a1a] rounded mb-2" />
            <div className="h-4 w-20 bg-[#1a1a1a] rounded" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-[#2A2A2A] bg-[#111111] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#1a1a1a]">
          <div className="h-5 w-32 bg-[#1a1a1a] rounded animate-pulse" />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center justify-between px-6 py-4 border-b border-[#0D0D0D]">
            <div>
              <div className="h-5 w-48 bg-[#1a1a1a] rounded animate-pulse mb-1.5" />
              <div className="h-3 w-36 bg-[#1a1a1a] rounded animate-pulse" />
            </div>
            <div className="flex gap-2">
              <div className="h-7 w-16 bg-[#1a1a1a] rounded-lg animate-pulse" />
              <div className="h-7 w-20 bg-[#1a1a1a] rounded-lg animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
