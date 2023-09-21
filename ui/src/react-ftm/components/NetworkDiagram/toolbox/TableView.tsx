import React from 'react';
import isEmpty from 'lodash/isEmpty';
import { GraphContext } from 'react-ftm/components/NetworkDiagram/GraphContext';
import { EntityChanges } from 'react-ftm/components/common/types';
import { EntityTable } from 'react-ftm/components/EntityTable';
import { Button, Drawer, Position } from '@blueprintjs/core';
import { Entity } from '@alephdata/followthemoney';

import './TableView.scss';

interface ITableViewProps {
  toggleTableView: () => void;
  fitToSelection: () => void;
}

export class TableView extends React.Component<ITableViewProps> {
  static contextType = GraphContext;

  constructor(props: ITableViewProps) {
    super(props);

    this.onSelectionChange = this.onSelectionChange.bind(this);
    this.visitEntity = this.visitEntity.bind(this);
    this.onEntitiesUpdate = this.onEntitiesUpdate.bind(this);
  }

  onSelectionChange(entityIds: Array<string>, options: any) {
    const { layout, updateLayout } = this.context;
    layout.selectByEntityIds(entityIds, options);
    updateLayout(layout, null, { clearSearch: true });
  }

  visitEntity(entity: Entity | string) {
    const { fitToSelection, toggleTableView } = this.props;
    const entityId = typeof entity === 'string' ? entity : entity.id;
    if (entityId) {
      this.onSelectionChange([entityId], { additional: false });
      toggleTableView();
      fitToSelection();
    }
  }

  onEntitiesUpdate(entityChanges: EntityChanges) {
    const { entityManager, layout, updateLayout, viewport } = this.context;
    if (!isEmpty(entityChanges)) {
      if (entityChanges.created) {
        layout.layout(entityManager.getEntities(), viewport.center);
        layout.selectByEntityIds(
          entityChanges.created.map((e: Entity) => e.id)
        );
      }
      layout.layout(entityManager.getEntities());
      updateLayout(layout, entityChanges, { modifyHistory: true });
    }
  }

  render() {
    const { entityManager, layout, writeable } = this.context;
    const { toggleTableView } = this.props;

    return (
      <Drawer
        className="TableView"
        isOpen={true}
        hasBackdrop={false}
        position={Position.BOTTOM}
        autoFocus={false}
        enforceFocus={false}
        usePortal={false}
      >
        <Button
          className="TableView__close"
          icon="cross"
          minimal
          onClick={toggleTableView}
        />
        <EntityTable
          entityManager={entityManager}
          visitEntity={this.visitEntity}
          selection={layout.getSelectedEntityIds()}
          onSelectionChange={(entityIds: Array<string>, forceVal: boolean) =>
            this.onSelectionChange(entityIds, { forceVal, additional: true })
          }
          updateFinishedCallback={this.onEntitiesUpdate}
          writeable={writeable}
        />
      </Drawer>
    );
  }
}
