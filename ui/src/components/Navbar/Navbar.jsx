import React from 'react';
import { withRouter } from 'react-router';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import queryString from 'query-string';
import { InputGroup } from "@blueprintjs/core";

import AuthButtons from 'src/components/AuthButtons/AuthButtons';
import LanguageMenu from 'src/components/LanguageMenu/LanguageMenu';

import './Navbar.css';


const messages = defineMessages({
  search_placeholder: {
    id: 'navbar.search_placeholder',
    defaultMessage: 'Search companies, people and documents.',
  },
});


class Navbar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {value: ''};

    this.onChange = this.onChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
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
  
  render() {
    const {metadata, session, intl, isHomepage} = this.props

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
              <form onSubmit={this.onSubmit}>
                <InputGroup type="text" leftIcon="search" className="pt-large"
                  onChange={this.onChange} value={this.state.value}
                  placeholder={intl.formatMessage(messages.search_placeholder)}
                  />
              </form>
            )} 
          </div>
          <div className="pt-navbar-group pt-align-right">
            <Link to="/collections" className="pt-minimal pt-button pt-icon-database">
              <FormattedMessage id="nav.collections" defaultMessage="Sources"/>
            </Link>
            <AuthButtons session={session} auth={metadata.auth} />
            <LanguageMenu />
          </div>
        </nav>
      </div>
    );
  }
}

Navbar = injectIntl(Navbar);
export default withRouter(Navbar);