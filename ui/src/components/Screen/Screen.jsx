import React from 'react';
import { Helmet } from 'react-helmet';
import c from 'classnames';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import AuthenticationDialog from 'dialogs/AuthenticationDialog/AuthenticationDialog';
import EntityPreview from 'components/Entity/EntityPreview';
import { selectSession, selectMetadata } from 'selectors';

import './Screen.scss';

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

  render() {
    const {
      exemptFromRequiredAuth, session, metadata, requireSession, title, description, className,
    } = this.props;
    const hasMetadata = metadata && metadata.app && metadata.app.title;


    let forceAuth = false;
    if (metadata?.auth?.require_logged_in) {
      forceAuth = !exemptFromRequiredAuth && !session.loggedIn
    } else {
      forceAuth = requireSession && !session.loggedIn
    }

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
            <main>
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
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({
  metadata: selectMetadata(state),
  session: selectSession(state),
});

export default compose(
  withRouter,
  connect(mapStateToProps),
)(Screen);
