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
      searchValue: props.query ? props.query.getString('q') : '',
      mobileSearchOpen: false,
    };

    this.onChange = this.onChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.onDefaultSearch = this.onDefaultSearch.bind(this);
    this.onToggleMobileSearch = this.onToggleMobileSearch.bind(this);
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

  onToggleMobileSearch(event) {
    event.preventDefault();
    this.setState(({ mobileSearchOpen }) => ({ mobileSearchOpen: !mobileSearchOpen }));
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

    if (updateQuery !== undefined) {
      updateQuery(query.set('q', searchValue));
    } else {
      searchScope.onSearch(searchValue);
    }
  };


  render() {
    const {
      metadata, session, searchScopes, role, onToggleSearchTips, isHomepage,
    } = this.props;
    const { mobileSearchOpen } = this.state;

    const defaultScope = {
      listItem: metadata.app.title,
      label: metadata.app.title,
      onSearch: this.onDefaultSearch,
    };

    return (
      <Bp3Navbar id="Navbar" className="Navbar bp3-dark">
        <Bp3Navbar.Group align={Alignment.LEFT} className={c('Navbar__left-group', { hide: mobileSearchOpen })}>
          <Link to="/" className="Navbar__home-link">
            <img src={metadata.app.logo} alt={metadata.app.title} />
          </Link>
          {isHomepage && (
            <Bp3Navbar.Heading>
              {metadata.app.title}
            </Bp3Navbar.Heading>
          )}
        </Bp3Navbar.Group>
        <Bp3Navbar.Group align={Alignment.CENTER} className={c('Navbar__middle-group', { 'mobile-force-open': mobileSearchOpen })}>
          {!isHomepage && (
            <div className="Navbar__search-container">
              <form onSubmit={this.onSubmit} autoComplete="off">
                <ScopedSearchBox
                  doSearch={this.doSearch}
                  updateSearchValue={this.updateSearchValue}
                  searchValue={this.state.searchValue}
                  searchScopes={searchScopes
                    ? [...[defaultScope], ...searchScopes] : [defaultScope]}
                  toggleSearchTips={onToggleSearchTips}
                />
              </form>
            </div>
          )}
        </Bp3Navbar.Group>
        <Bp3Navbar.Group align={Alignment.RIGHT} className="Navbar__right-group" id="navbarSupportedContent">
          <Link to="/sources">
            <Button icon="database" className="Navbar__sources-button bp3-minimal">
              <FormattedMessage id="nav.sources" defaultMessage="Sources" />
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
