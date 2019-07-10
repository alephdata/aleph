import React from 'react';
import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { ButtonGroup } from '@blueprintjs/core';

import { Toolbar, CloseButton, DownloadButton } from 'src/components/Toolbar';
import getEntityLink from 'src/util/getEntityLink';


class EntityToolbar extends React.Component {
  render() {
    const { entity, isPreview } = this.props;
    const isThing = entity && entity.schema.isThing();
    const isDocument = entity && entity.schema.isDocument();
    const showDownloadButton = isDocument && entity.links && entity.links.file;

    if (!isPreview && !showDownloadButton) {
      return null;
    }

    return (
      <Toolbar className="toolbar-preview">
        <ButtonGroup>
          {isPreview && isThing && (
            <Link to={getEntityLink(entity)} className="bp3-button button-link">
              <span className="bp3-icon-share" />
              <FormattedMessage id="sidebar.open" defaultMessage="Open" />
            </Link>
          )}
          {showDownloadButton && (
            <DownloadButton document={entity} />
          )}
        </ButtonGroup>
        { isPreview && (
          <CloseButton />
        )}
      </Toolbar>
    );
  }
}

export default EntityToolbar;
