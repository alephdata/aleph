import React from 'react';
import { Link } from 'react-router-dom';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import queryString from 'query-string';
import { Alignment, Button, Navbar as Bp3Navbar } from '@blueprintjs/core';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import c from 'classnames';

import Query from 'app/Query';
import AuthButtons from 'components/AuthButtons/AuthButtons';
import { selectSession, selectPages } from 'selectors';
import SearchAlert from 'components/SearchAlert/SearchAlert';
import { SearchBox } from 'components/common';
import getPageLink from 'util/getPageLink';

import './Navbar.scss';

const messages = defineMessages({
  placeholder: {
    id: 'search.placeholder',
    defaultMessage: 'Search companies, people and documents',
  },
});

export class Navbar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      mobileSearchOpen: false,
    };
    this.onToggleMobileSearch = this.onToggleMobileSearch.bind(this);
    this.onSearchSubmit = this.onSearchSubmit.bind(this);
  }

  onToggleMobileSearch(event) {
    event.preventDefault();
    this.setState(({ mobileSearchOpen }) => ({ mobileSearchOpen: !mobileSearchOpen }));
  }

  onSearchSubmit(queryText) {
    const { history, query } = this.props;
    history.push({
      pathname: '/search',
      search: queryString.stringify({ q: queryText }),
    });
  }

  render() {
    const {
      metadata, pages, query, isHomepage, intl, session
    } = this.props;
    const { mobileSearchOpen } = this.state;
    const queryText = query?.getString('q');

    const menuPages = pages.filter((page) => page.menu);

    return (
      <Bp3Navbar id="Navbar" className="Navbar bp3-dark">
        <Bp3Navbar.Group align={Alignment.LEFT} className={c('Navbar__left-group', { hide: mobileSearchOpen })}>
          <Link to="/" className="Navbar__home-link">
            <img src={metadata.app.logo} alt={metadata.app.title} />
            {metadata.app.title}
          </Link>
        </Bp3Navbar.Group>
        <Bp3Navbar.Group align={Alignment.CENTER} className={c('Navbar__middle-group', { 'mobile-force-open': mobileSearchOpen })}>
          {!isHomepage && (
            <div className="Navbar__search-container">
              <div className="Navbar__search-container__content">
                <div className="Navbar__search-container__searchbar">
                  <SearchBox
                    onSearch={this.onSearchSubmit}
                    query={query}
                    inputProps={{
                      rightElement: <SearchAlert alertQuery={queryText} />
                    }}
                    placeholder={intl.formatMessage(messages.placeholder)}
                  />
                </div>
                <Button
                  className="Navbar__search-container__search-tips bp3-fixed"
                  icon="settings"
                  minimal
                  onClick={this.props.onToggleAdvancedSearch}
                />
              </div>
            </div>
          )}
        </Bp3Navbar.Group>
        <Bp3Navbar.Group align={Alignment.RIGHT} className="Navbar__right-group" id="navbarSupportedContent">
          {!isHomepage && (
            <>
              <div className="Navbar__mobile-search-toggle">
                {!mobileSearchOpen && (
                  <Button icon="search" className="bp3-minimal" onClick={this.onToggleMobileSearch} />
                )}
                {mobileSearchOpen && (
                  <Button icon="cross" className="bp3-minimal" onClick={this.onToggleMobileSearch} />
                )}

              </div>
              {!mobileSearchOpen && <Bp3Navbar.Divider className="Navbar__mobile-search-divider" />}
            </>
          )}
          {!mobileSearchOpen && (
            <>
              <Link to="/datasets">
                <Button icon="database" className="Navbar_collections-button bp3-minimal">
                  <FormattedMessage id="nav.collections" defaultMessage="Datasets" />
                </Button>
              </Link>
              {session.loggedIn && (
                <Link to="/investigations">
                  <Button icon="briefcase" className="Navbar_collections-button bp3-minimal">
                    <FormattedMessage id="nav.investigations" defaultMessage="Investigations" />
                  </Button>
                </Link>
              )}
              {menuPages.map(page => (
                <Link to={getPageLink(page)} key={page.name}>
                  <Button icon={page.icon} className="Navbar_collections-button bp3-minimal">
                    {page.short}
                  </Button>
                </Link>
              ))}
            </>
          )}
          <Bp3Navbar.Divider className={c({ 'mobile-hidden': mobileSearchOpen })} />
          <div className={c({ 'mobile-hidden': mobileSearchOpen })}>
            <AuthButtons className={c({ hide: mobileSearchOpen })} />
          </div>
        </Bp3Navbar.Group>
      </Bp3Navbar>
    );
  }
}
const mapStateToProps = (state, ownProps) => ({
  session: selectSession(state),
  pages: selectPages(state)
});

export default compose(
  withRouter,
  connect(mapStateToProps),
  injectIntl,
)(Navbar);
