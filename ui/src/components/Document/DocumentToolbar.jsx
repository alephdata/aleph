import React from 'react';
import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { ButtonGroup } from '@blueprintjs/core';

import { Toolbar, CloseButton, DownloadButton } from 'src/components/Toolbar';
import getPath from 'src/util/getPath';

class DocumentToolbar extends React.PureComponent {
  render() {
    const { document, isPreview } = this.props;

    return (
      <Toolbar className="toolbar-preview">
        <ButtonGroup>
          {isPreview && document.links && (
            <Link to={getPath(document.links.ui)} className="bp3-button button-link">
              <span className="bp3-icon-share" />
              <FormattedMessage id="sidebar.open" defaultMessage="Open" />
            </Link>
          )}
          <DownloadButton document={document} />
        </ButtonGroup>
        {isPreview && (
          <CloseButton />
        )}
      </Toolbar>
    );
  }
}

export default DocumentToolbar;
