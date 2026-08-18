export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <div className="h-80 bg-bleu-50 rounded-lg animate-pulse mb-6" />
        <div className="h-8 bg-bleu-50 rounded animate-pulse w-2/3 mb-3" />
        <div className="h-4 bg-bleu-50 rounded animate-pulse w-1/3" />
      </div>
      <div className="h-40 bg-bleu-50 rounded-lg animate-pulse" />
    </div>
  );
}