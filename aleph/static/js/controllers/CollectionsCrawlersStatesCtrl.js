
aleph.controller('CollectionsCrawlersStatesCtrl', ['$scope', '$route', '$location', '$http', '$uibModal', 'Title', 'states', 'collection',
    function($scope, $route, $location, $http, $uibModal, Title, states, collection) {
  
  $scope.collection = collection;
  $scope.states = states;
  Title.set("Crawler Logs: " + collection.label, "collection");

  $scope.loadOffset = function(offset) {
    var query = $location.search();
    query.offset = offset;
    $location.search(query);
  };

  $scope.reload = function() {
    $route.reload();
  };

  $scope.showDetail = function(state) {
    var instance = $uibModal.open({
      templateUrl: 'templates/crawlers/state_detail.html',
      controller: 'CrawlersStateDetailCtrl',
      backdrop: true,
      size: 'lg',
      resolve: {
        state: function() {
          return state;
        }
      }
    });
  };
}]);
