import { connect } from 'react-redux'

import * as selectors from '../store/reducers/documents';

import DocumentList from '../components/DocumentList'

const mapStateToProps = (state) => {
  return {
    documents: selectors.getDocuments(state.documents),
    isFetching: selectors.getIsFetching(state.documents)
  };
}

const DocumentsContainer = connect(
  mapStateToProps
)(DocumentList);

export default DocumentsContainer;
