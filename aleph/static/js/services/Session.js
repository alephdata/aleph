
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
        dfd.success(function(data) {
          data.cbq = data.logged_in ? data.user.id : 'anon';
          cb(data);
        });
    };

    return {
        get: get,
        reset: reset
    };
}]);
