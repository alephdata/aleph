import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { defineMessages, injectIntl } from 'react-intl';
import { selectCollectionProcessingReport } from 'src/selectors';
import { ErrorSection, SectionLoading } from 'src/components/common';
import ProcessingJobReport from './ProcessingJobReport';

const messages = defineMessages({
  empty: {
    id: 'report.collection.empty',
    defaultMessage: 'No report available for this dataset',
  },
});

class CollectionReportMode extends React.Component {
  render() {
    const { intl, processingReport, collection } = this.props;
    if (processingReport.isLoading) {
      return <SectionLoading />;
    }

    if (processingReport.isError || !processingReport.jobs || !processingReport.jobs.length) {
      return (
        <ErrorSection
          icon="grouped-bar-chart"
          title={intl.formatMessage(messages.empty)}
        />
      );
    }

    const renderJob = (job) => (
      <ProcessingJobReport
        collection={collection}
        counter={job.i}
        key={job.job_id}
        job={job}
      />
    );

    return (
      <div className="CollectionReportMode">
        {processingReport.jobs.map(renderJob)}
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collection } = ownProps;
  return {
    processingReport: selectCollectionProcessingReport(state, collection.id),
  };
};

export default compose(withRouter, connect(mapStateToProps), injectIntl)(
  CollectionReportMode,
);
