import Query from 'src/app/Query';


export function queryCollectionDocuments(location, collectionId) {
  const context = {
    'filter:collection_id': collectionId,
    'filter:schemata': 'Document',
    'empty:properties.parent': true,
  };
  return Query.fromLocation('entities', location, context, 'document');
}

export function queryCollectionDiagrams(location, collectionId) {
  const context = {
    'filter:collection_id': collectionId,
  };
  return Query.fromLocation('diagrams', location, context, 'diagrams');
}

export function queryCollectionXrefFacets(location, collectionId) {
  const path = `collections/${collectionId}/xref`;
  return Query.fromLocation(path, location, {}, 'xref')
    .defaultFacet('match_collection_id', true)
    .defaultFacet('countries', false)
    .defaultFacet('schema', false);
}

export function queryFolderDocuments(location, documentId, queryText) {
  // when a query is defined, we switch to recursive folder search - otherwise
  // a flat listing of the immediate children of this directory is shown.
  const q = Query.fromLocation('entities', location, {}, 'document').getString('q');
  const hasSearch = (q.length !== 0 || queryText);
  const context = {
    'filter:schemata': 'Document',
  };
  if (hasSearch) {
    context['filter:properties.ancestors'] = documentId;
  } else {
    context['filter:properties.parent'] = documentId;
  }
  let query = Query.fromLocation('entities', location, context, 'document');
  if (queryText) {
    query = query.setString('q', queryText);
  }
  return query;
}

export function queryEntityReference(location, entity, reference) {
  if (!reference) {
    return null;
  }
  const context = {
    [`filter:properties.${reference.property.name}`]: entity.id,
    'filter:schemata': reference.schema,
  };
  return Query.fromLocation('entities', location, context, reference.property.name);
}

export function queryEntitySimilar(location, entityId) {
  const path = entityId ? `entities/${entityId}/similar` : undefined;
  return Query.fromLocation(path, location, {}, 'similar')
    .defaultFacet('collection_id', true);
}
