aleph.directive('searchFrame', ['Query', 'QueryContext', 'Session', function (Query, QueryContext, Session) {
  return {
    restrict: 'EA',
    scope: {
      'result': '='
    },
    transclude: true,
    templateUrl: 'search_frame.html',
    link: function (scope, element, attrs, model) {
      scope.query = Query;
      scope.queryContext = {};
      scope.sources = {};
      scope.session = {};
      scope.lists = {};
      scope.attributes = {};

      QueryContext.get().then(function(ctx) {
        scope.sources = ctx.sources;
        scope.lists = ctx.lists;
        scope.attributes = ctx.attributes;
        scope.queryContext = ctx;
      });

      scope.showListFacet = function(id) {
        return Query.load().listfacet.indexOf(id) == -1;
      };

      scope.showAttributeFacet = function(attr) {
        return Query.load().attributefacet.indexOf(attr) == -1;
      };
      
      Session.get(function(session) {
        scope.session = session;
      });
    }
  };
}]);
