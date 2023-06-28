import { FC } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import { Button, ButtonProps } from '@blueprintjs/core';
import { Entity } from '@alephdata/followthemoney';

import { selectExperimentalBookmarksFeatureEnabled } from 'selectors';
import { createBookmark, deleteBookmark } from 'actions/bookmarkActions';

type BookmarkButtonProps = ButtonProps & {
  entity: Entity & { bookmarked: boolean };
};

const BookmarkButton: FC<BookmarkButtonProps> = ({ entity, ...props }) => {
  const dispatch = useDispatch();
  const enabled = useSelector(selectExperimentalBookmarksFeatureEnabled);
  const { bookmarked } = entity;

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
    if (bookmarked) {
      await deleteBookmark(entity)(dispatch);
    } else {
      await createBookmark(entity)(dispatch);
    }
  };

  return (
    <Button icon={icon} onClick={toggle} {...props}>
      {label}
    </Button>
  );
};

export default BookmarkButton;
