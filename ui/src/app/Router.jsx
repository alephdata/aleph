import React, { Component, Suspense } from 'react';
import { Route, Redirect, Routes } from 'react-router-dom';
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
            <Route path="/oauth" exact children={<OAuthScreen />} />
            <Route path="/logout" exact children={<LogoutScreen />} />
            <Route path="/pages/:page" exact children={<PagesScreen />} />
            <Route path="/activate/:code" exact children={<ActivateScreen />} />
            <Route path="/entities/:entityId" exact children={<EntityScreen />} />
            <Route path="/text/:documentId" render={() => <Redirect to="/entities/:documentId" />} />
            <Route path="/tabular/:documentId/:sheet" render={() => <Redirect to="/entities/:documentId" />} />
            <Route path="/documents/:documentId" render={() => <Redirect to="/entities/:documentId" />} />
            <Route path="/datasets" exact children={<DatasetIndexScreen />} />
            <Route path="/sources" render={() => <Redirect to="/datasets" />} />
            <Route path="/investigations" exact children={<InvestigationIndexScreen />} />
            <Route path="/cases" render={() => <Redirect to="/investigations" />} />
            <Route path="/collections/:collectionId/documents" render={() => <Redirect to="/datasets/:collectionId" />} />
            <Route path="/datasets/:collectionId" exact children={<CollectionScreen />} />
            <Route path="/investigations/:collectionId" exact children={<InvestigationScreen />} />
            <Route path="/collections/:collectionId" render={() => <Redirect to="/datasets/:collectionId" />} />
            <Route path="/collections/:collectionId/xref/:otherId" render={() => <Redirect to="/datasets/:collectionId\?filter\:match_collection_id=:otherId#mode=xref" />} />
            <Route path="/datasets/:collectionId/xref/:otherId" render={() => <Redirect to="/datasets/:collectionId\?filter\:match_collection_id=:otherId#mode=xref" />} />
            <Route path="/profiles/:profileId" exact children={<ProfileScreen />} />
            <Route path="/diagrams/:entitySetId" exact children={<DiagramScreen />} />
            <Route path="/diagrams" exact children={<EntitySetIndexScreen />} />
            <Route path="/lists/:entitySetId" exact children={<ListScreen />} />
            <Route path="/lists" exact children={<EntitySetIndexScreen />} />
            <Route path="/timelines/:entitySetId" exact children={<TimelineScreen />} />
            <Route path="/timelines" exact children={<EntitySetIndexScreen />} />
            <Route path="/sets/:entitySetId" exact children={<EntitySetScreen />} />
            <Route path="/search" exact children={<SearchScreen />} />
            <Route path="/notifications" exact children={<NotificationsScreen />} />
            <Route path="/alerts" exact children={<AlertsScreen />} />
            <Route path="/exports" exact children={<ExportsScreen />} />
            <Route path="/settings" exact children={<SettingsScreen />} />
            <Route path="/status" exact children={<SystemStatusScreen />} />
            <Route path="/groups/:groupId" exact children={<GroupScreen />} />
            <Route path="/" exact children={<HomeScreen />} />
            <Route children={<NotFoundScreen />} />
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
