import React, {Component} from 'react';
import {NonIdealState} from '@blueprintjs/core';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import {withRouter} from 'react-router';
import queryString from 'query-string';

const messages = defineMessages({
  no_alerts: {
    id: 'alerts.no_alerts',
    defaultMessage: 'There are no alerts',
  },
});

class AlertsTable extends Component {

  constructor(props) {
    super(props);

    this.deleteAlert = this.deleteAlert.bind(this);
    this.onSearch = this.onSearch.bind(this);
  }

  async deleteAlert(id, event) {
    this.props.deleteAlert(id);
  }

  onSearch(alert) {
    const { history } = this.props;
    history.push({
      pathname: '/search',
      search: queryString.stringify({
        q: alert
      })
    });
  }

  render() {
    const { alerts, intl } = this.props;

    if (alerts.results === undefined || alerts.results.length === 0) {
      return (
        <div>
          <NonIdealState visual="" title={intl.formatMessage(messages.no_alerts)}/>
        </div>
      );
    }

    return (

      <table className="AlertsTable settings-table">
        <thead>
          <tr>
            <th className='topic'>
              <FormattedMessage id="alerts.topic" defaultMessage="Topic"/>
            </th>
            <th className='other-topics'>
              <FormattedMessage id="alerts.search" defaultMessage="Search"/>
            </th>
            <th className='other-topics'>
              <FormattedMessage id="alerts.delete" defaultMessage="Delete"/>
            </th>
          </tr>
        </thead>
        <tbody className='table_body_alerts'>
          {alerts.results.map((item) => (
            <tr key={item.id} className='table-row'>
              <td className='first-row header_topic'>
                {item.label}
              </td>
              <td className='other-rows'
                  onClick={() => this.onSearch(item.label)}>
                <i className="fa fa-search" aria-hidden="true"/>
              </td>
              <td
                className='other-rows'
                onClick={() => this.deleteAlert(item.id)}
              >
                <i className="fa fa-trash-o" aria-hidden="true"/>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }
}

export default withRouter(injectIntl(AlertsTable));
