import { Component } from 'react';

import {
  fetchEntity, fetchDocumentContent, fetchEntityTags, queryEntities,
} from 'src/actions';
import {
  selectEntity, selectEntityTags, selectEntitiesResult, selectDocumentContent,
} from 'src/selectors';
import { queryFolderDocuments } from 'src/queries';
import { connectedWIthRouter } from '../../screens/OAuthScreen/enhancers';


class DocumentContextLoader extends Component {
  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { documentId, document } = this.props;
    if (document.shouldLoad) {
      this.props.fetchEntity({ id: documentId });
    }

    const { content } = this.props;
    if (content.shouldLoad) {
      this.props.fetchDocumentContent({ id: documentId });
    }

    const { tags } = this.props;
    if (tags.shouldLoad) {
      this.props.fetchEntityTags({ id: documentId });
    }

    const { childrenResult, childrenQuery } = this.props;
    if (childrenResult.shouldLoad) {
      this.props.queryEntities({ query: childrenQuery });
    }
  }

  render() {
    return this.props.children;
  }
}


const mapStateToProps = (state, ownProps) => {
  const { documentId, location } = ownProps;
  const childrenQuery = queryFolderDocuments(location, documentId, undefined);
  return {
    document: selectEntity(state, documentId),
    content: selectDocumentContent(state, documentId),
    tags: selectEntityTags(state, documentId),
    childrenQuery,
    childrenResult: selectEntitiesResult(state, childrenQuery),
  };
};

export default connectedWIthRouter({
  mapStateToProps,
  mapDispatchToProps: {
    fetchEntity, fetchEntityTags, queryEntities, fetchDocumentContent,
  },
})(DocumentContextLoader);
