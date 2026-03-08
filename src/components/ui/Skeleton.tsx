export function SkeletonLine({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
      <SkeletonLine className="h-5 w-2/3" />
      <SkeletonLine className="h-4 w-full" />
      <SkeletonLine className="h-4 w-1/2" />
    </div>
  );
}

export function SkeletonCards({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-4">
          <SkeletonLine className="h-10 w-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <SkeletonLine className="h-4 w-3/4" />
            <SkeletonLine className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="border-b border-gray-100 px-5 py-3 flex gap-8">
        <SkeletonLine className="h-4 w-24" />
        <SkeletonLine className="h-4 w-16 hidden sm:block" />
        <SkeletonLine className="h-4 w-20 hidden md:block" />
        <div className="flex-1" />
        <SkeletonLine className="h-4 w-16" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border-b border-gray-50 last:border-0 px-5 py-4 flex items-center gap-4">
          <SkeletonLine className="h-9 w-9 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <SkeletonLine className="h-4 w-1/3" />
            <SkeletonLine className="h-3 w-1/4" />
          </div>
          <SkeletonLine className="h-8 w-20 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <SkeletonLine className="h-8 w-64" />
        <SkeletonLine className="h-5 w-48" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 space-y-2">
            <SkeletonLine className="h-4 w-20" />
            <SkeletonLine className="h-8 w-12" />
          </div>
        ))}
      </div>
      <SkeletonCards count={3} />
    </div>
  );
}
