import convertHighlightsToReactElements from '/src/util/convertHighlightsToReactElements.js';
import './SearchHighlight.scss';

export default function SearchHighlight({ highlight }) {
  if (!highlight || highlight.length <= 0) {
    return null;
  }

  return (
    <p className="SearchHighlight">
      {highlight
        .map((fragment) => convertHighlightsToReactElements(fragment))
        .reduce((prev, curr) => [prev, ' … ', curr])}
    </p>
  );
}
