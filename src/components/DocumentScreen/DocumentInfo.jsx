import React, { Component } from 'react';

import DualPane from 'src/components/common/DualPane';

class DocumentInfo extends Component {
  render() {
    const { document } = this.props;
    const hasTitle = !!document.title;
    return (
      <DualPane.InfoPane>
        <h1>{hasTitle ? document.title : document.file_name}</h1>
        <ul>
          {hasTitle && <li>{document.file_name}</li>}
          <li>{document.schema}</li>
          <li>{document.created_at}</li>
        </ul>
      </DualPane.InfoPane>
    );
  }
}

export default DocumentInfo;
