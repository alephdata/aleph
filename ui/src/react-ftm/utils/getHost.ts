export function getHost(url: string) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return url;
  }
}
