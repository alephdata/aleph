
var loadEntitiesIndex = ['$http', '$q', '$route', '$location', 'Session', 'Metadata', 'Alert', 'Query',
    function($http, $q, $route, $location, Session, Metadata, Alert, Query) {
  var dfd = $q.defer();
  Metadata.get().then(function(metadata) {
    Session.get().then(function(session) {
      Alert.index().then(function(alerts) {
        var query = Query.parse(),
            state = angular.copy(query.state);
        state['limit'] = 20;
        state['doc_counts'] = 'true';
        state['facet'] = ['jurisdiction_code', '$schema'];
        state['offset'] = state.offset || 0;
        $http.get('/api/1/entities', {params: state}).then(function(res) {
          var result = res.data;
          for (var i in result.results) {
            var res = result.results[i];
            res.alert_id = null;
            for (var j in alerts.results) {
              var alert = alerts.results[j];
              if (alert.entity_id == res.id && !alert.query_text) {
                res.alert_id = alert.id;
              }
            }
          }
          console.log(result);
          dfd.resolve({
            'query': query,
            'result': result,
            'metadata': metadata
          });  
        }, function(err) {
          if (err.status == 400) {
            dfd.resolve({
              'result': {
                'error': err.data
              },
              'query': query,
              'metadata': metadata
            });
          }
          dfd.reject(err);  
        });
      }, function(err) {
        dfd.reject(err);
      });
    }, function(err) {
      dfd.reject(err);
    });
  }, function(err) {
    dfd.reject(err);
  });
  return dfd.promise;
}];
