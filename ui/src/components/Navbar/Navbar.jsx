import React from 'react';
import {connect} from 'react-redux';
import {withRouter} from 'react-router';
import {Link} from 'react-router-dom';
import {defineMessages, injectIntl, FormattedMessage} from 'react-intl';
import queryString from 'query-string';
import c from 'classnames';
import { ControlGroup, InputGroup, Icon } from "@blueprintjs/core";
// import {ControlGroup, InputGroup, NavbarDivider} from "@blueprintjs/core";

import SearchAlert from 'src/components/SearchAlert/SearchAlert';
import AuthButtons from 'src/components/AuthButtons/AuthButtons';
import LanguageMenu from 'src/components/LanguageMenu/LanguageMenu';

import './Navbar.css';

const messages = defineMessages({
  search_placeholder: {
    id: 'navbar.search_placeholder',
    defaultMessage: 'Search companies, people and documents.',
  },
  mobile_search_placeholder: {
    id: 'navbar.mobile_search_placeholder',
    defaultMessage: 'Search companies, people and ...',
  }
});

class Navbar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {searchValue: '', responsive: false, searchOpen: false};

    this.onChange = this.onChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.onOpenMenu = this.onOpenMenu.bind(this);
    this.onToggleSearch = this.onToggleSearch.bind(this);
  }

  componentDidMount() {
    const { query } = this.props;
    if (query !== undefined) {
      this.setState({searchValue: query.getString('q')})
    }
  }

  onChange({target}) {
    this.setState({searchValue: target.value});
  }

  onSubmit(event) {
    const { query, updateQuery, history } = this.props;
    event.preventDefault();
    if (updateQuery !== undefined) {
      updateQuery(query.set('q', this.state.searchValue));
    } else {
      history.push({
        pathname: '/search',
        search: queryString.stringify({
          q: this.state.searchValue
        })
      })
    }
  }

  onOpenMenu() {
    this.setState({responsive: !this.state.responsive});
  }

  onToggleSearch() {
    this.setState({searchOpen: !this.state.searchOpen});
  }

  render() {
    const {metadata, session, intl, isHomepage} = this.props;
    const {searchValue, responsive, searchOpen} = this.state;

    return (
      <div id="Navbar" className="Navbar">
        <nav className="pt-navbar">
          <div className='navbar-header-search'>
            <div className={"pt-navbar-group pt-align-left"}>
              <div className="pt-navbar-heading">
                <Link to="/">
                  <img src={metadata.app.logo} alt={metadata.app.title}/>
                </Link>
              </div>
              <div className="pt-navbar-heading heading-title">
                <Link to="/">{metadata.app.title}</Link>
              </div>
            </div>
            {!isHomepage && (
              <div className={searchOpen ? 'responsive-input' : 'hide'}>
                <button type="button" className="back-button pt-button pt-large pt-minimal pt-icon-arrow-left" onClick={this.onToggleSearch}/>
                <form onSubmit={this.onSubmit} className='navbar-search-form'>
                  <ControlGroup fill={true}>
                    <InputGroup
                      type="text"
                      leftIcon="search"
                      className='pt-large'
                      onChange={this.onChange} value={searchValue}
                      placeholder={intl.formatMessage(searchOpen ? messages.mobile_search_placeholder : messages.search_placeholder)}
                      rightElement={<SearchAlert queryText={searchValue}/>}
                    />
                  </ControlGroup>
                </form>
              </div>

            )}
            <div className='search-and-burger'>
              {!isHomepage && (<a href="#" className={'search-icon icon'} onClick={this.onToggleSearch}>
                <Icon icon='search'/>
              </a>)}
              <a href="#" className={`menu-icon icon ${responsive && 'responsive-icon'}`} onClick={this.onOpenMenu}>
                <Icon icon='menu'/>
              </a>
            </div>
          </div>
          <div className={`topnav pt-navbar-group pt-align-right ${responsive && 'responsive'}`} id="navbarSupportedContent">
            <div className='menu-items'>
              <Link to="/sources" className="pt-minimal pt-button pt-icon-database">
                <FormattedMessage id="nav.sources" defaultMessage="Sources"/>
              </Link>
              <div className="pt-navbar-divider"/>
              {/*
            <li>
                <Link to="/cases" className="pt-minimal pt-button pt-icon-briefcase">
                <FormattedMessage id="nav.cases" defaultMessage="Case files"/>
              </Link>
              </li>
            */}
              <AuthButtons session={session} auth={metadata.auth}/>
              <LanguageMenu/>
            </div>
          </div>
        </nav>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return { session: state.session };
};

Navbar = connect(mapStateToProps, {})(Navbar);
Navbar = injectIntl(Navbar);
Navbar = withRouter(Navbar);
export default Navbar;