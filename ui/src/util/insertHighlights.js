import { encode } from 'util/htmlEntities';

export default function insertHighlights(text, highlights) {
  // The highlights returned by the API are HTML encoded, but
  // the document text is not. We need to encoded the document text
  // as well. Otherwise, highlights that contain HTML entities
  // would not get replaced.
  text = encode(text);

  return highlights.reduce((text, highlight) => {
    // Highlights are enclosed with HTML `em` tags
    const withoutMarkup = highlight.replaceAll(/<\/?em>/g, '');

    return text.replace(withoutMarkup, highlight);
  }, text);
}
