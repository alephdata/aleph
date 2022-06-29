{/*
SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.

SPDX-License-Identifier: MIT
*/}


import React, { Component } from 'react';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { ControlGroup, InputGroup, Button, Intent, Icon } from '@blueprintjs/core';
import { Tooltip2 as Tooltip } from '@blueprintjs/popover2';
import queryString from 'query-string';
import { compose } from 'redux';
import { connect } from 'react-redux';

import withRouter from 'app/withRouter'
import { ErrorSection, Date, QueryInfiniteLoad, QueryText, Skeleton } from 'components/common';
import { queryAlerts, createAlert, deleteAlert } from 'actions';
import { selectAlertResult } from 'selectors';
import { alertsQuery } from 'queries';
import validAlertQuery from 'util/validAlertQuery';

import './AlertsManager.scss';


const messages = defineMessages({
  title: {
    id: 'alerts.heading',
    defaultMessage: 'Manage your alerts',
  },
  save_button: {
    id: 'alerts.save',
    defaultMessage: 'Update',
  },
  add_placeholder: {
    id: 'alerts.add_placeholder',
    defaultMessage: 'Create a new tracking alert...',
  },
  no_alerts: {
    id: 'alerts.no_alerts',
    defaultMessage: 'You are not tracking any searches',
  },
  delete: {
    id: 'alerts.delete',
    defaultMessage: 'Remove alert',
  },
});

class AlertsDialog extends Component {
  constructor(props) {
    super(props);
    this.state = { newAlert: '' };

    this.onDelete = this.onDelete.bind(this);
    this.onAddAlert = this.onAddAlert.bind(this);
    this.onSearch = this.onSearch.bind(this);
    this.onChangeAddingInput = this.onChangeAddingInput.bind(this);
  }

  async onDelete(alert) {
    await this.props.deleteAlert(alert.id);
  }

  async onAddAlert(event) {
    const { newAlert } = this.state;
    event.preventDefault();
    if (validAlertQuery(newAlert)) {
      this.setState({ newAlert: '' });
      await this.props.createAlert({ query: newAlert });
    }
  }

  onSearch(alert, event) {
    const { navigate } = this.props;
    event.preventDefault();
    const search = queryString.stringify({ q: alert.query });
    navigate({ pathname: '/search', search: search });
  }

  onChangeAddingInput({ target }) {
    this.setState({ newAlert: target.value });
  }

  renderSkeleton(item) {
    return (
      <tr key={'x' + item} className="AlertsManager__row">
        <td className="AlertsManager__button narrow">
          <Skeleton.Text type="span" length={1} />
        </td>
        <td className="AlertsManager__text text-main">
          <Skeleton.Text type="span" length={40} />
        </td>
        <td className="AlertsManager__text text-date">
          <Skeleton.Text type="span" length={15} />
        </td>
        <td className="AlertsManager__button narrow">
          <Skeleton.Text type="span" length={1} />
        </td>
      </tr>
    );
  }

  renderRow(item) {
    const { intl } = this.props;
    return (
      <tr key={item.id} className="AlertsManager__row">
        <td className="AlertsManager__button narrow">
          <Icon className="bp3-intent-primary" icon="feed-subscribed" />
        </td>
        <td className="AlertsManager__text text-main">
          <Button minimal onClick={(e) => this.onSearch(item, e)}>
            <QueryText query={item.query} />
          </Button>
        </td>
        <td className="AlertsManager__text text-date">
          <Date value={item.updated_at} showTime />
        </td>
        <td className="AlertsManager__button narrow">
          <Tooltip content={intl.formatMessage(messages.delete)}>
            <Button
              icon="cross"
              minimal
              small
              onClick={() => this.onDelete(item)}
            />
          </Tooltip>
        </td>
      </tr>
    )
  }

  render() {
    const { query, result, intl } = this.props;
    const { newAlert } = this.state;
    const skeletonItems = [...Array(15).keys()];

    return (
      <div className="AlertsManager">
        <form onSubmit={this.onAddAlert} className="add-form">
          <ControlGroup fill>
            <InputGroup
              leftIcon="feed"
              placeholder={intl.formatMessage(messages.add_placeholder)}
              onChange={this.onChangeAddingInput}
              value={newAlert}
              autoFocus
              large
            />
            <Button
              disabled={!validAlertQuery(newAlert)}
              onClick={this.onAddAlert}
              intent={Intent.PRIMARY}
              text={<FormattedMessage id="alerts.track" defaultMessage="Track" />}
              large
            />
          </ControlGroup>
        </form>
        { result.total === 0 && (
          <ErrorSection
            icon="feed"
            title={intl.formatMessage(messages.no_alerts)}
          />
        )}
        <table className="settings-table">
          <tbody>
            {result.results.map((i) => this.renderRow(i))}
            {result.isPending && skeletonItems.map((i) => this.renderSkeleton(i))}
          </tbody>
        </table>
        <QueryInfiniteLoad
          query={query}
          result={result}
          fetch={this.props.queryAlerts}
        />
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps;
  const query = alertsQuery(location);
  return {
    query,
    result: selectAlertResult(state, query)
  };
};

const mapDispatchToProps = { queryAlerts, createAlert, deleteAlert };

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl,
)(AlertsDialog);
