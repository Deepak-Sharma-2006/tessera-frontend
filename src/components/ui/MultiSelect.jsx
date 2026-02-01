import React, { useState } from 'react';
import { Badge } from './badge';
import { Input } from './input';
import { Button } from './button';

export default function MultiSelect({ options, selected, onChange, placeholder }) {
  const [search, setSearch] = useState("");

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(search.toLowerCase()) && !selected.includes(opt)
  );

  return (
    <div className="space-y-4 w-full">
      {/* Search Input */}
      <Input 
        placeholder={placeholder} 
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="bg-cyan-950/20 border border-cyan-400/30 text-cyan-50 placeholder:text-cyan-600 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/30 text-base p-3 backdrop-blur-xl"
      />

      {/* Selected Items Container */}
      <div className="flex flex-wrap gap-2 p-4 min-h-[60px] bg-gradient-to-r from-cyan-950/20 to-cyan-950/10 border border-cyan-400/30 rounded-xl backdrop-blur-xl">
        {selected.length === 0 && (
          <span className="text-sm text-cyan-400/70 italic">No items selected yet...</span>
        )}
        {selected.map((item, idx) => (
          <Badge 
            key={`${item}-${idx}`}
            className="bg-gradient-to-r from-cyan-500/30 to-cyan-400/20 text-cyan-200 hover:from-cyan-500/40 hover:to-cyan-400/30 gap-2 py-2 px-4 text-sm font-semibold shadow-md shadow-cyan-400/10 border border-cyan-400/40"
          >
            {item} 
            <button 
              type="button"
              className="hover:text-cyan-50 font-bold transition-colors text-lg leading-none"
              onClick={() => onChange(selected.filter(i => i !== item))}
            >
              ×
            </button>
          </Badge>
        ))}
      </div>

      {/* Suggested Options Grid */}
      <div className="space-y-2">
        {filteredOptions.length > 0 && (
          <p className="text-xs font-semibold text-cyan-400/70 uppercase tracking-wider">Available ({filteredOptions.length})</p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
          {filteredOptions.map((option, idx) => (
            <button 
              key={`opt-${option}-${idx}`}
              type="button"
              onClick={() => {
                onChange([...selected, option]);
                setSearch("");
              }}
              className="text-left px-3 py-2 rounded-lg border border-cyan-400/40 bg-cyan-950/20 hover:bg-cyan-950/40 hover:border-cyan-400/60 transition-all duration-200 font-medium text-sm text-cyan-200 hover:text-cyan-100 group backdrop-blur-xl"
            >
              <span className="text-cyan-400 font-bold mr-1">+</span>
              <span className="group-hover:font-semibold">{option}</span>
            </button>
          ))}
        </div>
      </div>

      {/* No Results Message */}
      {search && filteredOptions.length === 0 && selected.length < options.length && (
        <p className="text-sm text-cyan-400/70 italic text-center py-3">No matches found for "{search}"</p>
      )}

      {/* All Selected */}
      {!search && filteredOptions.length === 0 && selected.length > 0 && (
        <p className="text-sm text-center text-cyan-400/70 py-3">✓ All items selected</p>
      )}
    </div>
  );
}
