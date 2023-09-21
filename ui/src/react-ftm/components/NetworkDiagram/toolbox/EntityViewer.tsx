import * as React from 'react';
import { Divider } from '@blueprintjs/core';
import {
  IEntityDatum,
  Property as FTMProperty,
  Schema as FTMSchema,
} from '@alephdata/followthemoney';
import { ColorPicker, PropertySelect, RadiusPicker } from 'react-ftm/editors';
import {
  Entity,
  FTMEntityExtended as FTMEntity,
  Schema,
} from 'react-ftm/types';
import { mapColor } from 'react-ftm/utils';
import { Vertex } from 'react-ftm/components/NetworkDiagram/layout';
import { GraphContext } from 'react-ftm/components/NetworkDiagram/GraphContext';
import { EditableProperty } from 'react-ftm/components/common';
import c from 'classnames';

import './EntityViewer.scss';

interface IEntityViewerProps {
  entity: FTMEntity;
  vertexRef?: Vertex;
  onEntityChanged: (entity: FTMEntity, previousData: IEntityDatum) => void;
  onVertexColorSelected: (vertex: Vertex, color: string) => void;
  onVertexRadiusSelected: (vertex: Vertex, radius: number) => void;
}

interface IEntityViewerState {
  visibleProps: FTMProperty[];
  currEditing: FTMProperty | null;
}

export class EntityViewer extends React.PureComponent<
  IEntityViewerProps,
  IEntityViewerState
> {
  static contextType = GraphContext;
  private schemaProperties: FTMProperty[];

  constructor(props: IEntityViewerProps) {
    super(props);
    this.schemaProperties = props.entity.schema
      .getEditableProperties()
      .sort((a, b) => a.label.localeCompare(b.label));

    this.state = {
      visibleProps: this.getVisibleProperties(props),
      currEditing: null,
    };

    this.onNewPropertySelected = this.onNewPropertySelected.bind(this);
    this.renderProperty = this.renderProperty.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.onEditPropertyClick = this.onEditPropertyClick.bind(this);
  }

  getVisibleProperties(props = this.props) {
    const { entity } = props;

    return Array.from(
      new Set([
        ...entity.schema.getFeaturedProperties(),
        ...entity.getProperties(),
      ])
    );
  }

  componentWillReceiveProps(nextProps: Readonly<IEntityViewerProps>): void {
    if (this.props.entity !== nextProps.entity) {
      this.schemaProperties = nextProps.entity.schema.getEditableProperties();
      this.setState({
        visibleProps: this.getVisibleProperties(nextProps),
      });
    }
  }

  onNewPropertySelected(p: FTMProperty) {
    this.setState(({ visibleProps }) => ({
      visibleProps: [...visibleProps, ...[p]],
      currEditing: null,
    }));
  }

  onEditPropertyClick(property: FTMProperty) {
    this.setState({
      currEditing: property,
    });
  }

  onSubmit(entity: FTMEntity, previousData: IEntityDatum) {
    this.props.onEntityChanged(entity, previousData);

    this.setState({
      currEditing: null,
    });
  }

  renderProperty(property: FTMProperty) {
    const { entityManager, writeable } = this.context;
    const { entity } = this.props;
    const { currEditing } = this.state;

    return (
      <EditableProperty
        key={property.name}
        entity={entity}
        property={property}
        onSubmit={this.onSubmit}
        onToggleEdit={this.onEditPropertyClick}
        editing={property?.name === currEditing?.name}
        fetchEntitySuggestions={(
          queryText: string,
          schemata?: Array<FTMSchema>
        ) => entityManager.getEntitySuggestions(true, queryText, schemata)}
        resolveEntityReference={entityManager.getEntity}
        createNewReferencedEntity={(entityData: any) =>
          entityManager.createEntity(entityData)
        }
        model={entityManager.model}
        writeable={writeable}
      />
    );
  }

  render() {
    const { writeable } = this.context;
    const { entity, vertexRef } = this.props;
    const { visibleProps } = this.state;
    const availableProperties = this.schemaProperties.filter(
      (p) => visibleProps.indexOf(p) < 0
    );
    const hasCaption = entity.getCaption() !== entity.schema.label;

    return (
      <div className={c('EntityViewer', { writeable: writeable })}>
        <div className="EntityViewer__title">
          <div className="EntityViewer__title__text">
            {hasCaption && (
              <p className="EntityViewer__title__text__secondary">
                <Schema.Label schema={entity.schema} icon />
              </p>
            )}
            <h2 className="EntityViewer__title__text__main">
              <Entity.Label entity={entity} icon={!hasCaption} iconSize={25} />
            </h2>
          </div>
          {vertexRef && writeable && (
            <div className="EntityViewer__title__settings">
              <ColorPicker
                currSelected={mapColor(vertexRef.color)}
                onSelect={(color: string) =>
                  this.props.onVertexColorSelected(vertexRef, color)
                }
              />
              <RadiusPicker
                radius={vertexRef.radius}
                onChange={(radius: number) =>
                  this.props.onVertexRadiusSelected(vertexRef, radius)
                }
                schema={entity.schema}
              />
            </div>
          )}
        </div>
        <div className="EntityViewer__property-list">
          {visibleProps.map(this.renderProperty)}
        </div>
        {writeable && !!availableProperties.length && (
          <>
            <Divider />
            <PropertySelect
              properties={availableProperties}
              onSelected={this.onNewPropertySelected}
            />
          </>
        )}
      </div>
    );
  }
}
