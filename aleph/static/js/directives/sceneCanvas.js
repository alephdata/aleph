aleph.directive('sceneCanvas', ['Metadata', function(Metadata) {

  var SceneGridPoint = function(x, y) {
    var self = this;
    self.x = x;
    self.y = y;

    self.distance = function(target) {
      return Math.sqrt(Math.pow(target.x - self.x, 2) + Math.pow(target.y - self.y, 2));
    };

    self.is = function(point) {
      return self.x == point.x && self.y == point.y;
    };

    self.inArray = function(points) {
      for (var i in points) {
        if (self.is(points[i])) {
          return true;
        }
      }
      return false;
    };
  } 

  var SceneGridRouter = function(nodeMatrix, source, target) {
    var self = this
        // moveOptions = [[1, 0], [0, 1], [-1, 0], [0, -1]]
        moveOptions = [[1, 0], [1, 1], [0, 1], [-1, 0], [0, -1], [-1, -1], [-1, 1], [1, -1]],
        deadPoints = [];
    self.sourcePt = new SceneGridPoint(source.gridX, source.gridY);
    self.targetPt = new SceneGridPoint(target.gridX, target.gridY);

    self.getPenalty = function(point) {
      // apply penalties to points that overlap with nodes.
      var nodes = nodeMatrix[point.x];
      if (nodes) {
        var nodeId = nodes[point.y];
        if (nodeId) {
          if (nodeId != source.id && nodeId != target.id) {
            return 100;
          }
          return 2;
        }
      }
      return 1;
    };

    self.followPath = function(path) {
      var lastPoint = path[path.length - 1];
      while (true) {
        var bestDistance = Infinity,
            bestOption = null;
        for (var o in moveOptions) {
          // this tries out all the possible move options, i.e. up down left right
          // each one is assigned a cost based on whether the next step is inside a
          // node, or a "course change".
          var opt = moveOptions[o],
              nextPoint = new SceneGridPoint(lastPoint.x + opt[0], lastPoint.y + opt[1]),
              nextDistance = nextPoint.distance(self.targetPt) * self.getPenalty(nextPoint);
          if (nextPoint.is(self.targetPt)) {
            return path;
          }
          // if (path.length > 1) {
          //   var prevPoint = path[path.length - 2];
          //   if (prevPoint.x != nextPoint.x && prevPoint.y != nextPoint.y) {
          //     nextDistance += 0.8;
          //   }
          // }
          if (nextDistance < bestDistance) {
            // check if the point has been excluded from further path-finding.
            // check if the given point is already on the path.
            if (!nextPoint.inArray(deadPoints)) {
              bestOption = nextPoint;
              bestDistance = nextDistance;
            }
          }
        };
        if (bestOption == null || bestOption.inArray(path)) {
          deadPoints.push(lastPoint);
          return null;
        }
        var nextPath = self.followPath(path.concat([bestOption]));
        if (nextPath != null) {
          return nextPath;
        }
      }
    };

    self.path = function() {
      return self.followPath([self.sourcePt]);
    };
  };

  var SceneGrid = function(scene) {
    var self = this;
    self.scene = scene;
    self.edgePaths = {};
    self.unit = 20;
    self.nodeWidthUnits = 6;
    self.nodeHeightUnits = 2;

    self.nodeWidth = function(node) {
      return self.nodeWidthUnits * self.unit;
    };

    self.nodeHeight = function(node) {
      return self.nodeHeightUnits * self.unit;
    };

    self.fontSize = function() {
      return self.unit * 0.6;
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
      if (node.gridX === null && node.gridY === null)  {
        node = self.placeNode(node);
      }
      node.x = self.nodeX(node);
      node.y = self.nodeY(node);
      return 'translate(' + [node.x, node.y] + ')';
    };

    self.edgeLabelTranslate = function(edge) {
      var x = (edge.source.x + edge.target.x) / 2;
      var y = (edge.source.y + edge.target.y) / 2;
      return 'translate(' + [x, y] + ')';
    };

    self.pixelToUnit = function(px) {
      return Math.round(px / self.unit);
    };

    self.snapToGrid = function(node) {
      node.gridX = self.pixelToUnit(node.x);
      node.gridY = self.pixelToUnit(node.y);
      node = self.placeNode(node);
    };

    self.placeNode = function(node) {
      var iter = 1,
          options = [[1, 0], [1, 1], [0, 1], [-1, 0],
                     [0, -1], [-1, -1], [-1, 1], [1, -1]];
      if (!self.hasOverlap(node)) {
        node.gridX = node.gridX || 0;
        node.gridY = node.gridY || 0;
        return node;
      }
      while (true) {
        for (var i in options) {
          var pos = {
            id: node.id,
            gridX: node.gridX + (options[i][0] * iter * self.nodeWidthUnits),
            gridY: node.gridY + (options[i][1] * iter * self.nodeHeightUnits),
          };
          if (!self.hasOverlap(pos)) {
            node.gridX = pos.gridX;
            node.gridY = pos.gridY;
            return node;
          }
        };
        iter += 1;
      }
    };

    self.getNodeBox = function(node) {
      var offsetX = self.nodeOffsetX(node),
          offsetY = self.nodeOffsetY(node);
      return {
        left: self.nodeX(node) + offsetX,
        right: self.nodeX(node) + (offsetX * -1),
        top: self.nodeY(node) + offsetY,
        bottom: self.nodeY(node) + (offsetY * -1),
      };
    };

    self.hasOverlap = function(node) {
      var box = self.getNodeBox(node);
      for (var i in self.scene.nodes) {
        var on = self.scene.nodes[i];
        if (on.id != node.id) {
          var other = self.getNodeBox(self.scene.nodes[i]);
          if (!(box.left > other.right || box.right < other.left ||
                box.top > other.bottom || box.bottom < other.top)) {
            return true;
          }
        }
      }
      return false;
    };

    self.computePaths = function() {
      // var matrix = self.getGridMatrix();

      // for (var i in self.scene.edges) {
      //   var edge = self.scene.edges[i],
      //       route = new SceneGridRouter(matrix, edge.source, edge.target)
      //   self.edgePaths[edge.id] = route.path();
      // }
    };

    self.edgePath = function(edge) {
      var source = [edge.source.x, edge.source.y],
          target = [edge.target.x, edge.target.y];
      return 'M' + source + 'L' + target;
      // var path = self.edgePaths[edge.id].map(function(n) {
      //   return [n.x * self.unit, n.y * self.unit];
      // });
      // return 'M' + path.join('L');
    };

    self.getGridMatrix = function() {
      var matrix = {};
      for (var i in self.scene.nodes) {
        var box = self.getNodeBox(self.scene.nodes[i]);
        // todo: make a version that emits units.
        box.left = self.pixelToUnit(box.left);
        box.right = self.pixelToUnit(box.right);
        box.top = self.pixelToUnit(box.top);
        box.bottom = self.pixelToUnit(box.bottom);
        for (var col = box.left; col <= box.right; col++) {
          if (!matrix[col]) {
             matrix[col] = {};
          }
          for (var row = box.top; row <= box.bottom; row++) {
            matrix[col][row] = self.scene.nodes[i].id;
          }
        }
      }
      return matrix;
    };
  };

  return {
    restrict: 'E',
    require: '^sceneWorkspace',
    template: '<div id="scene-canvas"></div>',
    link: function (scope, element, attrs, ctrl) {
      var frame = d3.select("#scene-canvas"),
          svg = frame.append("svg"),
          grid = new SceneGrid(ctrl),
          fontSize = grid.fontSize(),
          container = svg.append("g"),
          edgeContainer = container.append("g")
          nodeContainer = container.append("g");

      var zoom = d3.zoom()
        .scaleExtent([0.3, 6])
        .on("zoom", zoomed);

      var nodeDrag = d3.drag().on("start", dragNode);

      function updateSize() {
        // adapt to window resizing.
        var width = frame.node().getBoundingClientRect().width,
            height = d3.select("body").node().getBoundingClientRect().height * 0.7;
        svg.attr("width", width)
           .attr("height", height);
        return {width: width, height: height};
      };

      function adjustText(texts) {
        // cut off the node label if it is longer than the node box.
        texts.each(function(node) {
          var text = d3.select(this),
              name = node.name + '';
          text.text(name);
          var maxWidth = grid.nodeWidth(node) - 4,
              width = text.node().getComputedTextLength(),
              charWidth = Math.max(width, maxWidth) / name.length,
              maxChars = (maxWidth / charWidth);
          if (width > maxWidth) {
            name = name.substring(0, maxChars - 3);
            name = name + '…';
            text.text(name); 
          }
        });
      };

      function drawNodes() {
        // this should update as well as create, i.e. you can
        // run it repatedly.
        var nodes = nodeContainer.selectAll(".node")
            .data(ctrl.nodes, function(d) { return d.id; });

        var enteringNodes = nodes.enter().append("g")
            .attr("class", "node")
            .attr("transform", grid.nodeTranslate)
            .on("click", clickNode)
            .call(nodeDrag);

        enteringNodes.append("rect")
            .attr("x", grid.nodeOffsetX)
            .attr("y", grid.nodeOffsetY)
            .attr("width", grid.nodeWidth)
            .attr("height", grid.nodeHeight)
            .style("fill", function(n) { return n.getColor(); });

        // the icon.
        enteringNodes.append("text")
            .attr("dy", function(d) { return -2; })
            .attr("class", "icon")
            .attr("text-anchor", "middle")
            .attr("font-family", "FontAwesome")
            .text(function(d){ return d.getIcon(); });

        // the label for the node.
        enteringNodes.append("text")
            .attr("dy", function(d) { return grid.unit * 0.65; })
            .attr("class", "title")
            .attr("text-anchor", "middle")
            .text(function(d){ return d.name; });

        nodeContainer.selectAll('.title')
          .attr("font-size", fontSize)
          .call(adjustText);

        nodes.exit().remove();
      };

      function drawEdges() {
        // grid.computePaths();

        var edges = edgeContainer.selectAll(".edge")
            .data(ctrl.edges, function(e) { return e.id; })
            .attr("d", grid.edgePath);
        edges.enter().append("path")
            .attr("class", "edge")
            .on("click", clickEdge);
            // .attr("id", function(e) { return 'edge' + e.id; });
        edges.exit().remove();

        var labels = edgeContainer.selectAll('.edgelabel')
            .data(ctrl.edges, function(e) { return e.id; });

        var entering = labels.enter().append('g')
            .on("click", clickEdge)
            .attr('class', 'edgelabel');

        labels.attr('transform', grid.edgeLabelTranslate);

        entering.append('rect');
        entering.append('text')
            .text(function(e) { return e.type; });

        // resize the texts upon zoom.
        var labelTexts = labels.selectAll('text')
            .attr("dy", (fontSize * 0.8) / 3)
            .attr("font-size", fontSize * 0.8);

        // make sure the background for the edge label is placed
        // behind the actual text and has the same dimensions.
        labels.selectAll('rect').each(function(edge) {
          var rect = d3.select(this);
          labelTexts.each(function(labelEdge) {
            if (labelEdge.id == edge.id) {
              var text = d3.select(this).node(), 
                  box = text.getBBox(),
                  width = box.width + 4;
              rect
                .attr('width', width)
                .attr('height', box.height)
                .attr('transform', 'translate(' + [(width / 2) * -1, (box.height / 2) * -1] + ')');
            }
          });
        });
        labels.exit().remove();
      };

      function zoomed() {
        container.attr("transform", d3.event.transform);
        fontSize = grid.fontSize() * (1 / Math.max(1, d3.event.transform.k));
        drawNodes();
        drawEdges();
      }

      function dragNode() {
        var element = d3.select(this).classed("dragging", true);
        d3.event.on("drag", dragged).on("end", ended);

        function dragged(node) {
          node.x += d3.event.dx;
          node.y += d3.event.dy;
          element.attr('transform', 'translate(' + [node.x, node.y] + ')');
          drawEdges();
        }

        function ended(node) {
          element.classed("dragging", false);
          grid.snapToGrid(node);
          element.attr('transform', grid.nodeTranslate(node));
          drawEdges();
        }
      }

      function clickNode(node) {
        // console.log(node);
        ctrl.removeNode(node);
      }

      function clickEdge(edge) {
        // console.log(edge);
        ctrl.removeEdge(edge);
      }

      var unsubscribe = scope.$on('updateScene', function(e) {
        drawNodes();
        drawEdges();
      });

      scope.$on('$destroy', unsubscribe);

      function init() {
        // make sure the SVG is sized responsively
        d3.select(window).on('resize', updateSize); 
        var size = updateSize();
        svg.call(zoom);

        // move to the center.
        zoom.translateBy(svg, (size.width/2), (size.height/2));

        // draw stuff.
        drawNodes();
        drawEdges();
      }
      
      init();
    }
  };
}]);
