export default function getEntitySetLink(entitySet) {

  return (entitySet && entitySet.id) ? `/${entitySet.type}s/${entitySet.id}` : "";
}
