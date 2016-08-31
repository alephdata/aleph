
aleph.factory('Document', ['$http', '$q', '$location', '$httpParamSerializer', '$sce', '$uibModal', 'Metadata', 'Query', 'History',
    function($http, $q, $location, $httpParamSerializer, $sce, $uibModal, Metadata, Query, History) {

  var getDocumentById = function(id) {
    var dfd = $q.defer(),
        url = '/api/1/documents/' + id;
    $http.get(url, {cache: true}).then(function(res) {
      dfd.resolve(res.data);
    }, function(err) {
      dfd.reject(err);
    });
    return dfd.promise;
  };

  return {
    search: function(collection_id) {
      var dfd = $q.defer();
      var query = Query.parse(),
          state = angular.copy(query.state);
      state['limit'] = 20;
      state['snippet'] = 140;
      state['facet'] = query.getArray('facet');
      state['facet'].push('entities');
      if (collection_id) {
        state['filter:collection_id'] = collection_id;
        state['scope'] = 'collection';
      } else {
        state['facet'].push('collections');
      }
      state['offset'] = state.offset || 0;
      History.setLastSearch($location.path(), query.state);
      var params = {cache: !collection_id, params: state};
      $http.get('/api/1/query', params).then(function(res) {
        dfd.resolve({
          'query': query,
          'result': res.data
        });
      }, function(err) {
        dfd.reject(err);
      });
      return dfd.promise;
    },
    peek: function() {
      var dfd = $q.defer();
      var query = Query.parse(),
          state = angular.copy(query.state);
      $http.get('/api/1/peek', {cache: true, params: state}).then(function(res) {
        dfd.resolve(res.data);
      }, function(err) {
        dfd.reject(err);
      });
      return dfd.promise;
    },
    get: getDocumentById,
    edit: function(id) {
      var instance = $uibModal.open({
        templateUrl: 'templates/documents/edit.html',
        controller: 'DocumentsEditCtrl',
        backdrop: true,
        size: 'md',
        resolve: {
          doc: getDocumentById(id),
          metadata: Metadata.get()
        }
      });
      return instance.result;
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
        }, function(err) {
          dfd.reject(err);
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
    },
    getUrl: function(doc, record) {
      var search = $location.search(),
          query = {},
          path = null;
      if (doc.type === 'tabular') {
        var sheet = record ? record.sheet : 0,
            row = record ? record.row_id : null;
        query.row = row;
        path = '/tabular/' + doc.id + '/' + sheet;
      } else {
        path = '/text/' + doc.id;
        query.page = record ? record.page : 1;
        query.dq = search.q;
      }
      return path + '?' + $httpParamSerializer(query);
    }
  };
}]);
