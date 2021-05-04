import React from 'react';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Button, ProgressBar, Intent } from '@blueprintjs/core';
import { Tooltip2 as Tooltip } from '@blueprintjs/popover2';

import { Collection, ErrorSection, Numeric, Skeleton } from 'components/common';
import Screen from 'components/Screen/Screen';
import Dashboard from 'components/Dashboard/Dashboard';
import ErrorScreen from 'components/Screen/ErrorScreen';
import { triggerCollectionCancel, fetchSystemStatus } from 'actions';
import { selectSystemStatus } from 'selectors';

import './SystemStatusScreen.scss';


const messages = defineMessages({
  title: {
    id: 'dashboard.title',
    defaultMessage: 'System Status',
  },
  no_active: {
    id: 'collection.status.no_active',
    defaultMessage: 'There are no ongoing tasks',
  },
  cancel_button: {
    id: 'collection.status.cancel_button',
    defaultMessage: 'Cancel the process',
  },
});


export class SystemStatusScreen extends React.Component {
  constructor(props) {
    super(props);
    this.renderRow = this.renderRow.bind(this);
    this.fetchStatus = this.fetchStatus.bind(this);
    this.cancelCollection = this.cancelCollection.bind(this);
  }

  componentDidMount() {
    this.fetchStatus();
  }

  componentDidUpdate() {
    const { result } = this.props;
    if (result.shouldLoad) {
      this.fetchStatus();
    }
  }

  cancelAll() {
    if (this.loadPromise?.cancel) {
      this.loadPromise.cancel();
      this.loadPromise = undefined;
    }
    clearTimeout(this.timeout);
  }

  componentWillUnmount() {
    this.cancelAll();
  }

  fetchStatus() {
    this.cancelAll();
    this.loadPromise = this.props.fetchSystemStatus()
    this.loadPromise.finally(() => {
      this.timeout = setTimeout(this.fetchStatus, 3000);
    });
  }

  async cancelCollection(collection) {
    await this.props.triggerCollectionCancel(collection.id);
    this.fetchStatus();
  }

  renderRowSkeleton = (item) => (
    <tr key={item}>
      <td className="entity">
        <Skeleton.Text type="span" length={30} />
      </td>
      <td className="numeric narrow">
        <Skeleton.Text type="span" length={1} />
      </td>
      <td>
        <Skeleton.Text type="span" length={15} />
      </td>
      <td className="numeric narrow">
        <Skeleton.Text type="span" length={1} />
      </td>
      <td className="numeric narrow">
        <Skeleton.Text type="span" length={1} />
      </td>
      <td className="numeric narrow">
        <Skeleton.Text type="span" length={10} />
      </td>
    </tr>
  )

  renderRow(res) {
    const { intl } = this.props;
    const { collection } = res;
    const active = res.pending + res.running;
    const total = active + res.finished;
    const progress = res.finished / total;
    return (
      <tr key={collection?.id || 'null'}>
        <td className="entity">
          <Collection.Link collection={res.collection} />
          {!res.collection && (
            <FormattedMessage id="status.no_collection" defaultMessage="Other tasks" />
          )}
        </td>
        <td className="numeric narrow">{res.jobs.length}</td>
        <td>
          <ProgressBar value={progress} intent={Intent.PRIMARY} />
        </td>
        <td className="numeric narrow">
          <Numeric num={res.finished} />
        </td>
        <td className="numeric narrow">
          <Numeric num={active} />
        </td>
        <td className="numeric narrow">
          {collection && collection.writeable && (
            <Tooltip content={intl.formatMessage(messages.cancel_button)}>
              <Button onClick={() => this.cancelCollection(collection)} icon="delete" minimal small>
                <FormattedMessage id="collection.cancel.button" defaultMessage="Cancel" />
              </Button>
            </Tooltip>
          )}
        </td>
      </tr>
    );
  }

  render() {
    const { result, intl } = this.props;
    if (result.isError) {
      return <ErrorScreen error={result.error} />;
    }
    const results = result.results || [];
    const skeletonItems = [...Array(15).keys()];

    return (
      <Screen title={intl.formatMessage(messages.title)} requireSession>
        <Dashboard>
          <>
            <div className="Dashboard__title-container">
              <h5 className="Dashboard__title">{intl.formatMessage(messages.title)}</h5>
              <p className="Dashboard__subheading">
                <FormattedMessage
                  id="dashboard.subheading"
                  defaultMessage="Check the progress of ongoing data analysis, upload, and processing tasks."
                />
              </p>
            </div>
            {result.total === 0 && (
              <ErrorSection
                icon="dashboard"
                title={intl.formatMessage(messages.no_active)}
              />
            )}
            {result.total !== 0 && (
              <table className="StatusTable">
                <thead>
                  <tr>
                    <th>
                      <FormattedMessage id="collection.status.collection" defaultMessage="Dataset" />
                    </th>
                    <th className="numeric narrow">
                      <FormattedMessage id="collection.status.jobs" defaultMessage="Jobs" />
                    </th>
                    <th>
                      <FormattedMessage id="collection.status.progress" defaultMessage="Tasks" />
                    </th>
                    <th className="numeric narrow">
                      <FormattedMessage id="collection.status.finished_tasks" defaultMessage="Finished" />
                    </th>
                    <th className="numeric narrow">
                      <FormattedMessage id="collection.status.pending_tasks" defaultMessage="Pending" />
                    </th>
                    <th className="numeric narrow" />
                  </tr>
                </thead>
                <tbody>
                  {results.map(this.renderRow)}
                  {result.total === undefined && skeletonItems.map(this.renderRowSkeleton)}
                </tbody>
              </table>
            )}
          </>
        </Dashboard>
      </Screen>
    );
  }
}


const mapStateToProps = (state) => {
  const status = selectSystemStatus(state);
  return { result: status };
};

export default compose(
  withRouter,
  connect(mapStateToProps, { triggerCollectionCancel, fetchSystemStatus }),
  injectIntl,
)(SystemStatusScreen);
