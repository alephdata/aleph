import { FC, useState } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Intent, Button, ButtonProps } from '@blueprintjs/core';
import { Popover2 as Popover, Classes } from '@blueprintjs/popover2';
import { Entity } from '@alephdata/followthemoney';

import {
  selectEntityBookmarked,
  selectExperimentalBookmarksFeatureEnabled,
} from 'selectors';
import { createBookmark, deleteBookmark } from 'actions/bookmarkActions';
import { setConfigValue } from 'actions/configActions';

type BookmarkButtonProps = ButtonProps & {
  bookmarked: boolean;
  entity: Entity;
  enabled: boolean;
  showWarning: boolean;
  createBookmark: (entity: Entity) => Promise<any>;
  deleteBookmark: (entity: Entity) => Promise<any>;
  setConfigValue: (payload: object) => any;
};

const BookmarkButton: FC<BookmarkButtonProps> = ({
  entity,
  bookmarked,
  enabled,
  showWarning,
  createBookmark,
  deleteBookmark,
  setConfigValue,
  ...props
}) => {
  const [showPopover, setShowPopover] = useState(false);

  if (!enabled) {
    return null;
  }

  const icon = bookmarked ? 'star' : 'star-empty';
  const label = bookmarked ? (
    <FormattedMessage id="bookmarks.bookmarked" defaultMessage="Bookmarked" />
  ) : (
    <FormattedMessage id="bookmarks.bookmark" defaultMessage="Bookmark" />
  );

  const toggle = async () => {
    const action = bookmarked ? deleteBookmark : createBookmark;

    if (!bookmarked && showWarning) {
      setShowPopover(true);
    }

    await action(entity);
  };

  const popoverContent = (
    <>
      <p>
        <FormattedMessage
          id="bookmarks.popover.line1"
          defaultMessage="Yay, you found the new bookmark button! 🎉"
        />
      </p>
      <p>
        <FormattedMessage
          id="bookmarks.popover.line2"
          defaultMessage="This is still an <strong>experimental feature</strong>. Bookmarks are only stored in your browser. If you delete your browsing data or switch devices, you may lose access to your bookmarks."
          values={{ strong: (chunks) => <strong>{chunks}</strong> }}
        />
      </p>
      <Button
        fill
        intent={Intent.PRIMARY}
        onClick={() => {
          setConfigValue({ bookmarksWarningDismissed: true });
          setShowPopover(false);
        }}
      >
        <FormattedMessage
          id="bookmarks.popover.confirm"
          defaultMessage="Okay, I understand!"
        />
      </Button>
    </>
  );

  return (
    <Popover
      content={popoverContent}
      placement="bottom"
      isOpen={showPopover}
      popoverClassName={Classes.POPOVER2_CONTENT_SIZING}
    >
      <Button icon={icon} onClick={toggle} {...props}>
        {label}
      </Button>
    </Popover>
  );
};

const mapStateToProps = (state: any, ownProps: BookmarkButtonProps) => {
  const { entity } = ownProps;
  const bookmarked = selectEntityBookmarked(state, entity);
  const enabled = selectExperimentalBookmarksFeatureEnabled(state);
  const showWarning = !state.config.bookmarksWarningDismissed;

  return {
    bookmarked,
    enabled,
    showWarning,
  };
};

export default compose(
  connect(mapStateToProps, { createBookmark, deleteBookmark, setConfigValue }),
  injectIntl
)(BookmarkButton);
