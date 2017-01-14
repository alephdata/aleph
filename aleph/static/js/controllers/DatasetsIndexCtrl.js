import aleph from '../aleph';

aleph.controller('DatasetsIndexCtrl', ['$scope', '$location', 'Title', 'Dataset', 'datasets',
    function($scope, $location, Title, Dataset, datasets) {

  $scope.search = {};
  $scope.result = datasets.result;
  $scope.query = datasets.query;

  Title.set("Databases", "entities");

  $scope.submitSearch = function(form) {
    $location.search($scope.search);
    $location.path('/entities');
  };

  $scope.$on('$routeUpdate', function() {
    Dataset.search().then(function(datasets) {
      $scope.result = datasets.result;
      $scope.query = datasets.query;
    });
  });

}]);
