
aleph.controller('SearchGraphCtrl', ['$scope', '$location', '$timeout', '$compile', 'debounce',
                                     'Query', 'result', 'graph',
  function($scope, $location, $timeout, $compile, debounce, Query, result, graph) {
  
  $scope.partial = graph.partial;
  $scope.result = result;

  var svg = null,
      linkElements = null,
      nodeElements = null,
      force = d3.layout
                .force()
                .charge(-100)
                .linkStrength(0.2)
                .gravity(0.1);

  var updateSize = function() {
    var width = $('#graph').width(),
        height = $(window).height() * 0.8;
    svg = d3.select("#graph svg");
    svg.attr("width", width)
       .attr("height", height);
    redraw(width, height);
  };

  var redraw = function(width, height) {
    if (graph === null || !graph.nodes) return;

    var degreeExtent = d3.extent(graph.nodes, function(n) { return n.degree});
    var nodeScale = d3.scale.sqrt().domain(degreeExtent).range([5, width/30]);
    var linkExtent = d3.extent(graph.links, function(n) { return n.weight});
    var linkScale = d3.scale.sqrt().domain(linkExtent).range([1, width/100]);

    force = force
      .linkDistance(width/3)
      .on('tick', tick)
      .size([width, height])
      .nodes(graph.nodes)
      .links(graph.links)
      .start();

    svg.selectAll('g').remove();

    var linkContainer = svg.append("g");
    var nodeContainer = svg.append("g");
      

    linkElements = linkContainer.selectAll(".link")
        .data(graph.links, function(l) {
          return l.source.id + '.' + l.target.id;
        });

    linkElements.enter().append("line")
        .attr("class", "link")
        .style('stroke-width', function(d) { return linkScale(d.weight); })
        .style("stroke", '#fff')
        .transition()
          .duration(2000)
          .style("stroke", '#999');

    //linkElements.exit().remove();

    nodeElements = nodeContainer.selectAll(".node")
        .data(graph.nodes, function(n) { return n.id; });

    nodeElements.enter().append("circle")
        .attr("class", function(d) { return 'node ' + d.category; })
        .attr("r", 2)
        .attr("tooltip-append-to-body", true)
        .attr("tooltip", function(d){ return d.label; })
        // .on("click", function(d) {
        //   Query.toggleFilter('entity', d.id);
        //   $scope.$apply();
        // })
        .call(force.drag)
        .transition()
          .duration(1000)
          .attr("r", function(d) { return nodeScale(d.degree); });

    //nodeElements.exit().remove();

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
    $timeout(function() {
      updateSize();  
    });
    $(window).resize(debounce(updateSize, 400));
  };

  init();
}]);


