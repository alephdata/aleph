import React, { Component } from 'react';
import { Route, Switch } from 'react-router-dom';
import { connect } from 'react-redux';
import { Spinner } from '@blueprintjs/core';

import { fetchMetadata } from 'src/actions';
import LoginScreen from 'src/components/auth/LoginScreen';
import LogoutScreen from 'src/components/auth/LogoutScreen';
import SignupScreen from 'src/components/auth/SignupScreen';
import ActivateScreen from 'src/components/auth/ActivateScreen';
import SearchScreen from 'src/components/search/SearchScreen';
import EntityScreen from 'src/components/EntityScreen';
import EntityRelatedScreen from 'src/components/EntityScreen/EntityRelatedScreen';
import DocumentScreen from 'src/components/DocumentScreen';
import DocumentRelatedScreen from 'src/components/DocumentScreen/DocumentRelatedScreen';
import DocumentRedirectScreen from 'src/components/DocumentScreen/DocumentRedirectScreen';
import ErrorScreen from 'src/components/ErrorScreen';
import CollectionScreen from 'src/components/CollectionScreen';
import CollectionEditScreen from 'src/components/CollectionEdit';

import HomeScreen from 'src/screens/HomeScreen/HomeScreen';
import CollectionsIndexScreen from 'src/screens/CollectionsIndexScreen/CollectionsIndexScreen';
import CollectionsXrefScreen from 'src/screens/CollectionsXrefScreen/CollectionsXrefScreen';

import './Router.css';

class Router extends Component {

  componentWillMount() {
    this.props.fetchMetadata();
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
        <Route path="/collections" exact component={CollectionsIndexScreen}/>
        <Route path="/collections/:collectionId" exact component={CollectionScreen}/>
        <Route path="/collections/:collectionId/edit" exact component={CollectionEditScreen}/>
        <Route path="/collections/:collectionId/xref/:otherId" exact component={CollectionsXrefScreen}/>
        <Route path="/search" exact component={SearchScreen}/>
        <Route path="/" exact component={HomeScreen}/>
        <Route component={ErrorScreen}/>
      </Switch>
    );
  }
}

const mapStateToProps = (state) => {
  return state;
};

Router = connect(
  mapStateToProps,
  { fetchMetadata }
)(Router);

export default Router;
