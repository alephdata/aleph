
aleph.controller('SearchCtrl', ['$scope', '$location', '$http', 'Query', 'collections', 'result',
  function($scope, $location, $http, Query, collections, result) {

  $scope.result = result;
  $scope.collections = collections;
  $scope.query = Query;

  $scope.load = function() {
    
  };

  $scope.setMode = function(mode) {
    Query.state.mode = mode;
    $location.search(Query.state);
    $location.path('/search');
  };

  $scope.load();

}]);



aleph.controller('SearchListCtrl', ['$scope', '$location', '$http',
  function($scope, $location, $http) {
  var isLoading = false;

  $scope.hasMore = function() {
    return !isLoading && $scope.result.next_url !== null;
  };

  $scope.loadMore = function() {
    if (!$scope.$parent.result.next_url) {
      return;
    }
    isLoading = true;
    $http.get($scope.$parent.result.next_url).then(function(res) {
      $scope.$parent.result.results = $scope.$parent.result.results.concat(res.data.results);
      $scope.$parent.result.next_url = res.data.next_url;
      isLoading = false;
    });
  };

}]);


aleph.controller('SearchGraphCtrl', ['$scope', '$location', '$http', '$compile', 'debounce', 'Query',
  function($scope, $location, $http, $compile, debounce, Query) {
  $scope.partial = null;

  var svg = d3.select("#graph svg"),
      linkContainer = svg.append("g"),
      nodeContainer = svg.append("g"),
      linkElements = null,
      nodeElements = null,
      force = d3.layout
                .force()
                .charge(-100)
                .linkStrength(0.2)
                .gravity(0.1),
      graphData = {};

  var updateSize = function() {
    var width = $('#graph').width(),
        height = $(window).height() * 0.8;
    svg.attr("width", width)
       .attr("height", height);
    redraw(width, height);
  };

  var redraw = function(width, height) {
    if (graphData === null || !graphData.nodes) return;

    var degreeExtent = d3.extent(graphData.nodes, function(n) { return n.degree});
    var nodeScale = d3.scale.sqrt().domain(degreeExtent).range([5, width/30]);
    var linkExtent = d3.extent(graphData.links, function(n) { return n.weight});
    var linkScale = d3.scale.sqrt().domain(linkExtent).range([1, width/100]);

    force = force
      .linkDistance(width/3)
      .on('tick', tick)
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
        .style('stroke-width', function(d) { return linkScale(d.weight); })
        .style("stroke", '#fff')
        .transition()
          .duration(2000)
          .style("stroke", '#999');

    linkElements.exit().remove();

    nodeElements = nodeContainer.selectAll(".node")
        .data(graphData.nodes, function(n) { return n.id; });

    nodeElements.enter().append("circle")
        .attr("class", function(d) { return 'node ' + d.category; })
        .attr("r", 2)
        .attr("tooltip-append-to-body", true)
        .attr("tooltip", function(d){ return d.label; })
        .on("click", function(d) {
          Query.toggleFilter('entity', d.id);
          $scope.$apply();
        })
        .call(force.drag)
        .transition()
          .duration(1000)
          .attr("r", function(d) { return nodeScale(d.degree); });

    nodeElements.exit().remove();

    nodeElements.classed('active', function(d) {
      return Query.hasFilter('entity', d.id);
    });

    $compile($('#graph'))($scope);
  };

  var tick = function() {
    linkElements
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    nodeElements
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
  }

  var init = function() {
    $scope.load();
    $(window).resize(debounce(updateSize, 400));
  }

  $scope.load = function() {
    if (Query.state.mode != 'graph') return;
    var query = angular.copy(Query.load());
    query['limit'] = 75; // hello dunbar?
    $http.get('/api/1/graph', {params: query}).then(function(res) {
      graphData = res.data;
      $scope.partial = res.data.partial;
      updateSize();
    });
  };

  init();
}]);



aleph.controller('SearchExportCtrl', ['$scope', '$location', '$http', '$compile', 'Query',
  function($scope, $location, $http, $compile, Query) {
  $scope.attributes = {};
  $scope.query = Query;
  $scope.graph = {'limit': 75, 'options': [10, 75, 150, 300, 600, 1200]};

  $scope.load = function() {
    if (Query.state.mode != 'export') return;
    $http.get('/api/1/query/attributes', {params: Query.load()}).then(function(res) {
      $scope.attributes = res.data;

      if (Query.state.attribute.length == 0) {
        angular.forEach(res.data.core, function(enable, a) {
          if (enable) { Query.state.attribute.push(a); }
        });
        Query.submit();
      }
    });
  };

  $scope.load();
}]);






