import React from 'react';
import { connect } from 'react-redux';
import { NonIdealState } from '@blueprintjs/core';

import { fetchDocument } from 'src/actions';
import { selectEntity } from 'src/selectors';
import { DocumentInfo } from 'src/components/Document';
import { DocumentViewer } from 'src/components/DocumentViewer';
import { SectionLoading } from 'src/components/common';


class PreviewDocument extends React.Component {

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate(prevProps) {
    if (this.props.previewId !== prevProps.previewId) {
      this.fetchIfNeeded();
    }
  }

  fetchIfNeeded() {
    this.props.fetchDocument({ id: this.props.previewId });
  }

  render() {
    const { document, maximised } = this.props;

    console.log('render PreviewDocument');

    if (document && document.error) {
      return <NonIdealState
          title={document.error}
      />
    }

    if (!document || !document.id) {
      return <SectionLoading/>;
    }

    if (maximised) {
      return <DocumentViewer document={document}
                             toggleMaximise={this.props.toggleMaximise}
                             showToolbar={true}
                             previewMode={true} />;
    }

    return <DocumentInfo document={document}
                         toggleMaximise={this.props.toggleMaximise}
                         showToolbar={true} />;
  }
}

const mapStateToProps = (state, ownProps) => {
  return { document: selectEntity(state, ownProps.previewId) };
};

PreviewDocument = connect(mapStateToProps, { fetchDocument })(PreviewDocument);
export default PreviewDocument;