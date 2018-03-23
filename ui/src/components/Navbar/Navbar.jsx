import React from 'react';
import { withRouter } from 'react-router';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import queryString from 'query-string';
import { InputGroup, Button, Intent } from "@blueprintjs/core";
import { connect } from 'react-redux';

import AuthButtons from 'src/components/AuthButtons/AuthButtons';
import LanguageMenu from 'src/components/LanguageMenu/LanguageMenu';
import {addAlert, fetchAlerts} from 'src/actions';
import Query from 'src/app/Query'

import './Navbar.css';
import {showSuccessToast} from "../../app/toast";

const messages = defineMessages({
  search_placeholder: {
    id: 'navbar.search_placeholder',
    defaultMessage: 'Search companies, people and documents.',
  },
  success: {
    id: 'navbar.success',
    defaultMessage: 'You are now subscribed to alerts for this search'
  },
  alert: {
    id: 'navbar.alert',
    defaultMessage: 'Alert'
  }
});

class Navbar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {searchValue: ''};

    this.onChange = this.onChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.onAddAlert = this.onAddAlert.bind(this);
    this.alertExists = this.alertExists.bind(this);
  }

  componentDidMount() {
    const { query } = this.props;
    if (query !== undefined) {
      this.setState({
        searchValue: query.getString('q')
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
    
    if (!alerts || !alerts.results)
      return false;

    return alerts.results.some((a) => {
      return a.query_text === this.state.searchValue;
    });
  }

  async onAddAlert(event) {
    const {searchValue} = this.state;
    const {intl} = this.props;

    event.preventDefault();
    await this.props.addAlert({query_text: searchValue});
    await this.props.fetchAlerts();
    showSuccessToast(intl.formatMessage(messages.success));
  }
  
  render() {
    const {metadata, session, intl, isHomepage} = this.props;
    const {searchValue} = this.state;
    
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
                <InputGroup type="text" leftIcon="search" className="pt-large"
                  onChange={this.onChange} value={searchValue}
                  placeholder={intl.formatMessage(messages.search_placeholder)}
                  rightElement={
                    searchValue && (
                      <Button
                        icon="notifications"
                        intent={this.alertExists() ? Intent.PRIMARY : Intent.DEFAULT}
                        className={this.alertExists() ? 'pt-minimal' : 'pt-minimal'}
                        onClick={this.onAddAlert}
                        disabled={this.alertExists()}
                        text={intl.formatMessage(messages.alert)}
                      />
                    )
                  }
                />
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
    alerts: state.alerts
  }
};

Navbar = injectIntl(Navbar);
Navbar = withRouter(Navbar);
export default connect(mapStateToProps, {addAlert, fetchAlerts})(Navbar);