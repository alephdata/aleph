import { FC } from 'react';
import { FormattedMessage } from 'react-intl';
import { Classes, Drawer, DrawerSize } from '@blueprintjs/core';
import BookmarksList from './BookmarksList';

import './BookmarksDrawer.scss';

type BookmarksDrawerProps = {
  isOpen: boolean;
  toggleDialog: () => void;
};

const BookmarksDrawer: FC<BookmarksDrawerProps> = ({
  isOpen,
  toggleDialog,
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
      <div className={Classes.DRAWER_BODY}>
        <div className="BookmarksDrawer__content">
          <BookmarksList onNavigate={toggleDialog} />
        </div>
      </div>
    </Drawer>
  );
};

export default BookmarksDrawer;
