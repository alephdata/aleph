import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { defineMessages, injectIntl } from 'react-intl';
import { Tooltip } from "@blueprintjs/core";
import c from 'classnames';

import { addAlert, deleteAlert, fetchAlerts } from 'src/actions';
import { selectSession, selectAlerts } from 'src/selectors';


const messages = defineMessages({
  alert_add: {
    id: 'navbar.alert_add',
    defaultMessage: 'You will receive alerts for new results.'
  },
  alert_remove: {
    id: 'navbar.alert_remove',
    defaultMessage: 'You are receiving alerts about this search.'
  }
});


class SearchAlert extends React.Component {
  constructor(props) {
    super(props);
    this.state = {updating: false};
    this.onToggleAlert = this.onToggleAlert.bind(this);
  }

  shouldComponentUpdate(nextProps) {
    return !this.props.alerts ||
      this.props.alerts.total !== nextProps.alerts.total ||
      this.props.queryText !== nextProps.queryText;
  }

  componentDidMount() {
    const { session, alerts } = this.props;
    if (session.loggedIn && !alerts.isLoading && (!alerts || !alerts.results)) {
      this.props.fetchAlerts();
    }
  }

  alertExists() {
    const { queryText, session, alerts } = this.props;
    if (!session.loggedIn || !alerts || !alerts.results || !queryText) {
      return false;
    }
    return !!alerts.results.some((a) => {
      return a.query && a.query.trim() === queryText.trim();
    });
  }

  async onToggleAlert(event) {
    event.preventDefault();
    const { alerts, queryText } = this.props;
    const alertExists = this.alertExists();

    if (!alerts || !alerts.results || this.state.updating) {
      return false;
    }

    this.setState({updating: true});
    if (alertExists) {
      for (let alert of alerts.results) {
        if (alert.query.trim() === queryText.trim()) {
          await this.props.deleteAlert(alert.id);
          await this.props.fetchAlerts();
        }
      }
    } else {
      await this.props.addAlert({query: queryText.trim()});
      await this.props.fetchAlerts();
    }
    this.setState({updating: false});
  }
  
  render() {
    const { queryText, session, intl } = this.props;
    if (!session.loggedIn || !queryText || !queryText.trim().length) {
      return null;
    }
    const alertExists = this.alertExists();
    const className = c('bp3-button',
                        'bp3-minimal',
                        'bp3-icon-notifications',
                        {'bp3-intent-success': alertExists},
                        {'bp3-disabled': this.state.updating});
    const tooltip = alertExists ? intl.formatMessage(messages.alert_remove)
                                : intl.formatMessage(messages.alert_add);
    return (
      <Tooltip content={tooltip}>
        <button className={className} type="button" onClick={this.onToggleAlert} />
      </Tooltip>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    alerts: selectAlerts(state),
    session: selectSession(state),
  }
};

SearchAlert = connect(mapStateToProps, {addAlert, deleteAlert, fetchAlerts})(SearchAlert)
SearchAlert = injectIntl(SearchAlert);
SearchAlert = withRouter(SearchAlert);
export default SearchAlert;