export default function getEntityLink(entity) {
  const entityId = typeof entity === "string" ? entity : entity?.id;
  return entityId ? `/entities/${entityId}` : null;
}
