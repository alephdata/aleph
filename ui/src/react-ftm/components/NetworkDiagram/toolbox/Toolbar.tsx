import * as React from 'react';
import { defineMessages } from 'react-intl';
import {
  Boundary,
  Button,
  Divider,
  Menu,
  OverflowList,
} from '@blueprintjs/core';
import { Popover2 as Popover } from '@blueprintjs/popover2';
import c from 'classnames';

import { GraphContext } from 'react-ftm/components/NetworkDiagram/GraphContext';
import {
  IToolbarButtonGroup,
  ToolbarButtonGroup,
  SearchBox,
} from 'react-ftm/components/NetworkDiagram/toolbox';
import { modes } from 'react-ftm/components/NetworkDiagram/utils';
import {
  Point,
  centerAround,
  positionSelection,
  type PositionType,
} from 'react-ftm/components/NetworkDiagram/layout';

import { History } from 'react-ftm/components/NetworkDiagram/History';

import './Toolbar.scss';

const messages = defineMessages({
  tooltip_undo: {
    id: 'tooltip.undo',
    defaultMessage: 'Undo',
  },
  tooltip_redo: {
    id: 'tooltip.redo',
    defaultMessage: 'Redo',
  },
  tooltip_add_entities: {
    id: 'tooltip.add_entities',
    defaultMessage: 'Add entities',
  },
  tooltip_add_edges: {
    id: 'tooltip.add_edges',
    defaultMessage: 'Add link',
  },
  tooltip_expand: {
    id: 'tooltip.expand',
    defaultMessage: 'Discover links',
  },
  tooltip_delete: {
    id: 'tooltip.delete',
    defaultMessage: 'Delete selected',
  },
  tooltip_group: {
    id: 'tooltip.group',
    defaultMessage: 'Group selected',
  },
  tooltip_ungroup: {
    id: 'tooltip.ungroup',
    defaultMessage: 'Ungroup selected',
  },
  tooltip_select_mode: {
    id: 'tooltip.select_mode',
    defaultMessage: 'Toggle select mode',
  },
  tooltip_pan_mode: {
    id: 'tooltip.pan_mode',
    defaultMessage: 'Toggle pan mode',
  },
  tooltip_layouts: {
    id: 'tooltip.layouts',
    defaultMessage: 'Layouts',
  },
  tooltip_layout_horizontal: {
    id: 'tooltip.layout_horizontal',
    defaultMessage: 'Align horizontal',
  },
  tooltip_layout_vertical: {
    id: 'tooltip.layout_vertical',
    defaultMessage: 'Align vertical',
  },
  tooltip_layout_circle: {
    id: 'tooltip.layout_circle',
    defaultMessage: 'Arrange as circle',
  },
  tooltip_layout_hierarchy: {
    id: 'tooltip.layout_hierarchy',
    defaultMessage: 'Arrange as hierarchy',
  },
  tooltip_layout_auto: {
    id: 'tooltip.layout_auto',
    defaultMessage: 'Auto-layout',
  },
  tooltip_layout_center: {
    id: 'tooltip.layout_center',
    defaultMessage: 'Center',
  },
  tooltip_sidebar_view: {
    id: 'tooltip.sidebar_view',
    defaultMessage: 'Show sidebar',
  },
  tooltip_table_view: {
    id: 'tooltip.table_view',
    defaultMessage: 'Show table',
  },
  tooltip_export_svg: {
    id: 'tooltip.export_svg',
    defaultMessage: 'Export as SVG',
  },
  tooltip_settings: {
    id: 'tooltip.settings',
    defaultMessage: 'Settings',
  },
});

interface IToolbarProps {
  actions: any;
  history: History;
  showEditingButtons: boolean;
  searchText: string;
  tableView: boolean;
}

export class Toolbar extends React.Component<IToolbarProps> {
  static contextType = GraphContext;

  constructor(props: Readonly<IToolbarProps>) {
    super(props);
    this.onSetInteractionMode = this.onSetInteractionMode.bind(this);
    this.onPosition = this.onPosition.bind(this);
    this.itemRenderer = this.itemRenderer.bind(this);
    this.overflowListRenderer = this.overflowListRenderer.bind(this);
  }

  onSetInteractionMode(newMode: string) {
    const { layout, updateLayout } = this.context;
    const { actions } = this.props;
    actions.setInteractionMode(newMode);
    updateLayout(layout);
  }

  onPosition(type: PositionType) {
    const { layout, updateLayout } = this.context;
    const { actions } = this.props;
    updateLayout(positionSelection(layout, type), null, {
      modifyHistory: true,
    });
    actions.fitToSelection();
  }

  itemRenderer(buttonGroup: IToolbarButtonGroup, visible: boolean) {
    const { layout } = this.context;
    const { showEditingButtons } = this.props;

    const filteredGroup = showEditingButtons
      ? buttonGroup
      : buttonGroup.filter((b: any) => !b.writeableOnly);
    if (!filteredGroup.length) {
      return <></>;
    }

    return (
      <React.Fragment key={filteredGroup[0]?.helpText}>
        <Divider />
        <ToolbarButtonGroup
          buttonGroup={filteredGroup}
          visible={visible}
          editorTheme={layout.config.editorTheme}
        />
      </React.Fragment>
    );
  }

  overflowListRenderer(overflowItems: Array<IToolbarButtonGroup>) {
    const { config } = this.context.layout;
    const menuContent = overflowItems.map((item: IToolbarButtonGroup) =>
      this.itemRenderer(item, false)
    );
    return (
      <Popover
        content={<Menu>{menuContent}</Menu>}
        position="bottom"
        minimal
        popoverClassName={c('Toolbar__menu', `theme-${config.editorTheme}`)}
        rootBoundary="viewport"
      >
        <Button icon="double-chevron-right" />
      </Popover>
    );
  }

  render() {
    const { entityManager, interactionMode, intl, layout, updateLayout } =
      this.context;
    const { actions, history, searchText, tableView } = this.props;

    const vertices = layout.getSelectedVertices();
    const hasSelection = layout.hasSelection();
    const canAddEdge = vertices.length > 0 && vertices.length <= 2;
    const canExpandSelection =
      entityManager.hasExpand && layout.getSelectedVertices().length === 1;
    const canGroupSelection = layout.getSelectedVertices().length > 1;
    const canUngroupSelection = layout.getSelectedGroupings().length >= 1;
    const showSearch = layout.vertices && layout.vertices.size > 0;
    const { logo } = layout.config;

    const buttons: Array<IToolbarButtonGroup> = [
      [
        {
          helpText: intl.formatMessage(messages.tooltip_undo),
          icon: 'undo',
          onClick: () => actions.navigateHistory(History.BACK),
          disabled: !history.canGoTo(History.BACK),
          writeableOnly: true,
        },
        {
          helpText: intl.formatMessage(messages.tooltip_redo),
          icon: 'redo',
          onClick: () => actions.navigateHistory(History.FORWARD),
          disabled: !history.canGoTo(History.FORWARD),
          writeableOnly: true,
        },
      ],
      [
        {
          helpText: intl.formatMessage(messages.tooltip_add_entities),
          icon: 'new-object',
          onClick: () => this.onSetInteractionMode(modes.VERTEX_CREATE),
          writeableOnly: true,
        },
        {
          helpText: intl.formatMessage(messages.tooltip_add_edges),
          icon: 'new-link',
          onClick: () => this.onSetInteractionMode(modes.EDGE_CREATE),
          disabled: !canAddEdge,
          writeableOnly: true,
        },
        {
          helpText: intl.formatMessage(messages.tooltip_delete),
          icon: 'trash',
          onClick: () => actions.removeSelection(),
          disabled: !hasSelection,
          writeableOnly: true,
        },
        ...(entityManager.hasExpand
          ? [
              {
                helpText: intl.formatMessage(messages.tooltip_expand),
                icon: 'search-around',
                onClick: (e: React.MouseEvent) => {
                  const selectedVertex = vertices[0];

                  if (selectedVertex.isEntity()) {
                    const isTopToolbar =
                      layout.config.toolbarPosition === 'top';
                    const posX = isTopToolbar ? e.clientX - 10 : 70;
                    const posY = isTopToolbar ? 40 : e.clientY - 10;

                    actions.showVertexMenu(
                      selectedVertex,
                      new Point(posX, posY),
                      true
                    );
                  }
                },
                disabled: !canExpandSelection,
                writeableOnly: true,
              },
            ]
          : []),
      ],
      [
        {
          helpText: intl.formatMessage(messages.tooltip_group),
          icon: 'group-objects',
          onClick: () => this.onSetInteractionMode(modes.GROUPING_CREATE),
          disabled: !canGroupSelection,
          writeableOnly: true,
        },
        {
          helpText: intl.formatMessage(messages.tooltip_ungroup),
          icon: 'ungroup-objects',
          onClick: () => actions.ungroupSelection(),
          disabled: !canUngroupSelection,
          writeableOnly: true,
        },
      ],
      [
        {
          helpText: intl.formatMessage(messages.tooltip_select_mode),
          icon: 'select',
          disabled: interactionMode !== modes.PAN,
          onClick: () => this.onSetInteractionMode(modes.SELECT),
        },
        {
          helpText: intl.formatMessage(messages.tooltip_pan_mode),
          icon: 'hand',
          disabled: interactionMode === modes.PAN,
          onClick: () => this.onSetInteractionMode(modes.PAN),
        },
      ],
      [
        {
          helpText: intl.formatMessage(messages.tooltip_sidebar_view),
          icon: 'panel-stats',
          disabled: !tableView,
          onClick: () => actions.toggleTableView(),
        },
        {
          helpText: intl.formatMessage(messages.tooltip_table_view),
          icon: 'th',
          disabled: tableView,
          onClick: () => actions.toggleTableView(),
        },
      ],
      [
        {
          helpText: intl.formatMessage(messages.tooltip_layouts),
          icon: 'layout',
          writeableOnly: true,
          subItems: [
            {
              helpText: intl.formatMessage(messages.tooltip_layout_horizontal),
              icon: 'layout-linear',
              onClick: () => this.onPosition('alignHorizontal'),
            },
            {
              helpText: intl.formatMessage(messages.tooltip_layout_vertical),
              icon: 'drag-handle-vertical',
              onClick: () => this.onPosition('alignVertical'),
            },
            {
              helpText: intl.formatMessage(messages.tooltip_layout_circle),
              icon: 'layout-circle',
              onClick: () => this.onPosition('alignCircle'),
            },
            {
              helpText: intl.formatMessage(messages.tooltip_layout_hierarchy),
              icon: 'layout-hierarchy',
              onClick: () => this.onPosition('arrangeTree'),
            },
            {
              helpText: intl.formatMessage(messages.tooltip_layout_auto),
              icon: 'layout',
              onClick: () => this.onPosition('forceLayout'),
            },
            {
              helpText: intl.formatMessage(messages.tooltip_layout_center),
              icon: 'layout-auto',
              disabled: !hasSelection,
              onClick: () =>
                updateLayout(centerAround(layout), null, {
                  modifyHistory: true,
                }),
            },
          ],
        },
      ],
      [
        {
          helpText: intl.formatMessage(messages.tooltip_settings),
          icon: 'cog',
          onClick: () => actions.toggleSettingsDialog(),
          writeableOnly: true,
        },
      ],
    ];

    return (
      <div className="Toolbar">
        {logo && (
          <div className="Toolbar__logo-container">
            <div className="Toolbar__logo">
              {logo.image && (
                <img
                  className="Toolbar__logo__image"
                  src={logo.image}
                  alt="OCCRP Data"
                ></img>
              )}
              {logo.text && (
                <h5 className="Toolbar__logo__text">{logo.text}</h5>
              )}
            </div>
          </div>
        )}
        <div className="Toolbar__main">
          <OverflowList
            items={buttons}
            collapseFrom={Boundary.END}
            visibleItemRenderer={(buttonGroup: IToolbarButtonGroup) =>
              this.itemRenderer(buttonGroup, true)
            }
            overflowRenderer={this.overflowListRenderer}
            className="Toolbar__button-group-container"
            observeParents
          />
        </div>
        {showSearch && (
          <div className="Toolbar__search-container">
            <SearchBox
              onChangeSearch={actions.onChangeSearch}
              onSubmitSearch={actions.onSubmitSearch}
              searchText={searchText}
            />
          </div>
        )}
      </div>
    );
  }
}
