import React, { Component, Suspense } from 'react';
import { Route, Navigate, Routes } from 'react-router-dom';
import { connect } from 'react-redux';
import { Spinner } from '@blueprintjs/core';

import { fetchMetadata } from 'actions';
import { selectSession, selectMetadata } from 'selectors';
import Navbar from 'components/Navbar/Navbar';

import NotFoundScreen from 'screens/NotFoundScreen/NotFoundScreen';
import OAuthScreen from 'screens/OAuthScreen/OAuthScreen';
import LogoutScreen from 'screens/LogoutScreen/LogoutScreen';
import ActivateScreen from 'screens/ActivateScreen/ActivateScreen';
import HomeScreen from 'screens/HomeScreen/HomeScreen';
import SearchScreen from 'screens/SearchScreen/SearchScreen';
import NotificationsScreen from 'screens/NotificationsScreen/NotificationsScreen';
import PagesScreen from 'screens/PagesScreen/PagesScreen';
import AlertsScreen from 'screens/AlertsScreen/AlertsScreen';
import SettingsScreen from 'screens/SettingsScreen/SettingsScreen';
import SystemStatusScreen from 'screens/SystemStatusScreen/SystemStatusScreen';
import GroupScreen from 'screens/GroupScreen/GroupScreen';
import InvestigationIndexScreen from 'screens/InvestigationIndexScreen/InvestigationIndexScreen';
import DatasetIndexScreen from 'screens/DatasetIndexScreen/DatasetIndexScreen';
import CollectionScreen from 'screens/CollectionScreen/CollectionScreen';
import InvestigationScreen from 'screens/InvestigationScreen/InvestigationScreen';
import EntitySetIndexScreen from 'screens/EntitySetIndexScreen/EntitySetIndexScreen';
import DiagramScreen from 'screens/DiagramScreen/DiagramScreen';
import ProfileScreen from 'screens/ProfileScreen/ProfileScreen';
import ListScreen from 'screens/ListScreen/ListScreen';
import TimelineScreen from 'screens/TimelineScreen/TimelineScreen';
import EntitySetScreen from 'screens/EntitySetScreen/EntitySetScreen';
import EntityScreen from 'screens/EntityScreen/EntityScreen';
import ExportsScreen from 'src/screens/ExportsScreen/ExportsScreen';

import './Router.scss';


class Router extends Component {
  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { metadata } = this.props;
    if (metadata.shouldLoad) {
      this.props.fetchMetadata();
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
      <>
        <Navbar />
        <Suspense fallback={Loading}>
          <Routes>
            <Route path="/oauth" exact element={<OAuthScreen />} />
            <Route path="/logout" exact element={<LogoutScreen />} />
            <Route path="/pages/:page" exact element={<PagesScreen />} />
            <Route path="/activate/:code" exact element={<ActivateScreen />} />
            <Route path="/entities/:entityId" exact element={<EntityScreen />} />
            <Route path="/text/:documentId" render={() => <Navigate to="/entities/:documentId" replace />} />
            <Route path="/tabular/:documentId/:sheet" render={() => <Navigate to="/entities/:documentId" replace />} />
            <Route path="/documents/:documentId" render={() => <Navigate to="/entities/:documentId" replace />} />
            <Route path="/datasets" exact element={<DatasetIndexScreen />} />
            <Route path="/sources" render={() => <Navigate to="/datasets" replace />} />
            <Route path="/investigations" exact element={<InvestigationIndexScreen />} />
            <Route path="/cases" render={() => <Navigate to="/investigations" replace />} />
            <Route path="/collections/:collectionId/documents" render={() => <Navigate to="/datasets/:collectionId" replace />} />
            <Route path="/datasets/:collectionId" exact element={<CollectionScreen />} />
            <Route path="/investigations/:collectionId" exact element={<InvestigationScreen />} />
            <Route path="/collections/:collectionId" render={() => <Navigate to="/datasets/:collectionId" replace />} />
            <Route path="/collections/:collectionId/xref/:otherId" render={() => <Navigate to="/datasets/:collectionId\?filter\:match_collection_id=:otherId#mode=xref" replace />} />
            <Route path="/datasets/:collectionId/xref/:otherId" render={() => <Navigate to="/datasets/:collectionId\?filter\:match_collection_id=:otherId#mode=xref" replace />} />
            <Route path="/profiles/:profileId" exact element={<ProfileScreen />} />
            <Route path="/diagrams/:entitySetId" exact element={<DiagramScreen />} />
            <Route path="/diagrams" exact element={<EntitySetIndexScreen />} />
            <Route path="/lists/:entitySetId" exact element={<ListScreen />} />
            <Route path="/lists" exact element={<EntitySetIndexScreen />} />
            <Route path="/timelines/:entitySetId" exact element={<TimelineScreen />} />
            <Route path="/timelines" exact element={<EntitySetIndexScreen />} />
            <Route path="/sets/:entitySetId" exact element={<EntitySetScreen />} />
            <Route path="/search" exact element={<SearchScreen />} />
            <Route path="/notifications" exact element={<NotificationsScreen />} />
            <Route path="/alerts" exact element={<AlertsScreen />} />
            <Route path="/exports" exact element={<ExportsScreen />} />
            <Route path="/settings" exact element={<SettingsScreen />} />
            <Route path="/status" exact element={<SystemStatusScreen />} />
            <Route path="/groups/:groupId" exact element={<GroupScreen />} />
            <Route path="/" exact element={<HomeScreen />} />
            <Route element={<NotFoundScreen />} />
          </Routes>
        </Suspense>
      </>
    );
  }
}

const mapStateToProps = state => ({
  metadata: selectMetadata(state),
  session: selectSession(state),
});


export default connect(mapStateToProps, { fetchMetadata })(Router);
