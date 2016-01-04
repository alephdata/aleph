aleph.directive('searchFrame', ['Query', 'Metadata', 'Session', function (Query, Metadata, Session) {
  return {
    restrict: 'EA',
    scope: {
      'result': '='
    },
    transclude: true,
    templateUrl: 'search_frame.html',
    link: function (scope, element, attrs, model) {
      scope.query = Query;
      scope.metadata = {};
      scope.sources = {};
      scope.session = {};
      scope.watchlists = {};
      scope.fields = {};

      Metadata.get().then(function(ctx) {
        scope.sources = ctx.sources;
        scope.watchlists = ctx.watchlists;
        scope.fields = ctx.fields;
        scope.metadata = ctx;
      });

      scope.showListFacet = function(id) {
        return Query.load().watchlist.indexOf(id) == -1;
      };

      scope.showFieldFacet = function(field) {
        return Query.load().facet.indexOf(field) == -1;
      };
      
      Session.get().then(function(session) {
        scope.session = session;
      });
    }
  };
}]);
