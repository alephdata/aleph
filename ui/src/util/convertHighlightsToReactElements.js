import { createElement } from 'react';

// Converts a string containing `<em>` tags to a list of
// React elements without using `dangerouslySetInnerHTML`.
// This ensures that all other HTML markup is automatically
// escaped by React.
export default function convertHighlightsToReactElements(string) {
  const tokens = string.split(/(<\/?em>)/i);
  const nodes = [];

  let isHighlight = false;

  tokens.forEach((token, index) => {
    if (token === '<em>') {
      isHighlight = true;
      return;
    }

    if (token === '</em>') {
      isHighlight = false;
      return;
    }

    if (isHighlight) {
      nodes.push(createElement('em', { key: index }, token));
      return;
    }

    nodes.push(token);
  });

  return nodes;
}
