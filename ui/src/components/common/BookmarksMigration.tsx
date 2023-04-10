import { FC, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NonIdealState, Button, Spinner } from '@blueprintjs/core';
import downloadFile from 'js-file-download';
import { migrateLocalBookmarks, setConfigValue } from 'actions';
import { selectLocalBookmarks } from 'selectors';

import './BookmarksMigration.scss';

function downloadBookmarks(bookmarks: Array<any>) {
  const items = bookmarks.map(({ caption, bookmarkedAt, id }, index) =>
    [
      `${index + 1}: ${caption}`,
      new Date(bookmarkedAt).toISOString(),
      new URL(`/entities/${id}`, window.location.href),
    ].join('\n')
  );

  const heading = 'Bookmarks'.toUpperCase();
  const contents = `${heading}\n\n${items.join('\n\n')}`;
  downloadFile(contents, 'bookmarks.txt');
}

const BookmarksMigration: FC = () => {
  const localBookmarks = useSelector(selectLocalBookmarks);

  const failed = localBookmarks.filter(
    (bookmark: any) =>
      bookmark.migrationAttempted === true &&
      bookmark.migrationSucceeded === false
  );

  const succeeded = localBookmarks.filter(
    (bookmark: any) =>
      bookmark.migrationAttempted === true &&
      bookmark.migrationSucceeded === false
  );

  const migratable = localBookmarks.filter(
    (bookmark: any) => bookmark.migrationAttempted !== true
  );

  const [state, setState] = useState<'LOADING' | 'ERROR' | 'DONE'>('DONE');
  const dispatch = useDispatch();

  useEffect(() => {
    if (migratable.length <= 0) {
      return;
    }

    setState('LOADING');
    migrateLocalBookmarks(migratable)(dispatch)
      .then(() => setState('DONE'))
      .catch(() => setState('ERROR'));
  }, [migratable, dispatch]);

  if (state === 'LOADING') {
    return <Spinner className="BookmarksMigration__spinner" size={100} />;
  }

  if (state === 'DONE' && failed.length <= 0) {
    return (
      <NonIdealState
        icon="star"
        title="Changes to bookmarks"
        description="We have recently rolled out enhancements for bookmarks! Bookmarks are now more reliable and sync across all your devices."
        action={
          <Button
            onClick={() => {
              // @ts-ignore
              dispatch(setConfigValue({ bookmarksMigrationCompleted: true }));
            }}
          >
            Don’t show this message again
          </Button>
        }
      />
    );
  }

  if (state === 'DONE' && failed.length >= 0) {
    return (
      <NonIdealState
        icon="warning-sign"
        title="Changes to bookmarks"
        description={
          <>
            <p>
              We have recently rolled out enhancements for bookmarks! This
              required updating bookmarks to a new storage format.
            </p>
            <p>
              <strong>
                Unfortunately, {failed.length} out of {succeeded.length}{' '}
                bookmarks could not be updated to the new format.
              </strong>
            </p>
            <p>
              Most likely that’s because the data you bookmarked has been
              removed from Aleph. Download a copy of the affected bookmarks
              to proceed.
            </p>
          </>
        }
        action={
          <Button
            icon="archive"
            onClick={() => {
              downloadBookmarks(failed);
              // @ts-ignore
              dispatch(setConfigValue({ bookmarksMigrationCompleted: true }));
            }}
          >
            Download bookmarks
          </Button>
        }
      />
    );
  }

  return (
    <NonIdealState
      icon="error"
      title="Error"
      description="There was an error loading your bookmarks."
    />
  );
};

export default BookmarksMigration;
