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
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="filter-select"
    >
      <option value="">All Days</option>
      <option value="today">Today</option>
      {dayOptions.map((day) => (
        <option key={day.value} value={day.value}>
          {day.label}
        </option>
      ))}
    </select>
  );
};

export default DayFilter;
