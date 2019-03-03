export default function getPath(url) {
  if (url) {
    return new URL(url).pathname;
  }
  return undefined;
}
