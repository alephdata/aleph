import React, { PureComponent } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { injectIntl } from 'react-intl';
import queryString from 'query-string';
import { Button, Tag } from '@blueprintjs/core/';
import { Count, Date } from 'src/components/common';
import JobReportDeleteDialog from 'src/components/ProcessingReport/JobReportDeleteDialog';
import { queryDocumentReports } from 'src/queries';
import CollectionAnalyzeAlert from './CollectionAnalyzeAlert';

import './CollectionJobReport.scss';

const REPORTS_TYPE = 'Reports';

const getJumpToQuery = ({ query, context }) => {
  let newQuery = query.clone();
  // eslint-disable-next-line
  Object.keys(context).map((k) => {
    newQuery = newQuery.setFilter(k, context[k]);
  });
  return newQuery;
};

const jumpToDetails = ({ query, context, location, history }) => {
  const newQuery = getJumpToQuery({ query, context });
  const hash = queryString.parse(location.hash);
  hash.type = REPORTS_TYPE;
  history.push({
    pathname: location.pathname,
    search: newQuery.toLocation(),
    hash: queryString.stringify(hash),
  });
};

const renderDate = (dateString) => <Date value={dateString} showTime />;

const renderState = (finished) => (
  <Tag intent={finished ? 'success' : 'warning'} large>
    {finished ? 'Finished' : 'Running'}
  </Tag>
);

const renderStatus = ({ name, count }) => (
  <div key={name} className="CollectionStageReport__status">
    <span className="CollectionStageReport__status-name">
      <strong>
        {name}
        :
      </strong>
      {count}
      Documents
    </span>
  </div>
);

class StageReport extends PureComponent {
  constructor(props) {
    super(props);
    this.viewDetails = this.viewDetails.bind(this);
  }

  viewDetails() {
    const { stage, jumpToContext } = this.props;
    let { context } = jumpToContext;
    context = { stage: stage.name, ...context };
    jumpToDetails({ ...jumpToContext, context });
  }

  renderActions() {
    const { finished } = this.props.stage;
    return (
      <>
        <Button icon="info-sign" text="Details" onClick={this.viewDetails} />
        <Button
          icon={finished ? 'automatic-updates' : 'cross'}
          text={finished ? 'Re-run' : 'Stop'}
          intent={finished ? null : 'danger'}
        />
      </>
    );
  }

  render() {
    const {
      name,
      count,
      start_at: startAt,
      end_at: endAt,
      status,
      finished,
      has_errors: hasErrors,
    } = this.props.stage;
    const className = `CollectionStageReport ${
      hasErrors ? 'CollectionStageReport--error' : ''
    }`;

    const errors = status.filter(({ name }) => name === 'error')[0]; // eslint-disable-line

    return (
      <div className={className}>
        <div className="CollectionStageReport__inner-container">
          <div className="CollectionStageReport__heading">
            <h3 className="CollectionStageReport__heading__text">
              {name}
              <Count count={count} />
              {errors && (
                <span className="CollectionStageReport__heading__error">
                  {errors.count}
                  &nbsp;Errors
                </span>
              )}
            </h3>
            <span className="CollectionStageReport__heading__meta">
              <span className="CollectionStageReport__heading__date">
                Started at:
                {renderDate(startAt)}
              </span>
              <span className="CollectionStageReport__heading__date">
                {finished ? 'Finished at' : 'Last activity'}
                {renderDate(endAt)}
              </span>
            </span>
            <div className="CollectionStageReport__heading__control">
              <span className="CollectionStageReport__heading__status">
                {renderState(finished)}
              </span>
              <span className="CollectionStageReport__heading__actions">
                {this.renderActions()}
              </span>
            </div>
          </div>
          <div className="CollectionStageReport__content">
            <h4 className="CollectionStageReport__content__title">Status</h4>
            {status.map(renderStatus)}
          </div>
        </div>
      </div>
    );
  }
}

class CollectionJobReport extends PureComponent {
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

  render() {
    const { job, counter, collection } = this.props;
    const jobName = `Job #${counter}`;

    return (
      <div className="CollectionJobReport">
        {this.state.deleteIsOpen && (
          <JobReportDeleteDialog
            jobId={job.job_id}
            isOpen={this.state.deleteIsOpen}
            toggleDialog={this.toggleDelete}
          />
        )}
        <div className="CollectionJobReport__heading">
          <h2 className="CollectionJobReport__heading__text">{jobName}</h2>
          <span className="CollectionJobReport__heading__meta">
            <span className="CollectionJobReport__heading__date">
              Started at:
              {renderDate(job.start_at)}
            </span>
            <span className="CollectionJobReport__heading__date">
              {job.finished ? 'Finished at:' : 'Last activity:'}
              {renderDate(job.end_at)}
            </span>
          </span>
          <div className="CollectionJobReport__heading__control">
            <span className="CollectionJobReport__heading__status">
              {renderState(job.finished)}
            </span>
            <span className="CollectionJobReport__heading__actions">
              {this.renderActions()}
            </span>
          </div>
        </div>
        <div className="CollectionJobReport__content">
          {job.stages.map((s) => (
            <StageReport
              job={job}
              stage={s}
              key={s.name}
              viewDetails={this.viewDetails}
              jumpToContext={this.getJumpToContext()}
            />
          ))}
        </div>
        <CollectionAnalyzeAlert
          collection={collection}
          isOpen={this.state.analyzeIsOpen}
          toggleAlert={this.toggleAnalyze}
        />
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collection, location } = ownProps;
  return {
    query: queryDocumentReports(location, collection.foreign_id),
  };
};

export default compose(withRouter, connect(mapStateToProps), injectIntl)(
  CollectionJobReport,
);
