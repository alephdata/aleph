import React, { Component, Suspense } from 'react';
import { Route, Navigate, Routes } from 'react-router-dom';
import { connect } from 'react-redux';
import { Spinner } from '@blueprintjs/core';

import { fetchMetadata, fetchMessages } from 'actions';
import {
  selectSession,
  selectMetadata,
  selectMessages,
  selectPinnedMessage,
} from 'selectors';
import Navbar from 'components/Navbar/Navbar';
import MessageBanner from 'components/MessageBanner/MessageBanner';

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

const MESSAGES_INTERVAL = 10 * 1000; // every 10 seconds

class Router extends Component {
  componentDidMount() {
    this.fetchIfNeeded();

    this.setState(() => ({
      messagesInterval: setInterval(
        () => this.props.fetchMessages(),
        MESSAGES_INTERVAL
      ),
    }));
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  componentWillUnmount() {
    if (this.state?.messagesInterval) {
      clearInterval(this.state.messagesInterval);
    }
  }

  fetchIfNeeded() {
    const { metadata, messages } = this.props;

    if (metadata.shouldLoad) {
      this.props.fetchMetadata();
    }

    if (messages.shouldLoad) {
      this.props.fetchMessages();
    }
  }

  render() {
    const { metadata, session, pinnedMessage } = this.props;
    const isLoaded = metadata && metadata.app && session;

    const Loading = (
      <div className="RouterLoading">
        <div className="spinner">
          <Spinner className="bp3-large" />
        </div>
      </div>
    );

    if (!isLoaded) {
      return Loading;
    }

    return (
      <>
        <Navbar />
        <MessageBanner message={pinnedMessage} />
        <Suspense fallback={Loading}>
          <Routes>
            <Route path="oauth" element={<OAuthScreen />} />
            <Route path="logout" element={<LogoutScreen />} />
            <Route path="pages/:page" element={<PagesScreen />} />
            <Route path="activate/:code" element={<ActivateScreen />} />
            <Route path="entities/:entityId" element={<EntityScreen />} />
            <Route
              path="text/:documentId"
              render={() => <Navigate to="/entities/:documentId" replace />}
            />
            <Route
              path="tabular/:documentId/:sheet"
              render={() => <Navigate to="/entities/:documentId" replace />}
            />
            <Route
              path="documents/:documentId"
              render={() => <Navigate to="/entities/:documentId" replace />}
            />
            <Route path="datasets" element={<DatasetIndexScreen />} />
            <Route
              path="sources"
              render={() => <Navigate to="/datasets" replace />}
            />
            <Route
              path="investigations"
              element={<InvestigationIndexScreen />}
            />
            <Route
              path="cases"
              render={() => <Navigate to="/investigations" replace />}
            />
            <Route
              path="collections/:collectionId/documents"
              render={() => <Navigate to="/datasets/:collectionId" replace />}
            />
            <Route
              path="datasets/:collectionId"
              element={<CollectionScreen />}
            />
            <Route
              path="investigations/:collectionId"
              element={<InvestigationScreen />}
            />
            <Route
              path="collections/:collectionId"
              render={() => <Navigate to="/datasets/:collectionId" replace />}
            />
            <Route
              path="collections/:collectionId/xref/:otherId"
              render={() => (
                <Navigate
                  to="/datasets/:collectionId\?filter\:match_collection_id=:otherId#mode=xref"
                  replace
                />
              )}
            />
            <Route
              path="datasets/:collectionId/xref/:otherId"
              render={() => (
                <Navigate
                  to="/datasets/:collectionId\?filter\:match_collection_id=:otherId#mode=xref"
                  replace
                />
              )}
            />
            <Route path="profiles/:profileId" element={<ProfileScreen />} />
            <Route path="diagrams/:entitySetId" element={<DiagramScreen />} />
            <Route path="diagrams" element={<EntitySetIndexScreen />} />
            <Route path="lists/:entitySetId" element={<ListScreen />} />
            <Route path="lists" element={<EntitySetIndexScreen />} />
            <Route path="timelines/:entitySetId" element={<TimelineScreen />} />
            <Route path="timelines" element={<EntitySetIndexScreen />} />
            <Route path="sets/:entitySetId" element={<EntitySetScreen />} />
            <Route path="search" element={<SearchScreen />} />
            <Route path="notifications" element={<NotificationsScreen />} />
            <Route path="alerts" element={<AlertsScreen />} />
            <Route path="exports" element={<ExportsScreen />} />
            <Route path="settings" element={<SettingsScreen />} />
            <Route path="status" element={<SystemStatusScreen />} />
            <Route path="groups/:groupId" element={<GroupScreen />} />
            <Route path="/" element={<HomeScreen />} />
            <Route path="*" element={<NotFoundScreen />} />
          </Routes>
        </Suspense>
      </>
    );
  }
}

const mapStateToProps = (state) => ({
  metadata: selectMetadata(state),
  messages: selectMessages(state),
  pinnedMessage: selectPinnedMessage(state),
  session: selectSession(state),
});

export default connect(mapStateToProps, {
  fetchMetadata,
  fetchMessages,
})(Router);
