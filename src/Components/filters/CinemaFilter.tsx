interface CinemaFilterProps {
  value: string;
  onChange: (value: string) => void;
  cinemaNames: string[];
}

const CinemaFilter = ({ value, onChange, cinemaNames }: CinemaFilterProps) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="filter-select"
    >
      <option value="">All Cinemas</option>
      {cinemaNames.map((name) => (
        <option key={name} value={name}>
          {name}
        </option>
      ))}
    </select>
  );
};

export default CinemaFilter;
