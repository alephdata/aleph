import { compose } from 'redux';
import { connect } from 'react-redux';

import withRouter from '/src/app/withRouter.jsx';
import DocumentManager from '/src/components/Document/DocumentManager';
import { collectionDocumentsQuery } from '/src/queries.js';
import { selectCollection } from '/src/selectors.js';

const mapStateToProps = (state, ownProps) => {
  const { collectionId, location } = ownProps;
  const query = collectionDocumentsQuery(location, collectionId);

  return {
    collection: selectCollection(state, collectionId),
    query,
  };
};

export default compose(withRouter, connect(mapStateToProps))(DocumentManager);
