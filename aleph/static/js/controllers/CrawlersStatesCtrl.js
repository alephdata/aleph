
aleph.controller('CrawlersStatesCtrl', ['$scope', '$location', '$http', '$uibModal', 'Title', 'Source', 'states',
    function($scope, $location, $http, $uibModal, Title, Source, states) {
  // $scope.crawlers = crawlers;
  $scope.states = states;
  Title.set("Crawler Logs", "admin");

  $scope.loadOffset = function(offset) {
    var query = $location.search();
    query.offset = offset;
    $location.search(query);
  };

  $scope.isFiltered = function(error_type) {
    var query = $location.search();
    return query.error_type == error_type;
  };

  $scope.filterType = function(error_type) {
    var query = $location.search();
    if ($scope.isFiltered(error_type)) {
      query.error_type = null;
    } else {
      query.error_type = error_type;
    }
    $location.search(query);
  };

  $scope.showDetail = function(state) {
    var instance = $uibModal.open({
      templateUrl: 'templates/crawler_state_detail.html',
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
