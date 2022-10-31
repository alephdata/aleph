import * as React from 'react';
import { Classes } from '@blueprintjs/core';
import { injectIntl, WrappedComponentProps } from 'react-intl';
import {
  Entity,
  Model,
  Property,
  Schema,
  Values,
} from '@alephdata/followthemoney';
import { CountrySelect, TopicSelect, EntitySelect, TextEdit } from './';
import { validate } from 'react-ftm/utils';

const TAB_KEY = 9;

interface IPropertyEditorProps extends WrappedComponentProps {
  entity: Entity;
  property: Property;
  onSubmit: (entity: Entity) => void;
  onChange?: (values: Values) => void;
  fetchEntitySuggestions?: (
    queryText: string,
    schemata?: Array<Schema>
  ) => Promise<Entity[]>;
  resolveEntityReference?: (entityId: string) => Entity | undefined;
  createNewReferencedEntity?: (entityData: any) => Promise<Entity>;
  popoverProps?: any;
  model?: Model;
}

interface IPropertyEditorState {
  values: Values;
  error: any | null;
  entitySuggestions: { isPending: boolean; results: Array<Entity> };
}

class PropertyEditor extends React.Component<
  IPropertyEditorProps,
  IPropertyEditorState
> {
  private ref: any | null = null;

  constructor(props: IPropertyEditorProps) {
    super(props);
    const { entity, property, resolveEntityReference } = props;

    let values = entity?.getProperty(property.name) || [];
    if (property.type.name === 'entity' && resolveEntityReference) {
      values = values.map((val) => {
        if (typeof val === 'string') {
          return resolveEntityReference(val) || '';
        }
        return val;
      });
    }

    this.state = {
      entitySuggestions: { isPending: false, results: [] },
      values,
      error: null,
    };

    this.fetchEntitySuggestions = this.fetchEntitySuggestions.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);
    this.ref = React.createRef();
  }

  componentDidMount() {
    document.addEventListener('mousedown', this.handleClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside);
  }

  onChange = (values: Values) => {
    if (this.props.onChange) {
      this.props.onChange(values);
    }
    this.setState({ values });
  };

  onSubmit = (overrideStateValues?: Values) => {
    const { entity, property } = this.props;
    const values = overrideStateValues || this.state.values;
    if (overrideStateValues) {
      this.onChange(overrideStateValues);
    }
    const validationError = validate({
      entity,
      schema: entity.schema,
      property,
      values,
    });
    if (validationError) {
      this.setState({ error: validationError });
    } else {
      const changed = entity.clone();
      changed.properties.set(property, values);
      this.props.onSubmit(changed);
    }
  };

  handleClickOutside(e: MouseEvent) {
    const target = e.target as Element;
    if (
      target &&
      !this.ref?.current?.contains(target) &&
      !target.matches(`.${Classes.PORTAL} *, .${Classes.OVERLAY} *`)
    ) {
      e.preventDefault();
      e.stopPropagation();
      this.onSubmit();
    }
  }

  async fetchEntitySuggestions(query: string) {
    const { entity, property } = this.props;
    if (this.props.fetchEntitySuggestions) {
      const entityId = entity.id;
      this.setState({ entitySuggestions: { isPending: true, results: [] } });
      const suggestions = await this.props.fetchEntitySuggestions(query, [
        property.getRange(),
      ]);
      suggestions.filter((e) => e.id !== entityId);
      this.setState({
        entitySuggestions: { isPending: false, results: suggestions },
      });
    }
  }

  render() {
    const {
      createNewReferencedEntity,
      entity,
      intl,
      property,
      popoverProps,
      model,
    } = this.props;
    const { entitySuggestions, error, values } = this.state;
    const propType = property.type;

    const commonProps = {
      onSubmit: this.onSubmit,
      values,
      popoverProps,
    };
    let content;

    if (propType.name === 'country') {
      content = <CountrySelect fullList={propType.values} {...commonProps} />;
    } else if (propType.name === 'topic') {
      content = <TopicSelect fullList={propType.values} {...commonProps} />;
    } else if (propType.name === 'entity') {
      const filteredSuggestions = entitySuggestions.results
        ? entitySuggestions.results.filter((e) => e.id !== entity.id)
        : [];

      content = (
        <EntitySelect
          {...commonProps}
          model={model}
          allowMultiple={!entity.schema.isEdge}
          values={values as Array<Entity>}
          isFetching={entitySuggestions.isPending}
          entitySuggestions={filteredSuggestions}
          onQueryChange={this.fetchEntitySuggestions}
          createNewReferencedEntity={createNewReferencedEntity}
          referencedEntityRange={property.getRange()}
        />
      );
    } else {
      content = (
        <TextEdit
          onChange={this.onChange}
          multiline={propType.name === 'text'}
          {...commonProps}
        />
      );
    }

    return (
      <>
        <div
          ref={this.ref}
          onKeyDown={(e: any) =>
            e.keyCode === TAB_KEY ? this.onSubmit() : null
          }
        >
          {content}
        </div>
        {error && <div className="error-text">{intl.formatMessage(error)}</div>}
      </>
    );
  }
}

export default injectIntl(PropertyEditor);
