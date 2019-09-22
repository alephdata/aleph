import React, { Component, Suspense } from 'react';
import { Route, Redirect, Switch } from 'react-router-dom';
import { connect } from 'react-redux';
import { Spinner } from '@blueprintjs/core';

import { fetchMetadata as fetchMetadataAction } from 'src/actions';
import { selectSession, selectMetadata } from 'src/selectors';
import './Router.scss';
import NotFoundScreen from 'src/screens/NotFoundScreen/NotFoundScreen';

import OAuthScreen from 'src/screens/OAuthScreen/OAuthScreen';
import LogoutScreen from 'src/screens/LogoutScreen/LogoutScreen';
import ActivateScreen from 'src/screens/ActivateScreen/ActivateScreen';
import HomeScreen from 'src/screens/HomeScreen/HomeScreen';
import SearchScreen from 'src/screens/SearchScreen/SearchScreen';
import NotificationsScreen from 'src/screens/NotificationsScreen/NotificationsScreen';
import HistoryScreen from 'src/screens/HistoryScreen/HistoryScreen';
import SettingsScreen from 'src/screens/SettingsScreen/SettingsScreen';
import SystemStatusScreen from 'src/screens/SystemStatusScreen/SystemStatusScreen';
import GroupScreen from 'src/screens/GroupScreen/GroupScreen';
import CasesIndexScreen from 'src/screens/CasesIndexScreen/CasesIndexScreen';
import CollectionIndexScreen from 'src/screens/CollectionIndexScreen/CollectionIndexScreen';
import CollectionScreen from 'src/screens/CollectionScreen/CollectionScreen';
import CollectionXrefMatchesScreen from 'src/screens/CollectionXrefMatchesScreen/CollectionXrefMatchesScreen';
import EntityScreen from 'src/screens/EntityScreen/EntityScreen';


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
          <Route path="/datasets" exact component={CollectionIndexScreen} />
          <Redirect from="/sources" to="/datasets" />
          <Route path="/cases" exact component={CasesIndexScreen} />
          <Redirect from="/collections/:collectionId/documents" to="/datasets/:collectionId" />
          <Route path="/datasets/:collectionId" exact component={CollectionScreen} />
          <Redirect from="/collections/:collectionId" to="/datasets/:collectionId" />
          <Redirect from="/collections/:collectionId/xref/:otherId" to="/datasets/:collectionId/xref/:otherId" />
          <Route path="/datasets/:collectionId/xref/:otherId" exact component={CollectionXrefMatchesScreen} />
          <Route path="/search" exact component={SearchScreen} />
          <Route path="/notifications" exact component={NotificationsScreen} />
          <Route path="/history" exact component={HistoryScreen} />
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
