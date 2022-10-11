import { FC } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
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
  return (
    <Drawer
      className="BookmarksDrawer"
      title="Your Bookmarks"
      size={DrawerSize.SMALL}
      onClose={toggleDialog}
      isOpen={isOpen}
      hasBackdrop={false}
      canOutsideClickClose={true}
    >
      <div className="BookmarksDrawer__content">
        <BookmarksList bookmarks={bookmarks} />
      </div>
    </Drawer>
  );
};

const mapStateToProps = (state: any) => {
  return { bookmarks: selectBookmarks(state) };
};

export default compose(connect(mapStateToProps), injectIntl)(BookmarksDrawer);
