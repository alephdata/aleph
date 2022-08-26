import React from 'react';
import { Entity } from '@alephdata/followthemoney';
import { Menu, Icon } from '@blueprintjs/core';
import { Schema } from 'react-ftm/types';
import groupBy from 'lodash/groupBy';
import './EntityList.scss';

interface IEntityListProps {
  entities: Array<Entity>;
  onEntitySelected?: (selection: Entity) => void;
  onEntityRemoved?: (selection: Entity) => void;
}

export class EntityList extends React.PureComponent<IEntityListProps> {
  constructor(props: IEntityListProps) {
    super(props);

    this.renderItem = this.renderItem.bind(this);
  }

  renderItem(entity: Entity) {
    const { onEntityRemoved, onEntitySelected } = this.props;

    return (
      <li className="EntityList__item" key={entity.id}>
        <div
          className="EntityList__item__left bp3-menu-item"
          onClick={() => onEntitySelected && onEntitySelected(entity)}
        >
          <Schema.Icon schema={entity.schema} />
          <div className="bp3-fill">{entity.getCaption()}</div>
        </div>
        {onEntityRemoved && (
          <div
            className="EntityList__item__right"
            onClick={() => onEntityRemoved(entity)}
          >
            <Icon icon="cross" iconSize={14} />
          </div>
        )}
      </li>
    );
  }

  render() {
    const { entities } = this.props;
    entities.sort((a, b) =>
      a.getCaption().toLowerCase() > b.getCaption().toLowerCase() ? 1 : -1
    );
    const entityGroups = groupBy(entities, (e: Entity) => e.schema.plural);

    return (
      <Menu className="EntityList">
        {Object.entries(entityGroups).map(([key, values]: any) => {
          return (
            <div className="EntityList__category" key={key}>
              <h5 className="EntityList__category__title">{key}</h5>
              <div className="EntityList__category__values">
                {values.map(this.renderItem)}
              </div>
            </div>
          );
        })}
      </Menu>
    );
  }
}
