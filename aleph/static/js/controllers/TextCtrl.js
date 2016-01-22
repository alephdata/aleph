
aleph.controller('TextCtrl', ['$scope', '$location', '$http', 'metadata', 'Authz', 'data', 'pages',
    function($scope, $location, $http, metadata, Authz, data, pages) {

  $scope.doc = data.doc;
  $scope.pages = pages;

  $scope.loading = true;
  $scope.initialPage = $location.search().page || 1;
  $scope.reportLoading(true);
  $scope.pdfUrl = '/api/1/documents/' + data.doc.id + '/pdf';

  $scope.onError = function(error) {
    $scope.reportError("Could not load document.");
  }

  $scope.onLoad = function() {
    $scope.loading = false;
    $scope.reportLoading(false);
  }

  $scope.getLanguageLabel = function(code) {
    var label = metadata.languages[code];
    return label || code;
  };

  $scope.getCountryLabel = function(code) {
    var label = metadata.countries[code];
    return label || code;
  };
  

}]);
