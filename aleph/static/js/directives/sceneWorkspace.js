
aleph.directive('sceneWorkspace', ['$http', '$rootScope', '$location',
    function($http, $rootScope, $location) {

  var Node = function(scene, node) {
    // A node represents one object (person, company, phone, email, ...)
    // on the graph. This object is just interested in layout and grid
    // positioning, not the actual management of the scene canvas.
    var self = this;
    self.scene = scene;
    self.data = node;
    self.type = node.alephSchema || node.$label;
    self.name = node.name;
    self.gridX = node.gridX || null;
    self.gridY = node.gridY || null;
    self.id = node.id;

    self.getColor = function() {
      return scene.config.colors[self.type] || '#777777';
    };

    self.getIcon = function() {
      return scene.config.icons[self.type] || '\uf0c8';
    };

    self.toJSON = function() {
      return {
        id: self.id,
        gridX: self.gridX,
        gridY: self.grifY
      };
    };
  };

  var Edge = function(scene, edge, source, target) {
    // An edge represents a connection between two nodes. It is
    // directed.
    var self = this;
    self.scene = scene;
    self.data = edge;
    self.type = edge.$type;
    self.source = source;
    self.target = target;
    self.id = edge.id;

    self.toJSON = function() {
      return {id: self.id};
    };
  };

  return {
    restrict: 'E',
    scope: {
      scene: '=',
      metadata: '='
    },
    templateUrl: 'templates/scene_workspace.html',
    controller: ['$scope', function($scope) {
      var self = this;
      self.config = $scope.metadata.graph;
      self.collection_id = null;
      self.nodes = [];
      self.edges = [];
      self.selection = [];

      self.addNode = function(data) {
        for (var i in self.nodes) {
          var node = self.nodes[i];
          if (data.id == node.id) {
            return node;
          }
        }
        var node = new Node(self, data);
        // self.completeNode(node);
        self.nodes.push(node);
        self.update();
        return node;
      };

      self.removeNode = function(node) {
        var idx = self.nodes.indexOf(node);
        if (idx != -1) {
          var edges = self.edges.filter(function(edge) {
            return edge.source.id == node.id || edge.target.id == node.id;
          });
          for (var i in edges) {
            self.removeEdge(edges[i]);
          }
          self.nodes.splice(idx, 1);
          var selectionIdx = self.selection.indexOf(node);
          if (selectionIdx != -1) {
            self.selection.splice(selectionIdx, 1);
          }
          self.update();

        }
      };

      self.addEdge = function(data) {
        for (var i in self.edges) {
          var edge = self.edges[i];
          if (data.id == edge.id) {
            return edge;
          }
        }
        var edge = new Edge(self, data,
                            self.addNode(data.$source),
                            self.addNode(data.$target));
        self.edges.push(edge);
        self.update();
        return edge;
      };

      self.removeEdge = function(edge) {
        var idx = self.edges.indexOf(edge);
        if (idx != -1) {
          self.edges.splice(idx, 1);
          self.update();
        }
      };

      self.getNodeIds = function() {
        return self.nodes.map(function(n) { return n.id; });
      };

      self.getEdgeIds = function() {
        return self.edges.map(function(e) { return e.id; });
      };

      self.toggleSelection = function(node) {
        var idx = self.selection.indexOf(node);
        if (idx == -1) {
          self.selection.unshift(node);
        } else {
          self.selection.splice(idx, 1);
        }
        $scope.$broadcast('updateSceneSelection', self.selection);
        self.update();
      };

      self.isSelected = function(node) {
        return self.selection.indexOf(node) != -1;
      };

      self.completeNode = function(node) {
        var nodeIds = self.getNodeIds();
        if (nodeIds.length <= 1) {
          return;
        }
        var params = {
          ignore: self.getEdgeIds(),
          source_id: [node.id],
          target_id: nodeIds,
          directed: false,
          limit: 500
        };
        $http.post('/api/1/graph/edges', params).then(function(res) {
          for (var i in res.data.results) {
            var edge = res.data.results[i];
            self.addEdge(edge);
          }
          self.update();
        });
      };

      self.update = function() {
        $scope.$broadcast('updateScene', self);
      };

      $scope.hasSelectedNodes = function() {
        return self.selection.length > 0;
      }

      $scope.removeSelectedNodes = function() {
        for (var i = self.selection.length - 1; i >= 0; i--) {
          self.removeNode(self.selection[i]);
        }
        $scope.$broadcast('updateSceneSelection', self.selection);
      }

      self.fromJSON = function(scene) {
        self.collection_id = scene.collection_id;
        for (var i in scene.nodes) {
          self.addNode(scene.nodes[i]); 
        }
        for (var i in scene.edges) {
          self.addEdge(scene.edges[i]); 
        }
      };

      self.toJSON = function() {
        return {
          collection_id: self.collection_id,
          nodes: self.nodes.map(function(n) {
            return n.toJSON();
          }),
          edges: self.edges.map(function(e) {
            return e.toJSON();
          })
        };
      };

      self.fromJSON($scope.scene);
    }]
  };
}]);
