import * as React from 'react';
import { defineMessages, injectIntl, WrappedComponentProps } from 'react-intl';
import {
  defaultModel,
  Entity as FTMEntity,
  Model,
} from '@alephdata/followthemoney';
import { Entity, Schema } from 'react-ftm/types';
import { EntityCreateDialog } from 'react-ftm/components/common';
import {
  Alignment,
  Button,
  Intent,
  Menu,
  MenuDivider,
  MenuItem,
  Spinner,
  SpinnerSize,
} from '@blueprintjs/core';
import { ItemRenderer, MultiSelect, Select } from '@blueprintjs/select';
import { ITypeEditorProps } from './common';

import './EntitySelect.scss';

const messages = defineMessages({
  create_entity: {
    id: 'editor.entity.create_entity',
    defaultMessage: 'Create a new entity',
  },
  no_results: {
    id: 'editor.entity.no_results',
    defaultMessage: 'No existing entities found',
  },
  placeholder: {
    id: 'editor.entity.placeholder',
    defaultMessage: 'Select an entity',
  },
});

interface IEntityTypeProps extends ITypeEditorProps, WrappedComponentProps {
  allowMultiple: boolean;
  values: Array<FTMEntity>;
  entitySuggestions: Array<FTMEntity>;
  isFetching: boolean;
  onQueryChange: (query: string) => void;
  createNewReferencedEntity?: (entityData: any) => Promise<FTMEntity>;
  referencedEntityRange?: string;
  noResultsText?: string;
  buttonProps?: any;
  model?: Model;
}

interface IEntitySelectState {
  query: string;
  createNewDialogOpen: boolean;
}

const TypedMultiSelect = MultiSelect.ofType<FTMEntity>();
const TypedSelect = Select.ofType<FTMEntity>();

class EntitySelect extends React.Component<
  IEntityTypeProps,
  IEntitySelectState
> {
  private inputRef: HTMLElement | null = null;

  constructor(props: IEntityTypeProps) {
    super(props);

    this.state = {
      query: '',
      createNewDialogOpen: false,
    };

    this.onQueryChange = this.onQueryChange.bind(this);
    this.itemListRenderer = this.itemListRenderer.bind(this);
    this.onCreateNewEntity = this.onCreateNewEntity.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  componentDidMount() {
    this.inputRef && this.inputRef.focus();
    this.onQueryChange('');
  }

  itemRenderer: ItemRenderer<FTMEntity> = (
    entity,
    { handleClick, modifiers }
  ) => {
    return (
      <MenuItem
        active={modifiers.active}
        disabled={modifiers.disabled}
        key={entity.id}
        onClick={handleClick}
        text={<Entity.Label entity={entity} icon transliterate={false} />}
      />
    );
  };

  onRemove = (toRemove: any) => {
    const idToRemove = toRemove?.props?.entity?.id;
    const nextValues = this.props.values.filter((e) => e.id !== idToRemove);

    this.props.onSubmit(nextValues);
  };

  onSubmit(entity: FTMEntity) {
    const { allowMultiple, values } = this.props;
    this.props.onSubmit(allowMultiple ? [...values, entity] : [entity]);
  }

  async onCreateNewEntity(entityData: any) {
    const { createNewReferencedEntity } = this.props;

    if (createNewReferencedEntity) {
      const created = await createNewReferencedEntity(entityData);
      if (created) {
        this.onSubmit(created);
        return created;
      }
    }
  }

  itemListRenderer(rendererProps: any) {
    const { createNewReferencedEntity, intl, isFetching, noResultsText } =
      this.props;
    const { filteredItems, itemsParentRef, renderItem } = rendererProps;

    let content;
    if (isFetching) {
      content = (
        <Spinner
          className="EntityCreateDialog__spinner"
          size={SpinnerSize.SMALL}
        />
      );
    } else if (filteredItems.length === 0) {
      content = (
        <li className="bp3-menu-item bp3-disabled error-text">
          {noResultsText || intl.formatMessage(messages.no_results)}
        </li>
      );
    } else {
      content = filteredItems.map(renderItem);
    }

    return (
      <Menu ulRef={itemsParentRef}>
        {!!createNewReferencedEntity && (
          <>
            <MenuItem
              icon="add"
              intent={Intent.PRIMARY}
              onClick={() => this.setState({ createNewDialogOpen: true })}
              text={intl.formatMessage(messages.create_entity)}
            />
            <MenuDivider />
          </>
        )}
        {content}
      </Menu>
    );
  }

  onQueryChange(query: string) {
    this.setState({ query });
    this.props.onQueryChange(query);
  }

  renderSelect() {
    const {
      allowMultiple,
      entitySuggestions,
      intl,
      inputProps = {},
      popoverProps = {},
      buttonProps = {},
      values,
    } = this.props;
    const { query } = this.state;

    const filteredSuggestions = entitySuggestions.filter(
      (e) => !values.find((val) => val.id === e.id)
    );

    const commmonProps = {
      className: 'EntitySelect',
      itemRenderer: this.itemRenderer,
      itemListRenderer: this.itemListRenderer,
      items: filteredSuggestions,
      popoverProps: {
        minimal: true,
        targetProps: { style: { width: '100%' } },
        ...popoverProps,
      },
      fill: true,
      query,
      onQueryChange: this.onQueryChange,
      resetOnSelect: true,
    };

    if (allowMultiple) {
      return (
        <TypedMultiSelect
          {...commmonProps}
          tagRenderer={(entity) => (
            <Entity.Label entity={entity} icon transliterate={false} />
          )}
          onItemSelect={this.onSubmit}
          tagInputProps={{
            inputRef: (ref) => (this.inputRef = ref),
            tagProps: { interactive: false, minimal: true },
            onRemove: this.onRemove,
            placeholder: '',
            ...inputProps,
          }}
          selectedItems={values}
        />
      );
    } else {
      const buttonText = values.length ? (
        <Entity.Label entity={values[0]} icon={false} transliterate={false} />
      ) : (
        buttonProps?.placeholder || intl.formatMessage(messages.placeholder)
      );
      const buttonIcon = !!values.length && (
        <Schema.Icon schema={values[0].schema} className="left-icon" />
      );

      return (
        <TypedSelect {...commmonProps} onItemSelect={this.onSubmit} filterable>
          <Button
            text={buttonText}
            alignText={Alignment.LEFT}
            icon={buttonIcon}
            rightIcon="caret-down"
            elementRef={(ref) => (this.inputRef = ref)}
            fill
            {...buttonProps}
          />
        </TypedSelect>
      );
    }
  }

  render() {
    const {
      createNewReferencedEntity,
      model: inputModel,
      intl,
      referencedEntityRange,
    } = this.props;
    const { createNewDialogOpen, query } = this.state;

    const model = inputModel || new Model(defaultModel);

    return (
      <>
        {this.renderSelect()}
        {!!createNewReferencedEntity && (
          <EntityCreateDialog
            isOpen={createNewDialogOpen}
            onSubmit={this.onCreateNewEntity}
            toggleDialog={() => this.setState({ createNewDialogOpen: false })}
            schemaRange={referencedEntityRange}
            model={model}
            initialCaption={query}
          />
        )}
      </>
    );
  }
}

export default injectIntl(EntitySelect);
