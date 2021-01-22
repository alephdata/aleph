import React from 'react';
import { Helmet } from 'react-helmet';
import c from 'classnames';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import AuthenticationDialog from 'dialogs/AuthenticationDialog/AuthenticationDialog';
import EntityPreview from 'components/Entity/EntityPreview';
import AdvancedSearch from 'components/AdvancedSearch/AdvancedSearch';
import { selectSession, selectMetadata } from 'selectors';

import './Screen.scss';

export class Screen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      advancedSearchOpen: false,
    };
    this.onToggleAdvancedSearch = this.onToggleAdvancedSearch.bind(this);
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

  onToggleAdvancedSearch() {
    this.setState(({ advancedSearchOpen }) => ({ advancedSearchOpen: !advancedSearchOpen }));
  }

  toggleAuthentication = event => event.preventDefault();

  render() {
    const {
      session, metadata, requireSession,
      isHomepage, title, description, className,
    } = this.props;
    const { advancedSearchOpen } = this.state;
    const hasMetadata = metadata && metadata.app && metadata.app.title;
    const forceAuth = requireSession && !session.loggedIn;
    const mainClass = isHomepage ? 'main-homepage' : 'main';
    const titleTemplate = hasMetadata ? `%s - ${metadata.app.title}` : '%s';
    const defaultTitle = hasMetadata ? metadata.app.title : 'Aleph';

    return (
      <div className={c('Screen', className)}>
        <Helmet titleTemplate={titleTemplate} defaultTitle={defaultTitle}>
          {!!title && (
            <title>{title}</title>
          )}
          {!!description && (
            <meta name="description" content={description} />
          )}
          {!!metadata.app.favicon && (
            <link rel="shortcut icon" href={metadata.app.favicon} />
          )}
        </Helmet>
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
        <AdvancedSearch
          isOpen={advancedSearchOpen}
          onToggle={this.onToggleAdvancedSearch}
          navbarRef={this.navbarRef}
        />
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
)(Screen);
