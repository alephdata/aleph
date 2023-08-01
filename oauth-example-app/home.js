import { getToken, makeUrl } from "./util.js";

async function getUserInfo(token, settings) {
  const url = new URL("/api/2/roles/me", settings.apiUrl);
  const headers = new Headers();
  headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(url, { headers });
  const data = await res.json();

  return data;
}

async function handler(url, request, settings) {
  const token = getToken(request);
  let body;

  if (!token) {
    const loginUrl = makeUrl(request, "login").toString();
    body = `<a href="${loginUrl}">Log in</a>`;
  } else {
    const logoutUrl = makeUrl(request, "logout").toString();
    const { name } = await getUserInfo(token, settings);
    body = `Hi ${name}! <a href="${logoutUrl}">Log out</a>`;
  }

  return new Response(body, { status: 200 });
}

export default handler;
