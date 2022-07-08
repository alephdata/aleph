// The escpaing of HTML entities follows Lucenes implementation.
// Lucene encodes some character that aren't stricktly required
// to be encoded, e.g. slashes.
// https://github.com/apache/lucene/blob/releases/lucene/9.2.0/lucene/highlighter/src/java/org/apache/lucene/search/highlight/SimpleHTMLEncoder.java
const ESCAPES = [
  ['"', '&quot;'],
  ['&', '&amp;'],
  ['<', '&lt;'],
  ['>', '&gt;'],
  ['\\', '&#x27;'],
  ['/', '&#x2F;'],
];

export function decode(encoded) {
  return ESCAPES.reduce((encoded, [char, replacement]) => {
    return encoded.replaceAll(replacement, char);
  }, encoded);
}

export function encode(decoded) {
  return ESCAPES.reduce((decoded, [char, replacement]) => {
    return decoded.replaceAll(char, replacement);
  }, decoded);
}
