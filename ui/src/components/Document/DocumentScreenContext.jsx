import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from "react-router";

import Screen from 'src/components/Screen/Screen';
import DocumentToolbar from 'src/components/Document/DocumentToolbar';
import DocumentInfoMode from 'src/components/Document/DocumentInfoMode';
import DocumentViewsMenu from 'src/components/ViewsMenu/DocumentViewsMenu';
import LoadingScreen from 'src/components/Screen/LoadingScreen';
import ErrorScreen from 'src/components/Screen/ErrorScreen';
import { DualPane } from 'src/components/common';
import { queryEntitySimilar } from 'src/queries';
import { fetchDocument, fetchEntityTags, queryEntities } from 'src/actions';
import { selectEntity, selectEntityTags, selectEntitiesResult } from 'src/selectors';


class DocumentScreenContext extends Component {
  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate(prevProps) {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { documentId, document } = this.props;
    if (document.shouldLoad) {
      this.props.fetchDocument({ id: documentId });
    }

    const { tagsResult } = this.props;
    if (tagsResult.shouldLoad) {
      this.props.fetchEntityTags({ id: documentId });
    }

    const { similarQuery, similarResult } = this.props;
    if (similarResult.shouldLoad) {
      this.props.queryEntities({query: similarQuery});
    }
  }

  render() {
    const { document, activeMode } = this.props;
    if (document.isError) {
      return <ErrorScreen error={document.error} />;
    }
    if (document.shouldLoad || document.isLoading) {
      return <LoadingScreen />;
    }

    return (
      <Screen title={document.name}>
        <DualPane>
          <DualPane.ContentPane className='view-menu-flex-direction'>
            <DocumentViewsMenu document={document}
                               activeMode={activeMode}
                               isPreview={false}/>
            <div>
              {this.props.children}
            </div>
          </DualPane.ContentPane>
          <DualPane.InfoPane className="with-heading">
            <DocumentToolbar document={document} isPreview={false} />
            <DocumentInfoMode document={document} isPreview={false} />
          </DualPane.InfoPane>
        </DualPane>
      </Screen>
    );
  }
}


const mapStateToProps = (state, ownProps) => {
  const { documentId, location } = ownProps;
  const similarQuery = queryEntitySimilar(location, documentId);
  return {
    document: selectEntity(state, documentId),
    tagsResult: selectEntityTags(state, documentId),
    similarQuery: similarQuery,
    similarResult: selectEntitiesResult(state, similarQuery)
  };
};

DocumentScreenContext = connect(mapStateToProps, { fetchDocument, fetchEntityTags, queryEntities })(DocumentScreenContext);
DocumentScreenContext = withRouter(DocumentScreenContext);
export default (DocumentScreenContext);
