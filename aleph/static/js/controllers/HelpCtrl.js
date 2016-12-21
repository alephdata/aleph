import aleph from '../aleph';

aleph.controller('HelpCtrl', ['$scope', '$location', '$routeParams', '$templateCache', 'Title',
    function($scope, $location, $routeParams, $templateCache, Title) {

  var page = $routeParams.page || 'index';
  $scope.templatePath = 'help/' + page + '.html';
  var template = $templateCache.get($scope.templatePath),
      parser = new DOMParser(),
      htmlDoc = parser.parseFromString(template, "text/html");
  $scope.title = htmlDoc.getElementById('title').innerHTML;
  Title.set($scope.title || "Documentation", "help");

  $scope.isActive = function(path) {
    if ($location.path() == path) {
      return 'active';
    }
  };
}]);
