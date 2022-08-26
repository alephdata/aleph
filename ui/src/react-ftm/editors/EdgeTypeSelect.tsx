import * as React from 'react';
import partition from 'lodash/partition';
import {
  Menu,
  MenuItem,
  Icon,
  Button,
  Alignment,
  Position,
} from '@blueprintjs/core';
import {
  Select,
  IItemListRendererProps,
  IItemRendererProps,
} from '@blueprintjs/select';

import { EdgeType, Schema } from 'react-ftm/types';

const TypedSelect = Select.ofType<EdgeType>();

interface IEdgeTypeSelectProps {
  items: Array<EdgeType>;
  value?: EdgeType;
  onChange: (item: EdgeType) => void;
  placeholder: string;
}

class EdgeTypeSelect extends React.PureComponent<IEdgeTypeSelectProps> {
  constructor(props: any) {
    super(props);
  }

  getEdgeTypeIcon(type?: EdgeType) {
    if (type?.schema) {
      return <Schema.Icon schema={type.schema} />;
    } else {
      return <Icon icon="link" />;
    }
  }

  renderEdgeTypeList = (props: IItemListRendererProps<EdgeType>) => {
    const { items, itemsParentRef, renderItem } = props;
    const [propertyEdgeTypes, entityEdgeTypes] = partition(
      items,
      (et: EdgeType) => et.isPropertyEdgeType()
    );
    return (
      <Menu ulRef={itemsParentRef}>
        {entityEdgeTypes.map(renderItem)}
        <Menu.Divider />
        {propertyEdgeTypes.map(renderItem)}
      </Menu>
    );
  };

  renderEdgeType = (
    type: EdgeType,
    { handleClick, modifiers }: IItemRendererProps
  ) => {
    return (
      <MenuItem
        active={modifiers.active}
        key={type.key}
        text={type.label}
        icon={this.getEdgeTypeIcon(type)}
        onClick={handleClick}
      />
    );
  };

  render() {
    const { items, onChange, placeholder, value } = this.props;

    return (
      <TypedSelect
        popoverProps={{
          position: Position.BOTTOM_LEFT,
          minimal: true,
          targetProps: { style: { width: '100%' } },
        }}
        filterable={false}
        items={items}
        itemListRenderer={this.renderEdgeTypeList}
        itemRenderer={this.renderEdgeType}
        onItemSelect={onChange}
      >
        <Button
          fill
          disabled={!items.length}
          text={value ? value.label : placeholder}
          alignText={Alignment.LEFT}
          icon={this.getEdgeTypeIcon(value)}
          rightIcon="double-caret-vertical"
        />
      </TypedSelect>
    );
  }
}

export default EdgeTypeSelect;
