
aleph.controller('EntitiesReviewCtrl', ['$scope', '$route', '$location', '$http', '$timeout', 'Collection', 'Entity', 'metadata', 'collection', 'Authz', 'Title',
    function($scope, $route, $location, $http, $timeout, Collection, Entity, metadata, collection, Authz, Title) {
  
  $scope.reportLoading(true);
  $scope.collection = collection;
  $scope.entity = null;
  $scope.empty = false;
  $scope.schemata = {};
  $scope.duplicateOptions = [];
  Title.set("Review entities", "entities");

  var entityCache = [],
      entitySkipIds = [],
      entityCacheDfd = null;

  var loadCachedEntity = function() {
    $scope.schemata = metadata.schemata;
    $scope.entity = entityCache.splice(0, 1)[0];
    Title.set("Review: " + $scope.entity.name, "entities");
    $scope.entity.jurisdiction_code = $scope.entity.jurisdiction_code || null;
    var params = {params: {writeable: true}},
        url = '/api/1/entities/' + $scope.entity.id + '/similar';
    $http.get(url, params).then(function(res) {
      $scope.duplicateOptions = res.data.results;
      $scope.reportLoading(false);
    });
  };

  var loadNext = function() {
    console.log("Cache size:", entityCache.length);
    if ($scope.empty) {
      $scope.reportLoading(false);
      return;
    }  

    $scope.reportLoading(true);
    if (entityCache.length) {
      loadCachedEntity();
    } else {
      var url = '/api/1/collections/' + $scope.collection.id + '/pending';
      $http.get(url).then(function(res) {
        for (var i in res.data.results) {
          entityCache.push(res.data.results[i]);
        }
        if (res.data.total == 0) {
          $scope.empty = true;
        }
        loadNext();
      });  
    }
  };

  var triggerDone = function() {
    $scope.reportLoading(true);
    $scope.entity = null;
    loadNext();
  };

  $scope.activate = function() {
    if (!$scope.entity.id) {
      return;
    }
    var entity = angular.copy($scope.entity);
    entity.state = 'active';
    $http.post('/api/1/entities/' + entity.id, entity);
    triggerDone();
  };

  $scope.delete = function() {
    if (!$scope.entity.id) {
      return;
    }
    var url = '/api/1/entities/' + $scope.entity.id;
    $http.delete(url)
    triggerDone();
  };

  $scope.mergeDuplicate = function(dup) {
    var url = '/api/1/entities/' +  dup.id + '/merge/' + $scope.entity.id;
    $http.delete(url);
    triggerDone();
  };

  $scope.editDuplicate = function(dup) {
    Entity.edit(dup.id);
  };

  $scope.$on('key-pressed', function(e, k) {
    if (k == 65) {
      $scope.activate();
    }
    if (k == 68) {
      $scope.delete();
    }
    if (k == 77 && $scope.duplicateOptions.length) {
      $scope.mergeDuplicate($scope.duplicateOptions[0]);
    }
  });

  loadNext();

}]);
