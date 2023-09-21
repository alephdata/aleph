import * as React from 'react';
import {
  IEntityDatum,
  Model,
  Property as FTMProperty,
  Schema,
} from '@alephdata/followthemoney';
import c from 'classnames';

import { PropertyEditor } from 'react-ftm/editors';
import { FTMEntityExtended as Entity, Property } from 'react-ftm/types';

import './EditableProperty.scss';

interface IEditablePropertyProps {
  entity: Entity;
  property: FTMProperty;
  editing: boolean;
  writeable?: boolean;
  onToggleEdit: (property: FTMProperty) => void;
  onSubmit: (entity: Entity, previous: IEntityDatum) => void;
  fetchEntitySuggestions?: (
    queryText: string,
    schemata?: Array<Schema>
  ) => Promise<Entity[]>;
  resolveEntityReference?: (entityId: string) => Entity | undefined;
  createNewReferencedEntity?: (entityData: any) => Promise<Entity>;
  minimal?: boolean;
  model?: Model;
}

export class EditableProperty extends React.Component<IEditablePropertyProps> {
  constructor(props: IEditablePropertyProps) {
    super(props);

    this.toggleEditing = this.toggleEditing.bind(this);
  }

  toggleEditing(e: React.MouseEvent) {
    const { onToggleEdit, property } = this.props;
    e.preventDefault();
    e.stopPropagation();
    onToggleEdit(property);
  }

  render() {
    const {
      createNewReferencedEntity,
      editing,
      entity,
      fetchEntitySuggestions,
      onSubmit,
      property,
      minimal,
      model,
      resolveEntityReference,
      writeable = true,
    } = this.props;
    const entityData = entity.toJSON();

    const values = entity.getProperty(property.name);
    const isEmpty = values.length === 0;

    return (
      <div
        className={c('EditableProperty', {
          active: editing,
          minimal,
          'read-only': !writeable,
        })}
        onClick={(e) => !editing && this.toggleEditing(e)}
      >
        {(!minimal || isEmpty) && (
          <div className="EditableProperty__label">
            <span>
              <Property.Name prop={property} />
            </span>
          </div>
        )}
        <div className="EditableProperty__value">
          {writeable && editing && (
            <PropertyEditor
              key={property.name}
              onSubmit={(entity: Entity) => onSubmit(entity, entityData)}
              entity={entity}
              property={property}
              model={model}
              fetchEntitySuggestions={fetchEntitySuggestions}
              resolveEntityReference={resolveEntityReference}
              createNewReferencedEntity={createNewReferencedEntity}
            />
          )}
          {(!writeable || (!editing && !(minimal && isEmpty))) && (
            <Property.Values
              prop={property}
              values={values}
              resolveEntityReference={resolveEntityReference}
              translitLookup={entity.latinized}
            />
          )}
        </div>
      </div>
    );
  }
}
