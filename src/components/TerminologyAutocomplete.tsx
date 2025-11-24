import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  TerminologyOption,
  searchCIE10,
  searchMedications
} from '../services/terminologyService';

type SearchType = 'cie10' | 'medication';

interface TerminologyAutocompleteProps {
  value: string;
  placeholder?: string;
  searchType: SearchType;
  onValueChange: (value: string) => void;
  onOptionSelect?: (option: TerminologyOption) => void;
  disabled?: boolean;
  inputClassName?: string;
}

const SEARCH_FUNCTIONS: Record<SearchType, (query: string) => Promise<TerminologyOption[]>> = {
  cie10: searchCIE10,
  medication: searchMedications
};

export const TerminologyAutocomplete: React.FC<TerminologyAutocompleteProps> = ({
  value,
  placeholder,
  searchType,
  onValueChange,
  onOptionSelect,
  disabled,
  inputClassName
}) => {
  const [options, setOptions] = useState<TerminologyOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef<number | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const searchFn = useMemo(() => SEARCH_FUNCTIONS[searchType], [searchType]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    onValueChange(newValue);

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    if (!newValue || newValue.trim().length < 2) {
      setOptions([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const results = await searchFn(newValue.trim());
        setOptions(results);
        setIsOpen(true);
      } catch (error) {
        console.error('Terminology search error:', error);
        setOptions([]);
        setIsOpen(false);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleSelect = (option: TerminologyOption) => {
    const formatted = `${option.code} - ${option.display}`;
    onValueChange(formatted);
    if (onOptionSelect) {
      onOptionSelect(option);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <input
        type="text"
        className={`w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm ${inputClassName || ''}`}
        value={value}
        placeholder={placeholder}
        onChange={handleChange}
        onFocus={() => {
          if (options.length > 0) {
            setIsOpen(true);
          }
        }}
        disabled={disabled}
      />
      {loading && (
        <span className="absolute right-3 top-2.5 text-xs text-stone-400">
          Buscando...
        </span>
      )}
      {isOpen && options.length > 0 && (
        <div className="absolute z-40 mt-1 w-full bg-white border border-stone-200 rounded-lg shadow-lg max-h-64 overflow-auto">
          {options.map(option => (
            <button
              key={`${option.system || 'sys'}-${option.code}`}
              type="button"
              onMouseDown={event => event.preventDefault()}
              onClick={() => handleSelect(option)}
              className="w-full text-left px-3 py-2 hover:bg-emerald-50 focus:bg-emerald-50"
            >
              <div className="text-sm font-medium text-stone-900">
                {option.code} - {option.display}
              </div>
              {option.system && (
                <div className="text-xs text-stone-500 mt-0.5">{option.system}</div>
              )}
              {option.designation && option.designation.length > 0 && option.designation[0]?.value && (
                <div className="text-xs text-emerald-600 mt-0.5">{option.designation[0].value}</div>
              )}
            </button>
          ))}
        </div>
      )}
      {isOpen && !loading && options.length === 0 && (
        <div className="absolute z-40 mt-1 w-full bg-white border border-stone-200 rounded-lg shadow-lg px-3 py-2 text-sm text-stone-500">
          Sin resultados
        </div>
      )}
    </div>
  );
};

