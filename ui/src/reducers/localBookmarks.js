// TODO: Remove file after deadline
// See https://github.com/alephdata/aleph/issues/2864

import { createReducer } from 'redux-act';
import { migrateLocalBookmarks } from 'actions';

const initialState = [];

export default createReducer(
  {
    [migrateLocalBookmarks.COMPLETE]: (state, { bookmarks, response }) => {
      const localBookmarks = new Map(
        state.map((bookmark) => [bookmark.id, bookmark])
      );
      const errors = response.data.errors;

      for (const bookmark of bookmarks) {
        if (!localBookmarks.has(bookmark.id)) {
          continue;
        }

        const localBookmark = localBookmarks.get(bookmark.id);
        localBookmarks.set(bookmark.id, {
          ...localBookmark,
          migrationAttempted: true,
          migrationSucceeded: !errors.includes(bookmark.id),
        });
      }

      return [...localBookmarks.values()];
    },
  },
  initialState
);
