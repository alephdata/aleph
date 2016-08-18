aleph.directive('networkCanvas', ['Metadata', function(Metadata) {
  // main canvas for the network diagram, uses d3 to render out a set of 
  // nodes and edges and reacts to events both from interactions with the
  // canvas and the surrounding workspace directive.
  return {
    restrict: 'E',
    require: '^networkWorkspace',
    template: '<div id="network-canvas"></div>',
    link: function (scope, element, attrs, ctrl) {
      var frame = d3.select("#network-canvas"),
          svg = frame.append("svg"),
          svgSize = null,
          grid = new alephNetwork.Grid(ctrl),
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
        svgSize = {width: width, height: height};
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
            .attr("class", "background")
            .attr("x", grid.nodeOffsetX)
            .attr("y", grid.nodeOffsetY)
            .attr("width", grid.nodeWidth)
            .attr("height", grid.nodeHeight);

        enteringNodes.append("rect")
            .attr("class", "foreground")
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

        nodes.classed("selected", ctrl.isSelected);

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
        // rescale the font to make text smaller on large zoom labels.
        fontSize = grid.fontSize() * (1 / Math.max(1, d3.event.transform.k));
        // store the current viewport offset 
        ctrl.view.gridX = -1 * grid.pixelToUnit(d3.event.transform.x - (svgSize.width/2));
        ctrl.view.gridY = -1 * grid.pixelToUnit(d3.event.transform.y - (svgSize.height/2));
        ctrl.view.zoom = d3.event.transform.k;
        // update display
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

      function clickCanvas(node) {
        ctrl.clearSelection();
        scope.$apply();
      }

      function clickNode(node) {
        // todo should shift be required for multiple select?
        d3.event.stopPropagation();
        ctrl.toggleSelection(node);
        scope.$apply();
      }

      function clickEdge(edge) {
        // console.log(edge);
        d3.event.stopPropagation();
        ctrl.removeEdge(edge);
        scope.$apply();
      }

      scope.$on('$destroy', scope.$on('updateNetwork', function(e) {
        drawNodes();
        drawEdges();
      }));

      function init() {
        // make sure the SVG is sized responsively
        d3.select(window).on('resize', updateSize); 
        updateSize();
        svg.call(zoom);
        svg.on('click', clickCanvas);

        // move to the viewport offset last used in this view.
        zoom.translateBy(svg, grid.nodeX(ctrl.view) + (svgSize.width/2),
                              grid.nodeY(ctrl.view) + (svgSize.height/2));
        zoom.scaleBy(svg, ctrl.view.zoom);

        // draw stuff.
        drawNodes();
        drawEdges();
      }
      
      init();
    }
  };
}]);
