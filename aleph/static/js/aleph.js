// Expose some API
require('expose-loader?$!expose-loader?jQuery!jquery');
require('expose-loader?angular!angular');
require('expose-loader?PDFJS!angular-pdf/bower_components/pdfjs-dist/build/pdf.combined.js');

// These modules do not return anything
require('ui-select/dist/select.js');
require('angular-pdf');
require('angular-truncate');

var aleph = angular.module('aleph', [
  require('angular-route'),
  require('angular-animate'),
  require('angular-sanitize'),
  require('angular-ui-bootstrap'),
  require('angular-loading-bar'),
  require('ng-file-upload'),
  'ui.select',
  'truncate',
  'pdf'
]);

import {
  loadDocumentsSearch, loadDocument, loadPeek
} from './loaders/loadDocuments';
import loadMetadata from './loaders/loadMetadata';
import loadAlertsIndex from './loaders/loadAlertsIndex';
import loadTabular from './loaders/loadTabular.js';
import loadDatasets from './loaders/loadDatasets';
import loadPermissions from './loaders/loadPermissions';
import loadStatistics from './loaders/loadHome';
import {loadText, loadPagesQuery} from './loaders/loadText';
import loadCrawlers from './loaders/loadCrawlers';
import {
  loadEntitiesSearch, loadEntity, loadSimilarEntities, loadEntityLinks,
  loadEntityDocuments
} from './loaders/loadEntities';
import {
  loadProjectCollections, loadSourceCollections, loadCollection,
  loadCollectionDocuments, loadCollectionEntities, loadCollectionLeads,
  loadCollectionDeep
} from './loaders/loadCollections';

aleph.config([
  '$routeProvider', '$locationProvider', '$compileProvider',
  'cfpLoadingBarProvider', 'uiSelectConfig',
  function(
    $routeProvider, $locationProvider, $compileProvider, cfpLoadingBarProvider,
    uiSelectConfig
  ){

  $routeProvider.when('/documents', {
    templateUrl: 'templates/documents/search.html',
    controller: 'DocumentsSearchCtrl',
    reloadOnSearch: false,
    resolve: {
      'data': loadDocumentsSearch,
      'peek': loadPeek,
      'metadata': loadMetadata,
      'alerts': loadAlertsIndex
    }
  });

  $routeProvider.when('/documents/sources', {
    templateUrl: 'templates/documents/sources.html',
    controller: 'DocumentsSourcesCtrl',
    reloadOnSearch: false,
    resolve: {
      'collections': loadSourceCollections,
      'metadata': loadMetadata
    }
  });

  $routeProvider.when('/documents/:document_id', {
    templateUrl: 'templates/documents/view.html',
    controller: 'DocumentsViewCtrl',
    reloadOnSearch: false,
    resolve: {
      'doc': loadDocument,
      'metadata': loadMetadata
    }
  });

  $routeProvider.when('/tabular/:document_id/:table_id', {
    templateUrl: 'templates/documents/tabular.html',
    controller: 'TabularCtrl',
    reloadOnSearch: true,
    resolve: {
      'data': loadTabular,
      'metadata': loadMetadata
    }
  });

  $routeProvider.when('/text/:document_id', {
    templateUrl: 'templates/documents/text.html',
    controller: 'TextCtrl',
    reloadOnSearch: false,
    resolve: {
      'data': loadText,
      'metadata': loadMetadata,
      'pages': loadPagesQuery
    }
  });

  $routeProvider.when('/entities', {
    templateUrl: 'templates/entities/search.html',
    controller: 'EntitiesSearchCtrl',
    reloadOnSearch: false,
    resolve: {
      'data': loadEntitiesSearch,
      'metadata': loadMetadata
    }
  });

  $routeProvider.when('/datasets', {
    templateUrl: 'templates/datasets/index.html',
    controller: 'DatasetsIndexCtrl',
    reloadOnSearch: false,
    resolve: {
      'datasets': loadDatasets
    }
  });

  $routeProvider.when('/entities/:entity_id', {
    templateUrl: 'templates/entities/view.html',
    controller: 'EntitiesViewCtrl',
    reloadOnSearch: false,
    resolve: {
      'entity': loadEntity,
      'links': loadEntityLinks,
      'similar': loadSimilarEntities,
      'documents': loadEntityDocuments,
      'metadata': loadMetadata
    }
  });

  $routeProvider.when('/collections', {
    templateUrl: 'templates/collections/index.html',
    controller: 'CollectionsIndexCtrl',
    reloadOnSearch: true,
    resolve: {
      'collections': loadProjectCollections,
      'metadata': loadMetadata
    }
  });

  $routeProvider.when('/collections/:collection_id', {
    templateUrl: 'templates/collections/documents.html',
    controller: 'CollectionsDocumentsCtrl',
    reloadOnSearch: false,
    resolve: {
      'collection': loadCollection,
      'data': loadCollectionDocuments,
      'metadata': loadMetadata
    }
  });

  $routeProvider.when('/collections/:collection_id/entities', {
    templateUrl: 'templates/collections/entities.html',
    controller: 'CollectionsEntitiesCtrl',
    reloadOnSearch: false,
    resolve: {
      'collection': loadCollection,
      'data': loadCollectionEntities,
      'metadata': loadMetadata,
      'alerts': loadAlertsIndex
    }
  });

  $routeProvider.when('/collections/:collection_id/entities/review', {
    templateUrl: 'templates/entities/review.html',
    controller: 'EntitiesReviewCtrl',
    reloadOnSearch: false,
    resolve: {
      'collection': loadCollection,
      'metadata': loadMetadata
    }
  });

  $routeProvider.when('/collections/:collection_id/entities/bulk', {
    templateUrl: 'templates/entities/bulk.html',
    controller: 'EntitiesBulkCtrl',
    reloadOnSearch: false,
    resolve: {
      'collection': loadCollection,
      'metadata': loadMetadata
    }
  });

  $routeProvider.when('/collections/:collection_id/leads', {
    templateUrl: 'templates/collections/leads.html',
    controller: 'CollectionsLeadsCtrl',
    reloadOnSearch: false,
    resolve: {
      'collection': loadCollection,
      'leads': loadCollectionLeads,
      'metadata': loadMetadata
    }
  });

  $routeProvider.when('/collections/:collection_id/settings', {
    templateUrl: 'templates/collections/edit.html',
    controller: 'CollectionsEditCtrl',
    reloadOnSearch: false,
    resolve: {
      'collection': loadCollectionDeep,
      'metadata': loadMetadata,
      'permissions': loadPermissions
    }
  });

  $routeProvider.when('/crawlers', {
    templateUrl: 'templates/crawlers/manage.html',
    controller: 'CrawlersManageCtrl',
    reloadOnSearch: true,
    resolve: {
      'crawlers': loadCrawlers
    }
  });

  $routeProvider.when('/help/:page', {
    templateUrl: 'templates/help.html',
    controller: 'HelpCtrl',
    reloadOnSearch: false,
    resolve: {}
  });

  $routeProvider.when('/help', {
    templateUrl: 'templates/help.html',
    controller: 'HelpCtrl',
    reloadOnSearch: false,
    resolve: {}
  });

  $routeProvider.when('/', {
    templateUrl: 'templates/home.html',
    controller: 'HomeCtrl',
    reloadOnSearch: false,
    resolve: {
      'statistics': loadStatistics,
      'metadata': loadMetadata
    }
  });

  $routeProvider.when('/signup/:code', {
    templateUrl: 'templates/signup.html',
    controller: 'SignupCtrl'
  });

  $locationProvider.html5Mode(true);
  $compileProvider.debugInfoEnabled(false);
  cfpLoadingBarProvider.includeSpinner = false;
  cfpLoadingBarProvider.latencyThreshold = 100;

  uiSelectConfig.theme = 'bootstrap';
}]);

export default aleph;
