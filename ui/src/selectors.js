import _ from 'lodash';


function selectResult(state, query, expand) {
  const key = query.toKey();
  const result = {
    isLoading: false,
    isError: false,
    shouldLoad: true,
    results: [],
    ...state.results[key],
  };
  result.results = result.results.map(id => expand(state, id));
  return result;
}

function selectObject(objects, id) {
  if (!id || !_.has(objects, id)) {
    return {
      isLoading: false,
      isError: false,
      shouldLoad: true,
    };
  }
  return objects[id];
}

export function selectLocale(state) {
  // determine the active locale to be used by the user interface. this is
  // either saved in localStorage or extracted from metadata. The initial
  // request to metadata will be sent with unmodified Accept-Language headers
  // allowing the backend to perform language negotiation.
  const { config, session, metadata } = state;
  if (config && config.locale) {
    return config.locale;
  }
  if (session && session.role && session.role.locale) {
    return session.role.locale;
  }
  if (metadata && metadata.app) {
    return metadata.app.locale;
  }
  return undefined;
}

export function selectMetadata(state) {
  const metadata = selectObject(state, 'metadata');
  const locale = selectLocale(state);
  if (metadata.app && metadata.app.locale !== locale) {
    return selectObject(state, undefined);
  }
  return metadata;
}

export function selectModel(state) {
  return selectMetadata(state).model;
}

export function selectSchema(state, schemaName) {
  return selectModel(state).getSchema(schemaName);
}

export function selectSession(state) {
  return selectObject(state, 'session');
}

export function selectAlerts(state) {
  return selectObject(state, 'alerts');
}

export function selectGroups(state) {
  return state.groups;
}

export function selectStatistics(state) {
  return selectObject(state, 'statistics');
}

export function selectCollection(state, collectionId) {
  return selectObject(state.collections, collectionId);
}

export function selectEntity(state, entityId) {
  const entity = selectObject(state.entities, entityId);
  const model = selectModel(state);
  const hasModel = entity.schema !== undefined && model !== undefined;
  const result = hasModel ? model.getEntity(entity) : {};
  result.isLoading = !!entity.isLoading;
  result.isError = !!entity.isError;
  result.shouldLoad = !!entity.shouldLoad;
  result.links = entity.links;
  result.collection = entity.collection;
  result.highlight = entity.highlight;
  return result;
}

export function selectDocumentContent(state, documentId) {
  return selectObject(state.documentContent, documentId);
}

export function selectCollectionsResult(state, query) {
  return selectResult(state, query, selectCollection);
}

export function selectEntitiesResult(state, query) {
  return selectResult(state, query, selectEntity);
}

export function selectNotificationsResult(state, query) {
  const model = selectModel(state);
  const result = selectResult(state, query, (stateInner, id) => stateInner.notifications[id]);
  result.results.forEach((notif) => {
    Object.entries(notif.event.params).forEach(([field, type]) => {
      if (type === 'entity' && notif.params[field]) {
        notif.params[field] = model.getEntity(notif.params[field]);
      }
    });
  });
  return result;
}

export function selectDashboardResult(state, query) {
  const result = selectResult(state, query, (stateInner, id) => stateInner.dashboard[id]);
  return result;
}

export function selectEntityTags(state, entityId) {
  return selectObject(state.entityTags, entityId);
}

export function selectEntityReferences(state, entityId) {
  const model = selectModel(state);
  const references = selectObject(state.entityReferences, entityId);
  references.results = references.results || [];
  references.results = references.results.map((ref) => {
    const schema = model.getSchema(ref.schema);
    const property = schema.getProperty(ref.property.name);
    const reverse = property.getReverse();
    return {
      schema, property, reverse, count: ref.count,
    };
  });
  return references;
}

export function selectEntityReference(state, entityId, qname) {
  const references = selectEntityReferences(state, entityId);
  if (!references.total) {
    return undefined;
  }

  return references.results
    .find(ref => ref.property.qname === qname) || references.results[0];
}

export function selectEntityView(state, entityId, mode, isPreview) {
  if (mode) {
    return mode;
  }
  const { schema } = selectEntity(state, entityId);
  if (schema && schema.isAny(['Email', 'HyperText', 'Image', 'Pages', 'Table'])) {
    return 'view';
  }
  if (schema && schema.isA('Folder')) {
    return 'browse';
  }
  if (schema && schema.isDocument()) {
    return 'view';
  }
  if (isPreview) {
    return 'info';
  }
  const references = selectEntityReferences(state, entityId);
  if (references.total) {
    return references.results[0].property.qname;
  }
  return undefined;
}

export function selectCollectionView(state, collectionId, mode) {
  if (mode) {
    return mode;
  }
  const collection = selectCollection(state, collectionId);
  const model = selectModel(state);
  let largestSchema = 'Document';
  let largestCount = 0;
  const schemata = {};

  Object.keys(collection.schemata || {})
    .forEach((key) => {
      const norm = model.getSchema(key).isDocument() ? 'Document' : key;
      schemata[norm] = (schemata[norm] || 0) + collection.schemata[key];
      if (schemata[norm] > largestCount) {
        largestCount = schemata[norm];
        largestSchema = norm;
      }
    });
  return largestSchema; // yay.
}

export function selectCollectionStatus(state, collectionId) {
  return selectObject(state.collectionStatus, collectionId);
}

export function selectCollectionPermissions(state, collectionId) {
  return selectObject(state.collectionPermissions, collectionId);
}

export function selectCollectionXrefIndex(state, collectionId) {
  return selectObject(state.collectionXrefIndex, collectionId);
}

export function selectCollectionXrefMatches(state, query) {
  const model = selectModel(state);
  const matches = selectObject(state.collectionXrefMatches, query.toKey());
  if (matches.results !== undefined) {
    matches.results.forEach((result) => {
      result.match = model.getEntity(result.match);
      result.entity = model.getEntity(result.entity);
    });
  }
  return matches;
}

export function selectQueryLog(state) {
  return selectObject(state, 'queryLogs');
}

export function selectQueryLogsLimited(state, limit = 9) {
  const queryLogs = selectQueryLog(state);
  let results = [];
  if (queryLogs && !!queryLogs.results) {
    results = queryLogs.results.slice(0, limit);
  }
  return {
    ...queryLogs,
    results,
  };
}
