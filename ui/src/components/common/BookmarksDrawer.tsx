import { FC } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { FormattedMessage, injectIntl } from 'react-intl';
import { Drawer, DrawerSize } from '@blueprintjs/core';

import { selectBookmarks } from 'selectors';
import BookmarksList from './BookmarksList';

import './BookmarksDrawer.scss';

type Bookmark = {
  id: string;
  caption: string;
  bookmarkedAt: number;
};

type BookmarksDrawerProps = {
  isOpen: boolean;
  toggleDialog: () => void;
  bookmarks: Array<Bookmark>;
};

const BookmarksDrawer: FC<BookmarksDrawerProps> = ({
  isOpen,
  toggleDialog,
  bookmarks,
}) => {
  const title = (
    <FormattedMessage id="bookmarks.title" defaultMessage="Your bookmarks" />
  );

  return (
    <Drawer
      className="BookmarksDrawer"
      title={title}
      size={DrawerSize.SMALL}
      onClose={toggleDialog}
      isOpen={isOpen}
      hasBackdrop={false}
      canOutsideClickClose={true}
    >
      <div className="BookmarksDrawer__content">
        {bookmarks.length > 0 && (
          <BookmarksList bookmarks={bookmarks} onNavigate={toggleDialog} />
        )}

        {bookmarks.length <= 0 && (
          <p>
            <FormattedMessage
              id="bookmarks.empty"
              defaultMessage="You haven’t bookmarked anything yet. Add any entity to your bookmarks to get started."
            />
          </p>
        )}
      </div>
    </Drawer>
  );
};

const mapStateToProps = (state: any) => {
  return { bookmarks: selectBookmarks(state) };
};

export default compose(connect(mapStateToProps), injectIntl)(BookmarksDrawer);
