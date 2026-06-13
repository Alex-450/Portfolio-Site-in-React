import { useEffect, useId, useRef, useState } from 'react';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectDropdownProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  allLabel: string;
  selectedLabel: (count: number) => string;
}

const MultiSelectDropdown = ({
  options,
  selected,
  onChange,
  allLabel,
  selectedLabel,
}: MultiSelectDropdownProps) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when tapping/clicking outside. onBlur is unreliable on touch devices
  // because tapping a checkbox label never focuses (and so never blurs) the button.
  useEffect(() => {
    if (!showDropdown) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [showDropdown]);

  if (options.length === 0) {
    return null;
  }

  return (
    <div className="genre-filter" ref={containerRef}>
      <button
        className="filter-select genre-filter-button"
        onClick={() => setShowDropdown(!showDropdown)}
        aria-expanded={showDropdown}
        aria-controls={dropdownId}
        aria-haspopup="listbox"
      >
        {selected.length === 0 ? allLabel : selectedLabel(selected.length)}
      </button>
      {showDropdown && (
        <div id={dropdownId} role="listbox" className="genre-filter-dropdown">
          {options.map((option) => (
            <label key={option.value} className="genre-filter-option">
              <input
                type="checkbox"
                checked={selected.includes(option.value)}
                onChange={(e) => {
                  if (e.target.checked) {
                    onChange([...selected, option.value]);
                  } else {
                    onChange(selected.filter((v) => v !== option.value));
                  }
                  // Apply the choice and close; reopen to add more.
                  setShowDropdown(false);
                }}
              />
              {option.label}
            </label>
          ))}
          {selected.length > 0 && (
            <button
              className="genre-filter-clear"
              onClick={() => {
                onChange([]);
                setShowDropdown(false);
              }}
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;
