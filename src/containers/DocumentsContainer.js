import { connect } from 'react-redux'

import DocumentList from '../components/DocumentList'

const mapStateToProps = (state) => {
  return state.documents
}

const DocumentsContainer = connect(
  mapStateToProps
)(DocumentList);

export default DocumentsContainer;
