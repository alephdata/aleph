import * as React from 'react';
import {
  AnchorButton,
  Button,
  ButtonGroup,
  Menu,
  MenuItem,
} from '@blueprintjs/core';
import {
  Popover2 as Popover,
  Tooltip2 as Tooltip,
} from '@blueprintjs/popover2';
import c from 'classnames';

export interface IToolbarButton {
  icon: string;
  helpText: string;
  disabled?: boolean;
  writeableOnly?: boolean;
  onClick?: (e?: any) => void;
  subItems?: Array<IToolbarButton>;
}

export type IToolbarButtonGroup = Array<IToolbarButton>;

interface IToolbarButtonGroupProps {
  buttonGroup: IToolbarButtonGroup;
  visible: boolean;
  editorTheme: string;
}

export class ToolbarButtonGroup extends React.PureComponent<IToolbarButtonGroupProps> {
  constructor(props: Readonly<IToolbarButtonGroupProps>) {
    super(props);
  }

  renderVisible(items: any) {
    const { editorTheme } = this.props;

    return (
      <ButtonGroup className="ToolbarButtonGroup">
        {items.map((config: any) => {
          const { disabled, helpText, icon, onClick, subItems } = config;
          if (subItems) {
            return (
              <Popover
                key={icon}
                content={<Menu>{this.renderHidden(subItems)}</Menu>}
                position="bottom"
                popoverClassName={c('Toolbar__menu', `theme-${editorTheme}`)}
                rootBoundary="viewport"
                minimal
                interactionKind="hover"
              >
                <Button
                  icon={icon}
                  disabled={disabled}
                  rightIcon="caret-down"
                />
              </Popover>
            );
          } else {
            return (
              <Tooltip
                content={helpText}
                key={icon}
                position="bottom"
                popoverClassName={c(
                  'Toolbar__button-tip',
                  `theme-${editorTheme}`
                )}
                rootBoundary="viewport"
              >
                <AnchorButton
                  icon={icon}
                  onClick={onClick}
                  disabled={disabled}
                />
              </Tooltip>
            );
          }
        })}
      </ButtonGroup>
    );
  }

  renderHidden(items: any) {
    return items.map(({ disabled, helpText, icon, onClick, subItems }: any) => (
      <MenuItem
        icon={icon}
        key={icon}
        onClick={onClick}
        text={helpText}
        disabled={disabled}
      >
        {subItems && this.renderHidden(subItems)}
      </MenuItem>
    ));
  }

  render() {
    const { buttonGroup, visible } = this.props;

    if (visible) {
      return this.renderVisible(buttonGroup);
    } else {
      return this.renderHidden(buttonGroup);
    }
  }
}
