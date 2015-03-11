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
            scope.session = {}

            QueryContext.get().then(function(ctx) {
                scope.sources = ctx.sources;
            });
            
            Session.get(function(session) {
                scope.session = session;
            });
        }
    };
}]);
