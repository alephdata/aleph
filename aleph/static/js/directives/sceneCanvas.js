aleph.directive('sceneCanvas', ['Metadata', function(Metadata) {
  return {
    restrict: 'E',
    transclude: true,
    scope: {
      'scene': '='
    },
    template: '<div id="scene-canvas"></div>',
    link: function (scope, element, attrs, model) {
      var frame = d3.select("#scene-canvas"),
          svg = frame.append("svg"),
          container = svg.append("g"),
          nodeContainer = container.append("g");

      var zoom = d3.zoom()
        // .scaleExtent([1, 10])
        .on("zoom", zoomed);

      var rect = container.append("rect")
        // .attr("width", width)
        // .attr("height", height)
        .style("fill", "none")
        .style("stroke", "2")
        .style("pointer-events", "all");

      // var drag = d3.drag()
      //   .origin(function(d) { return d; })
      //   .on("dragstart", dragstarted)
      //   .on("drag", dragged)
      //   .on("dragend", dragended);

      var draw = function () {
        updateSize();
        drawNodes();
      };

      function updateSize() {
        var width = frame.node().getBoundingClientRect().width,
            height = d3.select("body").node().getBoundingClientRect().height * 0.7;
        svg.attr("width", width)
           .attr("height", height);
        rect.attr("width", width)
            .attr("height", height);
      };

      function drawNodes() {
        console.log(scope.scene.nodes);
        var nodes = nodeContainer.selectAll(".node")
            .data(scope.scene.nodes)
          .enter().append("g")
            .attr("class", "node");

        nodes.append("rect")
            .attr("x", function(e) { return 30; })
            .attr("y", function(e) { return 30; })
            .attr("width", function(e) { return 100; })
            .attr("height", function(e) { return 60; });
      };

      function zoomed() {
        container.attr("transform", d3.event.transform);
      }

      // function dragstarted(d) {
      //   d3.event.sourceEvent.stopPropagation();
      //   d3.select(this).classed("dragging", true);
      // }

      // function dragged(d) {
      //   d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
      // }

      // function dragended(d) {
      //   d3.select(this).classed("dragging", false);
      // }

      d3.select(window).on('resize', draw); 
      draw();
      svg
        .attr("transform", "translate(0,0) scale(10)")
        .call(zoom);

    }
  };
}]);
