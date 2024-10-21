import { Suspense } from 'react';

import { Route, Routes } from 'react-router-dom';

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
import ExportsScreen from 'screens/ExportsScreen/ExportsScreen';

import Loading from './Loading';

function HappyPath({ pinnedMessage, dismissMessage }) {
  return (
    <>
      <Navbar />
      <MessageBanner message={pinnedMessage} onDismiss={dismissMessage} />
      <Suspense fallback={Loading}>
        <Routes>
          <Route path="oauth" element={<OAuthScreen />} />
          <Route path="logout" element={<LogoutScreen />} />
          <Route path="pages/:page" element={<PagesScreen />} />
          <Route path="activate/:code" element={<ActivateScreen />} />
          <Route path="entities/:entityId" element={<EntityScreen />} />
          <Route path="datasets" element={<DatasetIndexScreen />} />
          <Route path="investigations" element={<InvestigationIndexScreen />} />
          <Route path="datasets/:collectionId" element={<CollectionScreen />} />
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

export default HappyPath;
