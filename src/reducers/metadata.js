import { mapValues } from 'lodash';

const initialState = {
  isLoaded: false
};

const metadata = (state = initialState, action) => {
  switch (action.type) {
    case 'FETCH_METADATA_REQUEST':
      return { ...action.metadata, isLoaded: false }
    case 'FETCH_METADATA_SUCCESS':
      return { ...tweakMetadata(action.metadata), isLoaded: true }
    default:
      return state;
  }
};

export default metadata;

// Quick fix to mock more category info.
// TODO add category info to back-end.
function tweakMetadata(metadata) {
  return {
    ...metadata,
    categories: mapValues(metadata.categories, (categoryLabel, categoryId) => ({
      id: categoryId,
      label: categoryLabel,
      ui: window.location.origin + `/${categoryId}/`,
      summary: 'Bla bla some info about this category (to be added to the API).',
    })),
  };
}
