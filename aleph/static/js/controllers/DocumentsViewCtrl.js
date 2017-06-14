import aleph from '../aleph';

aleph.controller('DocumentsViewCtrl', ['$scope', '$location', '$http', 'metadata', 'Authz', 'Document', 'Title', 'History', 'doc', 'children',
    function($scope, $location, $http, metadata, Authz, Document, Title, History, doc, children) {

  $scope.doc = doc;
  $scope.children = children;

  Title.set(doc.title, "documents");

  $scope.backToSearch = function() {
    History.back();
  };

  $scope.hasBackSearch = function() {
    return History.hasLastSearch();
  };

}]);
