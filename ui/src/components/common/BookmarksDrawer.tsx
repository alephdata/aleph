import { FC } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import downloadFile from 'js-file-download';
import {
  FormattedMessage,
  injectIntl,
  useIntl,
  defineMessage,
} from 'react-intl';
import { Button, Drawer, DrawerSize } from '@blueprintjs/core';

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

type DownloadButtonProps = Button['props'] & {
  bookmarks: Array<Bookmark>;
};

const downloadHeading = defineMessage({
  id: 'bookmarks.download.heading',
  defaultMessage: 'Your bookmarks',
});

const DownloadButton: FC<DownloadButtonProps> = ({
  bookmarks,
  ...buttonProps
}) => {
  const { formatDate, formatTime, formatMessage } = useIntl();

  const download = () => {
    const items = bookmarks.map(({ caption, bookmarkedAt, id }) =>
      [
        caption,
        `${formatDate(bookmarkedAt)} ${formatTime(bookmarkedAt)}`,
        new URL(`/entities/${id}`, window.location.href),
      ].join('\n')
    );

    const heading = formatMessage(downloadHeading).toUpperCase();
    const contents = `${heading}\n\n${items.join('\n\n')}`;
    downloadFile(contents, 'bookmarks.txt');
  };

  return (
    <Button onClick={download} {...buttonProps}>
      <FormattedMessage
        id="bookmarks.download"
        defaultMessage="Download your bookmarks"
      />
    </Button>
  );
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
        <DownloadButton icon="archive" bookmarks={bookmarks} />
      </div>
    </Drawer>
  );
};

const mapStateToProps = (state: any) => {
  return { bookmarks: selectBookmarks(state) };
};

export default compose(connect(mapStateToProps), injectIntl)(BookmarksDrawer);
