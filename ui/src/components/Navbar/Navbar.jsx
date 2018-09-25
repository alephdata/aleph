import React from 'react';
import {connect} from 'react-redux';
import {withRouter} from 'react-router';
import {Link} from 'react-router-dom';
import {defineMessages, injectIntl, FormattedMessage,} from 'react-intl';
import queryString from 'query-string';
import { Icon, Button } from "@blueprintjs/core";

import AuthButtons from 'src/components/AuthButtons/AuthButtons';
import LanguageMenu from 'src/components/LanguageMenu/LanguageMenu';
import SearchBox from 'src/components/Navbar/SearchBox';

import { selectSession } from 'src/selectors';

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

    this.doSearch = this.doSearch.bind(this);
    this.onOpenMenu = this.onOpenMenu.bind(this);
    this.onToggleSearch = this.onToggleSearch.bind(this);
    this.onClickSources = this.onClickSources.bind(this);
    this.onClickCases = this.onClickCases.bind(this);
  }

  componentDidMount() {
    const { query } = this.props;
    if (query !== undefined) {
      this.setState({searchValue: query.getString('q')})
    }
  }

  onSubmit = event => event.preventDefault();

  updateSearchValue = searchValue => this.setState({ searchValue });

  doSearch(searchValue = this.state.searchValue) {
    const { query, updateQuery, history } = this.props;
    if (updateQuery !== undefined) {
      updateQuery(query.set('q', searchValue));
    } else {
      history.push({
        pathname: '/search',
        search: queryString.stringify({
          q: searchValue
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

  onClickSources() {
    const { history } = this.props;

    history.push({
      pathname: '/sources'
    });

  }

  onClickCases() {
    const { history } = this.props;

    history.push({
      pathname: '/cases'
    });
  }

  render() {
    const {metadata, session, intl, isHomepage} = this.props;
    const { isMenuOpen, searchOpen} = this.state;

    return (
      <div id="Navbar" className="Navbar">
        <nav className="pt-navbar">
          <div className='navbar-header-search'>
            <div className={"pt-navbar-group"}>
              <div className="pt-navbar-heading">
                <Link to="/">
                  <img src={metadata.app.logo} alt={metadata.app.title}/>
                </Link>
              </div>
              <div className="pt-navbar-heading heading-title">
                <Link to="/">{metadata.app.title}</Link>
              </div>
            </div>

              <div className={searchOpen ? 'full-length-input visible-sm-flex' : 'hide'}>
                <button type="button" className="back-button visible-sm-block pt-button pt-large pt-minimal pt-icon-arrow-left" onClick={this.onToggleSearch}/>
                {!isHomepage && ( <form onSubmit={this.onSubmit} className='navbar-search-form'>
                    <SearchBox
                      doSearch={this.doSearch}
                      placeholder={intl.formatMessage(searchOpen ? messages.mobile_search_placeholder : messages.search_placeholder)}
                      updateSearchValue={this.updateSearchValue}
                      searchValue={this.state.searchValue}
                    />
                  </form>
                )}
              </div>


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
            <div className={`navbar-options pt-navbar-group ${isMenuOpen && 'show-menu-dropdown'}`} id="navbarSupportedContent">
              <div className='menu-items'>
                <Button icon='database' onClick={this.onClickSources} className='pt-minimal'>
                  <FormattedMessage id="nav.sources" defaultMessage="Sources"/>
                </Button>
                {/*
                {session.loggedIn && <Button icon='briefcase' className='pt-minimal' onClick={this.onClickCases}>
                  <FormattedMessage id="nav.cases" defaultMessage="Case files"/>
                </Button>}
                */}
                <div className="pt-navbar-divider"/>
                <AuthButtons session={session} auth={metadata.auth}/>
                <LanguageMenu/>
              </div>
            </div>
          </div>
        </nav>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return { session: selectSession(state) };
};

Navbar = connect(mapStateToProps, {})(Navbar);
Navbar = injectIntl(Navbar);
Navbar = withRouter(Navbar);
export default Navbar;