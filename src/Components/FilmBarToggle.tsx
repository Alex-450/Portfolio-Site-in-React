export type FilmBarTab = 'this-week' | 'coming-soon' | 'previews';

interface FilmBarToggleProps {
  tab: FilmBarTab;
  onChange: (tab: FilmBarTab) => void;
  // Hide a tab when its section has nothing to show.
  showPreviews?: boolean;
  showComingSoon?: boolean;
}

const FilmBarToggle = ({
  tab,
  onChange,
  showPreviews = true,
  showComingSoon = true,
}: FilmBarToggleProps) => {
  return (
    <div className="view-toggle film-bar-toggle">
      <button
        className={`view-toggle-button${tab === 'this-week' ? ' view-toggle-button-active' : ''}`}
        onClick={() => onChange('this-week')}
      >
        This Week
      </button>
      {showComingSoon && (
        <button
          className={`view-toggle-button${tab === 'coming-soon' ? ' view-toggle-button-active' : ''}`}
          onClick={() => onChange('coming-soon')}
        >
          Coming Soon
        </button>
      )}
      {showPreviews && (
        <button
          className={`view-toggle-button${tab === 'previews' ? ' view-toggle-button-active' : ''}`}
          onClick={() => onChange('previews')}
        >
          Previews
        </button>
      )}
    </div>
  );
};

export default FilmBarToggle;
