import aleph from '../aleph';

aleph.controller('CollectionsEditCtrl', ['$scope', '$q', '$location', '$http', '$routeParams', 'Collection', 'Metadata', 'Role', 'Authz', 'Title', 'collection', 'roles', 'metadata',
    function($scope, $q, $location, $http, $routeParams, Collection, Metadata, Role, Authz, Title, collection, roles, metadata) {

  $scope.authz = Authz;
  $scope.collection = collection;
  $scope.metadata = metadata;
  $scope.ownerRoles = roles.filter(function(r) {
    return r.type == 'user';
  });
  $scope.categories = metadata.categories;
  $scope.newRole = null;
  $scope.roleTypes = [
    {type: 'system', label: 'States'},
    {type: 'group', label: 'Groups'},
    {type: 'user', label: 'Users'},
  ];

  Title.set("Settings: " + collection.label, "collections");

  $scope.getActiveRoles = function() {
    return roles.filter(function(r) {
      return r.type != 'user' || r.read || r.write;
    });
  };

  $scope.findMatches = function($value) {
      var value = $value.toLowerCase();

      if(value.length > 2) {
          return $http.get('/api/1/roles/match/' + value).then(function(res) {
              return res.data;
          });
      }
  }

  $scope.addRole = function($item, $model) {
    $item.read = true;
    $item.dirty = true;
    $scope.newRole = {name: ''};
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
      for (var j in roles) {
        var role = roles[j];
        if (role.dirty) {
          qs.push($http.post(collection.api_url + '/permissions', {
            role: role.id,
            read: role.read,
            write: role.write
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
