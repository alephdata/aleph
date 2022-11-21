import React from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { Button, Tab, Tabs } from '@blueprintjs/core';
import { Schema as FTMSchema, Entity } from '@alephdata/followthemoney';

import { SchemaSelect } from 'react-ftm/editors';
import { Schema } from 'react-ftm/types';
import { sortEntities } from 'react-ftm/utils';
import { SortType } from 'react-ftm/components/common/types/SortType';
import { IEntityTableCommonProps } from 'react-ftm/components/EntityTable/common';
import { TableEditor } from 'react-ftm/components/EntityTable';

const messages = defineMessages({
  add: {
    id: 'table_editor.add_schema',
    defaultMessage: 'Add an entity type',
  },
});

interface IEntityTableProps extends IEntityTableCommonProps {
  selection?: Array<string>;
  onSelectionChange?: (entityIds: Array<string>, newVal: boolean) => void;
}

interface IEntityTableState {
  schemata: Array<FTMSchema>;
  activeSchema: string;
  sort: SortType | null;
}

class EntityTableBase extends React.Component<
  IEntityTableProps,
  IEntityTableState
> {
  constructor(props: IEntityTableProps) {
    super(props);

    const schemata = this.getSchemata();
    const activeSchema = schemata?.[0]?.name || 'Person';

    this.state = {
      schemata,
      activeSchema,
      sort: null,
    };

    this.getEntities = this.getEntities.bind(this);
    this.onColumnSort = this.onColumnSort.bind(this);
    this.setActiveSchema = this.setActiveSchema.bind(this);
  }

  getSchemata() {
    const { entityManager } = this.props;

    return entityManager
      .getEntities()
      .map((entity: Entity) => entity.schema)
      .filter(
        (schema: FTMSchema, index: number, list: any) =>
          !schema.isEdge && list.indexOf(schema) === index
      )
      .sort((a: FTMSchema, b: FTMSchema) => a.label.localeCompare(b.label));
  }

  addSchema(schema: FTMSchema) {
    const schemata = [...this.state.schemata, ...[schema]].sort((a, b) =>
      a.label.localeCompare(b.label)
    );
    this.setState({ schemata });
    this.setActiveSchema(schema.name);
  }

  setActiveSchema(activeSchema: string) {
    this.setState({ activeSchema, sort: null });
  }

  getEntities(schema: FTMSchema) {
    const { entityManager } = this.props;
    const { activeSchema, sort } = this.state;

    const entities = entityManager
      .getEntities()
      .filter((e: Entity) => e.schema.name === schema.name);

    if (activeSchema === schema.name && sort) {
      const { field, direction } = sort;
      const property = schema.getProperty(field);
      return entities.sort((a: Entity, b: Entity) =>
        sortEntities(a, b, property, direction, entityManager.getEntity)
      );
    } else {
      return entities;
    }
  }

  onColumnSort(sortedField: string) {
    this.setState(({ sort }) => {
      let nextSort;
      if (sort?.field !== sortedField) {
        nextSort = { field: sortedField, direction: 'asc' };
      } else {
        if (sort?.direction === 'asc') {
          nextSort = { field: sort.field, direction: 'desc' };
        } else {
          nextSort = null;
        }
      }
      return { sort: nextSort };
    });
  }

  render() {
    const {
      entityManager,
      intl,
      isPending,
      onSelectionChange,
      selection,
      updateFinishedCallback,
      visitEntity,
      writeable,
    } = this.props;
    const { activeSchema, sort, schemata } = this.state;

    return (
      <Tabs
        renderActiveTabPanelOnly
        selectedTabId={activeSchema}
        onChange={this.setActiveSchema}
      >
        {schemata.map((schema) => (
          <Tab
            id={schema.name}
            key={schema.name}
            title={<Schema.Label schema={schema} icon />}
            panel={
              <TableEditor
                entities={this.getEntities(schema)}
                schema={schema}
                sort={sort}
                selection={selection}
                sortColumn={this.onColumnSort}
                updateSelection={onSelectionChange}
                writeable={writeable}
                entityManager={entityManager}
                fetchEntitySuggestions={(
                  queryText: string,
                  schemata?: Array<FTMSchema>
                ) =>
                  entityManager.getEntitySuggestions(true, queryText, schemata)
                }
                updateFinishedCallback={updateFinishedCallback}
                visitEntity={visitEntity}
                isPending={isPending}
              />
            }
          />
        ))}
        {writeable && (
          <div className="TableView__schemaAdd">
            <SchemaSelect
              model={entityManager.model}
              onSelect={(schema) => this.addSchema(schema)}
              optionsFilter={(schema) => !schemata.includes(schema)}
            >
              <Button text={intl.formatMessage(messages.add)} icon="plus" />
            </SchemaSelect>
          </div>
        )}
      </Tabs>
    );
  }
}

export const EntityTable = injectIntl(EntityTableBase);
