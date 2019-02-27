export default function getHost(url) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return url;
  }
}
