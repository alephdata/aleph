import React from 'react';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { Helmet } from 'react-helmet';
import c from 'classnames';

import AuthenticationDialog from 'src/dialogs/AuthenticationDialog/AuthenticationDialog';
import Navbar from 'src/components/Navbar/Navbar';
import Preview from 'src/components/Preview/Preview';
import Footer from 'src/components/Footer/Footer';
import { selectSession, selectMetadata } from 'src/selectors';

import './Screen.css';

class Screen extends React.Component {
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

  toggleAuthentication(event) {
    event.preventDefault()
  }

  render() {
    const { isHomepage, requireSession, title, className, breadcrumbs } = this.props;
    const { session, metadata, query, updateQuery } = this.props;
    const forceAuth = requireSession && !session.loggedIn;
    const mainClass = isHomepage ? 'main-homepage' : 'main';

    return (
      <div className={c('Screen', className)}>
        <Helmet titleTemplate={`%s - ${metadata.app.title}`}>
          <title>{title || metadata.app.title}</title>
          <link rel='shortcut icon' href={metadata.app.favicon} />
        </Helmet>
        <Navbar metadata={metadata}
                session={session}
                query={query}
                updateQuery={updateQuery}
                isHomepage={isHomepage} />
        {!forceAuth && (
          <React.Fragment>
            <main className={mainClass}>
              {this.props.children}
            </main>
            <Preview/>
          </React.Fragment>
        )}
        {forceAuth && (
          <AuthenticationDialog auth={metadata.auth}
                                isOpen={true}
                                toggleDialog={this.toggleAuthentication} />
        )}
        <Footer isHomepage={isHomepage}
                metadata={metadata}
                breadcrumbs={breadcrumbs} />
      </div>
    )
  }
}

const mapStateToProps = (state) => {
  return {
    metadata: selectMetadata(state),
    session: selectSession(state)
  };
};

Screen = connect(mapStateToProps)(Screen);
Screen = withRouter(Screen);
export default Screen;
