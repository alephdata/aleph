import aleph from '../aleph';

aleph.controller('EntitiesSearchCtrl', ['$scope', '$http', '$timeout', '$anchorScroll', 'Entity', 'Authz', 'Title', 'data', 'metadata',
    function($scope, $http, $timeout, $anchorScroll, Entity, Authz, Title, data, metadata) {

  $scope.authz = Authz;

  $scope.submitSearch = function(form) {
    $scope.query.set('q', $scope.query.state.q);
  };

  $scope.loadOffset = function(offset) {
    $scope.query.set('offset', offset);
    $anchorScroll();
  };

  $scope.$on('$routeUpdate', function() {
    reloadSearch();
  });

  var reloadSearch = function() {
    Entity.search().then(function(data) {
      updateSearch(data);
    });
  };

  var updateSearch = function(data) {
    $scope.result = data.result;
    $scope.query = data.query;

    if (data.query.getQ()) {
      Title.set("'" + data.query.getQ() + "'", "entities");
    } else {
      Title.set("Search databases", "entities");
    }
  };

  updateSearch(data);
}]);
