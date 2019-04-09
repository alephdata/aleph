export default function getEntityLink(entity) {
  if (entity.id && entity.schema) {
    const resource = entity.schema.isDocument() ? 'documents' : 'entities';
    return `/${resource}/${entity.id}`;
  }
  return null;
}
