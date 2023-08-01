import { makeUrl, setToken } from "./util.js";

async function issueToken(authCode, settings) {
  const headers = new Headers();
  headers.set("Content-Type", "application/x-www-form-urlencoded; charset=utf-8");

  const body = new URLSearchParams();
  body.set("client_id", settings.clientId);
  body.set("client_secret", settings.clientSecret);
  body.set("redirect_uri", settings.redirectUrl);
  body.set("grant_type", "authorization_code");
  body.set("code", authCode);

  const res = await fetch(settings.tokenUrl, { method: "POST", headers, body });
  const data = await res.json();

  return {
    token: data.access_token,
    expires: data.expires_in,
  };
}

async function handler(url, request, settings) {
  const headers = new Headers();

  const location = makeUrl(request, "/");
  headers.set("Location", location.toString());

  const authCode = url.searchParams.get("code");

  if (!authCode) {
    return new Response("No auth code provided", {
      status: 400,
    });
  }

  const { token, expires } = await issueToken(authCode, settings);  
  setToken(headers, token, expires);

  return new Response("", {
    status: 302,
    headers,
  });
}

export default handler;
