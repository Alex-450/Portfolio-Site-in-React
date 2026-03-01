import { Plus, Minus } from 'lucide-react';

interface WatchlistButtonProps {
  isInWatchlist: boolean;
  onToggle: () => void;
}

function WatchlistButton({ isInWatchlist, onToggle }: WatchlistButtonProps) {
  return (
    <button
      className={`watchlist-btn${isInWatchlist ? ' watchlist-btn-active' : ''}`}
      onClick={onToggle}
      title={isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
      aria-label={isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
    >
      {isInWatchlist ? <Minus size={14} /> : <Plus size={14} />}
      Watchlist
    </button>
  );
}

export default WatchlistButton;
