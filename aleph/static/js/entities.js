
aleph.controller('ListsEntitiesCtrl', ['$scope', '$location', '$http', '$routeParams', 'Validation', 'Flash',
  function($scope, $location, $http, $routeParams, Validation, Flash) {
  
  var apiUrl = '/api/1/lists/' + $routeParams.id;
  $scope.query = $location.search();
  $scope.list = {};
  $scope.entities = {};
  $scope.edit = null;
  $scope.newEntity = {'category': 'Person'};

  $http.get(apiUrl).then(function(res) {
    $scope.list = res.data;
  });

  $scope.setEdit = function(val, suggestCreate) {
    $scope.edit = val;
    if (suggestCreate) {
      $scope.newEntity = {
        'category': 'Person',
        'label': $scope.query.prefix
      };
    } else if (val) {
      setTimeout(function() {
        $('#edit-label-' + val).focus();  
      }, 20);
    }
  };

  var handleResult = function(res) {
    $('#prefix-search').focus();
    angular.forEach(res.data.results, function(e) {
      var aliases = [];
      angular.forEach(e.selectors, function(s) {
        if (s !== e.label) {
          aliases.push(s);
        }
      });
      e.aliases = aliases.join(', ');
    });
    $scope.entities = res.data;
    if ($scope.entities.total == 0) {
      $scope.setEdit('new', true);
    }
  };

  var adaptEntity = function(entity) {
    entity.selectors = [];
    entity.list = $routeParams.id;
    entity.aliases = entity.aliases || '';
    angular.forEach(entity.aliases.split(','), function(s) {
      s = s.trim();
      if (s.length) entity.selectors.push(s);
    });
    return entity;
  };

  $scope.create = function(form) {
    var entity = adaptEntity($scope.newEntity);
    var res = $http.post('/api/1/entities', entity);
    res.success(function(data) {
      Flash.message("We track 'em, you whack 'em.", 'success');
      $scope.setEdit(null);
      $scope.entities.results.unshift(data);
      $scope.newEntity = {'category': 'Person'};
    });
    res.error(Validation.handle(form));
  };

  $scope.update = function(form, entity) {
    entity = adaptEntity(entity);
    var res = $http.post(entity.api_url, entity);
    res.success(function(data) {
      Flash.message("Your changes have been saved.", 'success');
      $scope.setEdit(null);
    });
    res.error(Validation.handle(form));
  };

  $scope.loadQuery = function() {
    $scope.setEdit(null);
    $scope.query['list'] = $routeParams.id;
    $http.get('/api/1/entities', {params: $scope.query}).then(handleResult);
  };

  $scope.loadUrl = function(url) {
    $http.get(url).then(handleResult);
  }

  $scope.filter = function() {
    delete $scope.query['list'];
    $location.search($scope.query);
  };

  $scope.delete = function(entity) {
    $http.delete(entity.api_url).then(function(res) {
      var idx = $scope.entities.results.indexOf(entity);
      $scope.entities.results.splice(idx, 1);
    });
  };

  $scope.$on('$routeUpdate', function(){
    $scope.loadQuery();
  });

  $scope.loadQuery();

}]);
