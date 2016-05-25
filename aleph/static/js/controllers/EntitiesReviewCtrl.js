
aleph.controller('EntitiesReviewCtrl', ['$scope', '$route', '$location', '$http', '$timeout', 'Collection', 'Entity', 'metadata', 'Authz', 'Title',
    function($scope, $route, $location, $http, $timeout, Collection, Entity, metadata, Authz, Title) {
  
  $scope.reportLoading(true);
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
    $http.get('/api/1/entities/' + $scope.entity.id + '/similar').then(function(res) {
      $scope.duplicateOptions = res.data.results;
      $scope.reportLoading(false);
    });
  };

  var loadNext = function() {
    // console.log("Cache size:", entityCache.length);

    if ($scope.entity == null) {
      if (entityCache.length) {
        loadCachedEntity();
      } else if ($scope.empty) {
        $scope.reportLoading(false);
      }  
    }

    $timeout(function() {
      if (!entityCacheDfd && !$scope.empty && entityCache.length < 22) {
        var params = {params: {skip: entitySkipIds.slice(entitySkipIds.length - 50)}}
        entityCacheDfd = $http.get('/api/1/entities/_pending', params);
        entityCacheDfd.then(function(res) {
          for (var i in res.data.results) {
            var ent = res.data.results[i];
            entitySkipIds.push(ent.id);
            entityCache.push(ent);
          }
          if (res.data.total == 0) {
            $scope.empty = true;
          }
          entityCacheDfd = null;
          loadNext();
        });  
      }  
    });
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
