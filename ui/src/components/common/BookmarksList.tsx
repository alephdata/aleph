import { FC } from 'react';
import { Link } from 'react-router-dom';
import RelativeTime from './RelativeTime';

import './BookmarksList.scss';

type Bookmark = {
  id: string;
  caption: string;
  bookmarkedAt: number;
};

type BookmarksListProps = {
  bookmarks: Array<Bookmark>;
};

const BookmarksList: FC<BookmarksListProps> = ({ bookmarks }) => {
  return (
    <ul className="BookmarksList">
      {bookmarks.map((bookmark) => (
        <li key={bookmark.id}>
          <Link
            className="BookmarksList__caption"
            to={`/entities/${bookmark.id}`}
          >
            {bookmark.caption}
          </Link>
          <div className="BookmarksList__meta">
            {'bookmarked '}
            <RelativeTime
              date={new Date(bookmark.bookmarkedAt)}
              utcDate={null}
            />
          </div>
        </li>
      ))}
    </ul>
  );
};

export default BookmarksList;
