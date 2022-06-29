{/*
SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.

SPDX-License-Identifier: MIT
*/}

import { compose } from 'redux';
import { connect } from 'react-redux';

import withRouter from 'app/withRouter'
import DocumentManager from 'components/Document/DocumentManager';
import { collectionDocumentsQuery } from 'queries';
import { selectCollection } from 'selectors';


const mapStateToProps = (state, ownProps) => {
  const { collectionId, location } = ownProps;
  const query = collectionDocumentsQuery(location, collectionId);

  return {
    collection: selectCollection(state, collectionId),
    query
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps),
)(DocumentManager);
