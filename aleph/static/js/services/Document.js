
aleph.factory('Document', ['$http', '$q', '$location', '$sce', 'Query', 'History',
    function($http, $q, $location, $sce, Query, History) {

  return {
    search: function() {
      var dfd = $q.defer();
      var query = Query.parse(),
          state = angular.copy(query.state);
      state['limit'] = 30;
      state['snippet'] = 140;
      state['offset'] = state.offset || 0;
      History.setLastSearch(query.state);
      $http.get('/api/1/query', {cache: true, params: state}).then(function(res) {
        dfd.resolve({
          'query': query,
          'result': res.data
        });
      }, function(err) {
        if (err.status == 400) {
          dfd.resolve({
            'result': {
              'error': err.data,
              'results': []
            },
            'query': query
          });
        }
        dfd.reject(err);  
      });
      return dfd.promise;
    },
    get: function(id) {
      var dfd = $q.defer(),
          url = '/api/1/documents/' + id;
      $http.get(url, {cache: true}).then(function(res) {
        dfd.resolve(res.data);
      }, function(err) {
        dfd.reject(err);
      });
      return dfd.promise;
    },
    queryPages: function(documentId, query) {
      var dfd = $q.defer();
      var sq = {'q': query.dq},
          url = '/api/1/query/records/' + documentId;

      if (sq.q) {
        sq['snippet'] = 50;
        sq['limit'] = 1000;
        $http.get(url, {cache: true, params: sq}).then(function(res) {
          for (var i in res.data.results) {
            var record = res.data.results[i];
            if (record && record.text && record.text.length) {
              record.snippet = $sce.trustAsHtml(record.text[0]);  
            }
          }
          dfd.resolve(res.data);
        });
      } else {
        dfd.resolve({});
      }
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
