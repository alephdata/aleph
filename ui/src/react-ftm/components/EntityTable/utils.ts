export const isScrolledIntoView = (
  el: HTMLElement,
  scrollParent: HTMLElement
) => {
  const parent = scrollParent.getBoundingClientRect();
  const { top, bottom, left, right } = el.getBoundingClientRect();

  return (
    top > parent.top &&
    bottom < parent.bottom &&
    left > parent.left &&
    right < parent.right
  );
};
