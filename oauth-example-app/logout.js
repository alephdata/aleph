import { deleteToken, makeUrl } from "./util.js";

async function handler(url, request, settings) {
  const headers = new Headers();
  headers.set("Location", makeUrl(request, "/").toString());
  deleteToken(headers);
  return new Response("", { status: 302, headers });
}

export default handler;
