export function InsightSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
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
