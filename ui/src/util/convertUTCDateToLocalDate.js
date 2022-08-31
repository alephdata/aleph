// The Aleph API returns dates as ISO strings without timezone
// designators. When initializing new `Date` objects, those dates
// will by default be initialized with the local timezone of the
// user agent.
export default function convertUTCDateToLocalDate(date) {
  const dateObj = new Date(date);
  return new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60 * 1000);
}
