import React, { Component } from 'react';
import { connect } from 'react-redux';

import { fetchDocument } from 'src/actions';
import DualPane from 'src/components/common/DualPane';
import DocumentInfo from './DocumentInfo';
import DocumentContent from './DocumentContent';

class DocumentScreen extends Component {
  componentDidMount() {
    const { documentId } = this.props;
    this.props.fetchDocument({ id: documentId });
  }

  componentDidUpdate(prevProps) {
    const { documentId } = this.props;
    if (documentId !== prevProps.documentId) {
      this.props.fetchDocument({ id: documentId });
    }
  }

  render() {
    const { document } = this.props;
    if (document === undefined) {
      return null;
    }
    return (
      <DualPane>
        <DocumentInfo document={document} />
        <DocumentContent document={document} />
      </DualPane>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { documentId } = ownProps.match.params;
  const document = documentId !== undefined
    ? state.documentCache[documentId]
    : undefined;
  return { documentId, document };
}

export default connect(mapStateToProps, { fetchDocument })(DocumentScreen);
