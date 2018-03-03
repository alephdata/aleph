import { get } from 'lodash';

import * as actions from 'src/actions';
import { showWarningToast } from './toast';

const errorActionTypes = [
  actions.fetchMetadata.ERROR,
  actions.fetchStatistics.ERROR,
  actions.fetchSearchResults.ERROR,
  actions.fetchNextSearchResults.ERROR,
  actions.fetchEntity.ERROR,
  actions.fetchEntityReferences.ERROR,
  actions.fetchEntityTags.ERROR,
  actions.fetchDocument.ERROR,
  actions.fetchCollection.ERROR,
  actions.queryCollections.ERROR,
  actions.fetchDocumentRecords.ERROR,
  actions.fetchNextDocumentRecords.ERROR,
];

// Middleware that after handling any action normally, shows a toast if the
// action was reporting an error.
const errorToastMiddleware = store => next => action => {
  const newState = next(action);

  if (errorActionTypes.includes(action.type)) {
    const defaultDescription = 'No clue how that happened.';
    const description = get(action, 'payload.error.message', defaultDescription);
    const message = `${action.type}: ${description}`;
    console.error(message);
    showWarningToast(message);
  }

  return newState;
};

export default errorToastMiddleware;
