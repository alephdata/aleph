import { FC } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Button, ButtonProps } from '@blueprintjs/core';
import { Entity } from '@alephdata/followthemoney';

import {
  selectEntityBookmarked,
  selectExperimentalBookmarksFeatureEnabled,
} from 'selectors';
import { createBookmark, deleteBookmark } from 'actions/bookmarkActions';

type BookmarkButtonProps = ButtonProps & {
  bookmarked: boolean;
  entity: Entity;
  enabled: boolean;
  createBookmark: (entity: Entity) => Promise<any>;
  deleteBookmark: (entity: Entity) => Promise<any>;
};

const BookmarkButton: FC<BookmarkButtonProps> = ({
  entity,
  bookmarked,
  enabled,
  createBookmark,
  deleteBookmark,
  ...props
}) => {
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
    await action(entity);
  };

  return (
    <Button icon={icon} onClick={toggle} {...props}>
      {label}
    </Button>
  );
};

const mapStateToProps = (state: any, ownProps: BookmarkButtonProps) => {
  const { entity } = ownProps;
  const bookmarked = selectEntityBookmarked(state, entity);
  const enabled = selectExperimentalBookmarksFeatureEnabled(state);

  return { bookmarked, enabled };
};

export default compose(
  connect(mapStateToProps, { createBookmark, deleteBookmark }),
  injectIntl
)(BookmarkButton);
