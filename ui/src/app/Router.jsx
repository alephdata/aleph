import React, { Component, Suspense } from 'react';
import { Route, Redirect, Switch } from 'react-router-dom';
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
          <Switch>
            <Route path="/oauth" exact component={OAuthScreen} />
            <Route path="/logout" exact component={LogoutScreen} />
            <Route path="/pages/:page" exact component={PagesScreen} />
            <Route path="/activate/:code" exact component={ActivateScreen} />
            <Route path="/entities/:entityId" exact component={EntityScreen} />
            <Redirect from="/text/:documentId" to="/entities/:documentId" />
            <Redirect from="/tabular/:documentId/:sheet" to="/entities/:documentId" />
            <Redirect from="/documents/:documentId" to="/entities/:documentId" />
            <Route path="/datasets" exact component={DatasetIndexScreen} />
            <Redirect from="/sources" to="/datasets" />
            <Route path="/investigations" exact component={InvestigationIndexScreen} />
            <Redirect from="/cases" to="/investigations" />
            <Redirect from="/collections/:collectionId/documents" to="/datasets/:collectionId" />
            <Route path="/datasets/:collectionId" exact component={CollectionScreen} />
            <Route path="/investigations/:collectionId" exact component={InvestigationScreen} />
            <Redirect from="/collections/:collectionId" to="/datasets/:collectionId" />
            <Redirect from="/collections/:collectionId/xref/:otherId" to="/datasets/:collectionId\?filter\:match_collection_id=:otherId#mode=xref" />
            <Redirect from="/datasets/:collectionId/xref/:otherId" to="/datasets/:collectionId\?filter\:match_collection_id=:otherId#mode=xref" />
            <Route path="/profiles/:profileId" exact component={ProfileScreen} />
            <Route path="/diagrams/:entitySetId" exact component={DiagramScreen} />
            <Route path="/diagrams" exact component={EntitySetIndexScreen} />
            <Route path="/lists/:entitySetId" exact component={ListScreen} />
            <Route path="/lists" exact component={EntitySetIndexScreen} />
            <Route path="/timelines/:entitySetId" exact component={TimelineScreen} />
            <Route path="/timelines" exact component={EntitySetIndexScreen} />
            <Route path="/sets/:entitySetId" exact component={EntitySetScreen} />
            <Route path="/search" exact component={SearchScreen} />
            <Route path="/notifications" exact component={NotificationsScreen} />
            <Route path="/alerts" exact component={AlertsScreen} />
            <Route path="/exports" exact component={ExportsScreen} />
            <Route path="/settings" exact component={SettingsScreen} />
            <Route path="/status" exact component={SystemStatusScreen} />
            <Route path="/groups/:groupId" exact component={GroupScreen} />
            <Route path="/" exact component={HomeScreen} />
            <Route component={NotFoundScreen} />
          </Switch>
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
