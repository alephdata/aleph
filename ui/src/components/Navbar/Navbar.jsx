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

import './Navbar.css';
import {showSuccessToast} from "../../app/toast";

const messages = defineMessages({
  search_placeholder: {
    id: 'navbar.search_placeholder',
    defaultMessage: 'Search companies, people and documents.',
  },
  success: {
    id: 'navbar.success',
    defaultMessage: 'You have successfully added alert!'
  }
});


class Navbar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {value: ''};

    this.onChange = this.onChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.onAddAlert = this.onAddAlert.bind(this);
    this.valid = this.valid.bind(this);
  }

  componentDidMount() {
    const { query } = this.props;
    if (query !== undefined) {
      this.setState({
        value: query.getString('q')
      })
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.location.pathname === '/search') {
      return
    }
      
    if (nextProps.query && nextProps.query.state.q !== this.state.value) {
      this.setState({
        value: nextProps.query.getString('q')
      })
    }
  }
  
  onChange({ target }) {
    this.setState({value: target.value})
  }

  onSubmit(event) {
    const { query, updateQuery } = this.props;
    event.preventDefault();
    if (updateQuery !== undefined) {
      updateQuery(query.set('q', this.state.value));
    } else {
      const { history } = this.props;
      history.push({
        pathname: '/search',
        search: queryString.stringify({
          q: this.state.value
        })
      })
    }
  }

  valid() {
    return this.state.value;
  }

  async onAddAlert(event) {
    const {value} = this.state;
    const {intl} = this.props;

    event.preventDefault();
    await this.props.addAlert({query_text: value});
    await this.props.fetchAlerts();
    showSuccessToast(intl.formatMessage(messages.success));
  }
  
  render() {
    const {metadata, session, intl, isHomepage} = this.props;
    const {value} = this.state;

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
                              onChange={this.onChange} value={this.state.value}
                              placeholder={intl.formatMessage(messages.search_placeholder)}
                  />
                  <Button
                    intent={Intent.PRIMARY}
                    onClick={this.onAddAlert}
                    disabled={!this.valid()}
                    text='Create alert'
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

const mapStateToProps = (state, ownProps) => ({
});

Navbar = injectIntl(Navbar);
Navbar = withRouter(Navbar);
export default connect(mapStateToProps, {addAlert, fetchAlerts})(Navbar);