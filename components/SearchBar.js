"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export default function SearchBar() {
  const [q, setQ] = useState("");
  const router = useRouter();

  function handleSubmit(e) {
    e.preventDefault();
    router.push(`/residences?q=${encodeURIComponent(q)}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-xl w-full mx-auto mt-8 flex flex-col sm:flex-row bg-white rounded-lg overflow-hidden shadow-lg"
    >
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Rechercher par ville, quartier..."
        className="flex-1 px-4 py-3 text-anthracite-800 focus:outline-none min-w-0"
      />
      <button
        type="submit"
        className="bg-rouge-500 hover:bg-rouge-600 text-white px-6 py-3 flex items-center justify-center gap-2 font-semibold transition"
      >
        <Search size={18} />
        Rechercher
      </button>
    </form>
  );
}