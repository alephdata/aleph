import React from 'react';
import { Link } from 'react-router-dom';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { ButtonGroup, Classes, Icon } from '@blueprintjs/core';
import c from 'classnames';

import { BookmarkButton } from 'components/common';
import { DialogToggleButton, DownloadButton } from 'components/Toolbar';
import getEntityLink from 'util/getEntityLink';

import './EntityToolbar.scss';
import EntitySetSelector from 'components/EntitySet/EntitySetSelector';
import { EntityAddToButton } from 'components/Toolbar/EntityAddToButton';

const messages = defineMessages({
  add_to: {
    id: 'entity.viewer.add_to',
    defaultMessage: 'Add to...',
  },
});

class EntityToolbar extends React.Component {
  render() {
    const { entity, profile = true, intl } = this.props;

    if (!entity || !entity.schema) {
      return null;
    }
    const isThing = entity && entity.schema.isThing();
    const isDocument = entity && entity.schema.isDocument();
    const showDownloadButton =
      isDocument && entity && entity.links && entity.links.file;

    return (
      <div className="EntityToolbar">
        <ButtonGroup
          minimal
          className={c('EntityToolbar__buttons', Classes.INTENT_PRIMARY)}
        >
          {isThing && (
            <Link
              to={getEntityLink(entity, profile)}
              className={Classes.BUTTON}
            >
              <Icon icon="fullscreen" className="left-icon" />
              <FormattedMessage id="sidebar.open" defaultMessage="Expand" />
            </Link>
          )}
          {showDownloadButton && <DownloadButton document={entity} />}
          <BookmarkButton entity={entity} />
          {entity?.collection?.writeable && (
            <>
              <EntityAddToButton
                entity={[entity]}
                collection={entity.collection}
                schema={entity.schema}
              />
            </>
          )}
        </ButtonGroup>
      </div>
    );
  }
}

export default injectIntl(EntityToolbar);
