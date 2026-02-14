import { useState } from 'react';

interface DayOption {
  value: string;
  label: string;
}

interface DayFilterProps {
  value: string;
  onChange: (value: string) => void;
  dayOptions: DayOption[];
}

const DayFilter = ({ value, onChange, dayOptions }: DayFilterProps) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const getDisplayLabel = () => {
    if (!value) return 'All Days';
    if (value === 'today') return 'Today';
    const option = dayOptions.find((d) => d.value === value);
    return option ? option.label : value;
  };

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
          <div
            className="genre-filter-option"
            onMouseDown={() => {
              onChange('');
              setShowDropdown(false);
            }}
          >
            All Days
          </div>
          <div
            className="genre-filter-option"
            onMouseDown={() => {
              onChange('today');
              setShowDropdown(false);
            }}
          >
            Today
          </div>
          {dayOptions.map((day) => (
            <div
              key={day.value}
              className="genre-filter-option"
              onMouseDown={() => {
                onChange(day.value);
                setShowDropdown(false);
              }}
            >
              {day.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DayFilter;
