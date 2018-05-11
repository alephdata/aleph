import pallete from "google-palette";

export function getColors() {
  let scheme = pallete.listSchemes('mpn65')[0];
  return scheme.apply(scheme, [65]);
}

export function getColor(id) {
  let colors = getColors();
  return colors[id % 65];
}
