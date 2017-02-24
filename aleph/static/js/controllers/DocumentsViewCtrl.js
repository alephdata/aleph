import aleph from '../aleph';

aleph.controller('DocumentsViewCtrl', ['$scope', '$location', '$http', 'metadata', 'Authz', 'Document', 'Title', 'History', 'doc',
    function($scope, $location, $http, metadata, Authz, Document, Title, History, doc) {

  $scope.doc = doc;

  Title.set(doc.title, "documents");

  $scope.backToSearch = function() {
    History.back();
  };

  $scope.hasBackSearch = function() {
    return History.hasLastSearch();
  };

}]);
