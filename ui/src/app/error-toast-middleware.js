import { get } from 'lodash';

import * as actions from 'actions';
import { showWarningToast } from './toast';

const errorActionTypes = [
  actions.fetchMetadata.ERROR,
  actions.fetchStatistics.ERROR,
  // actions.queryEntities.ERROR,
  // actions.queryCollections.ERROR,
  // actions.fetchEntity.ERROR,
  // actions.fetchEntityReferences.ERROR,
  // actions.fetchEntityTags.ERROR,
  // actions.fetchDocument.ERROR,
  // actions.fetchCollection.ERROR,
  // actions.queryDocumentRecords.ERROR,
  actions.deleteCollection.ERROR,
  actions.updateCollection.ERROR,
  actions.updateCollectionPermissions.ERROR,
  actions.deleteAlert.ERROR,
  actions.createAlert.ERROR,
  actions.updateRole.ERROR,
];

// Middleware that after handling any action normally, shows a toast if the
// action was reporting an error.
const errorToastMiddleware = () => (next) => (action) => {
  const newState = next(action);

  if (errorActionTypes.includes(action.type)) {
    const defaultDescription = "He's dead, Jim.";
    const statusCode = get(action, 'payload.error.response.status');
    if (statusCode !== 403 && statusCode !== 401) {
      const description = get(
        action,
        'payload.error.message',
        defaultDescription
      );
      showWarningToast(description);
      // console.error(action.type, description);
    }
  }

  return newState;
};

export default errorToastMiddleware;
