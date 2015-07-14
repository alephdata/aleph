
var loadCrawlers = ['$http', '$q', '$route', function($http, $q, $route) {
  var dfd = $q.defer();
  $http.get('/api/1/crawlers').then(function(res) {
    dfd.resolve(res.data);
  });
  return dfd.promise;
}];


var loadUsers = ['$http', '$q', '$route', 'Session', function($http, $q, $route, Session) {
  var dfd = $q.defer();
  Session.get(function(session) {
    $http.get('/api/1/users', {params: {'_uid': session.cbq}}).then(function(res) {
      dfd.resolve(res.data);
    });
  });
  return dfd.promise;
}];


var loadSource = ['$http', '$q', '$route', 'Session', function($http, $q, $route, Session) {
  var dfd = $q.defer(),
      url = '/api/1/sources/' + $route.current.params.slug;
  Session.get(function(session) {
    $http.get(url, {params: {'_uid': session.cbq}}).then(function(res) {
      dfd.resolve(res.data);
    });
  });
  return dfd.promise;
}];


aleph.directive('sourcesFrame', ['$http', 'QueryContext', function($http, QueryContext) {
  return {
    restrict: 'E',
    transclude: true,
    scope: {
      'source': '='
    },
    templateUrl: 'sources_frame.html',
    link: function (scope, element, attrs, model) {
      scope.sources = {};
      QueryContext.get().then(function(data) {
        scope.sources = data.sources;
      });
    }
  };
}]);


aleph.controller('SourcesIndexCtrl', ['$scope', '$location', '$http',
  function($scope, $location, $http) {

}]);


aleph.controller('SourcesEditCtrl', ['$scope', '$location', '$http', '$routeParams', 'Flash',
                                     'Validation', 'QueryContext', 'users', 'crawlers', 'source',
  function($scope, $location, $http, $routeParams, Flash, Validation, QueryContext, users, crawlers, source) {

  $scope.source = source;
  $scope.users = users;
  $scope.crawlers = crawlers;
  $scope.crawlTriggered = false;

  $scope.canSave = function() {
    return $scope.source.can_write;
  };

  $scope.hasUser = function(id) {
    var users = $scope.source.users || [];
    return users.indexOf(id) != -1;
  };

  $scope.toggleUser = function(id) {
    var idx = $scope.source.users.indexOf(id);
    if (idx != -1) {
      $scope.source.users.splice(idx, 1);
    } else {
      $scope.source.users.push(id);
    }
  };

  $scope.crawl = function() {
    if (!$scope.crawlTriggered) {
      $scope.crawlTriggered = true;
      $http.post($scope.source.api_url + '/crawl').then(function() {
        Flash.message('Crawling data for this source.', 'success');
      });
    }
  };

  $scope.process = function() {
    if (!$scope.processTriggered) {
      $scope.processTriggered = true;
      $http.post($scope.source.api_url + '/process').then(function() {
        Flash.message('Re-indexing and analyzing documents.', 'success');
      });
    }
  };

  $scope.save = function(form) {
      var res = $http.post(source.api_url, $scope.source);
      res.success(function(data) {
        QueryContext.reset();
        Flash.message('Your changes have been saved.', 'success');
      });
      res.error(Validation.handle(form));
  };

}]);


aleph.controller('SourcesNewCtrl', ['$scope', '$location', '$http', '$routeParams', 'Flash',
                                     'Validation', 'QueryContext', 'crawlers',
  function($scope, $location, $http, $routeParams, Flash, Validation, QueryContext, crawlers) {

  $scope.source = {
    config: {},
    fresh: true,
    'public': false,
    crawler: crawlers.results[0].name
  };
  $scope.crawlers = crawlers;
  $scope.slugGen = true;

  $scope.canSave = function() {
    return $scope.source.label && $scope.source.slug;
  };

  $scope.stopSlug = function() {
    $scope.slugGen = false;
  };

  $scope.$watch('source.label', function(l) {
    if($scope.slugGen && l) {
      var slug = l.toLowerCase()
        .replace(/ /g,'-')
        .replace(/[^\w-]+/g,'')
      $scope.source.slug = slug;
    }
  });

  $scope.save = function(form) {
      var res = $http.post('/api/1/sources', $scope.source);
      res.success(function(data) {
        QueryContext.reset();
        Flash.message('The source has been created.', 'success');
        $location.path('/sources/' + data.slug);
      });
      res.error(Validation.handle(form));
  };

}]);
