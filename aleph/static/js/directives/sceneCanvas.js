aleph.directive('sceneCanvas', ['Metadata', function(Metadata) {

  var SceneGrid = function() {
    var self = this;
    self.unit = 30;
    self.nodeWidthUnits = 3;
    self.nodeHeightUnits = 2;

    self.nodeWidth = function(node) {
      return self.nodeWidthUnits * self.unit;
    };

    self.nodeHeight = function(node) {
      return self.nodeHeightUnits * self.unit;
    };

    self.nodeX = function(node) {
      return (node.gridX * self.unit); // - (self.nodeWidth(node) / 2);
    };

    self.nodeY = function(node) {
      return (node.gridY * self.unit); // - (self.nodeHeight(node) / 2);
    };

    self.nodeOffsetX = function(node) {
      return (self.nodeWidth(node) / 2) * -1;
    };

    self.nodeOffsetY = function(node) {
      return (self.nodeHeight(node) / 2) * -1;
    };

    self.nodeTranslate = function(node) {
      node.x = self.nodeX(node);
      node.y = self.nodeY(node);
      return 'translate(' + [node.x, node.y] + ')';
    }

    self.pixelToUnit = function(px) {
      return Math.round(px / self.unit);
    };

    self.snapToGrid = function(node) {
      node.gridX = self.pixelToUnit(node.x);
      node.gridY = self.pixelToUnit(node.y);
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
        // drawNodes();
        return {width: width, height: height};
      };

      function drawNodes() {
        var nodes = nodeContainer.selectAll(".node")
            .data(scope.scene.nodes, function(d) { return d.id; })
          .enter().append("g")
            .attr("class", "node")
            .attr("transform", grid.nodeTranslate)
            .call(nodeDrag);

        nodes.append("rect")
            .attr("x", grid.nodeOffsetX)
            .attr("y", grid.nodeOffsetY)
            .attr("width", grid.nodeWidth)
            .attr("height", grid.nodeHeight);

        nodes.append("text")
            .attr("dy", function(d) { return 4; })
            .attr("class", "title")
            .attr("text-anchor", "middle")
            .text(function(d){ return d.props.name; });

      };

      function zoomed() {
        container.attr("transform", d3.event.transform);
      }

      function dragNode() {
        var element = d3.select(this).classed("dragging", true);
        d3.event.on("drag", dragged).on("end", ended);

        function dragged(node) {
          node.x += d3.event.dx;
          node.y += d3.event.dy;
          element.attr('transform', 'translate(' + [node.x, node.y] + ')');
        }

        function ended(node) {
          element.classed("dragging", false);
          grid.snapToGrid(node);
          element.attr('transform', grid.nodeTranslate(node));
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
