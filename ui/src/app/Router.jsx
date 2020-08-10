import React, { Component, Suspense } from 'react';
import { Route, Redirect, Switch } from 'react-router-dom';
import { connect } from 'react-redux';
import { Spinner } from '@blueprintjs/core';

import { fetchMetadata as fetchMetadataAction } from 'actions';
import { selectSession, selectMetadata } from 'selectors';
import NotFoundScreen from 'screens/NotFoundScreen/NotFoundScreen';

import OAuthScreen from 'screens/OAuthScreen/OAuthScreen';
import LogoutScreen from 'screens/LogoutScreen/LogoutScreen';
import ActivateScreen from 'screens/ActivateScreen/ActivateScreen';
import HomeScreen from 'screens/HomeScreen/HomeScreen';
import SearchScreen from 'screens/SearchScreen/SearchScreen';
import NotificationsScreen from 'screens/NotificationsScreen/NotificationsScreen';
import PagesScreen from 'screens/PagesScreen/PagesScreen';
import HistoryScreen from 'screens/HistoryScreen/HistoryScreen';
import AlertsScreen from 'screens/AlertsScreen/AlertsScreen';
import SettingsScreen from 'screens/SettingsScreen/SettingsScreen';
import SystemStatusScreen from 'screens/SystemStatusScreen/SystemStatusScreen';
import GroupScreen from 'screens/GroupScreen/GroupScreen';
import CasesIndexScreen from 'screens/CasesIndexScreen/CasesIndexScreen';
import CollectionIndexScreen from 'screens/CollectionIndexScreen/CollectionIndexScreen';
import CollectionScreen from 'screens/CollectionScreen/CollectionScreen';
import DiagramIndexScreen from 'screens/DiagramIndexScreen/DiagramIndexScreen';
import DiagramScreen from 'screens/DiagramScreen/DiagramScreen';
import EntityScreen from 'screens/EntityScreen/EntityScreen';

import './Router.scss';


class Router extends Component {
  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { metadata, fetchMetadata } = this.props;
    if (metadata.shouldLoad) {
      fetchMetadata();
    }
  }

  render() {
    const { metadata, session } = this.props;
    const isLoaded = metadata && metadata.app && session;

    const Loading = (
      <div className="RouterLoading">
        <div className="spinner"><Spinner className="bp3-large" /></div>
      </div>
    );
    if (!isLoaded) {
      return Loading;
    }

    return (
      <Suspense fallback={Loading}>
        <Switch>
          <Route path="/oauth" exact component={OAuthScreen} />
          <Route path="/logout" exact component={LogoutScreen} />
          <Route path="/pages/:page" exact component={PagesScreen} />
          <Route path="/activate/:code" exact component={ActivateScreen} />
          <Route path="/entities/:entityId" exact component={EntityScreen} />
          <Redirect from="/text/:documentId" to="/entities/:documentId" />
          <Redirect from="/tabular/:documentId/:sheet" to="/entities/:documentId" />
          <Redirect from="/documents/:documentId" to="/entities/:documentId" />
          <Route path="/datasets" exact component={CollectionIndexScreen} />
          <Redirect from="/sources" to="/datasets" />
          <Route path="/cases" exact component={CasesIndexScreen} />
          <Redirect from="/collections/:collectionId/documents" to="/datasets/:collectionId" />
          <Route path="/datasets/:collectionId" exact component={CollectionScreen} />
          <Redirect from="/collections/:collectionId" to="/datasets/:collectionId" />
          <Redirect from="/collections/:collectionId/xref/:otherId" to="/datasets/:collectionId\?filter\:match_collection_id=:otherId#mode=xref" />
          <Redirect from="/datasets/:collectionId/xref/:otherId" to="/datasets/:collectionId\?filter\:match_collection_id=:otherId#mode=xref" />
          <Route path="/diagrams/:diagramId" exact component={DiagramScreen} />
          <Route path="/diagrams" exact component={DiagramIndexScreen} />
          <Route path="/search" exact component={SearchScreen} />
          <Route path="/notifications" exact component={NotificationsScreen} />
          <Route path="/history" exact component={HistoryScreen} />
          <Route path="/alerts" exact component={AlertsScreen} />
          <Route path="/settings" exact component={SettingsScreen} />
          <Route path="/status" exact component={SystemStatusScreen} />
          <Route path="/groups/:groupId" exact component={GroupScreen} />
          <Route path="/" exact component={HomeScreen} />
          <Route component={NotFoundScreen} />
        </Switch>
      </Suspense>
    );
  }
}

const mapStateToProps = state => ({
  metadata: selectMetadata(state),
  session: selectSession(state),
});


export default connect(mapStateToProps, { fetchMetadata: fetchMetadataAction })(Router);
