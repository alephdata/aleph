aleph.directive('sceneCanvas', ['Metadata', function(Metadata) {

  var SceneGrid = function() {
    var self = this;
    self.unit = 20;
    self.nodeWidthUnits = 3;
    self.nodeHeightUnits = 2;

    self.nodeWidth = function(node) {
      return self.nodeWidthUnits * self.unit;
    };

    self.nodeHeight = function(node) {
      return self.nodeHeightUnits * self.unit;
    };

    self.nodeX = function(node) {
      return (node.gridX * self.unit) - (self.nodeWidth(node) / 2);
    };

    self.nodeY = function(node) {
      return (node.gridY * self.unit) - (self.nodeHeight(node) / 2);
    };

    self.pixelToUnit = function(px) {
      return Math.round(px / self.unit);
    };

    self.snapToGrid = function(node, el) {
      node.gridX = self.pixelToUnit(parseInt(el.attr('x')) + (self.nodeWidth(node) / 2));
      node.gridY = self.pixelToUnit(parseInt(el.attr('y')) + (self.nodeHeight(node) / 2));
    };

  };

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
          grid = new SceneGrid(),
          container = svg.append("g"),
          nodeContainer = container.append("g");

      var zoom = d3.zoom()
        .scaleExtent([0.3, 6])
        .on("zoom", zoomed);

      var nodeDrag = d3.drag().on("start", dragNode);

      function updateSize() {
        var width = frame.node().getBoundingClientRect().width,
            height = d3.select("body").node().getBoundingClientRect().height * 0.7;
        svg.attr("width", width)
           .attr("height", height);
        return {width: width, height: height};
      };

      function drawNodes() {
        var nodes = nodeContainer.selectAll(".node")
            .data(scope.scene.nodes, function(d) { return d.id; })
          .enter().append("g")
            .attr("class", "node");

        nodes.append("rect")
            .attr("x", grid.nodeX)
            .attr("y", grid.nodeY)
            .attr("width", grid.nodeWidth)
            .attr("height", grid.nodeHeight)
            .call(nodeDrag);
      };

      function zoomed() {
        container.attr("transform", d3.event.transform);
      }

      function dragNode() {
        var element = d3.select(this).classed("dragging", true),
            xOffset = d3.event.x - parseInt(element.attr('x')),
            yOffset = d3.event.y - parseInt(element.attr('y'));

        d3.event.on("drag", dragged).on("end", ended);

        function dragged(d) {
          element.attr('x', d3.event.x - xOffset);
          element.attr('y', d3.event.y - yOffset);
        }

        function ended(d) {
          element.classed("dragging", false);
          grid.snapToGrid(d, element);
          element.attr('x', grid.nodeX(d));
          element.attr('y', grid.nodeY(d));
        }
      }

      function init() {
        d3.select(window).on('resize', updateSize); 
        var size = updateSize();
        svg.call(zoom);
        zoom.translateBy(svg, (size.width/2), (size.height/2));
        drawNodes();
      }
      
      init();
    }
  };
}]);
