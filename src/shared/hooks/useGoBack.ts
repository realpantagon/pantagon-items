import { useNavigate } from 'react-router-dom';

/**
 * Navigates to the previous history entry when one exists in this app session,
 * otherwise falls back to the dashboard (e.g. when a page was opened directly).
 */
export function useGoBack(fallback: string = '/') {
  const navigate = useNavigate();

  return () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx;
    if (typeof idx === 'number' && idx > 0) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  };
}
