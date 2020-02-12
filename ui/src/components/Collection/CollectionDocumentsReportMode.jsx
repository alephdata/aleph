import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import ReportManager from 'src/components/ProcessingReport/ReportManager';
import { queryDocumentReports } from 'src/queries';


class CollectionDocumentsReportMode extends React.Component {
  render() {
    const { collection, query } = this.props;
    return <ReportManager query={query} collection={collection} />;
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collection, location } = ownProps;
  return {
    query: queryDocumentReports(location, collection.foreign_id),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps),
)(CollectionDocumentsReportMode);
