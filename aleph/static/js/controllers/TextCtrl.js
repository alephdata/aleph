
aleph.controller('TextCtrl', ['$scope', '$location', '$http', 'metadata', 'Authz', 'data',
    function($scope, $location, $http, metadata, Authz, data) {

  $scope.doc = data.doc;
  console.log(data);
  $scope.pdfUrl = '/api/1/documents/' + data.doc.id + '/pdf';


  $scope.getLanguageLabel = function(code) {
    var label = metadata.languages[code];
    return label || code;
  };

  $scope.getCountryLabel = function(code) {
    var label = metadata.countries[code];
    return label || code;
  };
  

}]);
