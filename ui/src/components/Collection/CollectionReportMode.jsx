import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { defineMessages, injectIntl } from 'react-intl';
import { fetchCollectionReport } from 'src/actions';
import { selectCollectionReport } from 'src/selectors';
import { ErrorSection, SectionLoading } from 'src/components/common';
import CollectionJobReport from './CollectionJobReport';

const messages = defineMessages({
  empty: {
    id: 'report.collection.empty',
    defaultMessage: 'No report available for this dataset',
  },
});

class CollectionReportMode extends React.Component {
  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { collection, report } = this.props;
    if (report.shouldLoad) {
      this.props.fetchCollectionReport(collection);
    }
  }

  render() {
    const { intl, report, collection } = this.props;
    if (report.isLoading) {
      return <SectionLoading />;
    }

    if (report.isError || !report.jobs || !report.jobs.length) {
      return (
        <ErrorSection
          icon="grouped-bar-chart"
          title={intl.formatMessage(messages.empty)}
        />
      );
    }

    const renderJob = (job) => (
      <CollectionJobReport collection={collection} counter={job.i} key={job.job_id} job={job} />
    );

    return (
      <div className="CollectionReportMode">
        {report.jobs.map(renderJob)}
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collection } = ownProps;
  return {
    report: selectCollectionReport(state, collection.id),
  };
};

const mapDispatchToProps = { fetchCollectionReport };

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl,
)(CollectionReportMode);
