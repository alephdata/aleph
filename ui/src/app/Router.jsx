import React, { Component } from 'react';
import { Route, Switch } from 'react-router-dom';
import { connect } from 'react-redux';
import { Spinner } from '@blueprintjs/core';

import { fetchMetadata } from 'src/actions';
import { selectSession, selectMetadata } from 'src/selectors';
import NotFoundScreen from 'src/screens/NotFoundScreen/NotFoundScreen';
import EntityScreen from 'src/screens/EntityScreen/EntityScreen';
import OAuthScreen from "src/screens/OAuthScreen/OAuthScreen";
import LogoutScreen from 'src/screens/LogoutScreen/LogoutScreen';
import ActivateScreen from 'src/screens/ActivateScreen/ActivateScreen';
import HomeScreen from 'src/screens/HomeScreen/HomeScreen';
import SearchScreen from 'src/screens/SearchScreen/SearchScreen';
import NotificationsScreen from 'src/screens/NotificationsScreen/NotificationsScreen';
import SourcesIndexScreen from 'src/screens/SourcesIndexScreen/SourcesIndexScreen';
import CollectionsXrefScreen from 'src/screens/CollectionsXrefScreen/CollectionsXrefScreen';
import DocumentScreen from 'src/screens/DocumentScreen/DocumentScreen';
import CasesIndexScreen from 'src/screens/CasesIndexScreen/CasesIndexScreen';
import CaseScreen from 'src/screens/CaseScreen/CaseScreen';
import CollectionDocumentsScreen from 'src/screens/CollectionDocumentsScreen/CollectionDocumentsScreen';
import CollectionRedirectScreen from 'src/screens/CollectionRedirectScreen/CollectionRedirectScreen';
import DocumentRedirectScreen from 'src/screens/DocumentRedirectScreen/DocumentRedirectScreen';

import './Router.css';

class Router extends Component {

  componentWillMount() {
    const { metadata } = this.props;
    if (!metadata.app) {
      this.props.fetchMetadata();
    }
  }

  render() {
    const { metadata, session } = this.props;
    const isLoaded = metadata && metadata.app && session;

    if (!isLoaded) {
      return (
        <div className="RouterLoading">
          <div className="spinner"><Spinner className="pt-large"/></div>
        </div>
      )
    }

    return (
      <Switch>
        <Route path="/oauth" exact component={OAuthScreen}/>
        <Route path="/logout" exact component={LogoutScreen}/>
        <Route path="/activate/:code" exact component={ActivateScreen}/>
        <Route path="/entities/:entityId" exact component={EntityScreen}/>
        <Route path="/documents/:documentId" exact component={DocumentScreen}/>
        <Route path="/text/:documentId" exact component={DocumentRedirectScreen}/>
        <Route path="/tabular/:documentId/:sheet" exact component={DocumentRedirectScreen}/>
        <Route path="/sources" exact component={SourcesIndexScreen}/>
        <Route path="/cases" exact component={CasesIndexScreen}/>
        <Route path="/cases/:collectionId" exact component={CaseScreen}/>
        <Route path="/collections/:collectionId/documents" exact component={CollectionDocumentsScreen}/>
        <Route path="/collections/:collectionId" exact component={CollectionRedirectScreen}/>
        <Route path="/collections/:collectionId/xref/:otherId" exact component={CollectionsXrefScreen}/>
        <Route path="/search" exact component={SearchScreen}/>
        <Route path="/notifications" exact component={NotificationsScreen}/>
        <Route path="/" exact component={HomeScreen}/>
        <Route component={NotFoundScreen}/>
      </Switch>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    metadata: selectMetadata(state),
    session: selectSession(state)
  };
};

Router = connect(mapStateToProps, { fetchMetadata })(Router);
export default Router;
