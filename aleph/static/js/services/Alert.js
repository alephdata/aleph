
aleph.factory('Alert', ['$http', '$q', '$location', '$sce', '$uibModal', 'Session',
    function($http, $q, $location, $sce, $uibModal, Session) {

  var create = function(alert) {
    var instance = $uibModal.open({
      templateUrl: 'templates/alerts_create.html',
      controller: 'AlertsCreateCtrl',
      backdrop: true,
      size: 'md',
      resolve: {
        alert: function() {
          return alert; 
        }
      }
    });
    return instance.result;
  };

  return {
    index: function(id) {
      var dfd = $q.defer(),
          url = '/api/1/alerts';
      Session.get().then(function(session) {
        $http.get(url).then(function(res) {
          dfd.resolve(res.data);
        }, function(err) {
          dfd.reject(err);
        });
      });
      return dfd.promise;
    },
    delete: function(id) {
      return $http.delete('/api/1/alerts/' + id);
    },
    create: create
  };
}]);
