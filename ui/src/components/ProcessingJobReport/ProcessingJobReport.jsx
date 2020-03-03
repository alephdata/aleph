import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router';
import { injectIntl } from 'react-intl';
import { Button } from '@blueprintjs/core/';
import { Date } from 'src/components/common';
import ProcessingJobReportDeleteDialog from 'src/dialogs/ProcessingJobReportDeleteDialog/ProcessingJobReportDeleteDialog';
import { processingTaskReportsQuery } from 'src/queries';
import ProcessingJobReportTable from './ProcessingJobReportTable';
import StatusTag from './StatusTag';
import { jumpToDetails } from './util';

import './ProcessingJobReport.scss';

const renderDate = (dateString) => <Date value={dateString} showTime />;

class ProcessingJobReport extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      analyzeIsOpen: false,
      deleteIsOpen: false,
    };
    this.toggleAnalyze = this.toggleAnalyze.bind(this);
    this.toggleDelete = this.toggleDelete.bind(this);
    this.getJumpToContext = this.getJumpToContext.bind(this);
    this.viewDetails = this.viewDetails.bind(this);
  }

  getJumpToContext() {
    const { query, history, location } = this.props;
    const context = { job: this.props.job.job_id };
    return { query, history, location, context };
  }

  toggleAnalyze() {
    this.setState(({ analyzeIsOpen }) => ({ analyzeIsOpen: !analyzeIsOpen }));
  }

  toggleDelete() {
    this.setState(({ deleteIsOpen }) => ({ deleteIsOpen: !deleteIsOpen }));
  }

  viewDetails() {
    jumpToDetails(this.getJumpToContext());
  }

  renderActions() {
    const { finished } = this.props.job;
    return (
      <>
        <Button icon="info-sign" text="Details" onClick={this.viewDetails} />
        <Button
          icon={finished ? 'automatic-updates' : 'cross'}
          text={finished ? 'Re-run' : 'Stop'}
          intent={finished ? null : 'danger'}
          onClick={finished ? this.toggleAnalyze : null}
        />
        <Button
          icon="delete"
          text="Delete this report"
          onClick={this.toggleDelete}
        />
      </>
    );
  }

  renderInvocationMessage() {
    const { invocation } = this.props.job;
    if (invocation === 'reprocess') {
      return 'Triggered via "Re-process" in the Aleph-frontend';
    }
    return 'Trigerred via the `crawldir` cli command';
  }

  render() {
    const { job, counter } = this.props;
    const jobName = `Job #${counter} (${job.invocation})`;

    return (
      <div className="ProcessingJobReport">
        {this.state.deleteIsOpen && (
          <ProcessingJobReportDeleteDialog
            jobId={job.job_id}
            isOpen={this.state.deleteIsOpen}
            toggleDialog={this.toggleDelete}
          />
        )}
        <div className="ProcessingJobReport__heading">
          <h2 className="ProcessingJobReport__heading__text">{jobName}</h2>
          <span className="ProcessingJobReport__heading__meta">
            {this.renderInvocationMessage()}
            <span className="ProcessingJobReport__heading__date">
              Started at:
              {renderDate(job.start_at)}
            </span>
            <span className="ProcessingJobReport__heading__date">
              {job.finished ? 'Finished at:' : 'Last activity:'}
              {renderDate(job.end_at)}
            </span>
          </span>
          <div className="ProcessingJobReport__heading__control">
            <span className="ProcessingJobReport__heading__status">
              <StatusTag finished={job.finished} errors={job.errors} large />
            </span>
            <span className="ProcessingJobReport__heading__actions">
              {this.renderActions()}
            </span>
          </div>
        </div>
        <div className="ProcessingJobReport__table">
          <ProcessingJobReportTable
            operations={job.operations}
            viewDetails={this.viewDetails}
            jumpToContext={this.getJumpToContext()}
          />
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collection, location } = ownProps;
  return {
    query: processingTaskReportsQuery(location, collection.foreign_id),
  };
};

export default compose(withRouter, connect(mapStateToProps), injectIntl)(
  ProcessingJobReport,
);
