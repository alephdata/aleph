/*
 * https://stackoverflow.com/questions/23618744/rendering-comma-separated-list-of-links
 */
export default function wordList(arr, sep) {
  if (arr.length === 0) {
    return [];
  }
  return arr.slice(1).reduce((xs, x) => xs.concat([sep, x]), [arr[0]]);
}
