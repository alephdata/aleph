import React from 'react';
import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';

import { Toolbar, CloseButton } from 'src/components/Toolbar';
import getPath from 'src/util/getPath';

/* eslint-disable */

class EntityToolbar extends React.Component {
  render() {
    const { entity, isPreview } = this.props;
    const isThing = entity && entity.schema.isThing();

    return (
      <Toolbar className="toolbar-preview">
        { isThing && isPreview && (
          <Link to={getPath(entity.links.ui)} className="bp3-button button-link">
            <span className="bp3-icon-share" />
            <FormattedMessage id="sidebar.open" defaultMessage="Open" />
          </Link>
        )}
        { isPreview && (
          <CloseButton />
        )}
      </Toolbar>
    );
  }
}

export default EntityToolbar;
