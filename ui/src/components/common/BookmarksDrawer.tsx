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
import { Button, Drawer, DrawerSize, Callout, Intent } from '@blueprintjs/core';

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
        defaultMessage="Download bookmarks"
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
        <Callout intent={Intent.WARNING} icon={null}>
          <p>
            <strong>
              <FormattedMessage
                id="bookmarks.warning.heading"
                defaultMessage="Bookmarks are an experimental feature."
              />
            </strong>
          </p>
          <p>
            <FormattedMessage
              id="bookmarks.warning.text"
              defaultMessage="Bookmarks are only stored in your browser. If you delete your browsing data or switch devices, you may lose access to your bookmarks. You can download your bookmarks at any time."
            />
          </p>
        </Callout>

        {bookmarks.length > 0 && (
          <>
            <DownloadButton icon="archive" fill bookmarks={bookmarks} />
            <BookmarksList bookmarks={bookmarks} onNavigate={toggleDialog} />
          </>
        )}

        {bookmarks.length <= 0 && (
          <Callout intent={Intent.PRIMARY} icon={null}>
            <FormattedMessage
              id="bookmarks.empty"
              defaultMessage="You haven’t bookmarked anything yet. Add documents or entities such as people or companies to your bookmarks to easily get back to them later."
            />
          </Callout>
        )}
      </div>
    </Drawer>
  );
};

const mapStateToProps = (state: any) => {
  return { bookmarks: selectBookmarks(state) };
};

export default compose(connect(mapStateToProps), injectIntl)(BookmarksDrawer);
