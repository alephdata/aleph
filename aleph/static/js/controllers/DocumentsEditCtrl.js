import aleph from '../aleph';

aleph.controller('DocumentsEditCtrl', ['$scope', '$http', '$q', '$uibModalInstance', 'Metadata', 'Document', 'doc', 'metadata',
    function($scope, $http, $q, $uibModalInstance, Metadata, Document, doc, metadata) {

  $scope.blocked = false;
  $scope.doc = doc;
  $scope.originalName = doc.title + '';
  $scope.metadata = metadata;

  $scope.canSave = function() {
    if ($scope.blocked) {
      return false;
    }
    return $scope.editDocument.$valid;
  };

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };

  $scope.save = function(form) {
    if (!$scope.canSave()) {
      return false;
    }

    $scope.blocked = true;
    var url = '/api/1/documents/' + $scope.doc.id;
    var res = $http.post(url, $scope.doc);
    res.then(function(res) {
      $uibModalInstance.close(res.data);
    }, function(err) {
      // handle error
      $scope.blocked = false;
    });
  };
}]);
