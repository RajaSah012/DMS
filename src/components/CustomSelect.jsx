import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export const CustomSelect = ({
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  className = '',
  buttonClassName = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const triggerButtonRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  const selectedIndex = options.findIndex((opt) => opt.value === value);
  const selectedOption = options[selectedIndex];

  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    }
  }, [isOpen, selectedIndex]);

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      if (triggerButtonRef.current) triggerButtonRef.current.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < options.length) {
        onChange(options[highlightedIndex].value);
        setIsOpen(false);
        if (triggerButtonRef.current) triggerButtonRef.current.focus();
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className}`}
      onKeyDown={handleKeyDown}
    >
      <button
        ref={triggerButtonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between px-3 py-2 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-slate-800 border border-slate-200 rounded-xl transition-all cursor-pointer font-medium focus:outline-hidden focus:ring-2 focus:ring-[#00A3E0]/30 focus:border-[#00A3E0] ${
          isOpen ? 'ring-2 ring-[#00A3E0]/30 border-[#00A3E0] bg-white' : ''
        } ${buttonClassName}`}
      >
        <span className="truncate flex items-center gap-2">
          {selectedOption ? (
            <>
              {selectedOption.dotColor && (
                <span className={`w-2 h-2 rounded-full ${selectedOption.dotColor} shrink-0`} />
              )}
              <span className="truncate font-semibold text-slate-800">
                {selectedOption.label}
              </span>
            </>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ml-1.5 ${
            isOpen ? 'rotate-180 text-[#00A3E0]' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-xl shadow-2xl border border-slate-100 ring-1 ring-black/5 py-1 max-h-52 overflow-y-auto overscroll-contain animate-in fade-in zoom-in-95 duration-150"
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isHighlighted = highlightedIndex === index;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                  if (triggerButtonRef.current) triggerButtonRef.current.focus();
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-sky-50 text-[#0284C7] font-bold'
                    : isHighlighted
                    ? 'bg-slate-50 text-slate-900'
                    : 'text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {option.dotColor && (
                    <span className={`w-2 h-2 rounded-full ${option.dotColor} shrink-0`} />
                  )}
                  <span className="truncate">{option.label}</span>
                </div>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-[#00A3E0] stroke-[2.5] shrink-0 ml-2" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
