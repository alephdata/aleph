// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

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
