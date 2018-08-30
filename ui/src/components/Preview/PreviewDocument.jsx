import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import { fetchDocument } from 'src/actions';
import { selectEntity } from 'src/selectors';
import Preview from 'src/components/Preview/Preview';
import DocumentToolbar from 'src/components/Document/DocumentToolbar';
import DocumentInfoMode from 'src/components/Document/DocumentInfoMode';
import EntityTagsMode from 'src/components/Entity/EntityTagsMode';
import { DocumentViewer } from 'src/components/DocumentViewer';
import { DualPane, SectionLoading, ErrorSection } from 'src/components/common';
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
    const { document, previewMode = 'view' } = this.props;
    let mode = null, maximised = false;
    if (document.isError) {
      return <ErrorSection error={document.error} />
    } else if (document.id === undefined) {
      return <SectionLoading/>;
    } else if (previewMode === 'info') {
      mode = <DocumentInfoMode document={document} />;
    } else if (previewMode === 'tags') {
      mode = <EntityTagsMode entity={document} />;
      maximised = true;
    } else {
      mode = <DocumentViewer document={document} showToolbar={true} previewMode={true} />;
      maximised = true;
    }
    return (
      <Preview maximised={maximised}>
        <DocumentViewsMenu document={document}
                           activeMode={previewMode}
                           isPreview={true} />
        <DualPane.InfoPane className="with-heading">
          <DocumentToolbar document={document}
                             isPreview={true} />
          {mode}
        </DualPane.InfoPane>
      </Preview>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return { document: selectEntity(state, ownProps.previewId) };
};

PreviewDocument = connect(mapStateToProps, { fetchDocument })(PreviewDocument);
PreviewDocument = withRouter(PreviewDocument);
export default PreviewDocument;