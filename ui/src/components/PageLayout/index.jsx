import React, { Component } from 'react';
import { Route, Switch } from 'react-router-dom';
import { connect } from 'react-redux';
import { Spinner } from '@blueprintjs/core';
import { Helmet } from 'react-helmet';

import { fetchMetadata } from 'src/actions';
import LoginScreen from 'src/components/auth/LoginScreen';
import LogoutScreen from 'src/components/auth/LogoutScreen';
import SignupScreen from 'src/components/auth/SignupScreen';
import ActivateScreen from 'src/components/auth/ActivateScreen';
import SearchScreen from 'src/components/SearchScreen';
import EntityScreen from 'src/components/EntityScreen';
import EntityRelatedScreen from 'src/components/EntityScreen/EntityRelatedScreen';
import DocumentScreen from 'src/components/DocumentScreen';
import DocumentRelatedScreen from 'src/components/DocumentScreen/DocumentRelatedScreen';
import DocumentRedirectScreen from 'src/components/DocumentScreen/DocumentRedirectScreen';
import HomeScreen from 'src/components/HomeScreen';
import CollectionScreen from 'src/components/CollectionScreen';
import ErrorScreen from 'src/components/ErrorScreen';
import PageNavbar from './PageNavbar';

import './PageLayout.css';

class PageLayout extends Component {

  componentWillMount() {
    this.props.fetchMetadata();
  }

  render() {
    const { metadata, session } = this.props;
    const isLoaded = metadata && metadata.app && session;
    if (!isLoaded) {
      return (
        <div className="PageLayout-spinner">
          <div className="spinner">
            <Spinner className="pt-large"/>
          </div>
        </div>
      )
    }

    return (
      <div className="PageLayout-root">
        <Helmet titleTemplate={`%s - ${metadata.app.title}`}>
          <title>{metadata.app.title}</title>
          <link rel="shortcut icon" href={metadata.app.favicon} />
        </Helmet>
        <PageNavbar metadata={metadata} session={session}/>
        <main className="PageLayout-main">
          <Switch>
            <Route path="/login" exact component={LoginScreen}/>
            <Route path="/logout" exact component={LogoutScreen}/>
            <Route path="/signup" exact component={SignupScreen}/>
            <Route path="/activate/:code" exact component={ActivateScreen}/>
            <Route path="/entities/:entityId" exact component={EntityScreen}/>
            <Route path="/entities/:entityId/related" exact component={EntityRelatedScreen}/>
            <Route path="/documents/:documentId" exact component={DocumentScreen}/>
            <Route path="/documents/:documentId/related" exact component={DocumentRelatedScreen}/>
            <Route path="/text/:documentId" exact component={DocumentRedirectScreen}/>
            <Route path="/tabular/:documentId/:sheet" exact component={DocumentRedirectScreen}/>
            <Route path="/collections/:collectionId" exact component={CollectionScreen}/>
            <Route path="/search" exact component={SearchScreen}/>
            <Route path="/" exact component={HomeScreen}/>
            <Route component={ErrorScreen}/>
          </Switch>
        </main>
        <footer className="PageLayout-footer">
          <p>
            <strong>ℵ</strong> aleph Mk II · 
            {' '}
            <i className="fa fa-fw fa-github" />
            <a href="https://github.com/alephdata/aleph">open source</a>
          </p>
        </footer>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return state;
};

PageLayout = connect(
  mapStateToProps,
  { fetchMetadata }
)(PageLayout);

export default PageLayout;
