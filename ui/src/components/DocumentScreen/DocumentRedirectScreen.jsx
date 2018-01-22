import React, { PureComponent } from 'react';
import { Redirect } from 'react-router'

class DocumentRedirectScreen extends PureComponent {
  render() {
    const { documentId } = this.props.match.params;
    return <Redirect to={`/documents/${documentId}`} />;
  }
}

export default DocumentRedirectScreen;
