import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ActionBarProps {
  children: ReactNode;
  /** Stack children vertically (e.g. an error line above the submit button). */
  stacked?: boolean;
}

/**
 * Bottom action bar pinned to the viewport.
 *
 * Rendered into <body> through a portal so `position: fixed` is always
 * relative to the screen. Page wrappers use the `fade-up` animation, which
 * leaves a `transform` on them, and a transformed ancestor makes a fixed child
 * position against that ancestor instead. That left the bar floating over the
 * end of the content, with dead space beneath it.
 */
export default function ActionBar({ children, stacked }: ActionBarProps) {
  return createPortal(
    <div className="action-bar">
      <div className={stacked ? 'action-bar__inner action-bar__inner--stacked' : 'action-bar__inner'}>{children}</div>
    </div>,
    document.body,
  );
}
