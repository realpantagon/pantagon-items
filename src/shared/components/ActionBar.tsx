import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ActionBarProps {
  children: ReactNode;
  /** Stack children vertically (e.g. an error line above the submit button). */
  stacked?: boolean;
}

const NON_TEXT_INPUTS = new Set(['button', 'checkbox', 'radio', 'range', 'submit', 'reset', 'file', 'color', 'image']);

/** True when focusing this element brings up the on-screen keyboard or a system picker. */
function opensKeyboard(el: Element | null): boolean {
  if (!el) return false;
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) return true;
  if (el instanceof HTMLInputElement) return !NON_TEXT_INPUTS.has(el.type);
  return el instanceof HTMLElement && el.isContentEditable;
}

/**
 * Hide the bar while a field is focused on a touch device. iOS doesn't resize
 * the layout viewport for the keyboard, so a fixed bottom bar sits behind it,
 * follows the page up when scrolling and sticks when scrolling back down.
 */
function useKeyboardOpen(): boolean {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const touch = window.matchMedia('(pointer: coarse)');
    const update = () => setOpen(touch.matches && opensKeyboard(document.activeElement));
    // focusout fires before focus lands on the next field, so read activeElement a tick later
    const onFocusOut = () => setTimeout(update, 0);
    document.addEventListener('focusin', update);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('focusin', update);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, []);

  return open;
}

/**
 * Bottom action bar pinned to the viewport.
 *
 * Rendered into <body> through a portal so `position: fixed` is always
 * relative to the screen. Page wrappers use the `fade-up` animation, which
 * leaves a `transform` on them, and a transformed ancestor makes a fixed child
 * position against that ancestor instead.
 */
export default function ActionBar({ children, stacked }: ActionBarProps) {
  const keyboardOpen = useKeyboardOpen();

  return createPortal(
    <div className={keyboardOpen ? 'action-bar action-bar--hidden' : 'action-bar'} aria-hidden={keyboardOpen || undefined}>
      <div className={stacked ? 'action-bar__inner action-bar__inner--stacked' : 'action-bar__inner'}>{children}</div>
    </div>,
    document.body,
  );
}
