
aleph.factory('Source', ['$uibModal', 'Metadata', function($uibModal, Metadata) {

  return {
    edit: function(source) {
      var instance = $uibModal.open({
        templateUrl: 'templates/sources_edit.html',
        controller: 'SourcesEditCtrl',
        backdrop: true,
        size: 'md',
        resolve: {
          source: ['$q', '$http', 'Role', function($q, $http, Role) {
            var dfd = $q.defer();
            Role.getAll().then(function() {
              $http.get('/api/1/sources/' + source.id).then(function(res) {
                dfd.resolve(res.data);
              }, function(err) {
                dfd.reject(err);
              });
            }, function(err) {
              dfd.reject(err);
            });
            return dfd.promise;
          }],
          metadata: Metadata.get()
        }
      });
      return instance.result;
    }
  };

}]);
