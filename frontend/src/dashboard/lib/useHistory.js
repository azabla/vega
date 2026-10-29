import { useCallback, useRef, useState } from "react";

const MERGE_MS = 1000;
const LIMIT = 100;

/**
 * An unsaved draft with undo/redo. `present` is null while nothing is changed (the saved
 * version shows). Changes with the same `key` in quick succession (typing in one field, dragging
 * the colour picker) become one undo step.
 */
export const useHistory = () => {
  const [state, setState] = useState({ past: [], present: null, future: [] });
  const last = useRef({ key: null, at: 0 });

  const set = useCallback((next, key) => {
    const now = Date.now();
    const merge = Boolean(key) && last.current.key === key && now - last.current.at < MERGE_MS;
    last.current = { key, at: now };
    setState((s) =>
      merge ? { ...s, present: next, future: [] } : { past: [...s.past, s.present].slice(-LIMIT), present: next, future: [] }
    );
  }, []);

  const undo = useCallback(() => {
    last.current = { key: null, at: 0 };
    setState((s) => (s.past.length ? { past: s.past.slice(0, -1), present: s.past.at(-1), future: [s.present, ...s.future] } : s));
  }, []);

  const redo = useCallback(() => {
    last.current = { key: null, at: 0 };
    setState((s) => (s.future.length ? { past: [...s.past, s.present], present: s.future[0], future: s.future.slice(1) } : s));
  }, []);

  const reset = useCallback(() => {
    last.current = { key: null, at: 0 };
    setState({ past: [], present: null, future: [] });
  }, []);

  return { draft: state.present, set, undo, redo, reset, canUndo: state.past.length > 0, canRedo: state.future.length > 0 };
};
