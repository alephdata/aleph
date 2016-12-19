import aleph from '../aleph';

aleph.controller('DocumentsSearchCtrl', ['$scope', '$route', '$location', '$timeout', '$anchorScroll', '$http', 'Entity', 'Authz', 'Alert', 'Document', 'Title', 'data', 'peek', 'alerts', 'metadata',
    function($scope, $route, $location, $timeout, $anchorScroll, $http, Entity, Authz, Alert, Document, Title, data, peek, alerts, metadata) {

  $scope.metadata = metadata;
  $scope.peek = peek;
  $scope.collectionFacet = [];
  $scope.authz = Authz;

  $scope.loadOffset = function(offset) {
    $scope.query.set('offset', offset);
    $anchorScroll();
  };

  function getAlert() {
    var alert = {};
    if ($scope.originalText.length >= 3) {
      alert.query_text = $scope.originalText;
    }
    if ($scope.query.getArray('entity').length == 1) {
      alert.entity_id = $scope.query.getArray('entity')[0];
    }
    return alert;
  };

  $scope.hasAlert = function() {
    return Alert.check(getAlert());
  };

  $scope.canCreateAlert = function() {
    if ($scope.result.error) {
      return false;
    }
    return Alert.valid(getAlert());
  };

  $scope.toggleAlert = function() {
    return Alert.toggle(getAlert());
  };

  $scope.hasPeek = function() {
    var query = $scope.query.getQ();
    return query && query.trim().length > 1;
  };

  var initFacets = function(query, result) {
    if (result.error) {
      return;
    }
    $scope.collectionFacet = result.facets.collections.values;
  };

  $scope.$on('$routeUpdate', function() {
    reloadSearch();
  });

  var reloadSearch = function() {
    // $scope.reportLoading(true);
    Document.search().then(function(data) {
      updateSearch(data);
    });
    if ($scope.hasPeek()) {
      Document.peek().then(function(peek) {
        $scope.peek = peek;
      });
    } else {
      $scope.peek = {active: false};
    }

  };

  var updateSearch = function(data) {
    $scope.query = data.query;
    $scope.result = data.result;
    $scope.queryString = data.query.toString();
    $scope.originalText = data.query.state.q ? data.query.state.q : '';

    if ($scope.query.getQ()) {
      Title.set("Search for '" + $scope.query.getQ() + "'", "documents");
    } else {
      Title.set("Search documents", "documents");
    }
    // $scope.reportLoading(false);
  };

  updateSearch(data);
}]);
