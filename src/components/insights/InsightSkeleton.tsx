export function InsightSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Health score skeleton */}
      <div className="bg-[#252526] border border-[#3c3c3c] rounded-lg p-4 sm:p-6">
        <div className="h-5 w-40 bg-[#3c3c3c] rounded mb-4" />
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-36 h-36 rounded-full bg-[#3c3c3c]" />
          <div className="flex-1 w-full space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-3 w-24 bg-[#3c3c3c] rounded" />
                <div className="flex-1 h-2 bg-[#3c3c3c] rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insight card skeletons */}
      {[1, 2, 3].map(i => (
        <div key={i} className="flex bg-[#252526] border border-[#3c3c3c] rounded-lg overflow-hidden">
          <div className="w-1 bg-[#3c3c3c]" />
          <div className="flex-1 p-4">
            <div className="h-4 w-48 bg-[#3c3c3c] rounded mb-2" />
            <div className="h-3 w-full bg-[#3c3c3c] rounded mb-1" />
            <div className="h-3 w-2/3 bg-[#3c3c3c] rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
