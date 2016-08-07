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
        .scaleExtent([0.3, 6])
        .on("zoom", zoomed);

      var nodeDrag = d3.drag().on("start", dragNode);

      var draw = function () {
        updateSize();
        drawNodes();
      };

      function updateSize() {
        var width = frame.node().getBoundingClientRect().width,
            height = d3.select("body").node().getBoundingClientRect().height * 0.7;
        svg.attr("width", width)
           .attr("height", height);
      };

      function drawNodes() {
        var nodes = nodeContainer.selectAll(".node")
            .data(scope.scene.nodes, function(d) { return d.id; })
          .enter().append("g")
            .attr("class", "node");

        nodes.append("rect")
            .attr("x", function(e) { return 30; })
            .attr("y", function(e) { return 30; })
            .attr("width", function(e) { return 100; })
            .attr("height", function(e) { return 60; })
            .call(nodeDrag);
      };

      function zoomed() {
        container.attr("transform", d3.event.transform);
      }

      function dragNode() {
        var node = d3.select(this).classed("dragging", true),
            xOffset = d3.event.x - parseInt(node.attr('x')),
            yOffset = d3.event.y - parseInt(node.attr('y'));

        d3.event.on("drag", dragged).on("end", ended);

        function dragged(d) {
          node.attr('x', d3.event.x - xOffset);
          node.attr('y', d3.event.y - yOffset);
        }

        function ended() {
          node.classed("dragging", false);
        }
      }

      d3.select(window).on('resize', draw); 
      draw();
      svg
        .attr("transform", "translate(0,0) scale(10)")
        .call(zoom);

    }
  };
}]);
