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
        title="We’ve updated bookmarks"
        description="Your bookmarks will now synchronize across all your devices."
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
        title="We’ve updated bookmarks"
        description={
          <>
            <p>
              In order to synchronize bookmarks across all your devices, we’ve
              updated the way your bookmarks are stored.
            </p>
            <p>
              <strong>
                Unfortunately, {failed.length} out of {succeeded.length}{' '}
                bookmarks that you had previously created could not be updated.
              </strong>
            </p>
            <p>
              The most likely reason for this is that the data you bookmarked
              has been removed from Aleph in the meantime. To proceed, download
              a copy of the affected bookmarks.
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
