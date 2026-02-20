interface WatchlistButtonProps {
  isInWatchlist: boolean;
  onToggle: () => void;
  size?: 'small' | 'large';
}

function WatchlistButton({ isInWatchlist, onToggle, size = 'small' }: WatchlistButtonProps) {
  const className = size === 'large' ? 'watchlist-btn watchlist-btn-large' : 'watchlist-btn';

  return (
    <button
      className={`${className}${isInWatchlist ? ' watchlist-btn-active' : ''}`}
      onClick={onToggle}
      title={isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
      aria-label={isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
    >
      {isInWatchlist ? '- Watchlist' : '+ Watchlist'}
    </button>
  );
}

export default WatchlistButton;
