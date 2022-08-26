import React from 'react';

/*
 * https://stackoverflow.com/questions/23618744/rendering-comma-separated-list-of-links
 */
export function wordList(arr: Array<any>, sep: string) {
  if (arr.length === 0) {
    return [];
  }

  return arr.slice(1).reduce(
    (xs, x, i) =>
      xs.concat([
        <span key={`${i}_sep`} className="separator">
          {sep}
        </span>,
        <span key={i}>{x}</span>,
      ]),
    [<span key={arr[0]}>{arr[0]}</span>]
  );
}
