import React from 'react';
import { Link } from 'react-router-dom';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import queryString from 'query-string';
import {
  Alignment,
  Button,
  Classes,
  Navbar as BpNavbar,
} from '@blueprintjs/core';
import { compose } from 'redux';
import { connect } from 'react-redux';
import c from 'classnames';

import withRouter from 'app/withRouter';
import AdvancedSearch from 'components/AdvancedSearch/AdvancedSearch';
import AuthButtons from 'components/AuthButtons/AuthButtons';
import {
  selectMetadata,
  selectSession,
  selectPages,
  selectEntitiesResult,
} from 'selectors';
import SearchAlert from 'components/SearchAlert/SearchAlert';
import { HotkeysContainer, SearchBox, LinkButton } from 'components/common';
import getPageLink from 'util/getPageLink';
import { entitiesQuery } from 'queries';

import './Navbar.scss';

const messages = defineMessages({
  hotkey_focus: {
    id: 'hotkeys.search_focus',
    defaultMessage: 'Search',
  },
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
      advancedSearchOpen: false,
    };

    this.onToggleMobileSearch = this.onToggleMobileSearch.bind(this);
    this.onToggleAdvancedSearch = this.onToggleAdvancedSearch.bind(this);
    this.onSearchSubmit = this.onSearchSubmit.bind(this);
    this.navbarRef = React.createRef();
    this.inputRef = React.createRef();
  }

  onToggleMobileSearch(event) {
    event.preventDefault();
    this.setState(({ mobileSearchOpen }) => ({
      mobileSearchOpen: !mobileSearchOpen,
    }));
  }

  onToggleAdvancedSearch() {
    this.setState(({ advancedSearchOpen }) => ({
      advancedSearchOpen: !advancedSearchOpen,
    }));
  }

  onSearchSubmit(queryText) {
    const { navigate, query } = this.props;
    let search = queryString.stringify({ q: queryText });
    if (query) {
      const newQuery = query.set('q', queryText);
      search = newQuery.toLocation();
    }

    navigate({
      pathname: '/search',
      search,
    });
  }

  render() {
    const { metadata, pages, session, query, result, isHomepage, intl } =
      this.props;
    const { advancedSearchOpen, mobileSearchOpen } = this.state;

    const queryText = query?.getString('q');
    const alertQuery = result?.query_text || queryText;
    const menuPages = pages.filter((page) => page.menu);

    return (
      <>
        <div className="Navbar" ref={this.navbarRef}>
          <BpNavbar id="Navbar" className={Classes.DARK}>
            <BpNavbar.Group
              align={Alignment.LEFT}
              className={c('Navbar__left-group', { hide: mobileSearchOpen })}
            >
              <Link to="/" className="Navbar__home-link">
                {!!metadata.app.logo && (
                  <img src={metadata.app.logo} alt={metadata.app.title} />
                )}
                {!!metadata.app.title && (
                  <span className="Navbar__home-link__text">
                    {metadata.app.title}
                  </span>
                )}
              </Link>
            </BpNavbar.Group>
            <BpNavbar.Group
              align={Alignment.CENTER}
              className={c('Navbar__middle-group', {
                'mobile-force-open': mobileSearchOpen,
              })}
            >
              {!isHomepage && (
                <div className="Navbar__search-container">
                  <div className="Navbar__search-container__content">
                    <div className="Navbar__search-container__searchbar">
                      <SearchBox
                        onSearch={this.onSearchSubmit}
                        query={query}
                        inputProps={{
                          inputRef: this.inputRef,
                          rightElement: <SearchAlert alertQuery={alertQuery} />,
                        }}
                        placeholder={intl.formatMessage(messages.placeholder)}
                      />
                    </div>
                    <Button
                      className={c(
                        'Navbar__search-container__search-tips',
                        Classes.FIXED
                      )}
                      icon="settings"
                      minimal
                      onClick={this.onToggleAdvancedSearch}
                    />
                  </div>
                </div>
              )}
            </BpNavbar.Group>
            <BpNavbar.Group
              align={Alignment.RIGHT}
              className="Navbar__right-group"
              id="navbarSupportedContent"
            >
              {!isHomepage && (
                <>
                  <div className="Navbar__mobile-search-toggle">
                    {!mobileSearchOpen && (
                      <Button
                        icon="search"
                        minimal
                        onClick={this.onToggleMobileSearch}
                      />
                    )}
                    {mobileSearchOpen && (
                      <Button
                        icon="cross"
                        minimal
                        onClick={this.onToggleMobileSearch}
                      />
                    )}
                  </div>
                  {!mobileSearchOpen && (
                    <BpNavbar.Divider className="Navbar__mobile-search-divider" />
                  )}
                </>
              )}
              {!mobileSearchOpen && (
                <>
                  <LinkButton
                    to="/datasets"
                    icon="database"
                    minimal={true}
                    className="Navbar_collections-button"
                  >
                    <FormattedMessage
                      id="nav.collections"
                      defaultMessage="Datasets"
                    />
                  </LinkButton>
                  {session.loggedIn && (
                    <LinkButton
                      to="/investigations"
                      icon="briefcase"
                      minimal={true}
                      className="Navbar__collections-button mobile-hide"
                    >
                      <FormattedMessage
                        id="nav.cases"
                        defaultMessage="Investigations"
                      />
                    </LinkButton>
                  )}
                  {menuPages.map((page) => (
                    <LinkButton
                      key={page.name}
                      to={getPageLink(page)}
                      icon={page.icon}
                      minimal={true}
                      className="Navbar__collections-button mobile-hide"
                    >
                      {page.short}
                    </LinkButton>
                  ))}
                </>
              )}
              <BpNavbar.Divider
                className={c({ 'mobile-hidden': mobileSearchOpen })}
              />
              <div className={c({ 'mobile-hidden': mobileSearchOpen })}>
                <AuthButtons className={c({ hide: mobileSearchOpen })} />
              </div>
            </BpNavbar.Group>
          </BpNavbar>
        </div>
        <AdvancedSearch
          isOpen={advancedSearchOpen}
          onToggle={this.onToggleAdvancedSearch}
          navbarRef={this.navbarRef}
        />
        <HotkeysContainer
          hotkeys={[
            {
              combo: '/',
              global: true,
              preventDefault: true,
              label: intl.formatMessage(messages.hotkey_focus),
              onKeyDown: () => this.inputRef?.current?.focus(),
            },
          ]}
        />
      </>
    );
  }
}
const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps;
  const query = entitiesQuery(location);
  return {
    query,
    result: selectEntitiesResult(state, query),
    isHomepage: location.pathname === '/',
    metadata: selectMetadata(state),
    session: selectSession(state),
    pages: selectPages(state),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps),
  injectIntl
)(Navbar);
