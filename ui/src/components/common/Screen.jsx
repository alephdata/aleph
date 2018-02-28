import React from 'react';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { Helmet } from 'react-helmet';

import PageNavbar from 'src/components/PageLayout/PageNavbarSearchForm';

import './Screen.css';

class Screen extends React.Component {

  componentDidMount() {
    window.scrollTo(0, 0)
  }

  componentDidUpdate(prevProps) {
    if (this.props.location && (this.props.location.pathname !== prevProps.location.pathname)) {
      window.scrollTo(0, 0)
    }
  }

  render() {
    
    return (
      <div className="Screen">
        <Helmet titleTemplate={`%s - ${this.props.title || this.props.metadata.app.title}`}>
          <title>{this.props.title || this.props.metadata.app.title}</title>
          <link rel="shortcut icon" href={this.props.metadata.app.favicon} />
        </Helmet>
      
        <PageNavbar metadata={this.props.metadata} session={this.props.session} searchContext={this.props.searchContext}/>
        
        { this.props.children }
        
        <footer className="PageLayout-footer">
          <p>
            <strong>ℵ</strong> aleph Mk II
            <span className="pt-text-muted"> • </span>
            <span>
              <a href="https://github.com/alephdata/aleph"><i className="fa fa-fw fa-github" /></a>
              {' '}
              <a href="https://github.com/alephdata/aleph">Source Code</a>
            </span>
            <span className="pt-text-muted"> • </span>
            <span>
              <a href="https://github.com/alephdata/aleph/wiki/User-manual"><i className="fa fa-fw fa-book" /></a>
              {' '}
              <a href="https://github.com/alephdata/aleph/wiki/User-manual">Documentation</a>
            </span>
          </p>
        </footer>              
      </div>
    )
  }
}

const mapStateToProps = (state) => {
  return state;
};

Screen = connect(
  mapStateToProps
)(Screen);

export default Screen;
