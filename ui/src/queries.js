import Query from 'app/Query';

export function groupsQuery(location) {
  return Query.fromLocation('groups', location, {}, 'groups');
}

export function alertsQuery(location) {
  return Query.fromLocation('alerts', location, {}, 'alerts').limit(
    Query.MAX_LIMIT
  );
}

export function entitiesQuery(location) {
  // We normally only want Things, not Intervals (relations between things).
  const context = {
    highlight: true,
    'filter:schemata': ['Thing', 'Page'],
  };
  return Query.fromLocation('entities', location, context, '');
}

function collectionContextQuery(context, location, collectionId, name) {
  const path = collectionId ? 'entities' : undefined;
  return Query.fromLocation(path, location, context, name);
}

export function collectionDocumentsQuery(location, collectionId) {
  const context = {
    'filter:collection_id': collectionId,
    'filter:schemata': 'Document',
    'empty:properties.parent': true,
  };
  return collectionContextQuery(context, location, collectionId, 'documents');
}

export function collectionEntitiesQuery(location, collectionId, schema) {
  const context = {
    'filter:collection_id': collectionId,
    'filter:schema': schema,
  };
  return collectionContextQuery(context, location, collectionId, 'entities');
}

export function collectionSearchQuery(location, collectionId, options = {}) {
  const context = {
    'filter:collection_id': collectionId,
    'filter:schemata': 'Thing',
    ...options,
  };
  return collectionContextQuery(context, location, collectionId, 'cs');
}

export function entitySetSchemaCountsQuery(entitySetId) {
  const path = entitySetId ? `entitysets/${entitySetId}/entities` : undefined;
  return new Query(path, {}, {}, 'entities')
    .add('facet', 'schema')
    .add('filter:schemata', 'Thing')
    .add('filter:schemata', 'Interval')
    .limit(0);
}

export function entitySetEntitiesQuery(
  location,
  entitySetId,
  schema,
  limit = Query.MAX_LIMIT
) {
  const context = {};
  if (schema) {
    context['filter:schema'] = schema;
  }
  const path = entitySetId ? `entitysets/${entitySetId}/entities` : undefined;
  return Query.fromLocation(path, location, context, 'entities').limit(limit);
}

export function entitySetItemsQuery(
  location,
  entitySetId,
  limit = Query.MAX_LIMIT
) {
  const path = entitySetId ? `entitysets/${entitySetId}/items` : undefined;
  return Query.fromLocation(path, location, {}, 'items').limit(limit);
}

export function investigationsQuery(location) {
  const context = { 'filter:category': 'casefile' };
  return Query.fromLocation(
    'collections',
    location,
    context,
    'collections'
  ).defaultSortBy('created_at', 'desc');
}

export function datasetsQuery(location) {
  const context = { 'exclude:category': 'casefile' };
  return Query.fromLocation('collections', location, context, 'collections')
    .defaultFacet('countries')
    .defaultFacet('category')
    .defaultSortBy('created_at', 'desc');
}

export function collectionEntitySetsQuery(location, collectionId) {
  const context = { 'filter:collection_id': collectionId };
  const path = collectionId ? `entitysets` : undefined;
  return Query.fromLocation(path, location, context, 'entitySets');
}

export function collectionMappingsQuery(location, collectionId) {
  const path = collectionId
    ? `collections/${collectionId}/mappings`
    : undefined;
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

export function folderDocumentsQuery(location, documentId, queryText) {
  // when a query is defined, we switch to recursive folder search - otherwise
  // a flat listing of the immediate children of this directory is shown.
  const path = documentId ? 'entities' : undefined;
  const q = Query.fromLocation(path, location, {}, 'document').getString('q');
  const hasSearch = q.length !== 0 || queryText;
  const field = hasSearch
    ? 'filter:properties.ancestors'
    : 'filter:properties.parent';
  const context = { 'filter:schemata': 'Document', [field]: documentId };
  let query = Query.fromLocation(path, location, context, 'document');
  if (queryText) {
    query = query.setString('q', queryText);
  }
  return query;
}

export function entitySimilarQuery(location, entityId) {
  const path = entityId ? `entities/${entityId}/similar` : undefined;
  return Query.fromLocation(path, location, {}, 'similar').defaultFacet(
    'collection_id',
    true
  );
}

export function profileSimilarQuery(location, profileId) {
  const path = profileId ? `profiles/${profileId}/similar` : undefined;
  return Query.fromLocation(path, location, {}, 'similar').defaultFacet(
    'collection_id',
    true
  );
}

export function entitySuggestQuery(
  location,
  collection,
  schemaName,
  queryText
) {
  const context = {
    'filter:schemata': schemaName,
    'filter:collection_id': collection?.id,
    ...queryText,
  };
  const path = schemaName && collection?.id ? 'entities' : undefined;
  return Query.fromLocation(path, location, context, 'entities').sortBy(
    'caption',
    'asc'
  );
}

export function entityExpandQuery(entityId, properties, limit = Query.LARGE) {
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
  const path =
    entity?.id && reference?.schema && reference?.property
      ? 'entities'
      : undefined;
  return Query.fromLocation(path, location, context, reference?.property?.name);
}

export function profileExpandQuery(profileId, properties, limit = Query.LARGE) {
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
  const path =
    profile?.id && reference?.schema && reference?.property
      ? 'entities'
      : undefined;
  return Query.fromLocation(path, location, context, reference?.property?.name);
}
