import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import { fetchDocument } from 'src/actions';
import { selectEntity } from 'src/selectors';
import Preview from 'src/components/Preview/Preview';
import { DocumentInfo } from 'src/components/Document';
import { DocumentViewer } from 'src/components/DocumentViewer';
import { SectionLoading, ErrorSection } from 'src/components/common';
import DocumentViewsMenu from "../ViewsMenu/DocumentViewsMenu";


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
    const { document, parsedHash } = this.props;
    if (document.isError) {
      return <ErrorSection error={document.error} />
    }
    if (document.id === undefined) {
      return <SectionLoading/>;
    }
    if (parsedHash['mode'] === 'info') {
      return <Preview maximised={false}>
        <DocumentViewsMenu document={document} isPreview={true}/>
        <DocumentInfo document={document} showToolbar={true} />
      </Preview>;
    }
    return <Preview maximised={true}>
      <DocumentViewsMenu document={document} isPreview={true}/>
      <DocumentViewer document={document}
                           showToolbar={true}
                           previewMode={true} />
      </Preview>;
  }
}

const mapStateToProps = (state, ownProps) => {
  return { document: selectEntity(state, ownProps.previewId) };
};

PreviewDocument = connect(mapStateToProps, { fetchDocument })(PreviewDocument);
PreviewDocument = withRouter(PreviewDocument);
export default PreviewDocument;