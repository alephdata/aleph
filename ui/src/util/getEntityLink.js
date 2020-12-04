export default function getEntityLink(entity, profile = true) {
  const entityId = typeof entity === "string" ? entity : entity?.id;
  const fragment = !profile ? '#profile=false' : '';
  return entityId ? `/entities/${entityId}${fragment}` : null;
}
