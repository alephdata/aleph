import React from 'react';
import { Helmet } from 'react-helmet';
import c from 'classnames';
import { HotkeysTarget, Hotkeys, Hotkey } from '@blueprintjs/core';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import AuthenticationDialog from 'src/dialogs/AuthenticationDialog/AuthenticationDialog';
import PreviewManager from 'src/components/Preview/PreviewManager';
import Navbar from 'src/components/Navbar/Navbar';
import Footer from 'src/components/Footer/Footer';
import { selectSession, selectMetadata } from 'src/selectors';

import './Screen.scss';

const mapStateToProps = state => ({
  metadata: selectMetadata(state),
  session: selectSession(state),
});

export class Screen extends React.Component {
  constructor(props) {
    super(props);
    this.toggleAuthentication = this.toggleAuthentication.bind(this);
  }

  componentDidMount() {
    window.scrollTo(0, 0);
  }

  componentDidUpdate(prevProps) {
    if (this.props.location && (this.props.location.pathname !== prevProps.location.pathname)) {
      window.scrollTo(0, 0);
    }
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
      session, metadata, query, updateQuery, requireSession,
      isHomepage, title, description, className,
    } = this.props;
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
          metadata={metadata}
          session={session}
          query={query}
          updateQuery={updateQuery}
          isHomepage={isHomepage}
        />
        { hasMetadata && !!metadata.app.banner && (
          <div className="app-banner bp3-callout bp3-intent-warning bp3-icon-warning-sign">
            {metadata.app.banner}
          </div>
        )}
        {!forceAuth && (
          <React.Fragment>
            <main className={mainClass}>
              {this.props.children}
            </main>
            <PreviewManager />
          </React.Fragment>
        )}
        {forceAuth && (
          <AuthenticationDialog
            auth={metadata.auth}
            isOpen
            toggleDialog={this.toggleAuthentication}
          />
        )}
        <Footer
          isHomepage={isHomepage}
          metadata={metadata}
        />
      </div>
    );
  }
}
export default compose(
  withRouter,
  connect(mapStateToProps),
  HotkeysTarget,
)(Screen);
