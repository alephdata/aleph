import React from 'react';
import { withRouter } from 'react-router';

import DownloadButton from 'src/components/Toolbar/DownloadButton';


class ModeButtons extends React.Component {
  render() {
    const { document } = this.props;

    return (
      <div className="pt-button-group">
        <DownloadButton document={document} />
      </div>
    );
  }
}

ModeButtons = withRouter(ModeButtons);
export default ModeButtons;