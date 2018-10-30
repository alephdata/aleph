import React from 'react';
import {connect} from 'react-redux';
import {withRouter} from 'react-router';
import {Link} from 'react-router-dom';
import {defineMessages, injectIntl, FormattedMessage} from 'react-intl';
import queryString from 'query-string';
import { ControlGroup, InputGroup, Icon, Button } from "@blueprintjs/core";

import SearchAlert from 'src/components/SearchAlert/SearchAlert';
import AuthButtons from 'src/components/AuthButtons/AuthButtons';
import LanguageMenu from 'src/components/LanguageMenu/LanguageMenu';
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
        <nav className="bp3-navbar">
          <div className='navbar-header-search'>
            <div className={"bp3-navbar-group"}>
              <div className="bp3-navbar-heading">
                <Link to="/">
                  <img src={metadata.app.logo} alt={metadata.app.title}/>
                </Link>
              </div>
              <div className="bp3-navbar-heading heading-title">
                <Link to="/">{metadata.app.title}</Link>
              </div>
            </div>

              <div className={searchOpen ? 'full-length-input visible-sm-flex' : 'hide'}>
                <button type="button" className="back-button visible-sm-block bp3-button bp3-large bp3-minimal bp3-icon-arrow-left" onClick={this.onToggleSearch}/>
                {!isHomepage && ( <form onSubmit={this.onSubmit} className='navbar-search-form'>
                    <ControlGroup fill={true}>
                      <InputGroup
                        type="text"
                        leftIcon="search"
                        className='bp3-large'
                        onChange={this.onChange} value={searchValue}
                        placeholder={intl.formatMessage(searchOpen ? messages.mobile_search_placeholder : messages.search_placeholder)}
                        rightElement={<SearchAlert queryText={searchValue}/>}
                      />
                    </ControlGroup>
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
            <div className={`navbar-options bp3-navbar-group ${isMenuOpen && 'show-menu-dropdown'}`} id="navbarSupportedContent">
              <div className='menu-items'>
                <Link to='/sources'>
                  <Button icon='database' className='bp3-minimal'>
                    <FormattedMessage id="nav.sources" defaultMessage="Sources"/>
                  </Button>
                </Link>
                {session.loggedIn &&
                <Link to='/cases'>
                  <Button icon='briefcase' className='bp3-minimal'>
                    <FormattedMessage id="nav.cases" defaultMessage="Cases"/>
                  </Button>
                </Link>}
                <div className="bp3-navbar-divider"/>
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