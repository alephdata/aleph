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
