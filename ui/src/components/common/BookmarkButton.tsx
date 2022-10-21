import { FC } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { Button, ButtonProps } from '@blueprintjs/core';

import { selectEntityBookmarked } from 'selectors';
import { createBookmark, deleteBookmark } from 'actions/bookmarkActions';

type BookmarkButtonProps = ButtonProps & {
  bookmarked: boolean;
  createBookmark: (entityId: string) => Promise<any>;
  deleteBookmark: (entityId: string) => Promise<any>;
  entityId: string;
};

const BookmarkButton: FC<BookmarkButtonProps> = ({
  entityId,
  bookmarked,
  createBookmark,
  deleteBookmark,
  ...props
}) => {
  const icon = bookmarked ? 'star' : 'star-empty';
  const label = bookmarked ? 'Remove bookmark' : 'Bookmark';

  const toggle = async () => {
    const action = bookmarked ? deleteBookmark : createBookmark;
    await action(entityId);
  };

  return (
    <Button icon={icon} onClick={toggle} {...props}>
      {label}
    </Button>
  );
};

const mapStateToProps = (state: any, ownProps: BookmarkButtonProps) => {
  const { entityId } = ownProps;
  const bookmarked = selectEntityBookmarked(state, entityId);

  return {
    bookmarked,
    createBookmark,
    deleteBookmark,
  };
};

export default compose(
  connect(mapStateToProps, { createBookmark, deleteBookmark }),
  injectIntl
)(BookmarkButton);
