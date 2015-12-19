aleph.directive('listsFrame', ['$http', function($http) {
  return {
    restrict: 'E',
    transclude: true,
    scope: {
      'list': '=',
      'selected': '@'
    },
    templateUrl: 'lists_frame.html',
    link: function (scope, element, attrs, model) {
      $http.get('/api/1/lists').then(function(res) {
        scope.lists = res.data;
      })
    }
  };
}]);
