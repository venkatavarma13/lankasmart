export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg overflow-hidden shadow-card">
          <div className="skeleton h-48 w-full" />
          <div className="p-3 space-y-2">
            <div className="skeleton h-4 rounded w-3/4" />
            <div className="skeleton h-3 rounded w-1/2" />
            <div className="skeleton h-4 rounded w-1/3" />
            <div className="skeleton h-8 rounded w-full mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="skeleton h-96 rounded-lg" />
      <div className="space-y-4">
        <div className="skeleton h-8 rounded w-3/4" />
        <div className="skeleton h-4 rounded w-1/2" />
        <div className="skeleton h-6 rounded w-1/3" />
        <div className="skeleton h-24 rounded" />
        <div className="skeleton h-12 rounded" />
      </div>
    </div>
  );
}
