import React, { Component } from 'react';
import { Route, Switch } from 'react-router-dom';
import { connect } from 'react-redux';
import { Spinner } from '@blueprintjs/core';

import { fetchMetadata } from 'src/actions';
import NotFoundScreen from 'src/screens/NotFoundScreen/NotFoundScreen';
import EntityScreen from 'src/screens/EntityScreen/EntityScreen';
import CollectionScreen from 'src/screens/CollectionScreen/CollectionScreen';
import OAuthScreen from "src/screens/OAuthScreen/OAuthScreen";
import LogoutScreen from 'src/screens/LogoutScreen/LogoutScreen';
import ActivateScreen from 'src/screens/ActivateScreen/ActivateScreen';
import HomeScreen from 'src/screens/HomeScreen/HomeScreen';
import SearchScreen from 'src/screens/SearchScreen/SearchScreen';
import NotificationsScreen from 'src/screens/NotificationsScreen/NotificationsScreen';
import CollectionsIndexScreen from 'src/screens/CollectionsIndexScreen/CollectionsIndexScreen';
import CollectionsXrefScreen from 'src/screens/CollectionsXrefScreen/CollectionsXrefScreen';
import DocumentScreen from 'src/screens/DocumentScreen/DocumentScreen';
import { DocumentRedirectScreen } from 'src/components/Document';

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
        <Route path="/collections" exact component={CollectionsIndexScreen}/>
        <Route path="/collections/:collectionId" exact component={CollectionScreen}/>
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
  return {metadata: state.metadata, session: state.session};
};

Router = connect(mapStateToProps, { fetchMetadata })(Router);
export default Router;
