
aleph.controller('TextCtrl', ['$scope', '$location', '$http', 'Metadata', 'Authz', 'data',
    function($scope, $location, $http, Metadata, Authz, data) {

  $scope.doc = data.doc;
  console.log(data);
  $scope.pdfUrl = '/api/1/documents/' + data.doc.id + '/pdf';

}]);
