import Query from 'app/Query';


export function queryGroups(location) {
  return Query.fromLocation('groups', location, {}, 'groups');
}

export function queryCollectionDocuments(location, collectionId) {
  const context = {
    'filter:collection_id': collectionId,
    'filter:schemata': 'Document',
    'empty:properties.parent': true,
  };
  const path = collectionId ? 'entities' : undefined;
  return Query.fromLocation(path, location, context, 'document');
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

  const path = collectionId ? 'entities' : undefined;
  if (location) {
    return Query.fromLocation(path, location, context, 'entities').limit(200);
  } else {
    return new Query(path, {}, context, 'entities').limit(200);
  }
}

export function entitySetSchemaCountsQuery(entitySetId) {
  const path = entitySetId ? `entitysets/${entitySetId}/entities` : undefined;
  return new Query(path, {}, {}, 'entitySetEntities')
    .add('facet', 'schema')
    .add('filter:schemata', 'Thing')
    .add('filter:schemata', 'Interval')
    .limit(0);
}

export function entitySetEntitiesQuery(location, entitySetId, schema, limit = 9999) {
  const context = {}
  if (schema) {
    context['filter:schema'] = schema;
  }
  const path = entitySetId ? `entitysets/${entitySetId}/entities` : undefined;
  return Query.fromLocation(path, location, context, 'entitySetEntities')
    .limit(limit);
}

export function entitySetItemsQuery(location, entitySetId, limit = 9999) {
  const path = entitySetId ? `entitysets/${entitySetId}/items` : undefined;
  return Query.fromLocation(path, location, {}, 'items').limit(limit);
}

export function queryCollectionEntitySets(location, collectionId) {
  const context = { 'filter:collection_id': collectionId };
  const path = collectionId ? `entitysets` : undefined;
  return Query.fromLocation(path, location, context, 'entitySets');
}

export function queryCollectionMappings(location, collectionId) {
  const path = collectionId ? `collections/${collectionId}/mappings` : undefined;
  return Query.fromLocation(path, location, {}, 'mappings');
}

export function collectionXrefFacetsQuery(location, collectionId) {
  const path = collectionId ? `collections/${collectionId}/xref` : undefined;
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
  const path = documentId ? 'entities' : undefined;
  const q = Query.fromLocation(path, location, {}, 'document').getString('q');
  const hasSearch = (q.length !== 0 || queryText);
  const field = hasSearch ? 'filter:properties.ancestors' : 'filter:properties.parent';
  const context = { 'filter:schemata': 'Document', [field]: documentId };
  let query = Query.fromLocation(path, location, context, 'document');
  if (queryText) {
    query = query.setString('q', queryText);
  }
  return query;
}

export function entitySimilarQuery(location, entityId) {
  const path = entityId ? `entities/${entityId}/similar` : undefined;
  return Query.fromLocation(path, location, {}, 'similar')
    .defaultFacet('collection_id', true);
}

export function profileSimilarQuery(location, profileId) {
  const path = profileId ? `profiles/${profileId}/similar` : undefined;
  return Query.fromLocation(path, location, {}, 'similar')
    .defaultFacet('collection_id', true);
}

export function queryEntitySuggest(location, collection, schemaName, queryText) {
  const context = {
    'filter:schemata': schemaName,
    'filter:collection_id': collection?.id,
    prefix: queryText,
  };
  const path = schemaName && collection?.id ? 'entities' : undefined;
  return Query.fromLocation(path, location, context, 'entities')
    .limit(30)
    .sortBy('caption', 'asc');
}

export function entityExpandQuery(entityId, properties, limit = 200) {
  const context = { 'filter:property': properties };
  const path = entityId ? `entities/${entityId}/expand` : undefined;
  return new Query(path, {}, context, 'expand').limit(limit);
}

export function entityReferencesQuery(entityId) {
  return entityExpandQuery(entityId, [], 0);
}

export function entityReferenceQuery(location, entity, reference) {
  const context = {
    [`filter:properties.${reference?.property?.name}`]: entity?.id,
    'filter:schemata': reference?.schema,
  };
  const path = (entity?.id && reference?.schema && reference?.property) ? 'entities' : undefined;
  return Query.fromLocation(path, location, context, reference?.property?.name);
}

export function profileExpandQuery(profileId, properties, limit = 200) {
  const context = { 'filter:property': properties };
  const path = profileId ? `profiles/${profileId}/expand` : undefined;
  return new Query(path, {}, context, 'expand').limit(limit);
}

export function profileReferencesQuery(profileId) {
  return profileExpandQuery(profileId, [], 0);
}

export function profileReferenceQuery(location, profile, reference) {
  const context = {
    [`filter:properties.${reference?.property?.name}`]: profile?.entities,
    'filter:schemata': reference?.schema,
  };
  const path = (profile?.id && reference?.schema && reference?.property) ? 'entities' : undefined;
  return Query.fromLocation(path, location, context, reference?.property?.name);
}
