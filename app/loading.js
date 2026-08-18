export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center py-32">
      <div className="w-12 h-12 border-4 border-bleu-100 border-t-bleu-600 rounded-full animate-spin" />
      <p className="text-anthracite-400 text-sm mt-4">Chargement...</p>
    </div>
  );
}