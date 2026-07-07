export type FilmBarTab = 'this-week' | 'coming-soon';

interface FilmBarToggleProps {
  tab: FilmBarTab;
  onChange: (tab: FilmBarTab) => void;
}

const FilmBarToggle = ({ tab, onChange }: FilmBarToggleProps) => {
  return (
    <div className="view-toggle film-bar-toggle">
      <button
        className={`view-toggle-button${tab === 'this-week' ? ' view-toggle-button-active' : ''}`}
        onClick={() => onChange('this-week')}
      >
        This Week
      </button>
      <button
        className={`view-toggle-button${tab === 'coming-soon' ? ' view-toggle-button-active' : ''}`}
        onClick={() => onChange('coming-soon')}
      >
        Coming Soon
      </button>
    </div>
  );
};

export default FilmBarToggle;
