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
        className="bg-white border-2 border-primary/30 text-gray-800 placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/30 text-base p-3"
      />

      {/* Selected Items Container */}
      <div className="flex flex-wrap gap-2 p-4 min-h-[60px] bg-gradient-to-r from-primary/5 to-purple-500/5 border-2 border-primary/20 rounded-xl">
        {selected.length === 0 && (
          <span className="text-sm text-gray-500 italic">No items selected yet...</span>
        )}
        {selected.map((item, idx) => (
          <Badge 
            key={`${item}-${idx}`}
            className="bg-gradient-to-r from-primary to-purple-600 text-gray-900 hover:from-primary/90 hover:to-purple-600/90 gap-2 py-2 px-4 text-sm font-semibold shadow-md"
          >
            {item} 
            <button 
              type="button"
              className="hover:text-gray-800 font-bold transition-colors text-lg leading-none"
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
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Available ({filteredOptions.length})</p>
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
              className="text-left px-3 py-2 rounded-lg border-2 border-primary/40 bg-white hover:bg-primary/10 hover:border-primary/70 transition-all duration-200 font-medium text-sm text-gray-800 hover:text-primary group"
            >
              <span className="text-primary font-bold mr-1">+</span>
              <span className="group-hover:font-semibold">{option}</span>
            </button>
          ))}
        </div>
      </div>

      {/* No Results Message */}
      {search && filteredOptions.length === 0 && selected.length < options.length && (
        <p className="text-sm text-gray-600 italic text-center py-3">No matches found for "{search}"</p>
      )}

      {/* All Selected */}
      {!search && filteredOptions.length === 0 && selected.length > 0 && (
        <p className="text-sm text-center text-gray-600 py-3">✓ All items selected</p>
      )}
    </div>
  );
}
