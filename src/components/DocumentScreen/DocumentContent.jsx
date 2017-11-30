import React, { Component } from 'react';

import DualPane from 'src/components/common/DualPane';

class DocumentContent extends Component {
  render() {
    const { document } = this.props;
    return (
      <DualPane.ContentPane>
        <h1>{document.file_name}</h1>
      </DualPane.ContentPane>
    );
  }
}

export default DocumentContent;
