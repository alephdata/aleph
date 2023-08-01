import { serve } from "https://deno.land/std@0.196.0/http/server.ts";
import homeHandler from "./home.js";
import loginHandler from "./login.js";
import logoutHandler from "./logout.js";
import callbackHandler from "./callback.js";

const settings = {
  clientId: Deno.env.get("OAUTH2_CLIENT_ID"),
  clientSecret: Deno.env.get("OAUTH2_CLIENT_SECRET"),
  authUrl: Deno.env.get("OAUTH2_AUTHORIZE_URL"),
  tokenUrl: Deno.env.get("OAUTH2_TOKEN_URL"),
  apiUrl: Deno.env.get("ALEPH_API_URL"),
  redirectUrl: "http://localhost:1234/callback",
};

if (
  !settings.clientId ||
  !settings.clientSecret ||
  !settings.authUrl ||
  !settings.tokenUrl ||
  !settings.apiUrl
) {
  console.log("Missing configuration options.");
  Deno.exit(1);
}

await serve(handler, { port: 1234 });

async function handler(request) {
  const url = new URL(request.url);
  let res;

  if (url.pathname === "/") {
    res = await homeHandler(url, request, settings);
  }

  if (url.pathname === "/login") {
    res = await loginHandler(url, request, settings);
  }

  if (url.pathname === "/logout") {
    res = await logoutHandler(url, request, settings);
  }

  if (url.pathname === "/callback") {
    res = await callbackHandler(url, request, settings);
  }

  if (!res) {
    return new Response("Not found", { status: 404 });
  }

  res.headers.set("Content-Type", "text/html");
  return res;
}
