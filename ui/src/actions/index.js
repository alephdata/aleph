import { createAction } from 'redux-act';

export {
  queryRoles,
  fetchRole,
  suggestRoles,
  updateRole,
  generateApiKey,
} from './roleActions';
export { createAlert, deleteAlert, queryAlerts } from './alertActions';
export { queryNotifications } from './notificationActions';
export { setConfigValue, dismissHint } from './configActions';
export { ingestDocument } from './documentActions';
export {
  createCollection,
  deleteCollection,
  fetchCollection,
  fetchCollectionPermissions,
  queryCollections,
  queryCollectionXref,
  triggerCollectionXref,
  triggerCollectionXrefDownload,
  triggerCollectionReingest,
  triggerCollectionReindex,
  triggerCollectionCancel,
  updateCollection,
  updateCollectionPermissions,
} from './collectionActions';
export {
  createEntity,
  deleteEntity,
  fetchEntity,
  fetchEntityTags,
  queryEntities,
  querySimilar,
  queryEntityExpand,
  updateEntity,
} from './entityActions';
export {
  createEntityMapping,
  deleteEntityMapping,
  fetchEntityMapping,
  flushEntityMapping,
  queryMappings,
  updateEntityMapping,
} from './entityMappingActions';
export {
  createEntitySetMutate,
  createEntitySetNoMutate,
  deleteEntitySet,
  entitySetAddEntity,
  queryEntitySetItems,
  updateEntitySetItemMutate,
  updateEntitySetItemNoMutate,
  fetchEntitySet,
  queryEntitySets,
  queryEntitySetEntities,
  updateEntitySet,
} from './entitySetActions';
export {
  queryProfileExpand,
  fetchProfile,
  fetchProfileTags,
  pairwiseJudgement,
} from './profileActions';
export { fetchMessages, dismissMessage } from './messagesActions';
export {
  fetchMetadata,
  fetchStatistics,
  fetchSystemStatus,
} from './metadataActions';
export { loginWithToken, loginWithPassword, logout } from './sessionActions';
export { fetchExports, triggerQueryExport } from './exportActions';
export {
  queryBookmarks,
  createBookmark,
  deleteBookmark,
} from './bookmarkActions';

export { createAction };
export const setLocale = createAction('SET_LOCALE');
export const forceMutate = createAction('MUTATE');
