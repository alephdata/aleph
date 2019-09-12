import React from 'react';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Button, Tooltip } from '@blueprintjs/core';

import Query from 'src/app/Query';
import { DualPane, Breadcrumbs, Collection, SectionLoading, ErrorSection } from 'src/components/common';
import Toolbar from 'src/components/Toolbar/Toolbar';
import Screen from 'src/components/Screen/Screen';
import ErrorScreen from 'src/components/Screen/ErrorScreen';
import { triggerCollectionCancel, queryDashboard } from 'src/actions';
import { selectDashboardResult } from 'src/selectors';
import { Link } from 'react-router-dom';
import getCollectionLink from 'src/util/getCollectionLink';


import './SystemStatusScreen.scss';


const messages = defineMessages({
  title: {
    id: 'dashboard.title',
    defaultMessage: 'System Status',
  },
  no_active_collection: {
    id: 'dashboard.no_active_collection',
    defaultMessage: 'There are no active collections',
  },
  cancel_button: {
    id: 'collection.status.cancel_button',
    defaultMessage: 'Cancel the process',
  },
});


export class SystemStatusScreen extends React.Component {
  componentDidMount() {
    this.fetchIfNeeded();
    this.interval = setInterval(() => this.fetchIfNeeded(), 10000);
  }

  componentDidUpdate(prevProps) {
    if (!this.props.query.sameAs(prevProps.query)) {
      this.fetchIfNeeded();
    }
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  fetchIfNeeded() {
    const { result, query } = this.props;
    if (!result.isLoading) {
      this.props.queryDashboard({ query });
    }
  }

  render() {
    const { result, intl } = this.props;

    if (result.isError) {
      return <ErrorScreen error={result.error} />;
    }

    return (
      <Screen title={intl.formatMessage(messages.title)} requireSession>
        <Breadcrumbs>
          <Breadcrumbs.Text text={intl.formatMessage(messages.title)} />
        </Breadcrumbs>
        <DualPane className="SystemStatusScreen">
          <DualPane.ContentPane className="padded">
            <Toolbar>
              <h1>
                <FormattedMessage id="notifications.heading" defaultMessage="Active Collections" />
              </h1>
            </Toolbar>
            <React.Fragment>
              {result.total === 0
                && (
                  <ErrorSection
                    visual="dashboard"
                    title={intl.formatMessage(messages.no_active_collection)}
                  />
                )
              }
              {result.total !== 0 && (
                <table className="Dashboard">
                  <thead>
                    <tr>
                      <th><FormattedMessage id="infoMode.collection" defaultMessage="Collection" /></th>
                      <th><FormattedMessage id="collection.status.jobs" defaultMessage="Number of Jobs" /></th>
                      <th><FormattedMessage id="collection.status.finished_tasks" defaultMessage="Finished Tasks" /></th>
                      <th><FormattedMessage id="collection.status.pending_tasks" defaultMessage="Pending Tasks" /></th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {result.results.map(res => (
                      (
                        <tr key={res.id}>
                          <td className="entity">
                            <Link to={getCollectionLink(res.collection)}>
                              <Collection.Label collection={res.collection} />
                            </Link>
                          </td>
                          <td>{res.jobs.length}</td>
                          <td>{res.finished}</td>
                          <td>{res.pending}</td>
                          <td>
                            <Tooltip content={intl.formatMessage(messages.cancel_button)}>
                              <Button onClick={() => this.props.triggerCollectionCancel(res.collection.id)} icon="delete">
                                <FormattedMessage id="collection.cancel.button" defaultMessage="Cancel" />
                              </Button>
                            </Tooltip>
                          </td>
                        </tr>
                      )
                    ))}
                  </tbody>
                </table>
              )}
              {result.isLoading && (
                <SectionLoading />
              )}
            </React.Fragment>
          </DualPane.ContentPane>
        </DualPane>
      </Screen>
    );
  }
}


const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps;
  const query = Query.fromLocation('status', location, {}, 'status');
  const result = selectDashboardResult(state, query);
  return { query, result };
};

const mapDispatchToProps = { triggerCollectionCancel, queryDashboard };

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl,
)(SystemStatusScreen);
