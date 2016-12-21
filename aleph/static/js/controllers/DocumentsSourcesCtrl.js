import aleph from '../aleph';

aleph.controller('DocumentsSourcesCtrl', ['$scope', '$route', '$location', '$anchorScroll', 'Title', 'Collection', 'collections', 'metadata',
    function($scope, $route, $location, $anchorScroll, Title, Collection, collections, metadata) {

  Title.set("Document sources", "documents");

  $scope.search = {};
  $scope.query = collections.query;
  $scope.collections = collections.result;
  $scope.metadata = metadata;

  $scope.submitSearch = function(form) {
    $location.path('/documents');
    $location.search($scope.search);
  };

  $scope.$on('$routeUpdate', function() {
    Collection.search({
      managed: true,
      counts: true,
      facet: ['countries', 'category']
    }).then(function(data) {
      updateSearch(data)
    });
  });

  $scope.loadOffset = function(offset) {
    $scope.query.set('offset', offset);
    $anchorScroll();
  };

  var updateSearch = function(data) {
    $scope.query = data.query;
    $scope.collections = data.result;
  };

  updateSearch(collections);
}]);
