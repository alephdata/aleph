
aleph.controller('GraphCtrl', ['$scope', '$location', '$http', 'debounce',
  function($scope, $location, $http, debounce) {

  var svg = null,
      force = null,
      graphData = {};


  var updateSize = function() {
    var width = $(window).width() * 0.9,
        height = $(window).height() * 0.9;
    svg.attr("width", width)
       .attr("height", height);
    redraw(width, height);
  };

  var redraw = function(width, height) {
    //console.log('huhu');
    if (graphData === null) return;

    var degreeExtent = d3.extent(graphData.nodes, function(n) { return n.degree});
    var nodeScale = d3.scale.linear().domain(degreeExtent).range([5, width/30]);
    var linkExtent = d3.extent(graphData.links, function(n) { return n.weight});
    var linkScale = d3.scale.linear().domain(linkExtent).range([1, width/100]);

    force = d3.layout.force()
      //.charge(-120)
      .linkDistance(width/5)
      .linkStrength(2)
      .size([width, height]);

    force
      .nodes(graphData.nodes)
      .links(graphData.links)
      .start();

    var link = svg.selectAll(".link")
        .data(graphData.links)
      .enter().append("line")
        .attr("class", "link")
        .style('stroke-width', function(d) { return linkScale(d.weight); });

    var node = svg.selectAll(".node")
        .data(graphData.nodes)
      .enter().append("circle")
        .attr("class", function(d) { return 'node ' + d.category; })
        .attr("r", function(d) { return nodeScale(d.degree); })
        .call(force.drag);

    node.append("title")
        .text(function(d) { return d.label; });

    force.on("tick", function() {
      link.attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });

      node.attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; });
    });

  };

  var init = function() {
    $scope.load();
    svg = d3.select("#graph").append("svg");
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

