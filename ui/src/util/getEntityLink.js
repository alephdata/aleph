export default function getEntityLink(entity) {
  return entity.id ? `/entities/${entity.id}`: null;
}
