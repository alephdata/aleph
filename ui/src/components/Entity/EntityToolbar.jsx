import React from 'react';
import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { ButtonGroup, Icon } from '@blueprintjs/core';

import { DownloadButton } from 'components/Toolbar';
import getEntityLink from 'util/getEntityLink';

import './EntityToolbar.scss';


class EntityToolbar extends React.Component {
  render() {
    const { entity, profile = true } = this.props;
    if (!entity || !entity.schema) {
      return null;
    }
    const isThing = entity && entity.schema.isThing();
    const isDocument = entity && entity.schema.isDocument();
    const showDownloadButton = isDocument && entity && entity.links && entity.links.file;

    return (
      <div className="EntityToolbar">
        <ButtonGroup minimal className="EntityToolbar__buttons bp3-intent-primary">
          {isThing && (
            <Link to={getEntityLink(entity, profile)} className="bp3-button">
              <Icon icon="fullscreen" className="left-icon" />
              <FormattedMessage id="sidebar.open" defaultMessage="Expand" />
            </Link>
          )}
          {showDownloadButton && (
            <DownloadButton document={entity} />
          )}
        </ButtonGroup>
      </div>
    );
  }
}

export default EntityToolbar;
