import { FC } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { Button, ButtonProps } from '@blueprintjs/core';
import { Entity } from '@alephdata/followthemoney';

import { selectEntityBookmarked } from 'selectors';
import { createBookmark, deleteBookmark } from 'actions/bookmarkActions';

type BookmarkButtonProps = ButtonProps & {
  bookmarked: boolean;
  createBookmark: (entity: Entity) => Promise<any>;
  deleteBookmark: (entity: Entity) => Promise<any>;
  entity: Entity;
};

const BookmarkButton: FC<BookmarkButtonProps> = ({
  entity,
  bookmarked,
  createBookmark,
  deleteBookmark,
  ...props
}) => {
  const icon = bookmarked ? 'star' : 'star-empty';
  const label = bookmarked ? 'Bookmarked' : 'Bookmark';

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
