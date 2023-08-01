import { getToken, makeUrl } from "./util.js";

async function handler(url, request, settings) {
  const token = getToken(request);

  if (token) {
    // Already logged in
    const headers = new Headers();
    headers.set("Location", makeUrl("/").toString());
    return new Response("", { status: 302, headers });
  }

  const headers = new Headers();

  const location = new URL(settings.authUrl);
  location.searchParams.set("client_id", settings.clientId);
  location.searchParams.set("response_type", "code");
  location.searchParams.set("redirect_uri", settings.redirectUrl);

  headers.set("Location", location);

  return new Response("", {
    status: 302,
    headers,
  });
}

export default handler;
