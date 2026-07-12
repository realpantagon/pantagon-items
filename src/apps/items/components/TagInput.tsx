import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../shared/utils/supabase';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
  onOpenChange?: (open: boolean) => void;
}

export default function TagInput({ value = [], onChange, placeholder = 'Add tags...', className = '', onOpenChange }: TagInputProps) {
  const safeValue = Array.isArray(value) ? value : [];
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchTags(); }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        onOpenChange?.(false);
        setFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchTags = async () => {
    try {
      const { data } = await supabase.from('Pantagon_items').select('tags');
      if (data) {
        const uniqueTags = Array.from(new Set(
          data.flatMap(item => item.tags || []).filter(Boolean)
        )) as string[];
        setAllTags(uniqueTags.sort());
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    if (val.trim()) {
      const filtered = allTags.filter(tag =>
        tag.toLowerCase().includes(val.toLowerCase()) && !safeValue.includes(tag)
      );
      setSuggestions(filtered);
      setIsOpen(true);
    } else {
      const available = allTags.filter(t => !safeValue.includes(t));
      setSuggestions(available);
    }
  };

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !safeValue.includes(trimmed)) {
      onChange([...safeValue, trimmed]);
      setInputValue('');
      setSuggestions([]);
      setIsOpen(false);
      onOpenChange?.(false);
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(safeValue.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && safeValue.length > 0) {
      removeTag(safeValue[safeValue.length - 1]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div
      ref={wrapperRef}
      style={{ position: 'relative', width: '100%', zIndex: isOpen ? 20 : 1 }}
      className={className}
    >
      {/* Container */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          padding: '0.68rem 0.85rem',
          background: 'var(--bg-elevated)',
          border: `1px solid ${focused ? 'color-mix(in srgb, var(--accent) 34%, transparent)' : 'var(--border-subtle)'}`,
          boxShadow: focused ? '0 0 0 4px var(--accent-soft)' : 'none',
          minHeight: '40px',
          alignItems: 'center',
          transition: 'all 0.2s ease',
          borderRadius: '0.9rem',
          position: 'relative',
        }}
      >
        {/* Tags */}
        {safeValue.map(tag => (
          <span
            key={tag}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              background: 'var(--accent-soft)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--accent-strong)',
              fontFamily: 'var(--font-display)',
              fontSize: '8px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-dim)',
                cursor: 'pointer',
                padding: 0,
                lineHeight: 1,
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              ×
            </button>
          </span>
        ))}

        {/* Input */}
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setFocused(true);
            const available = allTags.filter(t => !safeValue.includes(t));
            setSuggestions(available);
            setIsOpen(true);
            onOpenChange?.(true);
          }}
          onBlur={() => setFocused(false)}
          placeholder={safeValue.length === 0 ? placeholder : ''}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
            minWidth: '80px',
          }}
        />
      </div>

      {/* Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '0.9rem',
            boxShadow: 'var(--shadow-md)',
            maxHeight: '156px',
            overflowY: 'auto',
            zIndex: 50,
          }}
        >
          {suggestions.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => addTag(tag)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '8px 12px',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-body)',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'var(--accent-soft)';
                (e.currentTarget as HTMLElement).style.color = 'var(--accent-strong)';
                (e.currentTarget as HTMLElement).style.paddingLeft = '20px';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
                (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                (e.currentTarget as HTMLElement).style.paddingLeft = '14px';
              }}
            >
              <span style={{ color: 'var(--accent)', marginRight: '6px', fontFamily: 'var(--font-tech)', fontSize: '9px' }}>+</span>
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
