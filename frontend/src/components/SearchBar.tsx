// src/components/SearchBar.tsx
import { Search } from 'lucide-react';

interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
}

export function SearchBar({ searchTerm, setSearchTerm }: SearchBarProps) {
  return (
    <div className="relative w-full">
      <input 
        type="text" 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Faça sua busca..."
        className="w-full bg-[#ffffff] border border-gray-300 h-10 px-4 rounded-2xl outline-none focus:ring-2 focus:ring-intellisys-red transition-all pr-12 text-sm text-gray-700"
      />
      <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 size-5" />
    </div>
  );
}