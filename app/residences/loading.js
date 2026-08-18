export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="h-8 w-64 bg-bleu-50 rounded-md animate-pulse mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl overflow-hidden border border-anthracite-100">
            <div className="h-56 bg-bleu-50 animate-pulse" />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-bleu-50 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-bleu-50 rounded animate-pulse w-1/2" />
              <div className="h-3 bg-bleu-50 rounded animate-pulse w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}