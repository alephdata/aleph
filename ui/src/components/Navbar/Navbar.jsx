import React from 'react';
import { Link } from 'react-router-dom';
import { FormattedMessage, injectIntl } from 'react-intl';
import queryString from 'query-string';
import { Alignment, Button, Navbar as Bp3Navbar } from '@blueprintjs/core';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import AuthButtons from 'src/components/AuthButtons/AuthButtons';
import { selectSession } from 'src/selectors';
import ScopedSearchBox from 'src/components/Navbar/ScopedSearchBox';
import c from 'classnames';

import './Navbar.scss';

export class Navbar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      mobileSearchOpen: false,
    };
    this.onToggleMobileSearch = this.onToggleMobileSearch.bind(this);
    this.onDefaultSearch = this.onDefaultSearch.bind(this);
  }

  onToggleMobileSearch(event) {
    event.preventDefault();
    this.setState(({ mobileSearchOpen }) => ({ mobileSearchOpen: !mobileSearchOpen }));
  }

  onDefaultSearch(queryText) {
    const { history, query, location } = this.props;
    if (!query || location.pathname !== '/search') {
      history.push({
        pathname: '/search',
        search: queryString.stringify({ q: queryText }),
      });
    } else {
      const newQuery = query.set('q', queryText)
        .clearFilter('collection_id');
      history.push({ search: newQuery.toLocation() });
    }
  }

  render() {
    const {
      metadata, session, searchScopes, navbarRef, role, query, isHomepage,
    } = this.props;
    const { mobileSearchOpen } = this.state;

    const defaultScope = {
      listItem: metadata.app.title,
      onSearch: this.onDefaultSearch,
    };
    const scopes = searchScopes ? [defaultScope, ...searchScopes] : [defaultScope];

    return (
      <div ref={navbarRef}>
        <Bp3Navbar id="Navbar" className="Navbar bp3-dark">
          <Bp3Navbar.Group align={Alignment.LEFT} className={c('Navbar__left-group', { hide: mobileSearchOpen })}>
            <Link to="/" className="Navbar__home-link">
              <img src={metadata.app.logo} alt={metadata.app.title} />
            </Link>
          </Bp3Navbar.Group>
          <Bp3Navbar.Group align={Alignment.CENTER} className={c('Navbar__middle-group', { 'mobile-force-open': mobileSearchOpen })}>
            {!isHomepage && (
              <div className="Navbar__search-container">
                <ScopedSearchBox
                  query={query}
                  searchScopes={scopes}
                  onToggleSearchTips={this.props.onToggleSearchTips}
                />
              </div>
            )}
          </Bp3Navbar.Group>
          <Bp3Navbar.Group align={Alignment.RIGHT} className="Navbar__right-group" id="navbarSupportedContent">
            <Link to="/datasets">
              <Button icon="database" className="Navbar_collections-button bp3-minimal">
                <FormattedMessage id="nav.collections" defaultMessage="Datasets" />
              </Button>
            </Link>
            {!isHomepage && (
              <div className="Navbar__mobile-search-toggle">
                {!mobileSearchOpen && (
                  <Button icon="search" className="bp3-minimal" onClick={this.onToggleMobileSearch} />
                )}
                {mobileSearchOpen && (
                  <Button icon="cross" className="bp3-minimal" onClick={this.onToggleMobileSearch} />
                )}
              </div>
            )}
            <Bp3Navbar.Divider className={c({ 'mobile-hidden': mobileSearchOpen })} />
            <div className={c({ 'mobile-hidden': mobileSearchOpen })}>
              <AuthButtons
                session={session}
                auth={metadata.auth}
                role={role}
                className={c({ hide: mobileSearchOpen })}
              />
            </div>
          </Bp3Navbar.Group>
        </Bp3Navbar>
      </div>
    );
  }
}
const mapStateToProps = (state) => ({
  session: selectSession(state),
  role: state.session.role,
});

export default compose(
  withRouter,
  connect(mapStateToProps),
  injectIntl,
)(Navbar);
