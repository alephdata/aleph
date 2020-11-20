import Query from 'app/Query';


export function queryGroups(location) {
  return Query.fromLocation('groups', location, {}, 'groups');
}

export function queryCollectionDocuments(location, collectionId, onlyTopLevel = true) {
  const context = {
    'filter:collection_id': collectionId,
    'filter:schemata': 'Document',
  };
  if (onlyTopLevel) {
    context['empty:properties.parent'] = true;
  }
  return Query.fromLocation('entities', location, context, 'document');
}

export function queryCollectionEntities(location, collectionId, schema) {
  const context = {
    'filter:collection_id': collectionId,
  };
  if (schema) {
    context['filter:schema'] = schema;
  } else {
    context['filter:schemata'] = 'Thing';
  }
  return Query.fromLocation('entities', location, context, 'entities').limit(200);
}

export function entitySetSchemaCountsQuery(entitySetId) {
  return new Query(`entitysets/${entitySetId}/entities`, {}, {}, 'entitySetEntities')
    .add('facet', 'schema')
    .add('filter:schemata', 'Thing')
    .add('filter:schemata', 'Interval')
    .limit(0);
}

export function entitySetEntitiesQuery(location, entitySetId, schema) {
  const context = {
    'filter:schema': schema,
  };
  return Query.fromLocation(`entitysets/${entitySetId}/entities`, location, context, 'entitySetEntities');
}

export function queryCollectionEntitySets(location, collectionId) {
  const context = {
    'filter:collection_id': collectionId,
  };
  return Query.fromLocation('entitysets', location, context, 'entitySets');
}

export function queryCollectionDiagrams(location, collectionId) {
  return queryCollectionEntitySets(location, collectionId).setFilter('type', 'diagram');
}

export function queryCollectionLists(location, collectionId) {
  return queryCollectionEntitySets(location, collectionId).setFilter('type', 'list');
}

export function queryCollectionXrefFacets(location, collectionId) {
  const path = `collections/${collectionId}/xref`;
  let query = Query.fromLocation(path, location, {}, 'xref');
  query = query.defaultFacet('match_collection_id', true);
  query = query.defaultFacet('countries', false);
  query = query.defaultFacet('schema', false);
  // Show no internal matches:
  // query = query.set('exclude:match_collection_id', collectionId);
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
    'filter:schemata': schemaName,
    'filter:collection_id': collection.id,
    prefix: queryText,
  };

  return Query.fromLocation('entities', location, context, 'entities')
    .limit(30)
    .sortBy('caption', 'asc');
}

export function queryExpand(location, entityId, properties, limit = 200) {
  const path = `entities/${entityId}/expand`;
  const context = {
    'edge_types': ['entity'],
    'filter:property': properties
  };

  return Query.fromLocation(path, location, context, 'expand').limit(limit);
}
