import React, { Component, Suspense, lazy } from 'react';
import { Route, Switch } from 'react-router-dom';
import { connect } from 'react-redux';
import { Spinner } from '@blueprintjs/core';

import { fetchMetadata } from 'src/actions';
import { selectSession, selectMetadata } from 'src/selectors';
import './Router.scss';


const  NotFoundScreen = lazy(()=> import(/* webpackChunkName: 'NotFoundScreen' */ 'src/screens/NotFoundScreen/NotFoundScreen'));
const OAuthScreen = lazy(()=> import(/* webpackChunkName: 'OAuthScreen' */ "src/screens/OAuthScreen/OAuthScreen"));
const LogoutScreen  = lazy(()=> import(/* webpackChunkName: 'LogoutScreen' */ 'src/screens/LogoutScreen/LogoutScreen'));
const ActivateScreen = lazy(() => import(/* webpackChunkName: 'ActivateScreen' */ 'src/screens/ActivateScreen/ActivateScreen'));
const HomeScreen = lazy(()=> import(/* webpackChunkName: 'HomeScreen' */ 'src/screens/HomeScreen/HomeScreen'));
const SearchScreen = lazy(()=> import(/* webpackChunkName: 'SearchScreen' */ 'src/screens/SearchScreen/SearchScreen'));
const NotificationsScreen  = lazy(()=> import(/* webpackChunkName: 'NotificationsScreen' */ 'src/screens/NotificationsScreen/NotificationsScreen'));
const SourcesIndexScreen  = lazy(()=> import(/* webpackChunkName: 'SourcesIndexScreen' */ 'src/screens/SourcesIndexScreen/SourcesIndexScreen'));
const CasesIndexScreen  = lazy(()=> import(/* webpackChunkName: 'CasesIndexScreen' */ 'src/screens/CasesIndexScreen/CasesIndexScreen'));
// import CaseScreen from 'src/screens/CaseScreen/CaseScreen';
const CollectionScreen  = lazy(()=> import(/* webpackChunkName: 'CollectionScreen' */ 'src/screens/CollectionScreen/CollectionScreen'));
const CollectionDocumentsScreen  = lazy(()=> import(/* webpackChunkName: 'CollectionDocumentsScreen' */ 'src/screens/CollectionDocumentsScreen/CollectionDocumentsScreen'));
const CollectionXrefMatchesScreen  = lazy(()=> import(/* webpackChunkName: 'CollectionXrefMatchesScreen' */ 'src/screens/CollectionXrefMatchesScreen/CollectionXrefMatchesScreen'));
const EntityScreen  = lazy(()=> import(/* webpackChunkName: 'EntityScreen' */ 'src/screens/EntityScreen/EntityScreen'));
const DocumentScreen  = lazy(()=> import(/* webpackChunkName: 'DocumentScreen' */ 'src/screens/DocumentScreen/DocumentScreen'));
const  DocumentRedirectScreen  = lazy(()=> import(/* webpackChunkName: 'DocumentRedirectScreen' */ 'src/screens/DocumentRedirectScreen/DocumentRedirectScreen'));



class Router extends Component {

  componentWillMount() {
    const { metadata } = this.props;
    if (!metadata.app) {
      this.props.fetchMetadata();
    }
  }

  render() {
    const { metadata, session } = this.props;
    const isLoaded = metadata && metadata.app && session;

    const Loading = (
      <div className="RouterLoading">
        <div className="spinner"><Spinner className="bp3-large"/></div>
      </div>
    );
    if (!isLoaded) {
      return Loading;
    }

    return (
      <Suspense fallback={Loading}>
        <Switch>
          <Route path="/oauth" exact component={OAuthScreen}/>
          <Route path="/logout" exact component={LogoutScreen}/>
          <Route path="/activate/:code" exact component={ActivateScreen}/>
          <Route path="/entities/:entityId" exact component={EntityScreen}/>
          <Route path="/documents/:documentId" exact component={DocumentScreen}/>
          <Route path="/text/:documentId" exact component={DocumentRedirectScreen}/>
          <Route path="/tabular/:documentId/:sheet" exact component={DocumentRedirectScreen}/>
          <Route path="/sources" exact component={SourcesIndexScreen}/>
          <Route path="/cases" exact component={CasesIndexScreen}/>
          {/*<Route path="/cases/:collectionId" exact component={CaseScreen}/>*/}
          <Route path="/collections/:collectionId/documents" exact component={CollectionDocumentsScreen}/>
          <Route path="/collections/:collectionId" exact component={CollectionScreen}/>
          <Route path="/collections/:collectionId/xref/:otherId" exact component={CollectionXrefMatchesScreen}/>
          <Route path="/search" exact component={SearchScreen}/>
          <Route path="/notifications" exact component={NotificationsScreen}/>
          <Route path="/" exact component={HomeScreen}/>
          <Route component={NotFoundScreen}/>
        </Switch>
      </Suspense>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    metadata: selectMetadata(state),
    session: selectSession(state)
  };
};

Router = connect(mapStateToProps, { fetchMetadata })(Router);
export default Router;
