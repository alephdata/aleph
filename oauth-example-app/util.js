import { getCookies, setCookie } from "https://deno.land/std@0.196.0/http/cookie.ts";

function makeUrl(request, pathname) {
  const url = new URL(request.url);
  url.path = "/";
  url.search = "";
  url.pathname = pathname;

  return url;
}

const COOKIE_NAME = "session_token";

function getToken(request) {
  const cookies = getCookies(request.headers);
  return cookies[COOKIE_NAME];
}

function setToken(headers, token, expires) {
  const cookie = {
    name: COOKIE_NAME,
    value: token,
    maxAge: expires,
    secure: true,
    httpOnly: true,
    sameSite: "Strict",
  };

  setCookie(headers, cookie);
}

function deleteToken(headers) {
  const cookie = {
    name: COOKIE_NAME,
    value: '',
    expires: 0,
  };

  setCookie(headers, cookie);
}

export { makeUrl, getToken, setToken, deleteToken };
