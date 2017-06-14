import aleph from '../aleph';

aleph.directive('documentChildren', ['$location', 'Document',
    function($location, Document) {
  return {
    restrict: 'E',
    transclude: false,
    scope: {
      'children': '=',
      'doc': '='
    },
    templateUrl: 'templates/documents/children.html',
    link: function (scope, element, attrs, model) {
      scope.getUrl = function(document) {
        return Document.getUrl(document);
      }

      scope.loadOffset = function(offset) {
        var query = $location.search();
        query.children_offset = offset;
        $location.search(query);
        Document.queryChildren(scope.doc.id, query.children_offset).then(function(children) {
          scope.children = children;
        });
      }
    }
  };
}]);
