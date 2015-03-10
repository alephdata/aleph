
aleph.factory('Session', ['$http', '$q', function($http, $q) {
    var dfd = null;

    var reset = function() {
        dfd = null;
    };

    var get = function(cb) {
        if (dfd === null) {
            var dt = new Date();
            var config = {cache: false, params: {'_': dt.getTime()}};
            dfd = $http.get('/api/1/sessions', config);
        }
        dfd.success(cb);
    };

    return {
        get: get,
        reset: reset
    };
}]);


aleph.factory('Sources', ['$http', '$q', function($http, $q) {
    var dfd = null;

    var reset = function() { dfd = null; };

    var load = function(cb) {
        if (dfd === null) {
            dfd = $q.defer();
            $http.get('/api/1/sources').then(function(res) {
                var sources = {}
                angular.forEach(res.data.results, function(c) {
                  sources[c.slug] = c;
                });
                dfd.resolve(sources);
            });
        }
        return dfd.promise;
    };

    return {
        load: load,
        reset: reset
    };

}]);


aleph.factory('Flash', ['$rootScope', '$timeout', function($rootScope, $timeout) {
  // Message flashing.
  var currentMessage = null;

  $rootScope.$on("$routeChangeSuccess", function() {
    currentMessage = null;
  });

  return {
    message: function(message, type) {
      currentMessage = [message, type];
      $timeout(function() {
        currentMessage = null;
      }, 2000);
    },
    getMessage: function() {
      return currentMessage;
    }
  };
}]);

aleph.factory('Validation', ['Flash', function(Flash) {
  // handle server-side form validation errors.
  return {
    handle: function(form) {
      return function(res) {
        if (res.status == 400 || !form) {
            var errors = [];
            
            for (var field in res.errors) {
                form[field].$setValidity('value', false);
                form[field].$message = res.errors[field];
                errors.push(field);
            }
            if (angular.isDefined(form._errors)) {
                angular.forEach(form._errors, function(field) {
                    if (errors.indexOf(field) == -1) {
                        form[field].$setValidity('value', true);
                    }
                });
            }
            form._errors = errors;
        } else {
          Flash.message(res.message || res.title || 'Server error', 'danger');
        }
      }
    }
  };
}]);

