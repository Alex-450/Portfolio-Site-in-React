import MultiSelectDropdown from './MultiSelectDropdown';

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

const DayFilter = ({
  selectedDays,
  onChange,
  dayOptions,
  showToday = true,
}: DayFilterProps) => {
  const allOptions = [
    ...(showToday ? [{ value: 'today', label: 'Today' }] : []),
    ...dayOptions,
  ];

  return (
    <MultiSelectDropdown
      options={allOptions}
      selected={selectedDays}
      onChange={onChange}
      allLabel="All Days"
      selectedLabel={(n) => `${n} Day${n > 1 ? 's' : ''}`}
    />
  );
};

export default DayFilter;
