'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@apnatown/ui/cards/Card';
import { NavIcon } from '../../shared/ui/NavIcon';
import { SearchNotice } from './SearchFeedback';

/** Presentation only; the container projects the typed suggestions DTO. */
export type SuggestionGroup = {
  key: string;
  label: string;
  options: { key: string; label: string; select: () => void }[];
};

const matches = (query: string) =>
  typeof window !== 'undefined' && window.matchMedia(query).matches;

/**
 * WAI-ARIA 1.2 combobox with a grouped listbox (js4 `V.search` searchbar).
 * Suggestions from a previous keystroke stay visible while the current term
 * loads, but are inert: they can never be activated or selected.
 */
export function SearchCombobox({
  query,
  groups,
  stale,
  status,
  feedback,
  autoFocus = false,
  onDraftChange,
  onSubmit,
}: {
  query: string;
  groups: SuggestionGroup[];
  stale: boolean;
  /** Polite screen-reader summary (loading, count or no match). */
  status: string;
  /** Compact loading/offline/error content for the open popup. */
  feedback?: ReactNode;
  autoFocus?: boolean | undefined;
  onDraftChange: (value: string) => void;
  onSubmit: (value: string) => void;
}) {
  const t = useTranslations('search.screen');
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const initialFocus = useRef(autoFocus);
  const [seenQuery, setSeenQuery] = useState(query);
  const [draft, setDraft] = useState(query);
  const [open, setOpen] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState(false);
  const options = groups.flatMap((group) => group.options);
  const optionKeys = options.map((option) => option.key).join('|');
  // The active option belongs to one option set; a new set clears it.
  const [activeState, setActiveState] = useState({ keys: '', index: -1 });
  const active = !stale && activeState.keys === optionKeys ? activeState.index : -1;
  const setActive = (index: number) => setActiveState({ keys: optionKeys, index });
  const expanded = open && draft.trim().length > 0;
  const popup = expanded && (groups.length > 0 || Boolean(feedback));
  const listbox = popup && groups.length > 0;
  const selected = options[active];

  // A submitted/selected query (or Back/Forward) replaces the draft.
  if (seenQuery !== query) {
    setSeenQuery(query);
    setDraft(query);
    setOpen(false);
    setActiveState({ keys: '', index: -1 });
  }

  useEffect(() => {
    // js4: focus an empty Search only for fine pointers, never popping a
    // touch keyboard over the recent/popular terms.
    if (initialFocus.current && matches('(pointer: fine)'))
      input.current?.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    if (listbox && active >= 0)
      document.getElementById(`${id}-option-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active, listbox, id]);

  const change = (value: string) => {
    setDraft(value);
    setActive(-1);
    setOpen(true);
    onDraftChange(value);
  };
  const close = () => {
    setOpen(false);
    setActive(-1);
    // Dismiss the touch keyboard so results are visible (js4 blurs on submit).
    if (matches('(pointer: coarse)')) input.current?.blur();
  };
  const choose = (option: SuggestionGroup['options'][number]) => {
    if (stale) return;
    close();
    option.select();
  };

  return (
    <div
      className="grid min-w-0 gap-2"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <form
        role="search"
        aria-label={t('title')}
        onSubmit={(event) => {
          event.preventDefault();
          close();
          onSubmit(draft.trim());
        }}
        className="flex min-h-searchbar-min-height min-w-0 items-center gap-2 rounded-pill border-2 border-border-strong bg-surface ps-field-inline pe-1 transition-colors duration-2 ease-standard focus-within:border-primary focus-within:ring-3 focus-within:ring-primary-soft motion-reduce:transition-none"
      >
        <NavIcon name="search" className="size-5 shrink-0 text-muted" />
        <label htmlFor={id} className="sr-only">{t('title')}</label>
        <input
          ref={input}
          id={id}
          name="q"
          type="search"
          role="combobox"
          enterKeyHint="search"
          aria-autocomplete="list"
          aria-expanded={listbox}
          aria-controls={listbox ? `${id}-suggestions` : undefined}
          aria-activedescendant={listbox && selected ? `${id}-option-${active}` : undefined}
          autoComplete="off"
          spellCheck={false}
          maxLength={200}
          placeholder={t('placeholder')}
          value={draft}
          className="min-h-11 min-w-0 flex-1 bg-transparent text-body text-text outline-none placeholder:text-muted"
          onChange={(event) => change(event.target.value)}
          onFocus={() => {
            setOpen(true);
            onDraftChange(draft);
          }}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) return;
            if (event.key === 'Escape') {
              // Close only the topmost layer: the popup first, then the
              // browser's own type=search clearing on a second Esc.
              if (!popup) return;
              event.preventDefault();
              event.stopPropagation();
              setOpen(false);
              setActive(-1);
            } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault();
              setOpen(true);
              if (stale || options.length === 0) return;
              setActive(event.key === 'ArrowDown'
                ? (active + 1) % options.length
                : active <= 0 ? options.length - 1 : active - 1);
            } else if (listbox && active >= 0 && (event.key === 'Home' || event.key === 'End')) {
              event.preventDefault();
              setActive(event.key === 'Home' ? 0 : options.length - 1);
            } else if (event.key === 'Enter' && listbox && selected) {
              event.preventDefault();
              choose(selected);
            }
          }}
        />
        {/* Q-59: voice capture is not approved; explain instead of recording. */}
        <button
          type="button"
          aria-disabled="true"
          aria-label={t('voiceSearch')}
          aria-describedby={voiceNotice ? `${id}-voice` : undefined}
          className="grid size-11 shrink-0 place-items-center rounded-pill text-muted focus-visible:ring-focus"
          onClick={() => setVoiceNotice(true)}
        >
          <NavIcon name="mic" className="size-5" />
        </button>
      </form>
      <div id={`${id}-voice`} role="status">
        {voiceNotice && <SearchNotice>{t('voiceUnavailable')}</SearchNotice>}
      </div>
      <p role="status" className="sr-only">{expanded ? status : ''}</p>
      {popup && (
        <Card className="overflow-hidden">
          {listbox && (
            <div
              id={`${id}-suggestions`}
              role="listbox"
              aria-label={t('suggestions')}
              aria-busy={stale}
              className={`max-h-80 overflow-y-auto py-1 transition-opacity duration-2 motion-reduce:transition-none ${stale ? 'opacity-60' : ''}`}
            >
              {groups.map((group) => (
                <div key={group.key} role="group" aria-labelledby={`${id}-${group.key}`}>
                  <p id={`${id}-${group.key}`} className="m-0 px-field-inline pt-2 text-caption text-muted">
                    {group.label}
                  </p>
                  {group.options.map((option) => {
                    const index = options.indexOf(option);
                    return (
                      <div
                        key={option.key}
                        id={`${id}-option-${index}`}
                        role="option"
                        aria-selected={active === index}
                        aria-disabled={stale || undefined}
                        className={`flex min-h-touch items-center gap-2 px-field-inline py-2 text-start [overflow-wrap:anywhere] ${stale ? 'cursor-default' : 'cursor-pointer'} ${active === index ? 'bg-primary-soft text-primary-ink' : 'text-text hover:bg-surface-2'}`}
                        // Keep focus in the input so the combobox stays open.
                        onPointerDown={(event) => event.preventDefault()}
                        onClick={() => choose(option)}
                      >
                        <NavIcon name="search" className="size-4 shrink-0" />
                        <span className="min-w-0">{option.label}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
          {feedback && <div className="px-field-inline py-3">{feedback}</div>}
        </Card>
      )}
    </div>
  );
}
