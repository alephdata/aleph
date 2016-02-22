
aleph.factory('Document', ['$http', '$q', '$location', '$sce', 'Session',
    function($http, $q, $location, $sce, Session) {

  return {
    get: function(id) {
      var dfd = $q.defer(),
          url = url = '/api/1/documents/' + id;
      Session.get().then(function(session) {
        $http.get(url).then(function(res) {
          dfd.resolve(res.data);
        }, function(err) {
          dfd.reject(err);
        });
      });
      return dfd.promise;
    },
    queryPages: function(documentId, query) {
      var dfd = $q.defer();
      Session.get().then(function(session) {
        var sq = {
              'q': query.pq
            },
            url = '/api/1/query/records/' + documentId;

        if (sq.q) {
          sq['snippet'] = 80;
          sq['limit'] = 1000;
          $http.get(url, {params: sq}).then(function(res) {
            for (var i in res.data.results) {
              var record = res.data.results[i];
              record.snippet = $sce.trustAsHtml(record.text[0]);
            }
            dfd.resolve(res.data);
          });
        } else {
          dfd.resolve({});
        }
      });
      return dfd.promise;
    }
  };
}]);
