import { Component } from 'react';
import { connect } from 'react-redux';

import { fetchDocument, fetchDocumentContent, fetchEntityTags, queryEntities } from 'src/actions';
import { selectEntity, selectEntityTags, selectDocumentContent } from 'src/selectors';


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

    const { content } = this.props;
    if (content.shouldLoad) {
      this.props.fetchDocumentContent({ id: documentId });
    }

    const { tags } = this.props;
    if (tags.shouldLoad) {
      this.props.fetchEntityTags({ id: documentId });
    }
  }

  render() {
    return this.props.children;
  }
}


const mapStateToProps = (state, ownProps) => {
  const { documentId } = ownProps;
  return {
    document: selectEntity(state, documentId),
    content: selectDocumentContent(state, documentId),
    tags: selectEntityTags(state, documentId)
  };
};

DocumentContextLoader = connect(mapStateToProps, { fetchDocument, fetchEntityTags, queryEntities, fetchDocumentContent })(DocumentContextLoader);
export default DocumentContextLoader;
