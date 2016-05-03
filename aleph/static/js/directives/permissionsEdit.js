
aleph.directive('permissionsEdit', ['$http', '$q', 'Role',
    function($http, $q, Role) {
  return {
    restrict: 'E',
    scope: {
      'apiBase': '@'
    },
    templateUrl: 'templates/permissions_edit.html',
    link: function (scope, element, attrs, model) {
      var url = scope.apiBase + '/permissions',
          roles = [];

      scope.newRole = null;
      scope.types = [
        {type: 'system', label: 'State'},
        {type: 'group', label: 'Groups'},
        {type: 'user', label: 'Users'},
      ];
      
      Role.getAll().then(function(all) {
        for (var j in all.results) {
          var role = all.results[j];
          role.read = false;
          role.write = false;
          role.dirty = false;
        }
        $http.get(url).then(function(res) {
          for (var i in res.data.results) {
            var perm = res.data.results[i];
            for (var j in all.results) {
              var role = all.results[j];
              if (role.id == perm.role) {
                role.read = perm.read;
                role.write = perm.write;
              }
            }
          }
          roles = all.results;
        });
      });

      scope.getActiveRoles = function() {
        var activeRoles = [];
        for (var i in roles) {
          var role = roles[i];
          if (role.type != 'user' || role.read || role.write) {
            activeRoles.push(role);  
          }
        }
        return activeRoles;
      };

      scope.findRoles = function($value) {
        var matching = [];
        for (var i in roles) {
          var role = roles[i];
          if (role.name.toLowerCase().startsWith($value)) {
            matching.push(role);
          }
        }
        return matching;
      };

      scope.addRole = function($item, $model) {
        $item.read = true;
        $item.dirty = true;
        scope.newRole = {name: ''};
      };

      scope.markDirty = function(role) {
        role.dirty = true;
      };

      scope.$on('savePermissions', function() {
        var qs = [];
        for (var j in roles) {
          var role = roles[j];
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
