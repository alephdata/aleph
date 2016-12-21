import aleph from '../aleph';

aleph.factory('Alert', ['$http', '$q', '$location', '$sce', '$uibModal', 'Metadata',
    function($http, $q, $location, $sce, $uibModal, Metadata) {
  var indexDfd = null, indexAlerts = null;

  function index() {
    if (indexDfd === null) {
      indexDfd = $q.defer();
      Metadata.get().then(function(metadata) {
        indexAlerts = [];
        if (!metadata.session.logged_in) {
          indexDfd.resolve({total: 0, results: []});
        } else {
          $http.get('/api/1/alerts', {ignoreLoadingBar: true}).then(function(res) {
            indexAlerts = res.data.results;
            indexDfd.resolve(res.data);
          }, function(err) {
            indexDfd.reject(err);
          });
        }
      }, function(err) {
        indexDfd.reject(err);
      });
    }
    return indexDfd.promise;
  };

  function flush() {
    indexDfd = null;
    indexAlerts = null;
    return index();
  };

  function deleteAlert(id) {
    var dfd = $q.defer();
    $http.delete('/api/1/alerts/' + id).then(function(res) {
      flush().then(function() {
        dfd.resolve(id);
      }, function(err) {
        dfd.reject(err);
      });
    }, function(err) {
      dfd.reject(err);
    });
    return dfd.promise;
  };

  function createAlert(alert) {
    var dfd = $q.defer();
    $http.post('/api/1/alerts', alert).then(function(res) {
      flush().then(function() {
        dfd.resolve(res.data.id);
      }, function(err) {
        dfd.reject(err);
      });
    }, function(err) {
      dfd.reject(err);
    });
    return dfd.promise;
  };

  function checkAlert(alert) {
    // this is a sync function, but it is premised on alerts already being loaded.
    // use with care.
    if (indexAlerts == null) {
      return false;
    }
    // normalize
    if (alert.query_text && alert.query_text.trim().length < 2) {
      alert.query_text = null;
    }
    for (var i in indexAlerts) {
      var candidate = indexAlerts[i],
          sameId = candidate.entity_id == alert.entity_id,
          sameQuery = alert.query_text && candidate.query_text && alert.query_text.toLowerCase() == candidate.query_text.toLowerCase();
      if (!candidate.entity_id && !alert.entity_id && sameQuery) {
        return candidate.id;
      } else if (!candidate.query_text && !alert.query_text && sameId) {
        return candidate.id;
      } else if (sameId && sameQuery) {
        return candidate.id;
      }
    }
    return false;
  };

  function toggleAlert(alert) {
    var alertId = checkAlert(alert);
    if (!alertId) {
      return createAlert(alert);
    }
    return deleteAlert(alertId);
  };

  function validAlert(alert) {
    if (alert.query_text && alert.query_text.trim().length >= 2) {
      return true;
    }
    if (alert.entity_id) {
      return true
    }
    return false;
  };

  return {
    index: index,
    check: checkAlert,
    toggle: toggleAlert,
    delete: deleteAlert,
    create: createAlert,
    valid: validAlert
  };
}]);
