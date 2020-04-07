import React from 'react';
import { Helmet } from 'react-helmet';
import c from 'classnames';
import { Hotkeys, Hotkey } from '@blueprintjs/core';
// See @alxmiron at https://github.com/palantir/blueprint/issues/3604
import { HotkeysTarget } from '@blueprintjs/core/lib/esnext/components/hotkeys/hotkeysTarget.js';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import AuthenticationDialog from 'src/dialogs/AuthenticationDialog/AuthenticationDialog';
import EntityPreview from 'src/components/Entity/EntityPreview';
import Navbar from 'src/components/Navbar/Navbar';
import Footer from 'src/components/Footer/Footer';
import SearchTips from 'src/components/SearchTips/SearchTips';
import { selectSession, selectMetadata } from 'src/selectors';

import './Screen.scss';


export class Screen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      searchTipsOpen: false,
    };
    this.onToggleSearchTips = this.onToggleSearchTips.bind(this);
    this.toggleAuthentication = this.toggleAuthentication.bind(this);
    this.navbarRef = React.createRef();
  }

  componentDidMount() {
    window.scrollTo(0, 0);
  }

  componentDidUpdate(prevProps) {
    if (this.props.location && (this.props.location.pathname !== prevProps.location.pathname)) {
      window.scrollTo(0, 0);
    }
  }

  onToggleSearchTips() {
    this.setState(({ searchTipsOpen }) => ({ searchTipsOpen: !searchTipsOpen }));
  }

  toggleAuthentication = event => event.preventDefault();

  focusSearchBox = () => {
    const searchBox = document.querySelector('#search-box');
    if (searchBox) {
      searchBox.focus();
    }
  }

  renderHotkeys() {
    const { hotKeys = [] } = this.props;
    return (
      <Hotkeys>
        <Hotkey combo="/" label="Search" global onKeyUp={this.focusSearchBox} />
        {hotKeys.map(hotKey => (
          <Hotkey
            key={hotKey.combo + hotKey.group}
            {...hotKey}
          />
        ))}
      </Hotkeys>
    );
  }

  render() {
    const {
      session, metadata, query, requireSession,
      isHomepage, title, description, className, searchScopes,
    } = this.props;
    const { searchTipsOpen } = this.state;
    const hasMetadata = metadata && metadata.app && metadata.app.title;
    const forceAuth = requireSession && !session.loggedIn;
    const mainClass = isHomepage ? 'main-homepage' : 'main';
    const titleTemplate = hasMetadata ? `%s - ${metadata.app.title}` : '%s';
    const defaultTitle = hasMetadata ? metadata.app.title : 'Aleph';

    return (
      <div className={c('Screen', className)}>
        <Helmet titleTemplate={titleTemplate} defaultTitle={defaultTitle}>
          { !!title && (
            <title>{title}</title>
          )}
          { !!description && (
            <meta name="description" content={description} />
          )}
          { !!metadata.app.favicon && (
            <link rel="shortcut icon" href={metadata.app.favicon} />
          )}
        </Helmet>
        <Navbar
          navbarRef={this.navbarRef}
          metadata={metadata}
          session={session}
          query={query}
          isHomepage={isHomepage}
          searchScopes={searchScopes}
          onToggleSearchTips={this.onToggleSearchTips}
        />
        { (hasMetadata && !!metadata.app.banner) && (
          <div className="app-banner bp3-callout bp3-intent-warning bp3-icon-warning-sign">
            {metadata.app.banner}
          </div>
        )}
        {!forceAuth && (
          <>
            <main className={mainClass}>
              {this.props.children}
            </main>
            <EntityPreview />
          </>
        )}
        {forceAuth && (
          <AuthenticationDialog
            auth={metadata.auth}
            isOpen
            toggleDialog={this.toggleAuthentication}
          />
        )}
        <SearchTips
          isOpen={searchTipsOpen}
          onToggle={this.onToggleSearchTips}
          navbarRef={this.navbarRef}
        />
        <Footer isHomepage={isHomepage} metadata={metadata} />
      </div>
    );
  }
}

const mapStateToProps = state => ({
  metadata: selectMetadata(state),
  session: selectSession(state),
});

export default compose(
  withRouter,
  connect(mapStateToProps),
  HotkeysTarget,
)(Screen);
