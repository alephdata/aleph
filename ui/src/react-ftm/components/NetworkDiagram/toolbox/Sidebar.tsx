import * as React from 'react';
import { defineMessages } from 'react-intl';
import { Entity } from '@alephdata/followthemoney';
import { Drawer } from '@blueprintjs/core';
import { GraphContext } from 'react-ftm/components/NetworkDiagram/GraphContext';
import { EntityList } from 'react-ftm/components/common';
import {
  EntityBulkEdit,
  EntityViewer,
  GroupingViewer,
} from 'react-ftm/components/NetworkDiagram/toolbox';
import { Grouping, Vertex } from 'react-ftm/components/NetworkDiagram/layout';

import './Sidebar.scss';

const messages = defineMessages({
  search_found_one: {
    id: 'search.results_text.one',
    defaultMessage: 'Found 1 result',
  },
  search_found_multiple: {
    id: 'search.results_text.multiple',
    defaultMessage: 'Found {count} results',
  },
  selected_multiple: {
    id: 'sidebar.selected.multiple',
    defaultMessage: '{count} selected',
  },
  search_found_none: {
    id: 'search.results_text.none',
    defaultMessage: 'No results found',
  },
  default_multiple: {
    id: 'sidebar.default.multiple',
    defaultMessage: '{count} entities',
  },
});

export interface ISidebarProps {
  searchText: string;
  isOpen: boolean;
  selectedEntities: Array<Entity>;
}

export class Sidebar extends React.Component<ISidebarProps> {
  static contextType = GraphContext;

  constructor(props: Readonly<ISidebarProps>) {
    super(props);
    this.onEntityChanged = this.onEntityChanged.bind(this);
    this.onEntitySelected = this.onEntitySelected.bind(this);
    this.removeGroupingEntity = this.removeGroupingEntity.bind(this);
    this.setVerticesColor = this.setVerticesColor.bind(this);
    this.setVerticesRadius = this.setVerticesRadius.bind(this);
    this.setGroupingColor = this.setGroupingColor.bind(this);
  }

  onEntityChanged(entity: Entity) {
    const { layout, entityManager, updateLayout } = this.context;
    const previousEntity = entityManager.getEntity(entity.id);
    entityManager.updateEntity(entity);
    layout.layout(entityManager.getEntities());
    updateLayout(
      layout,
      { updated: [{ prev: previousEntity, next: entity }] },
      { modifyHistory: true }
    );
  }

  removeGroupingEntity(grouping: Grouping, entity: Entity) {
    const { layout, updateLayout } = this.context;

    const vertex = layout.getVertexByEntity(entity);

    if (vertex) {
      layout.groupings.set(grouping.id, grouping.removeVertex(vertex));
      layout.selectElement(grouping.getVertices());
      updateLayout(layout, null, { modifyHistory: true });
    }
  }

  setVerticesColor(vertices: Array<Vertex>, color: string) {
    const { layout, updateLayout } = this.context;
    if (color === '#fff' || color === '#ffffff') {
      return;
    }

    vertices.forEach((v) => {
      if (v) {
        layout.vertices.set(v.id, v.setColor(color));
      }
    });
    updateLayout(layout, null, { modifyHistory: true });
  }

  setVerticesRadius(vertices: Array<Vertex>, radius: number) {
    const { layout, updateLayout } = this.context;
    vertices.forEach((v) => {
      if (v) {
        layout.vertices.set(v.id, v.setRadius(radius));
      }
    });

    updateLayout(layout, null, { modifyHistory: true });
  }

  setGroupingColor(grouping: Grouping, color: string) {
    const { layout, updateLayout } = this.context;
    if (grouping) {
      layout.groupings.set(grouping.id, grouping.setColor(color));
      updateLayout(layout, null, { modifyHistory: true });
    }
  }

  onEntitySelected(entity: Entity) {
    const { layout, updateLayout } = this.context;
    const vertexToSelect = layout.getVertexByEntity(entity);
    if (vertexToSelect) {
      layout.selectElement(vertexToSelect);
      updateLayout(layout, null, { clearSearch: true });
    }
  }

  render() {
    const { entityManager, intl, layout } = this.context;
    const { isOpen, searchText, selectedEntities } = this.props;
    const selectedGroupings = layout.getSelectedGroupings();
    let contents, headerText, editMenu;

    if (searchText && !selectedEntities.length) {
      headerText = intl.formatMessage(messages.search_found_none);
    } else if (selectedEntities.length === 1) {
      const entity = selectedEntities[0];
      let vertexRef;
      if (!entity.schema.edge) {
        vertexRef = layout.getVertexByEntity(entity);
      }
      contents = (
        <EntityViewer
          entity={entity}
          onEntityChanged={this.onEntityChanged}
          vertexRef={vertexRef}
          onVertexColorSelected={(vertex, color) =>
            this.setVerticesColor([vertex], color)
          }
          onVertexRadiusSelected={(vertex, radius) =>
            this.setVerticesRadius([vertex], radius)
          }
        />
      );
      headerText =
        !!searchText && intl.formatMessage(messages.search_found_one);
    } else if (
      !searchText &&
      selectedGroupings.length === 1 &&
      selectedGroupings[0].vertices?.size === selectedEntities.length
    ) {
      const grouping = selectedGroupings[0];
      const editMenuText = intl.formatMessage(messages.default_multiple, {
        count: selectedEntities.length,
      });
      contents = (
        <GroupingViewer
          grouping={grouping}
          onEntitySelected={this.onEntitySelected}
          onEntityRemoved={this.removeGroupingEntity}
          onColorSelected={this.setGroupingColor}
          editMenu={
            <EntityBulkEdit
              text={editMenuText}
              entities={selectedEntities}
              setVerticesColor={this.setVerticesColor}
              setVerticesRadius={this.setVerticesRadius}
            />
          }
        />
      );
    } else if (selectedEntities.length) {
      contents = (
        <EntityList
          entities={selectedEntities}
          onEntitySelected={this.onEntitySelected}
        />
      );
      headerText = intl.formatMessage(
        messages[searchText ? 'search_found_multiple' : 'selected_multiple'],
        { count: selectedEntities.length }
      );
      editMenu = (
        <EntityBulkEdit
          text={headerText}
          entities={selectedEntities}
          setVerticesColor={this.setVerticesColor}
          setVerticesRadius={this.setVerticesRadius}
        />
      );
    } else {
      const entities = entityManager.getThingEntities();
      contents = (
        <EntityList
          entities={entities as Entity[]}
          onEntitySelected={this.onEntitySelected}
        />
      );
    }

    return (
      <Drawer
        className="Sidebar"
        isOpen={isOpen}
        hasBackdrop={false}
        autoFocus={false}
        enforceFocus={false}
        usePortal={false}
      >
        {headerText && (
          <div className="Sidebar__header-text">{editMenu || headerText}</div>
        )}
        {contents}
      </Drawer>
    );
  }
}
