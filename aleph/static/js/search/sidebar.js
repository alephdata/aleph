aleph.directive('searchSidebar', ['Query', 'Session', function (Query, Session) {
    return {
        restrict: 'EA',
        scope: {
            'response': '='
        },
        templateUrl: 'search_sidebar.html',
        link: function (scope, element, attrs, model) {
            scope.query = Query;
            scope.session = {}
            
            Session.get(function(session) {
                scope.session = session;
            });
        }
    };
}]);
