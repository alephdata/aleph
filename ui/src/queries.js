import Query from 'src/app/Query';


export function queryGroups(location) {
  return Query.fromLocation('groups', location, {}, 'groups');
}

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

export function queryCollectionXrefFacets(location, collectionId, contextId) {
  const path = `collections/${collectionId}/xref`;
  let query = Query.fromLocation(path, location, {}, 'xref');
  query = query.defaultFacet('match_collection_id', true);
  query = query.defaultFacet('countries', false);
  query = query.defaultFacet('schema', false);
  if (contextId) {
    query = query.set('context_id', contextId);
  } else {
    // Show internal matches only in de-dupe mode.
    query = query.set('exclude:match_collection_id', collectionId);
  }
  return query;
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

export function queryEntitySuggest(location, collection, schemaName, queryText) {
  const context = {
    'filter:schema': schemaName,
    'filter:collection_id': collection.id,
    prefix: queryText,
  };

  return Query.fromLocation('entities', location, context, 'entities').limit(30);
}
