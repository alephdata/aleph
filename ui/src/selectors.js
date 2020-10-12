import _ from 'lodash';

import { loadState } from 'reducers/util';


function selectTimestamp(state) {
  return state.mutation;
}

function selectObject(state, objects, id) {
  if (!id || !_.has(objects, id)) {
    return loadState();
  }
  const obj = objects[id];
  if (!obj.isError && !obj.isPending) {
    const outdated = obj.loadedAt && obj.loadedAt < selectTimestamp(state);
    obj.shouldLoad = obj.shouldLoad || outdated;
  }
  return obj;
}

function selectResult(state, query, expand) {
  const result = {
    results: [],
    ...selectObject(state, state.results, query.toKey()),
  };
  result.results = result.results
    .map(id => expand(state, id))
    .filter((r) => r.id !== undefined);
  return result;
}

export function selectLocale(state) {
  // determine the active locale to be used by the user interface. this is
  // either saved in localStorage or extracted from metadata. The initial
  // request to metadata will be sent with unmodified Accept-Language headers
  // allowing the backend to perform language negotiation.
  const role = selectCurrentRole(state);
  if (role.locale) {
    return role.locale;
  }
  const { metadata } = state;
  if (metadata && metadata.app) {
    return metadata.app.locale;
  }
  return 'en';
}

export function selectMetadata(state) {
  const metadata = selectObject(state, state, 'metadata');
  if (!metadata.isPending) {
    const locale = selectLocale(state);
    const localeMismatch = metadata.app && metadata.app.locale !== locale;
    metadata.shouldLoad = metadata.shouldLoad || localeMismatch;
    metadata.shouldLoad = metadata.shouldLoad || metadata.isError;
  }
  return metadata;
}

export function selectPages(state) {
  return selectMetadata(state).pages;
}

export function selectPage(state, name) {
  return selectPages(state).find((page) => page.name === name);
}

export function selectModel(state) {
  return selectMetadata(state).model;
}

export function selectSchema(state, schemaName) {
  return selectModel(state).getSchema(schemaName);
}

export function selectSession(state) {
  return selectObject(state, state, 'session');
}

export function selectCurrentRole(state) {
  const session = selectSession(state);
  const role = selectRole(state, session.roleId);
  if (role.id) {
    return role;
  }
  if (session.shouldLoad === undefined) {
    session.shouldLoad = session.loggedIn;
  }
  return session;
}

export function selectTester(state) {
  const role = selectCurrentRole(state);
  /* eslint-disable camelcase */
  return role.is_tester || false;
}

export function selectAdmin(state) {
  const role = selectCurrentRole(state);
  /* eslint-disable camelcase */
  return role.is_admin || false;
}

export function selectAlerts(state) {
  return selectObject(state, state, 'alerts');
}

export function selectStatistics(state) {
  return selectObject(state, state, 'statistics');
}

export function selectSystemStatus(state) {
  return selectObject(state, state, 'systemStatus');
}

export function selectRole(state, roleId) {
  return selectObject(state, state.roles, roleId);
}

export function selectEntitySets(state) {
  return state.entitySets;
}

export function selectCollection(state, collectionId) {
  return selectObject(state, state.collections, collectionId);
}

export function selectEntity(state, entityId) {
  const entity = selectObject(state, state.entities, entityId);
  const model = selectModel(state);
  const hasModel = entity.schema !== undefined && model !== undefined;
  const result = hasModel ? model.getEntity(entity) : {};
  result.isPending = !!entity.isPending;
  result.isError = !!entity.isError;
  result.shouldLoad = !!entity.shouldLoad;
  result.shallow = !!entity.shallow;
  result.error = entity.error;
  result.links = entity.links;
  result.safeHtml = entity.safeHtml;
  result.collection = entity.collection;
  result.highlight = entity.highlight;
  return result;
}

export function selectEntitySet(state, entitySetId) {
  return selectObject(state, state.entitySets, entitySetId);
}

export function selectDocumentContent(state, documentId) {
  return selectObject(state, state.documentContent, documentId);
}

export function selectCollectionsResult(state, query) {
  return selectResult(state, query, selectCollection);
}

export function selectRolesResult(state, query) {
  return selectResult(state, query, selectRole);
}

export function selectEntitiesResult(state, query) {
  return selectResult(state, query, selectEntity);
}

export function selectExpandResult(state, query) {
  return {
    results: [],
    ...selectObject(state, state.results, query.toKey()),
  };
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

export function selectEntitySetsResult(state, query) {
  return selectResult(state, query, selectEntitySet);
}

export function selectEntityTags(state, entityId) {
  return selectObject(state, state.entityTags, entityId);
}

export function selectExports(state) {
  return state.exports;
}

export function selectValueCount(state, prop, value) {
  if (!prop.matchable || !prop.type.grouped) {
    return null;
  }
  return state.values[`${prop.type.group}:${value}`] || null;
}

export function selectEntityReferences(state, entityId) {
  const model = selectModel(state);
  const references = selectObject(state, state.entityReferences, entityId);
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
  return references.results.find(ref => ref.property.qname === qname);
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

export function selectCollectionStatus(state, collectionId) {
  const status = selectObject(state, state.collectionStatus, collectionId);
  if (status.isError || status.isPending) {
    return status;
  }
  status.active = status.pending || status.running;
  return status;
}

export function selectCollectionPermissions(state, collectionId) {
  return selectObject(state, state.collectionPermissions, collectionId);
}

export function selectEntityMapping(state, entityId) {
  return selectObject(state, state.entityMappings, entityId);
}

export function selectCollectionXref(state, xrefId) {
  return selectObject(state, state.collectionXref, xrefId);
}

export function selectCollectionXrefResult(state, query) {
  const model = selectModel(state);
  const result = selectResult(state, query, (stateInner, id) => stateInner.collectionXref[id]);
  result.results.forEach((xref) => {
    xref.match = model.getEntity(xref.match);
    xref.entity = model.getEntity(xref.entity);
  });
  return result;
}

export function selectQueryLog(state) {
  return selectObject(state, state, 'queryLogs');
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
