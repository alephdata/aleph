export default function getEntitySetLink(entitySet) {
  return (entitySet && entitySet.id) ? `/entitysets/${entitySet.id}` : null;
}
