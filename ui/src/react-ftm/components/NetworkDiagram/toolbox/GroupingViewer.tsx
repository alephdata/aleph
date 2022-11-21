import * as React from 'react';
import { defineMessages } from 'react-intl';
import { Icon } from '@blueprintjs/core';
import { Entity } from '@alephdata/followthemoney';
import { ColorPicker } from 'react-ftm/editors';
import { Grouping } from 'react-ftm/components/NetworkDiagram/layout';
import { GraphContext } from 'react-ftm/components/NetworkDiagram/GraphContext';
import { EntityList } from 'react-ftm/components/common/EntityList';

import './GroupingViewer.scss';

const messages = defineMessages({
  group: {
    id: 'grouping.label',
    defaultMessage: 'Group',
  },
});

interface IGroupingViewerProps {
  grouping: Grouping;
  onEntitySelected: (entity: Entity) => void;
  onEntityRemoved: (grouping: Grouping, entity: Entity) => void;
  onColorSelected: (grouping: Grouping, color: string) => void;
  editMenu: any;
}

export class GroupingViewer extends React.PureComponent<IGroupingViewerProps> {
  static contextType = GraphContext;

  render() {
    const { entityManager, intl, writeable } = this.context;
    const {
      editMenu,
      grouping,
      onEntitySelected,
      onEntityRemoved,
      onColorSelected,
    } = this.props;
    return (
      <div className="GroupingViewer">
        <div className="GroupingViewer__title">
          <div className="GroupingViewer__title__text">
            <p className="GroupingViewer__title__text__secondary">
              <Icon icon="group-objects" />
              <span>{intl.formatMessage(messages.group)}</span>
            </p>
            <h2 className="GroupingViewer__title__text__main">
              {grouping.label}
            </h2>
          </div>
          <div className="GroupingViewer__title__settings">
            <ColorPicker
              currSelected={grouping.color}
              onSelect={(color: string) => onColorSelected(grouping, color)}
              swatchShape="square"
            />
          </div>
        </div>
        <div className="">{editMenu}</div>
        <EntityList
          entities={entityManager.getEntities(grouping.getEntityIds())}
          onEntitySelected={onEntitySelected}
          onEntityRemoved={
            writeable
              ? (entity) => onEntityRemoved(grouping, entity)
              : undefined
          }
        />
      </div>
    );
  }
}
