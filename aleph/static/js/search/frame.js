aleph.directive('searchFrame', ['Query', 'Session', function (Query, Session) {
    return {
        restrict: 'EA',
        scope: {
            'result': '=',
            'sources': '='
        },
        transclude: true,
        templateUrl: 'search_frame.html',
        link: function (scope, element, attrs, model) {
            scope.query = Query;
            scope.session = {}
            
            Session.get(function(session) {
                scope.session = session;
            });
        }
    };
}]);
