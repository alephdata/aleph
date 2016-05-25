
aleph.controller('CrawlersManageCtrl', ['$scope', '$route', '$http', 'Title', 'Source', 'crawlers',
    function($scope, $route, $http, Title, Source, crawlers) {
  $scope.crawlers = crawlers;
  Title.set("Crawler Management", "admin");

  $scope.editSource = function(source) {
    Source.edit(source).then(function() {
      $route.reload();
    });
  };

  $scope.executeCrawler = function(crawler, incremental) {
    crawler.running = true;
    var data = {'crawler_id': crawler.id, 'incremental': incremental};
    $http.post('/api/1/crawlers', data);
  };

}]);
