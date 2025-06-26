import React, { Component, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { connect } from 'react-redux';
import { Button, Spinner, Classes } from '@blueprintjs/core';
import { FormattedMessage, injectIntl } from 'react-intl';

import {
  fetchMetadata,
  fetchMessages,
  dismissMessage,
} from '/src/actions/index.js';
import {
  selectSession,
  selectMetadata,
  selectMessages,
  selectPinnedMessage,
} from '/src/selectors.js';
import { routes as legacyRedirects } from '/src/app/legacyRedirects.js';
import Navbar from '/src/components/Navbar/Navbar.jsx';
import MessageBanner from '/src/components/MessageBanner/MessageBanner.jsx';

import NotFoundScreen from '/src/screens/NotFoundScreen/NotFoundScreen.jsx';
import OAuthScreen from '/src/screens/OAuthScreen/OAuthScreen.jsx';
import LogoutScreen from '/src/screens/LogoutScreen/LogoutScreen.jsx';
import ActivateScreen from '/src/screens/ActivateScreen/ActivateScreen.jsx';
import HomeScreen from '/src/screens/HomeScreen/HomeScreen.jsx';
import SearchScreen from '/src/screens/SearchScreen/SearchScreen.jsx';
import NotificationsScreen from '/src/screens/NotificationsScreen/NotificationsScreen.jsx';
import PagesScreen from '/src/screens/PagesScreen/PagesScreen.jsx';
import AlertsScreen from '/src/screens/AlertsScreen/AlertsScreen.jsx';
import SettingsScreen from '/src/screens/SettingsScreen/SettingsScreen.jsx';
import SystemStatusScreen from '/src/screens/SystemStatusScreen/SystemStatusScreen.jsx';
import GroupScreen from '/src/screens/GroupScreen/GroupScreen.jsx';
import InvestigationIndexScreen from '/src/screens/InvestigationIndexScreen/InvestigationIndexScreen.jsx';
import DatasetIndexScreen from '/src/screens/DatasetIndexScreen/DatasetIndexScreen.jsx';
import CollectionScreen from '/src/screens/CollectionScreen/CollectionScreen.jsx';
import InvestigationScreen from '/src/screens/InvestigationScreen/InvestigationScreen.jsx';
import EntitySetIndexScreen from '/src/screens/EntitySetIndexScreen/EntitySetIndexScreen.jsx';
import DiagramScreen from '/src/screens/DiagramScreen/DiagramScreen.jsx';
import ProfileScreen from '/src/screens/ProfileScreen/ProfileScreen.jsx';
import ListScreen from '/src/screens/ListScreen/ListScreen.jsx';
import TimelineScreen from '/src/screens/TimelineScreen/TimelineScreen.jsx';
import EntitySetScreen from '/src/screens/EntitySetScreen/EntitySetScreen.jsx';
import EntityScreen from '/src/screens/EntityScreen/EntityScreen.jsx';
import ExportsScreen from '/src/screens/ExportsScreen/ExportsScreen.jsx';

import './Router.scss';

const MESSAGES_INTERVAL = 15 * 60 * 1000; // every 15 minutes

class Router extends Component {
  componentDidMount() {
    this.fetchIfNeeded();
    this.setMessagesInterval();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  componentWillUnmount() {
    this.clearMessagesInterval();
  }

  fetchIfNeeded() {
    const { metadata, messages } = this.props;

    if (
      metadata.shouldLoad &&
      (!metadata.isError || metadata.error?.response?.status === 401)
    ) {
      this.props.fetchMetadata();
    }

    if (messages.shouldLoad && !messages.isError) {
      this.fetchMessages();
    }
  }

  fetchMessages() {
    const { metadata } = this.props;

    if (metadata?.app?.messages_url) {
      this.props.fetchMessages(metadata.app.messages_url);
    }
  }

  setMessagesInterval() {
    const id = setInterval(() => this.fetchMessages(), MESSAGES_INTERVAL);
    this.setState(() => ({ messagesInterval: id }));
  }

  clearMessagesInterval() {
    if (this.state?.messagesInterval) {
      clearInterval(this.state.messagesInterval);
    }
  }

  render() {
    const { metadata, session, pinnedMessage, dismissMessage } = this.props;
    const isLoaded = metadata && metadata.app && session;

    if (metadata.isError) {
      return (
        <div className="Router">
          <div className="Router__error">
            <p className={Classes.TEXT_LARGE}>
              <FormattedMessage
                id="router.error.message"
                defaultMessage="Sorry, something went wrong and Aleph couldn’t load. Please try again in a few minutes or contact an administrator if the error persists."
              />
            </p>
            <Button large icon="reset" onClick={() => window.location.reload()}>
              <FormattedMessage
                id="router.error.retry"
                defaultMessage="Retry"
              />
            </Button>
          </div>
        </div>
      );
    }

    const loading = (
      <div className="Router">
        <div className="Router__spinner">
          <Spinner className={Classes.LARGE} />
        </div>
      </div>
    );

    if (!isLoaded) {
      return loading;
    }

    return (
      <>
        <Navbar />
        <MessageBanner message={pinnedMessage} onDismiss={dismissMessage} />
        <Suspense fallback={loading}>
          <Routes>
            <Route path="oauth" element={<OAuthScreen />} />
            <Route path="logout" element={<LogoutScreen />} />
            <Route path="pages/:page" element={<PagesScreen />} />
            <Route path="activate/:code" element={<ActivateScreen />} />
            <Route path="entities/:entityId" element={<EntityScreen />} />
            <Route path="datasets" element={<DatasetIndexScreen />} />
            <Route
              path="investigations"
              element={<InvestigationIndexScreen />}
            />
            <Route
              path="datasets/:collectionId"
              element={<CollectionScreen />}
            />
            <Route
              path="investigations/:collectionId"
              element={<InvestigationScreen />}
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
            {legacyRedirects}
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
  dismissMessage,
  injectIntl,
})(Router);
