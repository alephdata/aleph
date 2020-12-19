export default function normalizeDegreeValue(value) {
  return value < 0 ? (360 + value) % 360 : value % 360;
}
