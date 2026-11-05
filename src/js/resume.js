// Browser lifecycle plus Android Activity.onResume, forwarded by the native host.
export function installResumeRefresh(refresh, { document = globalThis.document, window = globalThis.window } = {}) {
  const visible = () => { if (!document.hidden) refresh(); };
  const listeners = [
    [document, 'visibilitychange', visible],
    [window, 'pageshow', refresh],
    [window, 'mes-reperes-resume', refresh],
  ];
  for (const [target, event, handler] of listeners) target?.addEventListener?.(event, handler);
  return () => { for (const [target, event, handler] of listeners) target?.removeEventListener?.(event, handler); };
}
