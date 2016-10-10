aleph.controller('CollectionsNetworksCtrl', ['$scope', '$location', '$http', '$route', '$anchorScroll', 'Title', 'Collection', 'Network', 'Authz', 'collection', 'metadata', 'networks',
    function($scope, $location, $http, $route, $anchorScroll, Title, Collection, Network, Authz, collection, metadata, networks) {

  $scope.collection = collection;
  $scope.networks = networks;
  $scope.metadata = metadata;
  $scope.authz = Authz;
  Title.set(collection.label, "collections");

  $scope.delete = function(network) {
    Network.delete(network).then(function() {
      $route.reload();
    });
  };

  $scope.loadOffset = function(offset) {
    $scope.query.set('offset', offset);
    $anchorScroll();
  };
}]);
