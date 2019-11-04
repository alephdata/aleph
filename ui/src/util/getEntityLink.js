export default function getEntityLink(entity) {
  return (entity && entity.id) ? `/entities/${entity.id}` : null;
}
