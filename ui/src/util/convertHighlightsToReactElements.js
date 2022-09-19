import { createElement } from 'react';
import { decode } from './htmlEntities';

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

    // Highlight snippets are HTML encoded. As we are creating
    // proper React elements from those HTML snippets, and React
    // will escape any HTML markup, we neede to decode the snippet.
    // Otherwise, markup would get encoded twice.
    const decodedToken = decode(token);

    if (isHighlight) {
      nodes.push(createElement('em', { key: index }, decodedToken));
      return;
    }

    nodes.push(decodedToken);
  });

  return nodes;
}
