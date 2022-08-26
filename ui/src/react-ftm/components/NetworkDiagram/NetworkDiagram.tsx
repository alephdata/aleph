import * as React from 'react';
import c from 'classnames';
import { Entity, Schema } from '@alephdata/followthemoney';
import { Button, ButtonGroup } from '@blueprintjs/core';
import { Tooltip2 as Tooltip } from '@blueprintjs/popover2';
import { defineMessages, injectIntl, WrappedComponentProps } from 'react-intl';

import {
  EdgeCreateDialog,
  EntityCreateDialog,
  EntityManager,
} from 'react-ftm/components/common';
import { GraphConfig } from 'react-ftm/components/NetworkDiagram/GraphConfig';
import { GraphRenderer } from 'react-ftm/components/NetworkDiagram/renderer';
import {
  Edge,
  GraphLayout,
  Rectangle,
  Point,
  Settings,
  Vertex,
} from 'react-ftm/components/NetworkDiagram/layout';
import { Viewport } from 'react-ftm/components/NetworkDiagram/Viewport';
import { GraphContext } from 'react-ftm/components/NetworkDiagram/GraphContext';
import {
  Sidebar,
  TableView,
  Toolbar,
  VertexMenu,
} from 'react-ftm/components/NetworkDiagram/toolbox';
import { History } from 'react-ftm/components/NetworkDiagram/History';
import {
  GroupingCreateDialog,
  SettingsDialog,
} from 'react-ftm/components/NetworkDiagram/dialogs';
import { EdgeType } from 'react-ftm/types';
import { EntityChanges } from 'react-ftm/components/common/types';
import {
  filterVerticesByText,
  modes,
} from 'react-ftm/components/NetworkDiagram/utils';
import { showSuccessToast, showWarningToast } from 'react-ftm/utils';

import './NetworkDiagram.scss';

const messages = defineMessages({
  tooltip_fit_selection: {
    id: 'tooltips.fit_to_selection',
    defaultMessage: 'Fit view to selection',
  },
  expand_success: {
    id: 'toasts.expand_success',
    defaultMessage: `Successfully added {vertices} new
      {vertices, plural, one {node} other {nodes}}
      and {edges} new
      {edges, plural, one {link} other {links}}
      to the diagram`,
  },
  expand_none: {
    id: 'toasts.expand_none',
    defaultMessage: 'All expansion results are already present in the diagram',
  },
});

export interface INetworkDiagramProps extends WrappedComponentProps {
  config: GraphConfig;
  locale?: string;
  entityManager: EntityManager;
  layout: GraphLayout;
  viewport: Viewport;
  updateLayout: (layout: GraphLayout, options?: any) => void;
  updateViewport: (viewport: Viewport) => void;
  writeable: boolean;
  externalFilterText?: string;
  svgRef?: React.RefObject<SVGSVGElement>;
}

interface INetworkDiagramState {
  animateTransition: boolean;
  interactionMode: string;
  searchText: string;
  tableView: boolean;
  settingsDialogOpen: boolean;
  vertexCreateOptions?: any;
  vertexMenuSettings: any;
}

class NetworkDiagramBase extends React.Component<
  INetworkDiagramProps,
  INetworkDiagramState
> {
  state: INetworkDiagramState;
  history: History;

  constructor(props: INetworkDiagramProps) {
    super(props);
    const { externalFilterText, layout, writeable } = props;

    this.history = new History();

    if (layout) {
      this.history.push({ layout: layout.toJSON() });
    }

    this.state = {
      animateTransition: false,
      interactionMode: writeable ? modes.SELECT : modes.PAN,
      tableView: false,
      searchText: externalFilterText || '',
      vertexMenuSettings: null,
      settingsDialogOpen: false,
    };

    this.addVertex = this.addVertex.bind(this);
    this.fitToSelection = this.fitToSelection.bind(this);
    this.navigateHistory = this.navigateHistory.bind(this);
    this.onZoom = this.onZoom.bind(this);
    this.onChangeSearch = this.onChangeSearch.bind(this);
    this.onSubmitSearch = this.onSubmitSearch.bind(this);
    this.removeSelection = this.removeSelection.bind(this);
    this.setInteractionMode = this.setInteractionMode.bind(this);
    this.toggleTableView = this.toggleTableView.bind(this);
    this.ungroupSelection = this.ungroupSelection.bind(this);
    this.updateLayout = this.updateLayout.bind(this);
    this.updateViewport = this.updateViewport.bind(this);
    this.hideVertexMenu = this.hideVertexMenu.bind(this);
    this.showVertexMenu = this.showVertexMenu.bind(this);
    this.toggleSettingsDialog = this.toggleSettingsDialog.bind(this);
    this.expandVertex = this.expandVertex.bind(this);
    this.onVertexCreate = this.onVertexCreate.bind(this);
    this.onEdgeCreate = this.onEdgeCreate.bind(this);
  }

  componentDidMount() {
    const { externalFilterText } = this.props;

    if (externalFilterText) {
      this.onChangeSearch(externalFilterText);
      this.onSubmitSearch();
    }
  }

  componentDidUpdate(prevProps: INetworkDiagramProps) {
    const { externalFilterText } = this.props;

    if (
      externalFilterText !== undefined &&
      prevProps.externalFilterText !== externalFilterText
    ) {
      this.onChangeSearch(externalFilterText);
      this.onSubmitSearch();
    }
  }

  onZoom(factor: number) {
    const { viewport } = this.props;
    if (viewport) {
      const newZoomLevel = viewport.zoomLevel * factor;
      this.updateViewport(viewport.setZoom(newZoomLevel), { animate: true });
    }
  }

  onChangeSearch(searchText: string) {
    const { layout } = this.props;

    if (searchText.length > 0) {
      const predicate = filterVerticesByText(searchText);
      layout.selectVerticesByFilter(predicate);
    } else {
      layout.clearSelection();
    }
    this.setState({ searchText });
    this.updateLayout(layout, undefined, { modifyHistory: false });
  }

  onSubmitSearch(event?: React.FormEvent) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.fitToSelection();
  }

  updateLayout(
    layout: GraphLayout,
    entityChanges?: EntityChanges,
    options?: any
  ) {
    if (options?.modifyHistory) {
      this.history.push({
        layout: layout.toJSON(),
        entityChanges: entityChanges,
      });
    }

    this.setState(({ searchText }) => ({
      animateTransition: false,
      searchText: options?.clearSearch ? '' : searchText,
    }));

    this.props.updateLayout(layout, {
      propagate: options?.modifyHistory || options?.forceSaveUpdate,
      clearSearch: options?.clearSearch,
    });
  }

  updateViewport(viewport: Viewport, { animate = false } = {}) {
    const { updateViewport } = this.props;

    this.setState({ animateTransition: animate });

    updateViewport(viewport);
  }

  navigateHistory(factor: number) {
    const { config, entityManager } = this.props;

    const { layout, entityChanges } = this.history.go(factor);

    if (entityChanges) {
      entityManager.applyEntityChanges(entityChanges, factor);
    }

    this.updateLayout(GraphLayout.fromJSON(config, layout), undefined, {
      forceSaveUpdate: true,
    });
  }

  addVertex(options?: any) {
    this.setState({
      interactionMode: modes.VERTEX_CREATE,
      vertexCreateOptions: options,
    });
  }

  async onVertexCreate(entityData: any) {
    const { entityManager, layout, viewport } = this.props;
    const { vertexCreateOptions } = this.state;

    const entity = entityManager.createEntity(entityData);
    const center = vertexCreateOptions?.initialPosition || viewport.center;

    layout.layout(entityManager.getEntities(), center);
    layout.selectByEntityIds([entity.id]);

    const vertex = layout.getVertexByEntity(entity);

    if (vertex) {
      if (vertexCreateOptions?.initialPosition) {
        layout.vertices.set(vertex.id, vertex.snapPosition(center));
      }
      this.updateLayout(
        layout,
        { created: [entity] },
        { modifyHistory: true, clearSearch: true }
      );
      return entity;
    }
  }

  onEdgeCreate(source: Entity, target: Entity, type: EdgeType) {
    const { entityManager, layout, viewport } = this.props;
    const sourceVertex = layout.getVertexByEntity(source);
    const targetVertex = layout.getVertexByEntity(target);
    if (!sourceVertex || !targetVertex) {
      return;
    }

    const entityChanges: EntityChanges = {};
    let edge;
    if (type.property && source) {
      const nextSource = source.clone();
      nextSource.setProperty(type.property, target);
      entityManager.updateEntity(nextSource);
      layout.layout(entityManager.getEntities());
      entityChanges.updated = [{ prev: source, next: nextSource }];
      edge = Edge.fromValue(layout, type.property, sourceVertex, targetVertex);
    }
    if (type.schema && type.schema.edge && source && target) {
      const entity = entityManager.createEntity({
        schema: type.schema,
        properties: {
          [type.schema.edge.source]: source.id,
          [type.schema.edge.target]: target.id,
        },
      });
      entityManager.addEntities([entity]);
      layout.layout(entityManager.getEntities());
      entityChanges.created = [entity];
      edge = Edge.fromEntity(layout, entity, sourceVertex, targetVertex);
    }

    if (edge) {
      layout.selectElement(edge);
      this.updateViewport(viewport.setCenter(edge.getCenter()), {
        animate: true,
      });
      this.updateLayout(layout, entityChanges, {
        modifyHistory: true,
        clearSearch: true,
      });
    }
  }

  async showVertexMenu(
    vertex: Vertex,
    position: Point,
    onlyShowExpand = false
  ) {
    const { entityManager } = this.props;
    const menuSettings = { vertex, position, anchor: 'top', onlyShowExpand };

    const docHeight = document.body.clientHeight;
    if (position.y > docHeight / 2) {
      menuSettings.anchor = 'bottom';
      menuSettings.position = new Point(position.x, docHeight - position.y);
    }

    this.setState({
      vertexMenuSettings: menuSettings,
    });
    if (vertex.entityId) {
      const expandResults = await entityManager.expandEntity(
        vertex.entityId,
        undefined,
        0
      );
      this.setState(({ vertexMenuSettings }) => ({
        vertexMenuSettings: vertexMenuSettings
          ? { ...menuSettings, expandResults }
          : null,
      }));
    }
  }

  hideVertexMenu() {
    this.setState({ vertexMenuSettings: null });
  }

  async expandVertex(vertex: Vertex, properties: Array<string>) {
    if (!vertex.entityId) return;
    const { entityManager, intl, layout, viewport } = this.props;

    this.setState({ vertexMenuSettings: null });

    const expandResults = await entityManager.expandEntity(
      vertex.entityId,
      properties
    );
    if (expandResults) {
      const before = layout.getVisibleElementCount();

      const entityIds = expandResults
        .reduce(
          (entities: Array<Entity>, expandObj: any) => [
            ...entities,
            ...expandObj.entities,
          ],
          []
        )
        .map((entity: Entity) => {
          entityManager.createEntity(entity);
          return entity.id;
        });

      layout.layout(entityManager.getEntities(), viewport.center);
      layout.selectByEntityIds(entityIds);

      const after = layout.getVisibleElementCount();
      const vDiff = after.vertices - before.vertices;
      const eDiff = after.edges - before.edges;

      if (vDiff || eDiff) {
        showSuccessToast(
          intl.formatMessage(messages.expand_success, {
            vertices: vDiff,
            edges: eDiff,
          })
        );
      } else {
        showWarningToast(intl.formatMessage(messages.expand_none));
      }

      this.updateLayout(layout, undefined, { modifyHistory: true });
    }
  }

  setInteractionMode(newMode?: string) {
    this.setState({
      interactionMode: newMode || modes.SELECT,
      vertexCreateOptions: null,
    });
  }

  toggleTableView() {
    this.setState(({ tableView }) => ({ tableView: !tableView }));
  }

  toggleSettingsDialog(settings?: any) {
    const { entityManager, layout } = this.props;

    this.setState(({ settingsDialogOpen }) => ({
      settingsDialogOpen: !settingsDialogOpen,
    }));

    if (settings) {
      layout.settings = Settings.fromJSON(settings);
      layout.layout(entityManager.getEntities());
      this.updateLayout(layout, undefined, { modifyHistory: true });
    }
  }
  fitToSelection() {
    const { layout, viewport } = this.props;
    const selection = layout.getSelectedVertices();
    const vertices = selection.length > 0 ? selection : layout.getVertices();
    const points = vertices.filter((v) => !v.isHidden()).map((v) => v.position);
    const rect = Rectangle.fromPoints(...points);
    this.updateViewport(viewport.fitToRect(rect), { animate: true });
  }

  removeSelection() {
    const { entityManager, layout } = this.props;

    const idsToRemove = layout.removeSelection();
    const entitiesToRemove = entityManager.getEntities(idsToRemove);
    entityManager.deleteEntities(idsToRemove);
    layout.layout(entityManager.getEntities());

    this.updateLayout(
      layout,
      { deleted: entitiesToRemove },
      { modifyHistory: true }
    );
  }

  ungroupSelection() {
    const { layout } = this.props;
    layout.ungroupSelection();
    this.updateLayout(layout, undefined, { modifyHistory: true });
  }

  render() {
    const { config, entityManager, intl, layout, svgRef, viewport, writeable } =
      this.props;
    const {
      animateTransition,
      interactionMode,
      searchText,
      settingsDialogOpen,
      tableView,
      vertexMenuSettings,
    } = this.state;
    const selectedEntities = entityManager.getEntities(
      layout.getSelectedEntityIds()
    );

    const layoutContext = {
      layout,
      updateLayout: this.updateLayout,
      viewport,
      updateViewport: this.updateViewport,
      entityManager,
      intl,
      writeable,
      interactionMode,
    };

    const actions = {
      addVertex: this.addVertex,
      navigateHistory: this.navigateHistory,
      removeSelection: this.removeSelection,
      setInteractionMode: this.setInteractionMode,
      toggleTableView: this.toggleTableView,
      ungroupSelection: this.ungroupSelection,
      onChangeSearch: this.onChangeSearch,
      onSubmitSearch: this.onSubmitSearch,
      showVertexMenu: this.showVertexMenu,
      expandVertex: this.expandVertex,
      fitToSelection: this.fitToSelection,
      toggleSettingsDialog: this.toggleSettingsDialog,
    };

    const showSidebar =
      layout.vertices && layout.vertices.size > 0 && !tableView;

    return (
      <GraphContext.Provider value={layoutContext}>
        <div
          className={c(
            'NetworkDiagram',
            `toolbar-${config.toolbarPosition}`,
            `theme-${config.editorTheme}`
          )}
        >
          <div className="NetworkDiagram__toolbar">
            <Toolbar
              actions={actions}
              history={this.history}
              showEditingButtons={writeable}
              searchText={searchText}
              tableView={tableView}
            />
          </div>
          <div
            className={c('NetworkDiagram__content', {
              'sidebar-open': showSidebar,
              'table-open': tableView,
            })}
          >
            <div className="NetworkDiagram__main">
              <div className="NetworkDiagram__button-group">
                <ButtonGroup vertical>
                  <Tooltip
                    content={intl.formatMessage(messages.tooltip_fit_selection)}
                  >
                    <Button icon="zoom-to-fit" onClick={this.fitToSelection} />
                  </Tooltip>
                  <Button icon="zoom-in" onClick={() => this.onZoom(0.8)} />
                  <Button icon="zoom-out" onClick={() => this.onZoom(1.2)} />
                </ButtonGroup>
              </div>
              <GraphRenderer
                svgRef={svgRef}
                animateTransition={animateTransition}
                actions={actions}
              />
            </div>
            {showSidebar && (
              <div className="NetworkDiagram__sidebar">
                <Sidebar
                  searchText={searchText}
                  isOpen={showSidebar}
                  selectedEntities={selectedEntities}
                />
              </div>
            )}
            {tableView && (
              <div className="NetworkDiagram__table">
                <TableView
                  toggleTableView={this.toggleTableView}
                  fitToSelection={this.fitToSelection}
                  key={this.history.getRevertedDistance()}
                />
              </div>
            )}
          </div>
        </div>
        {writeable && (
          <>
            <EntityCreateDialog
              isOpen={interactionMode === modes.VERTEX_CREATE}
              onSubmit={this.onVertexCreate}
              toggleDialog={this.setInteractionMode}
              schema={entityManager.model.getSchema('Person')}
              model={entityManager.model}
              fetchEntitySuggestions={
                entityManager.hasSuggest
                  ? (queryText: string, schemata?: Array<Schema>) =>
                      entityManager.getEntitySuggestions(
                        false,
                        queryText,
                        schemata
                      )
                  : undefined
              }
              intl={intl}
            />
            <GroupingCreateDialog
              isOpen={interactionMode === modes.GROUPING_CREATE}
              toggleDialog={this.setInteractionMode}
            />
            <VertexMenu
              isOpen={
                vertexMenuSettings !== null &&
                interactionMode !== modes.EDGE_DRAW
              }
              contents={vertexMenuSettings}
              actions={actions}
              hideMenu={this.hideVertexMenu}
            />
            <SettingsDialog
              isOpen={settingsDialogOpen}
              settings={layout.settings}
              toggleDialog={this.toggleSettingsDialog}
            />
            <EdgeCreateDialog
              source={selectedEntities?.[0]}
              target={selectedEntities?.[1]}
              isOpen={interactionMode === modes.EDGE_CREATE}
              toggleDialog={this.setInteractionMode}
              onSubmit={this.onEdgeCreate}
              entityManager={entityManager}
              fetchEntitySuggestions={(
                queryText: string,
                schemata?: Array<Schema>
              ) =>
                entityManager.getEntitySuggestions(true, queryText, schemata)
              }
              intl={intl}
            />
          </>
        )}
      </GraphContext.Provider>
    );
  }
}

export const NetworkDiagram = injectIntl(NetworkDiagramBase);
