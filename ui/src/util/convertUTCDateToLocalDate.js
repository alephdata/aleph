export default function convertUTCDateToLocalDate(date) {
  return new Date(`${date} UTC`);
}
