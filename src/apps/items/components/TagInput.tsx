import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../shared/utils/supabase';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
}

export default function TagInput({ value = [], onChange, placeholder = 'Add tags...', className = '' }: TagInputProps) {
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
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }} className={className}>
      {/* Container */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          padding: '8px 12px 8px 14px',
          background: 'rgba(8,8,8,0.9)',
          border: `1px solid ${focused ? 'rgba(255,43,43,0.5)' : 'rgba(255,43,43,0.15)'}`,
          borderLeft: 'none',
          boxShadow: focused ? '0 0 0 1px rgba(255,43,43,0.2), 0 0 16px rgba(255,43,43,0.1)' : 'none',
          minHeight: '44px',
          alignItems: 'center',
          transition: 'all 0.2s ease',
          borderRadius: '0 2px 2px 0',
          position: 'relative',
        }}
      >
        {/* Left accent */}
        <div
          style={{
            position: 'absolute',
            top: 0, bottom: 0, left: '-14px',
            width: '2px',
            background: 'rgba(255,43,43,0.4)',
          }}
        />

        {/* Tags */}
        {safeValue.map(tag => (
          <span
            key={tag}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              background: 'rgba(255,43,43,0.1)',
              border: '1px solid rgba(255,43,43,0.3)',
              color: 'var(--soft-red)',
              fontFamily: 'var(--font-display)',
              fontSize: '8px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              boxShadow: '0 0 6px rgba(255,43,43,0.15)',
            }}
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,90,90,0.7)',
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
          }}
          onBlur={() => setFocused(false)}
          placeholder={safeValue.length === 0 ? placeholder : ''}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-tech)',
            fontSize: '14px',
            minWidth: '80px',
          }}
        />
      </div>

      {/* Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'rgba(10,10,10,0.97)',
            border: '1px solid rgba(255,43,43,0.25)',
            borderTop: 'none',
            boxShadow: '0 8px 24px rgba(0,0,0,0.8), 0 0 20px rgba(255,43,43,0.1)',
            maxHeight: '180px',
            overflowY: 'auto',
            zIndex: 100,
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
                padding: '8px 14px',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-tech)',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,43,43,0.08)';
                (e.currentTarget as HTMLElement).style.color = 'var(--soft-red)';
                (e.currentTarget as HTMLElement).style.paddingLeft = '20px';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
                (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                (e.currentTarget as HTMLElement).style.paddingLeft = '14px';
              }}
            >
              <span style={{ color: 'rgba(255,43,43,0.5)', marginRight: '6px', fontFamily: 'var(--font-display)', fontSize: '9px' }}>+</span>
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
