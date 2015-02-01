
aleph.controller('SearchCtrl', ['$scope', '$location', '$http',
  function($scope, $location, $http) {

  var isLoading = false,
      collectionCount = 0;
  $scope.result = {};
  $scope.collections = {};

  $http.get('/api/1/collections').then(function(res) {
    var collections = {}
    angular.forEach(res.data.results, function(c) {
      collections[c.slug] = c;
    });
    $scope.collections = collections;
    collectionCount = res.data.total;
  });
  
  $scope.load = function() {
    $scope.loadQuery();
    var query = angular.copy($scope.query);
    query['limit'] = 35;
    isLoading = true;
    $http.get('/api/1/query', {params: query}).then(function(res) {
      $scope.result = res.data;
      isLoading = false;
    });
  };

  $scope.hasMore = function() {
    return !isLoading && $scope.result.next_url !== null;
  };

  $scope.loadMore = function() {
    isLoading = true;
    $http.get($scope.result.next_url).then(function(res) {
      $scope.result.results = $scope.result.results.concat(res.data.results);
      $scope.result.next_url = res.data.next_url;
      isLoading = false;
    });
  };

  $scope.toggleFilter = function(name, val) {
    var idx = $scope.query[name].indexOf(val);
    if (idx == -1) {
      $scope.query[name].push(val);
    } else {
      $scope.query[name].splice(idx, 1);
    }
    $scope.submitSearch();
  };

  $scope.hasFilter = function(name, val) {
    return $scope.query[name].indexOf(val) != -1;
  };

  $scope.numQueriedCollections = function() {
    return $scope.query.collection.length || collectionCount;
  };

  $scope.$on('$routeUpdate', function(){
    $scope.load();
  });

  $scope.load();

}]);



aleph.controller('SearchListCtrl', ['$scope', '$location', '$http',
  function($scope, $location, $http) {



}]);



aleph.controller('SearchGraphCtrl', ['$scope', '$location', '$http', 'debounce',
  function($scope, $location, $http, debounce) {

  var svg = d3.select("#graph").append("svg"),
      linkContainer = svg.append("g"),
      nodeContainer = svg.append("g"),
      linkElements = null,
      nodeElements = null,
      force = d3.layout.force().linkStrength(2),
      graphData = {};


  var updateSize = function() {
    var width = $('#graph').width(),
        height = $(window).height() * 0.8;
    svg.attr("width", width)
       .attr("height", height);
    redraw(width, height);
  };

  var redraw = function(width, height) {
    if (graphData === null) return;

    var degreeExtent = d3.extent(graphData.nodes, function(n) { return n.degree});
    var nodeScale = d3.scale.sqrt().domain(degreeExtent).range([5, width/30]);
    var linkExtent = d3.extent(graphData.links, function(n) { return n.weight});
    var linkScale = d3.scale.sqrt().domain(linkExtent).range([1, width/100]);

    force = force
      .linkDistance(width/3)
      .size([width, height])
      .nodes(graphData.nodes)
      .links(graphData.links)
      .start();

    linkElements = linkContainer.selectAll(".link")
        .data(graphData.links, function(l) {
          return l.source.id + '.' + l.target.id;
        });

    linkElements.enter().append("line")
        .attr("class", "link")
        .style('stroke-width', function(d) { return linkScale(d.weight); });

    linkElements.exit().remove();

    nodeElements = nodeContainer.selectAll(".node")
        .data(graphData.nodes, function(n) { return n.id; });

    nodeElements.enter().append("circle")
        .attr("class", function(d) { return 'node ' + d.category; })
        .attr("r", 2)
        .call(force.drag)
        .transition()
          .duration(1000)
          .attr("r", function(d) { return nodeScale(d.degree); });

    nodeElements.exit().remove();

    nodeElements.append("title")
        .text(function(d) { return d.label; });

    force.on("tick", function() {
      linkElements
          .attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });

      nodeElements
          .attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; });
    });

  };

  var init = function() {
    $scope.load();
    $(window).resize(debounce(updateSize, 400));
  }

  $scope.load = function() {
    $scope.loadQuery();
    var query = angular.copy($scope.query);
    $http.get('/api/1/graph', {params: query}).then(function(res) {
      graphData = res.data;
      //console.log(res.data);
      updateSize();
    });
  };

  $scope.$on('$routeUpdate', function(){
    $scope.load();
  });

  init();
}]);




