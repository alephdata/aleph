export const getProviderLoginUrl = function (provider) {
  return `${provider.login}?next=${encodeURIComponent(window.location.href)}`
};
