export function isEditableTarget(target, { includeSelect = false } = {}) {
  if (!target) return false;

  const tagName = target.tagName;
  const selector = includeSelect
    ? "input, textarea, select, [contenteditable='true']"
    : "input, textarea, [contenteditable='true']";

  return (
    tagName === 'INPUT' ||
    tagName === 'TEXTAREA' ||
    (includeSelect && tagName === 'SELECT') ||
    target?.isContentEditable ||
    Boolean(target?.closest?.(selector))
  );
}
