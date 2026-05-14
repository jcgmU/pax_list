import React from 'react';
import { Search } from 'lucide-react';
import { useStore } from '../store/useStore';

export const SearchBar: React.FC = () => {
  const { searchTerm, setSearchTerm } = useStore();
  
  return (
    <div className="relative mb-6">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
      <input
        type="text"
        placeholder="Buscar nombre o asiento..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
        className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-[#E20613] transition-all"
      />
    </div>
  );
};
