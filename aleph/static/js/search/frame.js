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
            scope.sources = {};
            scope.session = {};
            scope.lists = {};
            scope.attributes = {};

            QueryContext.get().then(function(ctx) {
                scope.sources = ctx.sources;
                scope.lists = ctx.lists;
                scope.attributes = ctx.attributes;
            });
            
            Session.get(function(session) {
                scope.session = session;
            });
        }
    };
}]);
