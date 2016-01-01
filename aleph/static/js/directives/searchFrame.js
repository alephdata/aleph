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
      scope.fields = {};

      QueryContext.get().then(function(ctx) {
        scope.sources = ctx.sources;
        scope.lists = ctx.lists;
        scope.fields = ctx.fields;
        scope.queryContext = ctx;
      });

      scope.showListFacet = function(id) {
        return Query.load().watchlist.indexOf(id) == -1;
      };

      scope.showFieldFacet = function(field) {
        return Query.load().facet.indexOf(field) == -1;
      };
      
      Session.get(function(session) {
        scope.session = session;
      });
    }
  };
}]);
