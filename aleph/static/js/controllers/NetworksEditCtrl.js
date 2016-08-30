aleph.controller('NetworksEditCtrl', ['$scope', '$location', '$http', 'Title', 'Authz', 'metadata', 'collection', 'network',
    function($scope, $location, $http, Title, Authz, metadata, collection, network) {

  Title.set(network.label, "collections");
  $scope.authz = Authz;
  $scope.collection = collection;
  $scope.metadata = metadata;
  $scope.network = network;

  $scope.canSave = function(form) {
    return form.$valid;
  };

  $scope.save = function(form) {
    if (!$scope.canSave(form)) {
      return;
    }
    var network = $scope.network.toJSON(),
        url = collection.api_url + '/networks/' + $scope.network.id;
    network.label = $scope.network.label;
    $http.post(url, network).then(function(res) {
      console.log(res);
    }, function(err) {
      console.log('Error', err);
    });
  };
}]);
