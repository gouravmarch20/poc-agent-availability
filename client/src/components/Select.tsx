import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import styles from './Select.module.css';

export interface SelectOption {
  value: string;
  label: string;
  image?: string;
  meta?: string;
}

interface SelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
}

function Avatar({ option }: { option: SelectOption }) {
  if (option.image) return <img className={styles.avatar} src={option.image} alt="" loading="lazy" />;
  return <span className={`${styles.avatar} ${styles.initial}`} aria-hidden="true">{option.label.charAt(0).toUpperCase()}</span>;
}

export function Select({
  id,
  value,
  onChange,
  options,
  placeholder = 'Select…',
  disabled = false,
  searchable,
  searchPlaceholder = 'Search…',
}: SelectProps) {
  const uid = useId();
  const listId = `${uid}-list`;
  const optionId = (index: number) => `${uid}-option-${index}`;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  const showSearch = searchable ?? options.length > 6;
  const withAvatars = options.some((option) => option.image);
  const selected = options.find((option) => option.value === value);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle ? options.filter((option) => `${option.label} ${option.meta ?? ''}`.toLowerCase().includes(needle)) : options;
  }, [options, query]);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    if (showSearch) searchRef.current?.focus();
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [open, showSearch]);

  useEffect(() => {
    if (open) document.getElementById(optionId(active))?.scrollIntoView({ block: 'nearest' });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, active]);

  function openList() {
    if (disabled) return;
    setQuery('');
    setActive(Math.max(0, options.findIndex((option) => option.value === value)));
    setOpen(true);
  }

  function closeList() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function choose(option: SelectOption | undefined) {
    if (!option) return;
    onChange(option.value);
    closeList();
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const onSearch = event.target === searchRef.current;
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
        event.preventDefault();
        openList();
      }
      return;
    }
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActive((index) => Math.min(filtered.length - 1, index + 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActive((index) => Math.max(0, index - 1));
        break;
      case 'Home':
        if (!onSearch) { event.preventDefault(); setActive(0); }
        break;
      case 'End':
        if (!onSearch) { event.preventDefault(); setActive(filtered.length - 1); }
        break;
      case 'Enter':
        event.preventDefault();
        choose(filtered[active]);
        break;
      case ' ':
        if (!onSearch) { event.preventDefault(); choose(filtered[active]); }
        break;
      case 'Escape':
        event.preventDefault();
        closeList();
        break;
      case 'Tab':
        setOpen(false);
        break;
      default:
        // Type-ahead when there is no search box.
        if (!showSearch && event.key.length === 1) {
          const letter = event.key.toLowerCase();
          const next = filtered.findIndex((option, index) => index > active && option.label.toLowerCase().startsWith(letter));
          const first = filtered.findIndex((option) => option.label.toLowerCase().startsWith(letter));
          if (next >= 0 || first >= 0) setActive(next >= 0 ? next : first);
        }
    }
  }

  return (
    <div ref={rootRef} className={styles.root} onKeyDown={onKeyDown}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className={`${styles.trigger}${open ? ` ${styles.open}` : ''}`}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && !showSearch && filtered.length ? optionId(active) : undefined}
        disabled={disabled}
        onClick={() => (open ? closeList() : openList())}
      >
        {selected ? (
          <>
            {withAvatars && <Avatar option={selected} />}
            <span className={styles.text}>
              <span className={styles.label}>{selected.label}</span>
              {selected.meta && <span className={styles.meta}>{selected.meta}</span>}
            </span>
          </>
        ) : (
          <span className={styles.placeholder}>{placeholder}</span>
        )}
        <svg className={styles.chevron} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className={styles.popover}>
          {showSearch && (
            <input
              ref={searchRef}
              className={styles.search}
              type="text"
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              aria-controls={listId}
              aria-activedescendant={filtered.length ? optionId(active) : undefined}
              value={query}
              onChange={(event) => { setQuery(event.target.value); setActive(0); }}
            />
          )}
          <ul id={listId} role="listbox" className={styles.list}>
            {filtered.length === 0 ? (
              <li className={styles.empty}>No matches</li>
            ) : filtered.map((option, index) => (
              <li
                key={option.value}
                id={optionId(index)}
                role="option"
                aria-selected={option.value === value}
                className={`${styles.option}${index === active ? ` ${styles.active}` : ''}${option.value === value ? ` ${styles.chosen}` : ''}`}
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(option)}
              >
                {withAvatars && <Avatar option={option} />}
                <span className={styles.text}>
                  <span className={styles.label}>{option.label}</span>
                  {option.meta && <span className={styles.meta}>{option.meta}</span>}
                </span>
                {option.value === value && <span className={styles.check} aria-hidden="true">✓</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
