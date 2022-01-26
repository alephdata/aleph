import { compose } from 'redux';
import { connect } from 'react-redux';

import withRouter from 'app/withRouter'
import DocumentManager from 'components/Document/DocumentManager';
import { folderDocumentsQuery } from 'queries';


const mapStateToProps = (state, ownProps) => {
  const { document, location } = ownProps;
  // note: this is not currently conducting a search for queryText
  // because the semantics of doing so are confusing.
  return {
    collection: document.collection,
    query: folderDocumentsQuery(location, document.id),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps),
)(DocumentManager);
