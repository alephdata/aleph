import React from 'react';
import { Link } from 'react-router-dom';
import { FormattedMessage, injectIntl } from 'react-intl';
import queryString from 'query-string';
import { Alignment, Button, Icon, Navbar as Bp3Navbar } from '@blueprintjs/core';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import AuthButtons from 'src/components/AuthButtons/AuthButtons';
import { selectSession } from 'src/selectors';
import SearchBox from 'src/components/Navbar/SearchBox';
import './Navbar.scss';

export class Navbar extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      searchValue: props.query ? props.query.getString('q') : '',
      isMenuOpen: false,
      searchOpen: false,
    };

    this.onChange = this.onChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.onDefaultSearch = this.onDefaultSearch.bind(this);
    this.onOpenMenu = this.onOpenMenu.bind(this);
    this.onToggleSearch = this.onToggleSearch.bind(this);
  }


  componentDidMount() {
    const { query } = this.props;
    if (query !== undefined) {
      this.setState({ searchValue: query.getString('q') });
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (snapshot.query.shouldUpdate) {
      this.updateSearchValue(snapshot.query.nextValue);
    }
  }

  onChange({ target }) {
    this.setState({ searchValue: target.value });
  }

  onSubmit = event => event.preventDefault();

  onOpenMenu(event) {
    event.preventDefault();
    this.setState(({ isMenuOpen }) => ({ isMenuOpen: !isMenuOpen }));
  }

  onToggleSearch(event) {
    event.preventDefault();
    this.setState(({ searchOpen }) => ({ searchOpen: !searchOpen }));
  }

  onDefaultSearch(queryText) {
    const { history } = this.props;

    history.push({
      pathname: '/search',
      search: queryString.stringify({
        q: queryText,
      }),
    });
  }

  getSnapshotBeforeUpdate(prevProps) {
    if (this.props.query && (prevProps.query.state.q !== this.props.query.state.q)) {
      if (this.props.query.state.q !== this.state.searchValue) {
        return {
          query: {
            shouldUpdate: true,
            nextValue: this.props.query.state.q || '',
          },
        };
      }
    }
    return {
      query: {},
    };
  }

  updateSearchValue = searchValue => this.setState({ searchValue });

  doSearch = (searchValue = this.state.searchValue, searchScope) => {
    const { query, updateQuery } = this.props;

    console.log('scope is', searchScope);
    if (updateQuery !== undefined) {
      updateQuery(query.set('q', searchValue));
    } else {
      searchScope.onSearch(searchValue);
    }
  };


  render() {
    const {
      metadata, session, isHomepage, searchScopes, role,
    } = this.props;
    const { isMenuOpen, searchOpen } = this.state;

    const defaultScope = {
      listItem: 'OCCRP Aleph',
      label: 'OCCRP Aleph',
      onSearch: this.onDefaultSearch,
    };

    return (
      <div id="Navbar" className="Navbar">
        <Bp3Navbar className="bp3-dark">
          <Bp3Navbar.Group align={Alignment.LEFT} className="Navbar__left-group">
            <Bp3Navbar.Heading>
              <Link to="/">
                <img src={metadata.app.logo} alt={metadata.app.title} />
              </Link>
            </Bp3Navbar.Heading>
            <Bp3Navbar.Heading>
              <div className="heading-title">
                <Link to="/">{metadata.app.title}</Link>
              </div>
            </Bp3Navbar.Heading>
          </Bp3Navbar.Group>
          <Bp3Navbar.Group align={Alignment.CENTER} className="Navbar__middle-group">
            <div className={searchOpen ? 'full-length-input visible-sm-flex' : 'search-container hide'}>
              <button type="button" className="back-button visible-sm-block bp3-button bp3-large bp3-minimal bp3-icon-arrow-left" onClick={this.onToggleSearch} />
              {!isHomepage && (
                <form onSubmit={this.onSubmit} autoComplete="off" className="navbar-search-form">
                  <SearchBox
                    doSearch={this.doSearch}
                    updateSearchValue={this.updateSearchValue}
                    searchValue={this.state.searchValue}
                    searchScopes={searchScopes
                      ? [...[defaultScope], ...searchScopes] : [defaultScope]}
                  />
                </form>
              )}
            </div>

          </Bp3Navbar.Group>

          <div className={`search-and-burger-icons ${isHomepage && 'burger-fixed'}`}>
            {!isHomepage && (
              <a className="search-icon icon visible-sm-block" href="/" onClick={this.onToggleSearch}>
                <Icon icon="search" />
              </a>
            )}
            <a className={`menu-icon icon visible-sm-block ${isMenuOpen && 'transform'}`} href="/" onClick={this.onOpenMenu}>
              <div className="bar1" />
              <div className="bar2" />
              <div className="bar3" />
            </a>
          </div>
          <Bp3Navbar.Group align={Alignment.RIGHT} className={`navbar-options bp3-navbar-group ${isMenuOpen && 'show-menu-dropdown'}`} id="navbarSupportedContent">
            <div className="menu-items">
              <Link to="/sources">
                <Button icon="database" className="bp3-minimal">
                  <FormattedMessage id="nav.sources" defaultMessage="Datasets" />
                </Button>
              </Link>
              <Bp3Navbar.Divider />
              <AuthButtons session={session} auth={metadata.auth} role={role} />
            </div>
          </Bp3Navbar.Group>
        </Bp3Navbar>
      </div>
    );
  }
}
const mapStateToProps = state => ({
  session: selectSession(state),
  role: state.session.role,
});

export default compose(
  withRouter,
  connect(mapStateToProps),
  injectIntl,
)(Navbar);
