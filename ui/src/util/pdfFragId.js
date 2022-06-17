// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

// Parse a PDF fragment identifier according to
// <https://tools.ietf.org/html/rfc3778#section-3>.
// Returns the parameters as an array of objects.
export function parse(fragId) {
  const parameterStrings = fragId.split(/[&#]/);
  const parameters = parameterStrings.map(parseParameterString);
  return parameters;
}

// Turn a parameter string (e.g. 'zoom=1.5,0,0') into an object, e.g.:
//   { parameter: 'zoom', scale: 1.5, left: 0, top: 0 }.
function parseParameterString(parameterString) {
  const [parameter, valueString] = parameterString.split('=');
  const paramObject = { parameter: parameter.toLowerCase(), valueString };
  if (parameter === 'nameddest') paramObject.name = valueString;
  if (parameter === 'page') paramObject.pagenum = parseInt(valueString, 10);
  if (parameter === 'zoom') {
    const [scale, left, top] = valueString.split(',');
    Object.assign(paramObject, { scale, left, top });
  }
  if (parameter === 'view') {
    const [keyword, position] = valueString.split(',');
    Object.assign(paramObject, { keyword, position });
  }
  if (parameter === 'viewrect') {
    const [left, top, wd, ht] = valueString.split(',');
    Object.assign(paramObject, { left, top, wd, ht });
  }
  if (parameter === 'highlight') {
    const [lt, rt, top, btm] = valueString.split(',');
    Object.assign(paramObject, { lt, rt, top, btm });
  }
  return paramObject;
}
