
aleph.directive('permissionsEdit', ['$http', '$q', 'Metadata',
    function($http, $q, Metadata) {
  return {
    restrict: 'E',
    scope: {
      'apiBase': '@'
    },
    templateUrl: 'templates/permissions_edit.html',
    link: function (scope, element, attrs, model) {
      var url = scope.apiBase + '/permissions';

      scope.types = [
        {type: 'system', label: 'State'},
        {type: 'group', label: 'Groups'},
        {type: 'user', label: 'Users'},
      ];
      scope.roles = [];
      Metadata.getRoles().then(function(roles) {
        for (var j in roles.results) {
          var role = roles.results[j];
          role.read = false;
          role.write = false;
          role.dirty = false;
        }
        $http.get(url).then(function(res) {
          for (var i in res.data.results) {
            var perm = res.data.results[i];
            for (var j in roles.results) {
              var role = roles.results[j];
              if (role.id == perm.role) {
                role.read = perm.read;
                role.write = perm.write;
              }
            }
          }
          scope.roles = roles.results;
        });
      });

      scope.markDirty = function(role) {
        role.dirty = true;
      };

      scope.$on('savePermissions', function() {
        var qs = [];
        for (var j in scope.roles) {
          var role = scope.roles[j];
          if (role.dirty) {
            qs.push($http.post(url, {
              role: role.id,
              read: role.read,
              write: role.write
            }));
          }
        }

        $q.all(qs).then(function() {
          scope.$emit('permissionsSaved');
        });
      });
    }
  };
}]);
