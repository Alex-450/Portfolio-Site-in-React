import SingleSelectDropdown from './SingleSelectDropdown';

type ReleaseFilterValue =
  | 'recently-added'
  | 'upcoming'
  | 'recently-released'
  | 're-releases'
  | null;

interface ReleaseFilterProps {
  value: ReleaseFilterValue;
  onChange: (value: ReleaseFilterValue) => void;
}

export const RELEASE_OPTIONS: { value: ReleaseFilterValue; label: string }[] = [
  { value: 'recently-added', label: 'Recently Added' },
  { value: 'upcoming', label: 'Upcoming Releases' },
  { value: 'recently-released', label: 'Recently Released' },
  { value: 're-releases', label: 'Re-releases' },
];

const ReleaseFilter = ({ value, onChange }: ReleaseFilterProps) => (
  <SingleSelectDropdown
    options={RELEASE_OPTIONS as { value: string; label: string }[]}
    value={value}
    onChange={(v) => onChange(v as ReleaseFilterValue)}
    defaultLabel="Release"
    radioName="release-filter"
  />
);

export default ReleaseFilter;
export type { ReleaseFilterValue };
