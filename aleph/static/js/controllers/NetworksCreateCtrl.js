aleph.controller('NetworksCreateCtrl', ['$scope', '$location', '$http', 'Title', 'Authz', 'metadata', 'collection', 'network',
    function($scope, $location, $http, Title, Authz, metadata, collection, network) {

  Title.set(collection.label, "collections");
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
        url = collection.api_url + '/networks';
    network.label = $scope.network.label;
    $http.post(url, network).then(function(res) {
      var path = '/collections/' + collection.id + '/networks/' + res.data.id;
      $location.search({});
      $location.path(path);
    }, function(err) {
      console.log('Error', err);
    });
  };
}]);
