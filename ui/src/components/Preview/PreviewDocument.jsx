import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import { queryEntitySimilar } from 'src/queries';
import { fetchDocument, fetchEntityTags, queryEntities } from 'src/actions';
import { selectEntity, selectEntityTags, selectEntitiesResult } from 'src/selectors';
import Preview from 'src/components/Preview/Preview';
import DocumentToolbar from 'src/components/Document/DocumentToolbar';
import DocumentInfoMode from 'src/components/Document/DocumentInfoMode';
import EntityTagsMode from 'src/components/Entity/EntityTagsMode';
import EntitySimilarMode from 'src/components/Entity/EntitySimilarMode';
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
    const { document, previewId } = this.props;
    if (!document.isLoading) {
      this.props.fetchDocument({ id: previewId });
    }
    
    const { tagsResult } = this.props;
    if (tagsResult.shouldLoad) {
      this.props.fetchEntityTags({ id: previewId });
    }

    const { similarQuery, similarResult } = this.props;
    if (similarResult.shouldLoad) {
      this.props.queryEntities({query: similarQuery});
    }
  }

  render() {
    const { document, previewMode = 'view' } = this.props;
    let mode = null, maximised = false;
    if (document.isError) {
      mode = <ErrorSection error={document.error} />
    } else if (document.id === undefined) {
      mode = <SectionLoading/>;
    } else if (previewMode === 'info') {
      mode = <DocumentInfoMode document={document} />;
    } else if (previewMode === 'tags') {
      mode = <EntityTagsMode entity={document} />;
      maximised = true;
    } else if (previewMode === 'similar') {
      mode = <EntitySimilarMode entity={document} />;
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
  const { previewId, location } = ownProps;
  const similarQuery = queryEntitySimilar(location, previewId);
  return {
    document: selectEntity(state, previewId),
    tagsResult: selectEntityTags(state, previewId),
    similarQuery: similarQuery,
    similarResult: selectEntitiesResult(state, similarQuery)
  };
};

PreviewDocument = connect(mapStateToProps, { fetchDocument, fetchEntityTags, queryEntities })(PreviewDocument);
PreviewDocument = withRouter(PreviewDocument);
export default PreviewDocument;