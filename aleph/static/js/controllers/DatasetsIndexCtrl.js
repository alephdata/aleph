
aleph.controller('DatasetsIndexCtrl', ['$scope', '$location', 'Title', 'datasets',
    function($scope, $location, Title, datasets) {

  $scope.query = {};
  $scope.datasets = datasets;
  $scope.datasets.results = datasets.results.filter(function(d) {
    return d.doc_count != 0;
  }).sort(function(a, b) {
    var doc_diff = b.doc_count - a.doc_count;
    if (doc_diff == 0) {
      return a.label.localeCompare(b.label);
    }
    return doc_diff;
  });

  Title.set("Databases", "entities");

  $scope.submitSearch = function(form) {
    $location.search($scope.query);
    $location.path('/entities');
  };
}]);
