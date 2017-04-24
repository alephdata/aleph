import aleph from '../aleph';

aleph.controller('CollectionsEditCtrl', ['$scope', '$q', '$location', '$http', '$routeParams', 'Collection', 'Metadata', 'Role', 'Authz', 'Title', 'collection', 'permissions', 'metadata',
    function($scope, $q, $location, $http, $routeParams, Collection, Metadata, Role, Authz, Title, collection, permissions, metadata) {

  $scope.authz = Authz;
  $scope.collection = collection;
  $scope.metadata = metadata;
  $scope.permissions = permissions;
  $scope.categories = metadata.categories;
  $scope.newPermission = {};
  $scope.roleTypes = [
    {type: 'system', label: 'States'},
    {type: 'group', label: 'Groups'},
    {type: 'user', label: 'Users'},
  ];

  Title.set("Settings: " + collection.label, "collections");

  $scope.suggestRole = function($value) {
    return Role.suggest($value);
  }

  $scope.addPermission = function($item, $model) {
    $scope.permissions.push({
      'write': true,
      'read': true,
      'dirty': true,
      'role': $item
    });
    $scope.newPermission = {'name': ''};
  };

  $scope.markDirty = function(role) {
    role.dirty = true;
  };

  $scope.delete = function() {
    Collection.delete(collection).then(function() {
      $location.path('/collections');
    });
  };

  $scope.process = function() {
    var url = collection.api_url + '/process';
    $http.post(url).then(function() {
      $location.path('/collections/' + collection.id);
    });
  };

  $scope.save = function(form) {
    var res = $http.post(collection.api_url, $scope.collection);
    res.success(function(data) {
      var qs = [];
      for (var j in $scope.permissions) {
        var permission = $scope.permissions[j];
        if (permission.dirty) {
          qs.push($http.post(collection.api_url + '/permissions', {
            role_id: permission.role.id,
            read: permission.read,
            write: permission.write
          }));
        }
      }

      $q.all(qs).then(function() {
        Metadata.flush().then(function() {
          $location.path('/collections/' + collection.id);
        });
      });
    });
  };
}]);
