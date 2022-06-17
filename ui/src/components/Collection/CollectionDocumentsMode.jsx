// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

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
