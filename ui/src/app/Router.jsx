import React, { Component, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { connect } from 'react-redux';
import { Button, Spinner, Classes } from '@blueprintjs/core';
import { FormattedMessage, injectIntl } from 'react-intl';

import { fetchMetadata, fetchMessages, dismissMessage } from 'actions';
import {
  selectSession,
  selectMetadata,
  selectMessages,
  selectPinnedMessage,
} from 'selectors';
import { routes as legacyRedirects } from 'app/legacyRedirects';
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
