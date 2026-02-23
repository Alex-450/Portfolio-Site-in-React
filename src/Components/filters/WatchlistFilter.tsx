interface WatchlistFilterProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  watchlistCount: number;
}

const WatchlistFilter = ({
  enabled,
  onChange,
  watchlistCount,
}: WatchlistFilterProps) => {
  return (
    <button
      className={`filter-select${enabled ? ' filter-toggle-active' : ''}`}
      onClick={() => onChange(!enabled)}
    >
      Watchlist {watchlistCount > 0 && `(${watchlistCount})`}
    </button>
  );
};

export default WatchlistFilter;
