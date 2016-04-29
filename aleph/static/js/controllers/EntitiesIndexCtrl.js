
aleph.controller('EntitiesIndexCtrl', ['$scope', '$route', '$location', '$http', '$uibModal', 'data', 'Authz', 'Alert', 'Metadata', 'Title',
    function($scope, $route, $location, $http, $uibModal, data, Authz, Alert, Metadata, Title) {

  $scope.result = {};
  $scope.fields = data.metadata.fields;
  $scope.error = data.result.error;
  $scope.facets = [];
  $scope.session = data.metadata.session;
  $scope.metadata = data.metadata;
  
  // if (Query.state.q) {
  //   Title.set("Browse for '" + Query.state.q + "'", "entities");
  // } else {
  //   Title.set("Browse entities", "entities");  
  // }
  Title.set("Browse entities", "entities");

}]);
