import aleph from '../aleph';

aleph.controller('CrawlersManageCtrl', ['$scope', '$route', '$location', '$http', 'Title', 'crawlers',
    function($scope, $route, $location, $http, Title, crawlers) {
  $scope.crawlers = crawlers;
  Title.set("Crawler Management", "admin");

  $scope.loadOffset = function(offset) {
    var query = $location.search();
    query.offset = offset;
    $location.search(query);
  };

  $scope.executeCrawler = function(crawler, incremental) {
    crawler.running = true;
    var data = {'crawler_id': crawler.id, 'incremental': incremental};
    $http.post('/api/1/crawlers', data);
  };
}]);
