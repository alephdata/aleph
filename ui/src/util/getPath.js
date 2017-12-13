export default function getPath(url) {
  return new URL(url).pathname;
}
