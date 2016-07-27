
aleph.controller('CollectionsIndexCtrl', ['$scope', '$http', '$route', '$timeout', '$anchorScroll', 'Query', 'Collection', 'collections', 'metadata', 'Authz', 'Alert', 'Title',
    function($scope, $http, $route, $timeout, $anchorScroll, Query, Collection, collections, metadata, Authz, Alert, Title) {

  var updateTimeout = null;
  $scope.authz = Authz;
  $scope.collections = [];
  $scope.metadata = metadata;

  Title.set("Collections", "collections");

  $scope.createCollection = function($event) {
    $event.stopPropagation();
    Collection.create({
      'generate_entities': true,
      'category': 'investigation'
    }).then(function() {
      $route.reload();
    });
  };

  $scope.updateQuery = function() {
    $timeout.cancel(updateTimeout);
    $timeout(function() {
      $scope.query.set('q', $scope.query.state.q);
    }, 100);
  };

  var updateFilters = function() {
    $scope.query = Query.parse();
    var filterText = $scope.query.getQ() || '';
    filterText = filterText.toLowerCase();
    var colls = collections.filter(function(coll) {
      return coll.label.toLowerCase().indexOf(filterText) != -1;
    });

    // calculate category facets
    var categories = {};
    angular.forEach(colls, function(coll) {
      if (coll.category) {
        if (!categories[coll.category]) {
          categories[coll.category] = 1;
        } else {
          categories[coll.category] += 1;
        }  
      }
    });
    $scope.categories = categories;

    var categoryFilter = $scope.query.getArray('category');
    $scope.collections = colls.filter(function(coll) {
      if (!categoryFilter.length) {
        return true
      }
      return categoryFilter.indexOf(coll.category) != -1;
    });
  };

  $scope.$on('$routeUpdate', function() {
    updateFilters();
  });

  updateFilters();
}]);
