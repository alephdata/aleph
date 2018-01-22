import React, { Component } from 'react';
import { Redirect } from 'react-router'

class DocumentRedirectScreen extends Component {
  render() {
    const { documentId } = this.props.match.params;
    return <Redirect to={`/documents/${documentId}`} />;
  }
}

export default DocumentRedirectScreen;
