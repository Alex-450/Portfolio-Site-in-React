import { useEffect, useRef, useState } from 'react';

interface Option {
  value: string;
  label: string;
}

interface SingleSelectDropdownProps {
  options: Option[];
  value: string | null;
  onChange: (value: string | null) => void;
  defaultLabel: string;
  radioName: string;
}

const SingleSelectDropdown = ({
  options,
  value,
  onChange,
  defaultLabel,
  radioName,
}: SingleSelectDropdownProps) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when tapping/clicking outside. onBlur is unreliable on touch devices
  // because tapping an option's label never focuses (and so never blurs) the button.
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

  const displayLabel = value
    ? (options.find((o) => o.value === value)?.label ?? value)
    : defaultLabel;

  return (
    <div className="genre-filter" ref={containerRef}>
      <button
        className={`filter-select genre-filter-button${value ? ' filter-toggle-active' : ''}`}
        onClick={() => setShowDropdown(!showDropdown)}
      >
        {displayLabel}
      </button>
      {showDropdown && (
        <div className="genre-filter-dropdown">
          {options.map((option) => (
            <label key={option.value} className="genre-filter-option">
              <input
                type="radio"
                name={radioName}
                checked={value === option.value}
                onChange={() => {
                  // Single-select: a choice is final, so close the dropdown.
                  onChange(option.value);
                  setShowDropdown(false);
                }}
              />
              {option.label}
            </label>
          ))}
          {value && (
            <button
              className="genre-filter-clear"
              onClick={() => {
                onChange(null);
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

export default SingleSelectDropdown;
