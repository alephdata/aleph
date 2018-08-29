import React from 'react';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { FormattedNumber, FormattedMessage } from 'react-intl';


class CollectionDocumentsMode extends React.Component {
  render() {
    return <span>{'test'}</span>;
  }
}

// CollectionDocumentsMode = connect(mapStateToProps, {})(CollectionDocumentsMode);
export default CollectionDocumentsMode;
