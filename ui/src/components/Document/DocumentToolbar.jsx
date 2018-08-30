import React from 'react';
import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';

import { Toolbar, CloseButton, DownloadButton } from 'src/components/Toolbar';
import getPath from 'src/util/getPath';


class DocumentToolbar extends React.Component {
  render() {
    const { document, isPreview } = this.props;

    return (
      <Toolbar className='toolbar-preview'>
        {isPreview && (
          <Link to={getPath(document.links.ui)} className="pt-button button-link">
            <span className={`pt-icon-share`}/>
            <FormattedMessage id="sidebar.open" defaultMessage="Open"/>
          </Link>
        )}
        <DownloadButton isPreview={isPreview} document={document} />
        {isPreview && (
          <CloseButton />
        )}
      </Toolbar>
    );
  }
}

export default DocumentToolbar;
