import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Link } from 'react-router-dom';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import queryString from 'query-string';
import { ControlGroup, InputGroup, Intent, Switch, Position, Tooltip } from "@blueprintjs/core";
import classNames from 'classnames';

import AuthButtons from 'src/components/AuthButtons/AuthButtons';
import LanguageMenu from 'src/components/LanguageMenu/LanguageMenu';
import {addAlert, deleteAlert, fetchAlerts} from 'src/actions';
import {showSuccessToast, showInfoToast} from "src/app/toast";

import './Navbar.css';

const messages = defineMessages({
  search_placeholder: {
    id: 'navbar.search_placeholder',
    defaultMessage: 'Search companies, people and documents.',
  },
  alert_added: {
    id: 'navbar.alert_added',
    defaultMessage: 'You will receive alerts for new results'
  },
  alert_removed: {
    id: 'navbar.alert_removed',
    defaultMessage: 'You will no longer receive alerts for this search'
  },
  alert: {
    id: 'navbar.alert',
    defaultMessage: 'Alert'
  },
  alert_add: {
    id: 'navbar.alert_add',
    defaultMessage: 'Add alert'
  },
  alert_remove: {
    id: 'navbar.alert_remove',
    defaultMessage: 'Alert on'
  }
});

class Navbar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {searchValue: ''};

    this.onChange = this.onChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.onAddAlert = this.onAddAlert.bind(this);
    this.onRemoveAlert = this.onRemoveAlert.bind(this);
    this.alertExists = this.alertExists.bind(this);
  }

  componentDidMount() {
    const { query } = this.props;
    if (query !== undefined) {
      this.setState({
        searchValue: query.getString('q'),
        alertChangeProgress: false
      })
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.location.pathname === '/search') {
      return
    }
      
    if (nextProps.query && nextProps.query.state.q !== this.state.searchValue) {
      this.setState({
        searchValue: nextProps.query.getString('q')
      })
    }
  }
  
  onChange({ target }) {
    this.setState({searchValue: target.value})
  }

  onSubmit(event) {
    const { query, updateQuery } = this.props;
    event.preventDefault();
    if (updateQuery !== undefined) {
      updateQuery(query.set('q', this.state.searchValue));
    } else {
      const { history } = this.props;
      history.push({
        pathname: '/search',
        search: queryString.stringify({
          q: this.state.searchValue
        })
      })
    }
  }

  alertExists() {
    const { alerts } = this.props;
    const {searchValue} = this.state;
    // @FIXME The try/catch here is temporary to confirm this hotfix works
    // and workaround the issue temporarily in case it doesn't.
    try {
      if (!alerts || !alerts.results || !searchValue)
        return false;

      return alerts.results.some((a) => {
        return a.query_text && a.query_text.trim() === searchValue.trim();
      });
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  async onAddAlert(event) {
    const {intl} = this.props;
    const {searchValue} = this.state;
    
    this.setState({ alertChangeProgress: true });
    
    if (this.alertExists())
      return this.setState({ alertChangeProgress: false });

    event.preventDefault();
    await this.props.addAlert({query_text: searchValue});
    await this.props.fetchAlerts();
    showSuccessToast(intl.formatMessage(messages.alert_added));
    this.setState({ alertChangeProgress: false });
  }
  
  async onRemoveAlert(event) {
    const {intl, alerts, deleteAlert, fetchAlerts} = this.props;
    const {searchValue} = this.state;

    event.preventDefault();

    if (!alerts || !alerts.results)
      return false;

    this.setState({ alertChangeProgress: true });
      
    let alertDeleted = false;
    alerts.results.forEach((a) => {
      if (a.query_text.trim() === searchValue.trim()) {
        deleteAlert(a.id);
        alertDeleted = true;
      }
    });

    if (alertDeleted === true) {
      await fetchAlerts();
      showInfoToast(intl.formatMessage(messages.alert_removed));
    }
    this.setState({ alertChangeProgress: false });
  }
  
  render() {
    const {metadata, session, intl, isHomepage} = this.props;
    const {searchValue, alertChangeProgress} = this.state;
    
    const alertExists = this.alertExists();
    
    // Only show alert toggle when there is a search value and user logged in
    // @TODO Create option to inform users they can use alerts if signed in
    let showAlertToggle = false;
    if (searchValue && session && session.loggedIn === true) {
      showAlertToggle = true;
    }
    
    // Don't let users interact with the button when alerts are being updated
    let alertButtonOnClick = () => { return; };
    if (!alertChangeProgress) {
      alertButtonOnClick = alertExists ? this.onRemoveAlert : this.onAddAlert;
    }
    
    return (
      <div id="Navbar" className="Navbar">
        <nav className="pt-navbar">
          <div className="pt-navbar-group pt-align-left">
            <div className="pt-navbar-heading">
              <Link to="/">
                <img src={metadata.app.logo} alt={metadata.app.title} />
              </Link>
            </div>
            <div className="pt-navbar-heading">
              <Link to="/">{metadata.app.title}</Link>
            </div>
            {!isHomepage && (
              <form onSubmit={this.onSubmit} className='navbar-search-form'>
                <ControlGroup fill={true}>
                  <InputGroup
                    type="text"
                    leftIcon="search"
                    className="pt-large"
                    onChange={this.onChange} value={searchValue}
                    placeholder={intl.formatMessage(messages.search_placeholder)}
                    /*rightElement={<button className="pt-button pt-minimalx pt-icon-arrow-right"></button>}*/
                  />
                  {showAlertToggle && (
                    <div className="alert-toggle">
                      <Tooltip position={Position.RIGHT} intent={Intent.PRIMARY} content={
                         <FormattedMessage id="nav.alerts_tooltip" defaultMessage="Receive alerts for new results"/>
                      }>
                        <div className={classNames('pt-button pt-minimal', alertExists ? 'pt-intent-primary' : '')}
                          onClick={alertButtonOnClick}>
                          <span className={classNames('pt-icon-notifications', alertExists ? 'selected' : 'pt-text-muted')}/>
                          <Switch checked={alertExists} disabled={alertChangeProgress}/>
                        </div>
                      </Tooltip>
                    </div>
                  )}
                </ControlGroup>
              </form>
            )} 
          </div>
          <div className="pt-navbar-group pt-align-right">
            <Link to="/collections" className="pt-minimal pt-button pt-icon-database">
              <FormattedMessage id="nav.collections" defaultMessage="Sources"/>
            </Link>
            <div className="pt-navbar-divider"/>
            <AuthButtons session={session} auth={metadata.auth} />
            <LanguageMenu />
          </div>
        </nav>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    alerts: state.alerts,
    session: state.session
  }
};

Navbar = injectIntl(Navbar);
Navbar = withRouter(Navbar);
export default connect(mapStateToProps, {addAlert, deleteAlert, fetchAlerts})(Navbar);