interface ViewToggleProps {
  view: 'list' | 'carousel';
  onChange: (view: 'list' | 'carousel') => void;
}

const ViewToggle = ({ view, onChange }: ViewToggleProps) => {
  return (
    <div className="view-toggle">
      <button
        className={`view-toggle-button${view === 'list' ? ' view-toggle-button-active' : ''}`}
        onClick={() => onChange('list')}
      >
        List
      </button>
      <button
        className={`view-toggle-button${view === 'carousel' ? ' view-toggle-button-active' : ''}`}
        onClick={() => onChange('carousel')}
      >
        Grid
      </button>
    </div>
  );
};

export default ViewToggle;
