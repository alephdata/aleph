import { FC, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Callout, Intent, Spinner } from '@blueprintjs/core';
import { FormattedMessage } from 'react-intl';
import RelativeTime from './RelativeTime';
import { selectBookmarksResult } from 'selectors';
import { queryBookmarks } from 'actions';
import Query from 'app/Query';
import { QueryInfiniteLoad } from 'components/common';

import './BookmarksList.scss';

type BookmarksListProps = {
  onNavigate: () => void;
};

const BookmarksList: FC<BookmarksListProps> = ({ onNavigate }) => {
  const dispatch = useDispatch();
  const query = useMemo(() => new Query('bookmarks', {}), []);
  const result = useSelector((state) => selectBookmarksResult(state, query));
  const loadBookmarks = useCallback(
    (payload: any) => queryBookmarks(payload)(dispatch),
    [dispatch]
  );
  const shouldLoad = result.shouldLoad;

  useEffect(() => {
    if (shouldLoad) {
      loadBookmarks({ query });
    }
  }, [loadBookmarks, shouldLoad, query]);

  if (!result.status && result.isPending) {
    return <Spinner className="BookmarksList__spinner" size={100} />;
  }

  if (result.total <= 0) {
    return (
      <Callout intent={Intent.PRIMARY} icon={null}>
        <FormattedMessage
          id="bookmarks.empty"
          defaultMessage="You haven’t bookmarked anything yet. Add documents or entities such as people or companies to your bookmarks to easily get back to them later."
        />
      </Callout>
    );
  }

  return (
    <>
      <ul className="BookmarksList">
        {result.results.map((bookmark: any) => (
          <li key={bookmark.entity.id}>
            <Link
              className="BookmarksList__caption"
              to={`/entities/${bookmark.entity.id}`}
              onClick={onNavigate}
            >
              {bookmark.entity.getCaption()}
            </Link>
            <div className="BookmarksList__meta">
              {'bookmarked '}
              <RelativeTime
                date={new Date(bookmark.created_at)}
                utcDate={null}
              />
            </div>
          </li>
        ))}
      </ul>
      <QueryInfiniteLoad
        query={query}
        result={result}
        fetch={loadBookmarks}
        scrollableAncestor={null}
      />
    </>
  );
};

export default BookmarksList;
