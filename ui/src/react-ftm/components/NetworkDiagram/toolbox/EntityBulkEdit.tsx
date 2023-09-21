import * as React from 'react';
import { defineMessages } from 'react-intl';
import { Entity } from '@alephdata/followthemoney';
import { Button, Collapse } from '@blueprintjs/core';
import { GraphContext } from 'react-ftm/components/NetworkDiagram/GraphContext';
import { ColorPicker, RadiusPicker } from 'react-ftm/editors';
// import { EntityList } from 'components/common';
// import { EntityBulkEdit, EntityViewer, GroupingViewer } from 'NetworkDiagram/toolbox';
import { Vertex } from 'react-ftm/components/NetworkDiagram/layout';

// import './EntityBulkEdit.scss';

const messages = defineMessages({
  show: {
    id: 'sidebar.edit.show',
    defaultMessage: 'Edit all',
  },
  hide: {
    id: 'sidebar.edit.hide',
    defaultMessage: 'Hide',
  },
});

export interface IEntityBulkEditProps {
  text: string;
  entities: Array<Entity>;
  setVerticesColor: (vertices: Array<Vertex>, color: string) => void;
  setVerticesRadius: (vertices: Array<Vertex>, radius: number) => void;
}

export interface IEntityBulkEditState {
  isOpen: boolean;
  selectedColor?: string;
  selectedRadius?: number;
}

export class EntityBulkEdit extends React.Component<
  IEntityBulkEditProps,
  IEntityBulkEditState
> {
  static contextType = GraphContext;

  constructor(props: Readonly<IEntityBulkEditProps>) {
    super(props);

    this.state = {
      isOpen: false,
    };
  }

  toggleOpen = () => {
    this.setState(({ isOpen }) => ({ isOpen: !isOpen }));
  };

  getVertices() {
    const { layout } = this.context;
    const { entities } = this.props;

    return entities
      .filter((e) => !e.schema.edge)
      .map((e) => layout.getVertexByEntity(e));
  }

  onColorSelected = (color: string) => {
    this.setState({ selectedColor: color });
    this.props.setVerticesColor(this.getVertices(), color);
  };

  onRadiusSelected = (radius: number) => {
    this.setState({ selectedRadius: radius });
    this.props.setVerticesRadius(this.getVertices(), radius);
  };

  render() {
    const { intl } = this.context;
    const { text } = this.props;
    const { isOpen, selectedColor, selectedRadius } = this.state;
    return (
      <div className="EntityBulkEdit">
        <div className="EntityBulkEdit__main">
          {text}
          <Button
            minimal
            small
            onClick={this.toggleOpen}
            rightIcon={isOpen ? 'chevron-up' : 'chevron-down'}
          >
            {intl.formatMessage(messages[isOpen ? 'hide' : 'show'])}
          </Button>
        </div>
        <Collapse isOpen={isOpen}>
          <ColorPicker
            currSelected={selectedColor}
            onSelect={this.onColorSelected}
          />
          <RadiusPicker
            radius={selectedRadius}
            onChange={this.onRadiusSelected}
          />
        </Collapse>
      </div>
    );
  }
}
