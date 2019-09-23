import React from 'react';
import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { ButtonGroup } from '@blueprintjs/core';

import { CloseButton, DownloadButton } from 'src/components/Toolbar';
import getEntityLink from 'src/util/getEntityLink';

import './EntityToolbar.scss';


class EntityToolbar extends React.Component {
  render() {
    const { entity } = this.props;
    if (!entity || !entity.schema) {
      return null;
    }
    const isThing = entity && entity.schema.isThing();
    const isDocument = entity && entity.schema.isDocument();
    const showDownloadButton = isDocument && entity.links && entity.links.file;

    return (
      <div className="EntityToolbar">
        <ButtonGroup minimal className="EntityToolbar__buttons bp3-intent-primary">
          {isThing && (
            <Link to={getEntityLink(entity)} className="bp3-button">
              <span className="bp3-icon-share" />
              <FormattedMessage id="sidebar.open" defaultMessage="Open" />
            </Link>
          )}
          {showDownloadButton && (
            <DownloadButton document={entity} isPreview />
          )}
        </ButtonGroup>
        <CloseButton />
      </div>
    );
  }
}

export default EntityToolbar;
