
aleph.controller('EntitiesReviewCtrl', ['$scope', '$route', '$location', '$http', '$timeout', 'Collection', 'Entity', 'Metadata', 'Authz', 'Title',
    function($scope, $route, $location, $http, $timeout, Collection, Entity, Metadata, Authz, Title) {
  
  $scope.reportLoading(true);
  $scope.entity = {};
  $scope.schemata = {};
  $scope.duplicateOptions = [];
  Title.set("Review entities", "entities");

  var loadNext = function() {
    $scope.reportLoading(true);
    Metadata.get().then(function(metadata) {
      $scope.schemata = metadata.schemata;
      $http.get('/api/1/entities/_pending').then(function(res) {
        $scope.entity = res.data;
        Title.set("Review: " + res.data.name, "entities");
        $scope.entity.jurisdiction_code = $scope.entity.jurisdiction_code || null;
        if (!$scope.entity.empty) {
          $http.get('/api/1/entities/' + res.data.id + '/similar').then(function(res) {
            $scope.duplicateOptions = res.data.results;
            $scope.reportLoading(false);
          });
        } else {
          $scope.duplicateOptions = [];
          $scope.reportLoading(false);
        }
      });
    });
  };

  $scope.activate = function() {
    if (!$scope.entity.id) {
      return;
    }
    $scope.reportLoading(true);
    var entity = angular.copy($scope.entity);
    entity.state = 'active';
    $http.post('/api/1/entities/' + entity.id, entity).then(function() {
      loadNext();
    });
  };

  $scope.delete = function() {
    if (!$scope.entity.id) {
      return;
    }
    $scope.reportLoading(true);
    $http.delete('/api/1/entities/' + $scope.entity.id).then(function() {
      loadNext();
    });
  };

  $scope.mergeDuplicate = function(dup) {
    $scope.reportLoading(true);
    var url = '/api/1/entities/' +  dup.id + '/merge/' + $scope.entity.id;
    $http.delete(url).then(function() {
      loadNext();
    });
  };

  $scope.editDuplicate = function(dup) {
    Entity.edit(dup.id);
  };

  loadNext();

}]);
