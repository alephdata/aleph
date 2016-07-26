aleph.controller('CollectionsViewCtrl', ['$scope', '$location', '$http', 'Collection', 'collection', 'metadata',
    function($scope, $location, $http, Collection, collection, roles, metadata) {
  
  $scope.collection = collection;

}]);
