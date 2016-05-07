
aleph.factory('Document', ['$http', '$q', '$location', '$sce', 'Session',
    function($http, $q, $location, $sce, Session) {

  return {
    get: function(id) {
      var dfd = $q.defer(),
          url = '/api/1/documents/' + id;
      Session.get().then(function(session) {
        $http.get(url, {cache: true}).then(function(res) {
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
              'q': query.dq
            },
            url = '/api/1/query/records/' + documentId;

        if (sq.q) {
          sq['snippet'] = 50;
          sq['limit'] = 1000;
          $http.get(url, {cache: true, params: sq}).then(function(res) {
            for (var i in res.data.results) {
              var record = res.data.results[i];
              if (record.text.length) {
                record.snippet = $sce.trustAsHtml(record.text[0]);  
              }
            }
            dfd.resolve(res.data);
          });
        } else {
          dfd.resolve({});
        }
      });
      return dfd.promise;
    },
    getPage: function(documentId, pageNumber) {
      var dfd = $q.defer(),
          page = parseInt(pageNumber, 10) || 1,
          url = '/api/1/documents/' + documentId + '/pages/' + page;
      $http.get(url, {cache: true}).then(function(res) {
        dfd.resolve(res.data);
      }, function(err) {
        dfd.reject(err);
      });
      return dfd.promise;
    }
  };
}]);
