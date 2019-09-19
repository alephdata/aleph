import React, { Component, Suspense, lazy } from 'react';
import { Route, Redirect, Switch } from 'react-router-dom';
import { connect } from 'react-redux';
import { Spinner } from '@blueprintjs/core';

import { fetchMetadata as fetchMetadataAction } from 'src/actions';
import { selectSession, selectMetadata } from 'src/selectors';
import './Router.scss';


const NotFoundScreen = lazy(() => import(/* webpackChunkName: 'base' */ 'src/screens/NotFoundScreen/NotFoundScreen'));
const OAuthScreen = lazy(() => import(/* webpackChunkName: 'base' */ 'src/screens/OAuthScreen/OAuthScreen'));
const LogoutScreen = lazy(() => import(/* webpackChunkName: 'base' */ 'src/screens/LogoutScreen/LogoutScreen'));
const ActivateScreen = lazy(() => import(/* webpackChunkName: 'base' */ 'src/screens/ActivateScreen/ActivateScreen'));
const HomeScreen = lazy(() => import(/* webpackChunkName: 'base' */ 'src/screens/HomeScreen/HomeScreen'));
const SearchScreen = lazy(() => import(/* webpackChunkName: 'base' */ 'src/screens/SearchScreen/SearchScreen'));
const NotificationsScreen = lazy(() => import(/* webpackChunkName: 'base' */ 'src/screens/NotificationsScreen/NotificationsScreen'));
const HistoryScreen = lazy(() => import(/* webpackChunkName: 'base' */ 'src/screens/HistoryScreen/HistoryScreen'));
const SettingsScreen = lazy(() => import(/* webpackChunkName: 'base' */ 'src/screens/SettingsScreen/SettingsScreen'));
const SystemStatusScreen = lazy(() => import(/* webpackChunkName: 'base' */ 'src/screens/SystemStatusScreen/SystemStatusScreen'));
const SourcesIndexScreen = lazy(() => import(/* webpackChunkName: 'base' */ 'src/screens/SourcesIndexScreen/SourcesIndexScreen'));
const GroupSourcesScreen = lazy(() => import(/* webpackChunkName: 'base' */ 'src/screens/GroupSourcesScreen/GroupSourcesScreen'));
const CasesIndexScreen = lazy(() => import(/* webpackChunkName: 'base' */ 'src/screens/CasesIndexScreen/CasesIndexScreen'));
const CollectionScreen = lazy(() => import(/* webpackChunkName: 'base' */ 'src/screens/CollectionScreen/CollectionScreen'));
const CollectionXrefMatchesScreen = lazy(() => import(/* webpackChunkName: 'base' */ 'src/screens/CollectionXrefMatchesScreen/CollectionXrefMatchesScreen'));
const EntityScreen = lazy(() => import(/* webpackChunkName: 'base' */ 'src/screens/EntityScreen/EntityScreen'));


class Router extends Component {
  componentDidMount() {
    const { metadata, fetchMetadata } = this.props;
    if (!metadata.app) {
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
          <Route path="/activate/:code" exact component={ActivateScreen} />
          <Route path="/entities/:entityId" exact component={EntityScreen} />
          <Redirect from="/text/:documentId" to="/entities/:documentId" />
          <Redirect from="/tabular/:documentId/:sheet" to="/entities/:documentId" />
          <Redirect from="/documents/:documentId" to="/entities/:documentId" />
          <Route path="/sources" exact component={SourcesIndexScreen} />
          <Route path="/group/:groupId" exact component={GroupSourcesScreen} />
          <Route path="/cases" exact component={CasesIndexScreen} />
          <Redirect from="/collections/:collectionId/documents" to="/collections/:collectionId" />
          <Route path="/collections/:collectionId" exact component={CollectionScreen} />
          <Route path="/collections/:collectionId/xref/:otherId" exact component={CollectionXrefMatchesScreen} />
          <Route path="/search" exact component={SearchScreen} />
          <Route path="/notifications" exact component={NotificationsScreen} />
          <Route path="/history" exact component={HistoryScreen} />
          <Route path="/settings" exact component={SettingsScreen} />
          <Route path="/status" exact component={SystemStatusScreen} />
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
