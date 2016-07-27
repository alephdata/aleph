aleph.controller('CollectionsEditCtrl', ['$scope', '$location', '$http', '$routeParams',
                                         'Validation', 'Collection', 'Title', 'collection', 'roles', 'metadata',
    function($scope, $location, $http, $routeParams, Validation, Collection, Title, collection, roles, metadata) {
  
  $scope.collection = collection;
  $scope.roles = roles.filter(function(r) {
    return r.type == 'user';
  });
  $scope.categories = metadata.categories;

  Title.set("Settings: " + collection.label, "collections");

  $scope.delete = function() {
    Collection.delete(collection).then(function() {
      $location.path('/collections');
    });
  };
  
  $scope.process = function() {
    var url ='/api/1/collections/' + $scope.collection.id + '/process';
    $http.post(url).then(function() {
      $location.path('/collections/' + collection.id);
    });
  };

  $scope.save = function(form) {
    var res = $http.post(collection.api_url, $scope.collection);
    res.success(function(data) {
      $scope.$on('permissionsSaved', function() {
        Collection.flush().then(function() {
          $location.path('/collections/' + collection.id);
        });
      });
      $scope.$broadcast('savePermissions', data.data);
    });
    res.error(Validation.handle(form));
  };

}]);
