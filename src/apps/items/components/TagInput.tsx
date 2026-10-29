import { useEffect, useState } from 'react';
import { fetchAllTags } from '../../../api/items/api';
import { tagChipStyle } from '../utils/tagColor';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

/** Tap a known tag to toggle it; type to create a new one. */
export default function TagInput({ value = [], onChange, placeholder = 'New tag' }: TagInputProps) {
  const selected = Array.isArray(value) ? value : [];
  const [knownTags, setKnownTags] = useState<string[]>([]);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    fetchAllTags().then(setKnownTags).catch(error => console.error('Error fetching tags:', error));
  }, []);

  const options = Array.from(new Set([...knownTags, ...selected]));
  const query = draft.trim().toLowerCase();
  const visible = query ? options.filter(tag => tag.toLowerCase().includes(query)) : options;

  const toggle = (tag: string) => {
    onChange(selected.includes(tag) ? selected.filter(t => t !== tag) : [...selected, tag]);
  };

  const addDraft = () => {
    const tag = draft.trim();
    if (!tag) return;
    // Reuse the existing spelling when the typed tag only differs by case
    const existing = options.find(t => t.toLowerCase() === tag.toLowerCase()) ?? tag;
    if (!selected.includes(existing)) onChange([...selected, existing]);
    setDraft('');
  };

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
        {visible.map(tag => {
          const isOn = selected.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggle(tag)}
              aria-pressed={isOn}
              className={isOn ? 'tag-chip pressable' : 'chip'}
              style={isOn
                ? { ...tagChipStyle(tag), minHeight: '36px', padding: '0 14px', fontSize: '0.88rem', fontWeight: 600 }
                : { minHeight: '36px' }}
            >
              {isOn && (
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              )}
              {tag}
            </button>
          );
        })}
        {visible.length === 0 && query && (
          <span style={{ fontSize: '0.86rem', color: 'var(--text-dim)', alignSelf: 'center' }}>
            No tag “{draft.trim()}” yet. Tap Add to create it.
          </span>
        )}
      </div>

      <div className="ui-field-shell" style={{ alignItems: 'center' }}>
        <input
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addDraft();
            }
          }}
          enterKeyHint="done"
          autoCapitalize="words"
          placeholder={placeholder}
          aria-label="Find or create tag"
          className="ui-input"
        />
        <button
          type="button"
          onClick={addDraft}
          disabled={!draft.trim()}
          className="ui-button ui-button--secondary ui-button--sm"
          style={{ marginRight: '6px', flexShrink: 0 }}
        >
          Add
        </button>
      </div>
    </div>
  );
}
