/**
 * Makes everything outside a dialog inert (L2-047 AC1), wherever the dialog is rendered: every sibling of the
 * dialog and of each of its ancestors up to the body. Returns the undo, which clears only what it set.
 */
export function inertBackground(dialog: HTMLElement): () => void {
  const set: HTMLElement[] = [];
  for (let node: HTMLElement | null = dialog; node && node !== document.body; node = node.parentElement) {
    const parent: HTMLElement | null = node.parentElement;
    if (!parent) break;
    for (const sibling of Array.from(parent.children) as Element[]) {
      if (sibling === node || !(sibling instanceof HTMLElement) || sibling.inert) continue;
      if (['SCRIPT', 'STYLE', 'LINK'].includes(sibling.tagName)) continue;
      sibling.inert = true;
      set.push(sibling);
    }
  }
  return () => set.forEach((el) => (el.inert = false));
}
