import React from 'react';
import { connect } from 'react-redux';

import { fetchDocument } from 'src/actions';
import { selectEntity } from 'src/selectors';
import { DocumentInfo } from 'src/components/Document';
import { DocumentViewer } from 'src/components/DocumentViewer';
import { SectionLoading, ErrorSection } from 'src/components/common';


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
    const { document } = this.props;
    if (!document.isLoading) {
      this.props.fetchDocument({ id: this.props.previewId });
    }
  }

  render() {
    const { document, maximised } = this.props;
    if (document.isError) {
      return <ErrorSection error={document.error} />
    }
    if (document.id === undefined) {
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

PreviewDocument = connect(mapStateToProps, { fetchDocument }, null, { pure: false })(PreviewDocument);
export default PreviewDocument;