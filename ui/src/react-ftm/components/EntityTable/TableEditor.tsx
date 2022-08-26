import React from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import Datasheet from 'react-datasheet';
import difference from 'lodash/difference';
import differenceBy from 'lodash/differenceBy';
import groupBy from 'lodash/groupBy';
import uniqBy from 'lodash/uniqBy';
import { Button, Checkbox, Classes, Icon, Intent } from '@blueprintjs/core';
import { Tooltip2 as Tooltip } from '@blueprintjs/popover2';
import {
  Entity as FTMEntity,
  Property as FTMProperty,
  Schema as FTMSchema,
  Value,
} from '@alephdata/followthemoney';
import { PropertyEditor, PropertySelect } from 'react-ftm/editors';
import { Entity, Schema, Property } from 'react-ftm/types';
import { EntityChanges, SortType } from 'react-ftm/components/common/types';
import { IEntityTableCommonProps } from 'react-ftm/components/EntityTable/common';
import { showErrorToast, validate } from 'react-ftm/utils';
import { isScrolledIntoView } from 'react-ftm/components/EntityTable/utils';

import './TableEditor.scss';

const messages = defineMessages({
  add: {
    id: 'table_editor.add_row',
    defaultMessage: 'Add a new {schema} row',
  },
  remove: {
    id: 'table_editor.remove_row',
    defaultMessage: 'Remove new {schema} row',
  },
});

const ESC_KEY = 27;

const readOnlyCellProps = {
  readOnly: true,
  disableEvents: true,
  forceComponent: true,
};
const getCellBase = (type: string) => ({
  className: type,
  ...(type !== 'property' ? readOnlyCellProps : {}),
});

const propSort = (a: FTMProperty, b: FTMProperty) =>
  a.label > b.label ? 1 : -1;

export interface CellData extends Datasheet.Cell<CellData, any> {
  className: string;
  value?: any;
  data?: any;
  component?: any;
}

interface ITableEditorProps extends IEntityTableCommonProps {
  entities: Array<FTMEntity>;
  schema: FTMSchema;
  sort: SortType | null;
  sortColumn: (field: string) => void;
  selection: Array<string>;
  updateSelection: (entityIds: Array<string>, newVal: boolean) => void;
  fetchEntitySuggestions: (
    queryText: string,
    schemata?: Array<FTMSchema>
  ) => Promise<FTMEntity[]>;
}

interface ITableEditorState {
  addedColumns: Array<FTMProperty>;
  headerRow: CellData[];
  showTopAddRow: boolean;
  entityRows: CellData[][];
  createdEntityIds: string[];
  lastSelected?: string;
  visibleProps: Array<FTMProperty>;
}

class TableEditorBase extends React.Component<
  ITableEditorProps,
  ITableEditorState
> {
  private keyDownListener: any;
  ref: React.RefObject<any>;

  constructor(props: ITableEditorProps) {
    super(props);

    this.state = {
      addedColumns: [],
      headerRow: [],
      showTopAddRow: false,
      entityRows: [],
      createdEntityIds: [],
      visibleProps: this.getVisibleProperties(),
      lastSelected: props.selection?.[0],
    };

    this.ref = React.createRef();

    this.toggleTopAddRow = this.toggleTopAddRow.bind(this);
    this.onAddColumn = this.onAddColumn.bind(this);
    this.getVisibleProperties = this.getVisibleProperties.bind(this);
    this.getNonVisibleProperties = this.getNonVisibleProperties.bind(this);
  }

  componentDidMount() {
    this.regenerateTable();
  }

  componentDidUpdate(
    prevProps: ITableEditorProps,
    prevState: ITableEditorState
  ) {
    const { entities, schema, selection, sort, writeable } = this.props;
    const { visibleProps, showTopAddRow } = this.state;

    const entitiesLength = entities.length;
    const prevEntitiesLength = prevProps.entities.length;

    const entitiesDeleted = prevEntitiesLength > entitiesLength;
    const entitiesAdded = prevEntitiesLength < entitiesLength;
    const sortChanged =
      prevProps.sort?.field !== sort?.field ||
      prevProps.sort?.direction !== sort?.direction;
    const selectionChanged = prevProps.selection !== selection;
    const topAddRowToggled = prevState.showTopAddRow !== showTopAddRow;

    if (
      prevProps.schema !== schema ||
      visibleProps !== prevState.visibleProps ||
      sortChanged ||
      entitiesDeleted
    ) {
      this.regenerateTable();
      return;
    } else if (entitiesAdded) {
      this.appendAdditionalEntities(prevProps.entities);
    } else if (writeable && selectionChanged) {
      this.reflectUpdatedSelection();
    }
    if (topAddRowToggled) {
      this.regenerateHeader();
    }
  }

  regenerateTable = () => {
    this.setState({
      showTopAddRow: false,
      headerRow: this.getHeaderRow(),
      entityRows: this.getEntityRows(),
      createdEntityIds: [],
    });
  };

  regenerateHeader = () => {
    this.setState({
      headerRow: this.getHeaderRow(),
    });
  };

  appendAdditionalEntities(prevEntities: Array<FTMEntity>) {
    const { entities } = this.props;
    const { createdEntityIds, visibleProps } = this.state;

    let newEntities = differenceBy(entities, prevEntities, (e) => e.id);
    if (createdEntityIds.length) {
      newEntities = newEntities.filter(
        (e) => createdEntityIds.indexOf(e.id) < 0
      );
    }

    if (newEntities.length) {
      const newVisibleProps = this.getVisibleProperties(newEntities);
      const addtlProps = difference(newVisibleProps, visibleProps);
      if (addtlProps.length) {
        this.setState(({ visibleProps }) => ({
          visibleProps: [...visibleProps, ...addtlProps],
        }));
      } else {
        this.setState(({ entityRows }) => ({
          headerRow: this.getHeaderRow(),
          entityRows: [
            ...entityRows,
            ...newEntities.map((e) => this.getEntityRow(e)),
          ],
        }));
      }
    }
  }

  reflectUpdatedSelection() {
    const { visitEntity } = this.props;
    const checkboxCellIndex = visitEntity ? 1 : 0;
    this.setState(({ entityRows }) => ({
      entityRows: entityRows?.map((row) => {
        const checkboxCell = row[checkboxCellIndex];
        const newCheckboxCell = checkboxCell?.data?.entity
          ? this.getCheckboxCell(checkboxCell.data.entity)
          : checkboxCell;
        row.splice(checkboxCellIndex, 1, newCheckboxCell);
        return row;
      }),
    }));
  }

  getVisibleProperties(entitiesSubset?: Array<FTMEntity>) {
    const { entities, schema } = this.props;
    const addedColumns = this.state?.addedColumns || [];

    const requiredProps = schema.required.map((name) =>
      schema.getProperty(name)
    );
    const featuredProps = schema.getFeaturedProperties();
    const filledProps = (entitiesSubset || entities).reduce(
      (acc, entity: FTMEntity) => [...acc, ...entity.getProperties()],
      [] as FTMProperty[]
    );

    const fullList = uniqBy(
      [...requiredProps, ...featuredProps, ...filledProps, ...addedColumns],
      'name'
    );

    return fullList.filter((prop) => !prop.stub && !prop.hidden);
  }

  getNonVisibleProperties() {
    const { schema } = this.props;
    const { visibleProps } = this.state;

    return schema
      .getEditableProperties()
      .filter((prop) => visibleProps.indexOf(prop) < 0)
      .sort(propSort);
  }

  // Table data initialization

  getHeaderRow = () => {
    const { visitEntity, writeable } = this.props;
    const { visibleProps } = this.state;

    const headerCells = visibleProps.map((property) =>
      this.getHeaderCell(property)
    );
    const entityLinkPlaceholder =
      visitEntity != undefined ? [this.getEntityLinkCell()] : [];

    if (writeable) {
      const addEntityCell = this.getAddEntityCell();
      const propSelectCell = this.getPropSelectCell();
      return [
        ...entityLinkPlaceholder,
        addEntityCell,
        ...headerCells,
        propSelectCell,
      ];
    } else {
      return [...entityLinkPlaceholder, ...headerCells];
    }
  };

  getEntityRows = () => {
    const { entities } = this.props;
    return entities.map((e) => this.getEntityRow(e));
  };

  getEntityRow = (entity: FTMEntity) => {
    const { visitEntity, writeable } = this.props;
    const { visibleProps } = this.state;

    const propCells = visibleProps.map((property) => {
      let values = entity.getProperty(property.name);
      if (property.type.name === 'entity') {
        values = values.map((v: Value) => (typeof v === 'string' ? v : v.id));
      }

      return {
        ...getCellBase('property'),
        readOnly: !writeable,
        value: values,
        data: { entity, property },
      };
    });

    const entityLinkCell =
      visitEntity != undefined ? [this.getEntityLinkCell(entity)] : [];

    if (!writeable) {
      return [...entityLinkCell, ...propCells];
    } else {
      const checkbox = this.getCheckboxCell(entity);
      return [...entityLinkCell, checkbox, ...propCells];
    }
  };

  getCheckboxCell = (entity: FTMEntity) => {
    const { selection } = this.props;
    const isSelected = selection.indexOf(entity.id) > -1;
    return { ...getCellBase('checkbox'), data: { entity, isSelected } };
  };

  getEntityLinkCell = (entity?: FTMEntity) => {
    return {
      ...getCellBase('entity-link'),
      ...(entity ? { component: this.renderEntityLinkButton({ entity }) } : {}),
    };
  };

  getHeaderCell = (property: FTMProperty) => {
    return {
      ...getCellBase('header'),
      component: this.renderColumnHeader(property),
    };
  };

  getAddEntityCell = () => {
    return { ...getCellBase('add-button'), component: this.renderAddButton() };
  };

  getPropSelectCell = () => {
    return {
      ...getCellBase('prop-select'),
      component: this.renderPropertySelect(),
    };
  };

  getSkeletonRows = () => {
    const { visitEntity, writeable } = this.props;
    const { visibleProps } = this.state;

    const skeletonRowCount = 8;
    const entityLinkPlaceholder =
      visitEntity != undefined ? [this.getEntityLinkCell()] : [];
    const actionCellPlaceholder = writeable
      ? [{ ...getCellBase('checkbox') }]
      : [];
    const skeletonRow = [
      ...entityLinkPlaceholder,
      ...actionCellPlaceholder,
      ...visibleProps.map(() => ({
        ...getCellBase('skeleton'),
        component: this.renderSkeleton(),
      })),
    ];

    return Array.from(Array(skeletonRowCount).keys()).map(() => skeletonRow);
  };

  getAddRow = () => {
    const { visitEntity } = this.props;
    const { visibleProps } = this.state;

    const entityLinkPlaceholder =
      visitEntity != undefined ? [this.getEntityLinkCell()] : [];

    const addRowCells = visibleProps.map((property) => ({
      ...getCellBase('property'),
      data: { entity: null, property },
    }));

    return [
      ...entityLinkPlaceholder,
      { ...getCellBase('checkbox') },
      ...addRowCells,
    ];
  };

  findRowByEntity = (entityId?: string) => {
    if (!entityId) {
      return;
    }
    const { entityRows } = this.state;
    return entityRows.findIndex((row) => row[1]?.data?.entity?.id === entityId);
  };

  findEntityRange = (i0: number, i1: number) => {
    const [start, end] = [i0, i1].sort();
    return this.state.entityRows
      .slice(start, end + 1)
      .map((row) => row[1]?.data?.entity?.id);
  };

  // Table renderers

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  renderCell = ({ attributesRenderer, updated, editing, ...props }: any) => (
    // scroll cell into view if selected and not visible
    <td
      ref={(ref) =>
        props.selected &&
        ref &&
        !isScrolledIntoView(ref, this.ref.current) &&
        ref.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
      {...props}
    >
      {props.children}
    </td>
  );

  renderValue = ({ cell, row }: Datasheet.ValueViewerProps<CellData, any>) => {
    if (!cell.data) return null;
    const { entity, property } = cell.data;

    if (entity && property) {
      return this.renderPropValue(cell.data);
    }
    if (entity) {
      return this.renderCheckbox(cell.data, row);
    }
    if (property) {
      return <span>—</span>;
    }
    return null;
  };

  renderPropValue = ({
    entity,
    property,
  }: {
    entity: FTMEntity;
    property: FTMProperty;
  }) => {
    const { entityManager, visitEntity } = this.props;

    const values = entity.getProperty(property.name);
    const showVisitLink =
      visitEntity && property.type.name === 'entity' && values.length;

    return (
      <div className="TableEditor__overflow-container">
        <Property.Values
          values={values}
          prop={property}
          resolveEntityReference={entityManager.resolveEntityReference}
          getEntityLink={
            showVisitLink
              ? (e: FTMEntity) => (
                  <Button
                    minimal
                    small
                    icon={!!e?.schema && <Schema.Icon schema={e.schema} />}
                    rightIcon={
                      <Icon
                        icon="fullscreen"
                        iconSize={12}
                        className="TableEditor__link-cell__icon"
                      />
                    }
                    className="TableEditor__link-cell"
                    onClick={() => visitEntity && visitEntity(e)}
                  >
                    <Entity.Label entity={e} icon={false} />
                  </Button>
                )
              : undefined
          }
        />
      </div>
    );
  };

  renderEditor = ({
    cell,
    onCommit,
    onChange,
    onRevert,
  }: Datasheet.DataEditorProps<CellData, any>) => {
    const { entityManager, fetchEntitySuggestions, schema } = this.props;
    const { entity, property } = cell.data;

    if (!property) return null;

    if (!this.keyDownListener) {
      this.keyDownListener = (e: any) => {
        if (e.which === ESC_KEY) onRevert();
      };
      document.addEventListener('keydown', this.keyDownListener);
    }

    return (
      <PropertyEditor
        entity={
          entity ||
          new FTMEntity(entityManager.model, { schema, id: `${Math.random()}` })
        }
        property={property}
        onChange={onChange}
        onSubmit={(entity: FTMEntity) => {
          if (this.keyDownListener) {
            document.removeEventListener('keydown', this.keyDownListener);
            this.keyDownListener = null;
          }
          onCommit(entity.getProperty(property));
        }}
        popoverProps={{ usePortal: false }}
        fetchEntitySuggestions={fetchEntitySuggestions}
        resolveEntityReference={entityManager.resolveEntityReference}
      />
    );
  };

  renderColumnHeader = (property: FTMProperty) => {
    const { sort, sortColumn } = this.props;

    const isSorted = sort && sort.field === property.name;
    const sortIcon = isSorted
      ? sort && sort.direction === 'asc'
        ? 'caret-up'
        : 'caret-down'
      : null;
    return (
      <Button
        onClick={() => sortColumn(property.name)}
        rightIcon={sortIcon}
        minimal
        fill
        text={property.label}
      />
    );
  };

  renderAddButton = () => {
    const { intl, schema } = this.props;
    const { showTopAddRow } = this.state;
    return (
      <Tooltip
        content={intl.formatMessage(
          messages[showTopAddRow ? 'remove' : 'add'],
          {
            schema: schema.label,
          }
        )}
      >
        <Button
          icon={showTopAddRow ? 'remove' : 'add'}
          onClick={this.toggleTopAddRow}
          intent={Intent.PRIMARY}
          minimal
        />
      </Tooltip>
    );
  };

  renderPropertySelect = () => {
    return (
      <PropertySelect
        properties={this.getNonVisibleProperties()}
        onSelected={this.onAddColumn}
        buttonProps={{ minimal: true, intent: Intent.PRIMARY }}
      />
    );
  };

  renderCheckbox = (
    { entity, isSelected }: { entity: FTMEntity; isSelected: boolean },
    row: number
  ) => {
    return (
      <Checkbox
        checked={isSelected}
        onClick={(e) => {
          const { lastSelected, showTopAddRow } = this.state;
          const { shiftKey } = e;
          let newSelection;
          if (shiftKey && lastSelected !== undefined) {
            const lastSelectedRow = this.findRowByEntity(lastSelected);
            if (lastSelectedRow !== undefined && lastSelectedRow >= 0) {
              const adjustedRow = row - 1 - (showTopAddRow ? 1 : 0);
              newSelection = this.findEntityRange(adjustedRow, lastSelectedRow);
            }
          }

          this.props.updateSelection(newSelection || [entity.id], !isSelected);
          this.setState({ lastSelected: entity.id });
        }}
      />
    );
  };

  renderEntityLinkButton = ({ entity }: { entity: FTMEntity }) => {
    const { visitEntity } = this.props;
    if (visitEntity == undefined) return null;

    return (
      <Button
        minimal
        small
        icon="fullscreen"
        onClick={() => visitEntity(entity)}
      />
    );
  };

  renderSkeleton = () => {
    const skeletonLength = 15;
    return (
      <span className={Classes.SKELETON}>{'-'.repeat(skeletonLength)}</span>
    );
  };

  // Change handlers

  handleNewRow = (row: number, changes: any) => {
    const { intl, schema } = this.props;
    const { entityRows, showTopAddRow } = this.state;
    const entityData = { schema, properties: {} };
    const shouldPrepend = showTopAddRow && row === 1;

    changes.forEach(({ cell, value, col }: any) => {
      const property =
        cell?.data?.property || entityRows[0][col]?.data?.property;
      const error = validate({ schema, property, values: value });

      if (error) {
        showErrorToast(intl.formatMessage(error));
      } else {
        entityData.properties[property.name] = value;
      }
    });

    const entity = this.props.entityManager.createEntity(entityData);
    const newEntityRow = this.getEntityRow(entity);

    this.setState(({ entityRows, createdEntityIds, showTopAddRow }) => {
      return {
        entityRows: shouldPrepend
          ? [newEntityRow, ...entityRows]
          : [...entityRows, newEntityRow],
        createdEntityIds: [...createdEntityIds, entity.id],
        showTopAddRow: shouldPrepend ? false : showTopAddRow,
      };
    });

    return entity;
  };

  handleExistingRow = (
    changes:
      | Datasheet.CellsChangedArgs<CellData, any>
      | Datasheet.CellAdditionsArgs<CellData>
  ) => {
    const { intl } = this.props;

    let prevEntity: FTMEntity | undefined;
    let nextEntity: FTMEntity | undefined;

    changes.forEach(({ cell, value }: any) => {
      const { entity, property } = cell.data;
      const error = validate({
        entity,
        schema: entity.schema,
        property,
        values: value,
      });

      if (error) {
        showErrorToast(intl.formatMessage(error));
      } else {
        prevEntity = prevEntity || entity.clone();
        nextEntity = entity;
        if (value === '') {
          entity &&
            entity.properties.delete(entity.schema.getProperty(property.name));
          cell.value = null;
        } else {
          entity &&
            entity.properties.set(
              entity.schema.getProperty(property.name),
              value
            );
          cell.value = value.map((v: Value) =>
            typeof v === 'string' ? v : v.id
          );
        }
      }
    });

    if (prevEntity && nextEntity) {
      this.props.entityManager.updateEntity(nextEntity);
      return { prev: prevEntity, next: nextEntity };
    }
  };

  onCellsChanged = (
    changeList: Datasheet.CellsChangedArgs<CellData, any>,
    outOfBounds: Datasheet.CellAdditionsArgs<CellData>
  ) => {
    const { updateFinishedCallback } = this.props;
    const fullChangeList = outOfBounds
      ? [...changeList, ...outOfBounds]
      : changeList;
    const changesByRow = groupBy(fullChangeList, (c) => c.row);
    const entityChanges = {} as EntityChanges;

    Object.entries(changesByRow).forEach(
      ([rowIndex, changes]: [string, any]) => {
        const isExisting = changes[0]?.cell?.data?.entity != null;
        if (isExisting) {
          const updated = this.handleExistingRow(changes);
          if (updated) {
            entityChanges.updated
              ? entityChanges.updated.push(updated)
              : (entityChanges.updated = [updated]);
          }
        } else {
          const created = this.handleNewRow(+rowIndex, changes);
          if (created) {
            entityChanges.created
              ? entityChanges.created.push(created)
              : (entityChanges.created = [created]);
          }
        }
      }
    );

    // trigger re-render
    this.setState(({ entityRows }) => ({ entityRows }));

    if (updateFinishedCallback) {
      updateFinishedCallback(entityChanges);
    }
  };

  parsePaste(pastedString: string) {
    const lines = pastedString.split(/[\r\n]+/g);
    return lines.map((line) => line.split('\t').map((val) => val.split(',')));
  }

  onAddColumn(newColumn: FTMProperty) {
    this.setState(({ addedColumns, visibleProps }) => ({
      addedColumns: [...addedColumns, newColumn],
      visibleProps: [...visibleProps, newColumn],
    }));
  }

  toggleTopAddRow() {
    this.setState(({ showTopAddRow }) => ({
      showTopAddRow: !showTopAddRow,
    }));
  }

  render() {
    const { isPending, writeable } = this.props;
    const { headerRow, showTopAddRow, entityRows } = this.state;
    const bottomAddRow = writeable ? [this.getAddRow()] : [];
    const skeletonRows = isPending ? this.getSkeletonRows() : [];
    const topAddRow = showTopAddRow ? [this.getAddRow()] : [];
    const tableData = [
      headerRow,
      ...topAddRow,
      ...entityRows,
      ...skeletonRows,
      ...bottomAddRow,
    ];

    return (
      <div className="TableEditor" ref={this.ref}>
        <Datasheet
          data={tableData}
          valueRenderer={(cell: CellData) => cell.value}
          valueViewer={this.renderValue}
          dataEditor={this.renderEditor}
          cellRenderer={this.renderCell}
          onCellsChanged={
            this.onCellsChanged as Datasheet.CellsChangedHandler<
              CellData,
              CellData
            >
          }
          parsePaste={this.parsePaste as any}
        />
      </div>
    );
  }
}

export const TableEditor = injectIntl(TableEditorBase);
