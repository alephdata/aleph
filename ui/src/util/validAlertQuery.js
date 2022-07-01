export default function validAlertQuery(query) {
  return query && query.trim().length >= 3 && query.length < 100;
}
