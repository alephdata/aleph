import React from 'react';
import {connect} from 'react-redux';
import {withRouter} from 'react-router';
import {Link} from 'react-router-dom';
import {defineMessages, injectIntl, FormattedMessage} from 'react-intl';
import queryString from 'query-string';
import { ControlGroup, InputGroup, Icon } from "@blueprintjs/core";

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
    this.state = {searchValue: '', isMenuOpen: false, searchOpen: false};

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

  onOpenMenu(event) {
    event.preventDefault();
    this.setState({isMenuOpen: !this.state.isMenuOpen});
  }

  onToggleSearch(event) {
    event.preventDefault();
    this.setState({searchOpen: !this.state.searchOpen});
  }

  render() {
    const {metadata, session, intl, isHomepage} = this.props;
    const {searchValue, isMenuOpen, searchOpen} = this.state;

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
              <div className={searchOpen ? 'full-length-input visible-sm-flex' : 'hide'}>
                <button type="button" className="back-button visible-sm-block pt-button pt-large pt-minimal pt-icon-arrow-left" onClick={this.onToggleSearch}/>
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
            <div className={`search-and-burger-icons ${isHomepage && 'burger-fixed'}`}>
              {!isHomepage && (<a className={'search-icon icon visible-sm-block'} onClick={this.onToggleSearch}>
                <Icon icon='search'/>
              </a>)}
              <a className={`menu-icon icon visible-sm-block ${isMenuOpen && 'transform'}`} onClick={this.onOpenMenu}>
                <div className="bar1"/>
                <div className="bar2"/>
                <div className="bar3"/>
              </a>
            </div>
          </div>
          <div className={`navbar-options pt-navbar-group pt-align-right ${isMenuOpen && 'show-menu-dropdown'}`} id="navbarSupportedContent">
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