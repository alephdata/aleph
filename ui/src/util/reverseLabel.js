export default function reverseLabel(schemata, reference) {
  if (!reference || !reference.property) {
    return null;
  }
  const prop = reference.property;
  const schema = schemata[prop.schema];
  const reverse = schema.properties[prop.reverse] || prop;
  return reverse.label;
}