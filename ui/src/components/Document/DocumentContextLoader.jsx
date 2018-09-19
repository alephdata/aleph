import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from "react-router";

import { queryEntitySimilar } from 'src/queries';
import { fetchDocument, fetchEntityTags, queryEntities } from 'src/actions';
import { selectEntity, selectEntityTags, selectEntitiesResult } from 'src/selectors';


class DocumentContextLoader extends Component {
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
    return <React.Fragment>{this.props.children}</React.Fragment>;
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

DocumentContextLoader = connect(mapStateToProps, { fetchDocument, fetchEntityTags, queryEntities })(DocumentContextLoader);
DocumentContextLoader = withRouter(DocumentContextLoader);
export default DocumentContextLoader;
