import React from 'react';
import { IWrappedElementProps } from 'react-ftm/embed/common';
import { EntityTable } from 'react-ftm/components/EntityTable';

interface IEntityTableState {
  selection: Array<string>;
}

export default class EntityTableWrapper extends React.Component<
  IWrappedElementProps,
  IEntityTableState
> {
  constructor(props: IWrappedElementProps) {
    super(props);

    this.state = { selection: [] };
    this.onSelectionChange = this.onSelectionChange.bind(this);
  }

  onSelectionChange(entityIds: Array<string>, newVal: boolean) {
    this.setState(({ selection }) => {
      let newSelection;
      if (newVal) {
        newSelection = [...selection, ...entityIds];
      } else {
        newSelection = selection.filter((id) => entityIds.indexOf(id) < 0);
      }
      return { selection: newSelection };
    });
  }

  render() {
    const { entityManager, onUpdate, writeable } = this.props;
    return (
      <EntityTable
        entityManager={entityManager}
        writeable={writeable}
        updateFinishedCallback={() => onUpdate()}
        selection={this.state.selection}
        onSelectionChange={this.onSelectionChange}
      />
    );
  }
}
