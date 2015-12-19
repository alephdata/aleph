aleph.directive('doccloudConfig', ['$http', function ($http) {
    return {
        restrict: 'E',
        scope: {
            'source': '=',
            'crawlers': '='
        },
        templateUrl: 'doccloud_config.html',
        link: function (scope, element, attrs, model) {
            scope.crawler = {};
            scope.hasCredentials = false;
            scope.checking = false;
            scope.failed = false;
            scope.$watch('source.crawler', function(e) {
                angular.forEach(scope.crawlers.results, function(c) {
                    if (c.name == scope.source.crawler) {
                        scope.crawler = c;
                    }
                });
                scope.reloadProjects();
            });

            scope.reloadProjects = function() {
                scope.checking = false;
                scope.failed = false;
                scope.hasCredentials = scope.source.config && 
                    scope.source.config.username &&
                    scope.source.config.password;
                if (!scope.hasCredentials) {
                    return;
                }
                scope.checking = true;

                var params = {params: {
                    'source': scope.source.slug,
                    'username': scope.source.config.username,
                    'password': scope.source.config.password
                }};
                $http.get('/api/1/crawlers/dc_projects', params).then(function(res) {
                    scope.checking = false;
                    scope.failed = !res.data.credentials;
                    scope.projects = res.data.projects || [];
                    if (scope.projects.length && !scope.source.config.project_id) {
                        scope.source.config.project_id = scope.projects[0].id;
                    }
                });
            };

        }
    };
}]);
