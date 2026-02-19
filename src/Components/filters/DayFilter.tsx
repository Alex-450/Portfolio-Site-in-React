import { useState } from 'react';

interface DayOption {
  value: string;
  label: string;
}

interface DayFilterProps {
  selectedDays: string[];
  onChange: (days: string[]) => void;
  dayOptions: DayOption[];
  showToday?: boolean;
}

const DayFilter = ({ selectedDays, onChange, dayOptions, showToday = true }: DayFilterProps) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const getDisplayLabel = () => {
    if (selectedDays.length === 0) return 'All Days';
    return `${selectedDays.length} Day${selectedDays.length > 1 ? 's' : ''}`;
  };

  const allOptions = [
    ...(showToday ? [{ value: 'today', label: 'Today' }] : []),
    ...dayOptions,
  ];

  return (
    <div className="genre-filter">
      <button
        className="filter-select genre-filter-button"
        onClick={() => setShowDropdown(!showDropdown)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
      >
        {getDisplayLabel()}
      </button>
      {showDropdown && (
        <div className="genre-filter-dropdown">
          {allOptions.map((day) => (
            <label key={day.value} className="genre-filter-option">
              <input
                type="checkbox"
                checked={selectedDays.includes(day.value)}
                onChange={(e) => {
                  if (e.target.checked) {
                    onChange([...selectedDays, day.value]);
                  } else {
                    onChange(selectedDays.filter((d) => d !== day.value));
                  }
                }}
              />
              {day.label}
            </label>
          ))}
          {selectedDays.length > 0 && (
            <button
              className="genre-filter-clear"
              onMouseDown={() => onChange([])}
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default DayFilter;
