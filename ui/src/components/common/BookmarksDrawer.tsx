import { FC } from 'react';
import { FormattedMessage } from 'react-intl';
import { useSelector } from 'react-redux';
import { Classes, Drawer, DrawerSize } from '@blueprintjs/core';
import { selectLocalBookmarks, selectConfigValue } from 'selectors';
import BookmarksMigration from './BookmarksMigration';
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
  const localBookmarks = useSelector(selectLocalBookmarks);
  const migrationCompleted = useSelector((state) =>
    selectConfigValue(state, 'bookmarksMigrationCompleted')
  );
  const showMigration = localBookmarks.length > 0 && !migrationCompleted;

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
          {showMigration ? (
            <BookmarksMigration />
          ) : (
            <BookmarksList onNavigate={toggleDialog} />
          )}
        </div>
      </div>
    </Drawer>
  );
};

export default BookmarksDrawer;
