import _ from 'lodash';
import { isEntityRtl } from 'react-ftm';
import { Model } from '@alephdata/followthemoney';

import { loadState } from 'reducers/util';
import { entityReferencesQuery, profileReferencesQuery } from 'queries';
import { getRecentlyViewedItem } from 'app/storage';

function selectTimestamp(state) {
  return state.mutation;
}

function selectObject(state, objects, id) {
  if (!id || !_.has(objects, id)) {
    return loadState();
  }
  const obj = objects[id];
  const isLoadable = !obj.isError && !obj.isPending;
  if (isLoadable) {
    const outdated = obj.loadedAt && obj.loadedAt < selectTimestamp(state);
    obj.shouldLoad = obj.shouldLoad || outdated;
  }
  obj.shouldLoadDeep = obj.shouldLoad || (isLoadable && obj.shallow !== false);
  return obj;
}

function selectResult(state, query, expand) {
  if (!query || !query.path) {
    return {
      ...loadState(),
      results: [],
      shouldLoad: false,
      shouldLoadDeep: false,
      isPending: true,
    };
  }
  const result = {
    results: [],
    ...selectObject(state, state.results, query.toKey()),
  };
  if (expand) {
    result.results = result.results
      .map((id) => expand(state, id))
      .filter((r) => r.id !== undefined);
  }
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
    const localeMismatch = metadata?.app?.locale !== locale;
    metadata.shouldLoad = metadata.shouldLoad || localeMismatch;
    metadata.shouldLoad = metadata.shouldLoad || metadata.isError;
  }
  return metadata;
}

export function selectMessages(state) {
  return selectObject(state, state, 'messages');
}

export function selectPinnedMessage(state) {
  const metadata = selectMetadata(state);
  const { messages } = selectMessages(state);

  if (metadata?.app?.banner) {
    return { body: metadata.app.banner };
  }

  if (!messages) {
    return null;
  }

  const activeMessages = messages.filter(({ displayUntil }) => {
    return !displayUntil || Date.now() <= new Date(displayUntil);
  });

  if (activeMessages.length <= 0) {
    return null;
  }

  return activeMessages[0];
}

export function selectPages(state) {
  return selectMetadata(state).pages;
}

export function selectPage(state, name) {
  return selectPages(state).find((page) => page.name === name);
}

export function selectModel(state) {
  const metadata = selectMetadata(state);
  if (metadata.model && !metadata.ftmModel) {
    metadata.ftmModel = new Model(metadata.model);
  }
  return metadata.ftmModel;
}

export function selectSchema(state, schemaName) {
  return selectModel(state).getSchema(schemaName);
}

export function selectSession(state) {
  return selectObject(state, state, 'session');
}

export function selectCurrentRoleId(state) {
  const session = selectSession(state);
  if (!!session.token) {
    return session.token.split('.', 1);
  }
}

export function selectCurrentRole(state) {
  const roleId = selectCurrentRoleId(state);
  return !!roleId ? selectRole(state, roleId) : {};
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

export function selectAlertResult(state, query) {
  return selectResult(state, query);
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
  const collection = selectObject(state, state.collections, collectionId);
  const status = collection.status || {};
  status.pending = status.pending || 0;
  status.running = status.running || 0;
  status.finished = status.finished || 0;
  status.active = status.pending + status.running;
  status.total = status.active + status.finished;
  status.progress = status.finished / status.total;
  status.percent = Math.round(status.progress * 100);
  collection.status = status;
  return collection;
}

export function selectEntity(state, entityId) {
  const entity = selectObject(state, state.entities, entityId);
  const lastViewed = getRecentlyViewedItem(entityId);

  if (!entity.selectorCache) {
    const model = selectModel(state);
    if (!entity.schema || !model) {
      return entity;
    }
    entity.selectorCache = model.getEntity(entity);
  }

  const result = entity.selectorCache;
  result.safeHtml = entity.safeHtml;
  result.collection = entity.collection;
  result.role = entity.role;
  result.createdAt = entity.created_at;
  result.updatedAt = entity.updated_at;
  result.highlight = entity.highlight;
  result.latinized = entity.latinized;
  result.isPending = !!entity.isPending;
  result.isError = !!entity.isError;
  result.shouldLoad = !!entity.shouldLoad;
  result.shouldLoadDeep = !!entity.shouldLoadDeep;
  result.shallow = !!entity.shallow;
  result.error = entity.error;
  result.links = entity.links;
  result.profileId = entity.profile_id;
  result.lastViewed = lastViewed;
  result.writeable = entity.writeable;

  return result;
}

export function selectEntityDirectionality(state, entity) {
  const isRtl = isEntityRtl(entity, selectLocale(state), selectModel(state));
  return isRtl ? 'rtl' : 'ltr';
}

export function selectEntitySet(state, entitySetId) {
  return selectObject(state, state.entitySets, entitySetId);
}

export function selectEntitySetItem(state, itemId) {
  const item = selectObject(state, state.entitySetItems, itemId);
  item.entity = selectEntity(state, item.entityId || item.entity?.id);
  return item;
}

export function selectMappingsResult(state, query) {
  return selectResult(state, query, selectEntityMapping);
}

export function selectProfile(state, entitySetId) {
  const profile = selectObject(state, state.entitySets, entitySetId);
  if (profile?.merged?.schema && !profile?.entity?.id) {
    const model = selectModel(state);
    profile.entity = model.getEntity(profile.merged);
    profile.entity.latinized = profile.merged.latinized;
  }
  return profile;
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

function buildReferences(references, schema) {
  if (!schema) {
    return { ...references, results: [] };
  }
  references.results = references.results || [];
  references.results = references.results.map((ref) => {
    if (!!ref.schema) {
      return ref;
    }
    const reverse = schema.getProperty(ref.property);
    const property = reverse.getReverse();
    return {
      schema: property.schema,
      property,
      reverse,
      count: ref.count,
    };
  });
  references.results = references.results.filter(
    (ref) => ref.reverse.stub && !ref.reverse.hidden
  );
  references.total = references.results.length;
  return references;
}

export function selectEntityExpandResult(state, query) {
  return selectObject(state, state.results, query.toKey());
}

export function selectEntityReferences(state, entityId) {
  const entity = selectEntity(state, entityId);
  const query = entityReferencesQuery(entityId);
  const references = selectEntityExpandResult(state, query);
  return buildReferences(references, entity?.schema);
}

export function selectEntityReference(state, entityId, qname) {
  const references = selectEntityReferences(state, entityId);
  return references.results.find((ref) => ref.property.qname === qname);
}

export function selectProfileExpandResult(state, query) {
  return selectObject(state, state.results, query.toKey());
}

export function selectProfileReferences(state, profileId) {
  const profile = selectProfile(state, profileId);
  const query = profileReferencesQuery(profileId);
  const references = selectProfileExpandResult(state, query);
  return buildReferences(references, profile?.entity?.schema);
}

export function selectProfileReference(state, profileId, qname) {
  const references = selectProfileReferences(state, profileId);
  return references.results.find((ref) => ref.property.qname === qname);
}

export function selectNotificationsResult(state, query) {
  const model = selectModel(state);
  const result = selectResult(
    state,
    query,
    (stateInner, id) => stateInner.notifications[id]
  );
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

export function selectEntitySetItemsResult(state, query) {
  return selectResult(state, query, selectEntitySetItem);
}

export function selectEntityTags(state, entityId) {
  return selectObject(state, state.entityTags, entityId);
}

export function selectProfileTags(state, profileId) {
  return selectEntityTags(state, profileId);
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

export function selectEntityView(state, entityId, mode, isPreview) {
  if (mode) {
    return mode;
  }
  const { schema } = selectEntity(state, entityId);
  if (
    schema &&
    schema.isAny(['Email', 'HyperText', 'Image', 'Pages', 'Table'])
  ) {
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
  if (references?.results?.length) {
    return references.results[0].property.qname;
  }
  return 'similar';
}

export function selectProfileView(state, profileId, mode) {
  return mode ? mode : 'items';
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
  const result = selectResult(state, query, undefined);
  result.results.forEach((xref) => {
    xref.match = selectEntity(state, xref.matchId);
    xref.entity = selectEntity(state, xref.entityId);
  });
  return result;
}

export function selectSimilarResult(state, query) {
  const result = selectResult(state, query, undefined);
  result.results.forEach((obj) => {
    obj.entity = selectEntity(state, obj.entityId);
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
