import * as React from 'react';
import { injectIntl, defineMessages, WrappedComponentProps } from 'react-intl';
import { FormGroup, Intent, Button } from '@blueprintjs/core';
import { Entity, Schema } from '@alephdata/followthemoney';

import { EdgeTypeSelect, EntitySelect } from 'react-ftm/editors';
import { EdgeType } from 'react-ftm/types';
import { Dialog, EntityManager } from 'react-ftm/components/common';

const messages = defineMessages({
  add_link: {
    id: 'dialog.edge_create.title',
    defaultMessage: 'Add link',
  },
  source: {
    id: 'dialog.edge_create.source_label',
    defaultMessage: 'Source',
  },
  target: {
    id: 'dialog.edge_create.target_label',
    defaultMessage: 'Target',
  },
  type: {
    id: 'dialog.edge_create.type_label',
    defaultMessage: 'Type',
  },
  type_select: {
    id: 'dialog.edge_create.type_placeholder',
    defaultMessage: 'Select type',
  },
  submit: {
    id: 'dialog.edge_create.submit',
    defaultMessage: 'Create',
  },
});

interface IEdgeCreateDialogProps extends WrappedComponentProps {
  source: Entity;
  target?: Entity;
  isOpen: boolean;
  toggleDialog: () => any;
  onSubmit: (source: Entity, target: Entity, type: EdgeType) => void;
  fetchEntitySuggestions: (
    queryText: string,
    schemata?: Array<Schema>
  ) => Promise<Entity[]>;
  entityManager: EntityManager;
}

interface IEdgeCreateDialogState {
  source?: Entity;
  target?: Entity;
  sourceSuggestions: any;
  targetSuggestions: any;
  type?: EdgeType;
  isProcessing: boolean;
}

export class EdgeCreateDialog extends React.Component<
  IEdgeCreateDialogProps,
  IEdgeCreateDialogState
> {
  types: EdgeType[] = [];
  state: IEdgeCreateDialogState = {
    isProcessing: false,
    sourceSuggestions: { isPending: false, results: [] },
    targetSuggestions: { isPending: false, results: [] },
  };

  constructor(props: any) {
    super(props);

    this.types = EdgeType.getAll(props.entityManager.model);

    this.onSelectSource = this.onSelectSource.bind(this);
    this.onSelectTarget = this.onSelectTarget.bind(this);
    this.onChangeType = this.onChangeType.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.onReverse = this.onReverse.bind(this);
  }

  componentDidUpdate(prevProps: IEdgeCreateDialogProps) {
    const { isOpen, source, target } = this.props;
    if (!prevProps.isOpen && isOpen) {
      this.setState({ source, target, type: undefined });
    }
  }

  onChangeType(type: EdgeType) {
    const { source, target } = this.state;
    if (source && target) {
      if (!type.match(source, target) && type.match(target, source)) {
        this.setState({ source: target, target: source });
      }
      this.setState({ type });
    }
  }

  onSelectSource(source: Entity) {
    this.setState(({ target }) => ({
      source,
      target: target?.id === source.id ? undefined : target,
      type: undefined,
    }));
  }

  onSelectTarget(target: Entity) {
    this.setState(({ source }) => ({
      target,
      source: source?.id === target.id ? undefined : source,
      type: undefined,
    }));
  }

  isValid() {
    const { source, target, type } = this.state;
    return source && target && type && type.match(source, target);
  }

  async onSubmit(e: React.ChangeEvent<HTMLFormElement>) {
    const { onSubmit, toggleDialog } = this.props;
    const { source, target, type } = this.state;
    e.preventDefault();
    if (source && target && type && this.isValid()) {
      onSubmit(source, target, type);
      toggleDialog();
    }
  }

  isReversible() {
    const { source, target, type } = this.state;
    return source && target && type && type.match(target, source);
  }

  onReverse() {
    const { source, target } = this.state;
    if (this.isReversible()) {
      this.setState({ source: target, target: source });
    }
  }

  getTypes(): EdgeType[] {
    const { source, target } = this.state;

    if (source && target) {
      return this.types.filter(
        (et) => et.match(source, target) || et.match(target, source)
      );
    }
    return [];
  }

  getSourceLabel(): string | undefined {
    const { type } = this.state;
    if (type) {
      if (type.schema && type.schema.edge) {
        return type.schema.getProperty(type.schema.edge.source).label;
      }
      if (type.property) {
        return type.property.schema.label;
      }
    }
  }

  getTargetLabel(): string | undefined {
    const { type } = this.state;
    if (type) {
      if (type.schema && type.schema.edge) {
        return type.schema.getProperty(type.schema.edge.target).label;
      }
      if (type.property) {
        return type.property.label;
      }
    }
  }

  getTypeDescription(): string | undefined | null {
    const { type } = this.state;
    if (type) {
      if (type.schema) {
        return type.schema.description;
      }
      if (type.property) {
        return type.property.description;
      }
    }
  }

  async fetchSourceSuggestions(query: string) {
    this.setState({ sourceSuggestions: { isProcessing: true, results: [] } });
    const results = await this.fetchSuggestions(query);
    this.setState({ sourceSuggestions: { isProcessing: false, results } });
  }

  async fetchTargetSuggestions(query: string) {
    this.setState({ targetSuggestions: { isProcessing: true, results: [] } });
    const results = await this.fetchSuggestions(query);
    this.setState({ targetSuggestions: { isProcessing: false, results } });
  }

  async fetchSuggestions(query: string) {
    const { entityManager, fetchEntitySuggestions } = this.props;

    const schemata = entityManager.model
      .getSchemata()
      .filter(
        (schema: Schema) =>
          schema.isThing() && !schema.generated && !schema.abstract
      );

    return await fetchEntitySuggestions(query, schemata);
  }

  render() {
    const { intl, isOpen, toggleDialog } = this.props;
    const {
      isProcessing,
      source,
      target,
      type,
      sourceSuggestions,
      targetSuggestions,
    } = this.state;
    const types = this.getTypes();

    return (
      <Dialog
        icon="new-link"
        isOpen={isOpen}
        isProcessing={isProcessing}
        title={intl.formatMessage(messages.add_link)}
        onClose={() => toggleDialog()}
        className="large"
      >
        <form onSubmit={this.onSubmit}>
          <div className="bp3-dialog-body">
            <div style={{ flex: 1, display: 'flex', flexFlow: 'row' }}>
              <div
                style={{
                  flexGrow: 1,
                  flexShrink: 1,
                  flexBasis: 'auto',
                  paddingRight: '1em',
                }}
              >
                <FormGroup
                  label={intl.formatMessage(messages.source)}
                  helperText={this.getSourceLabel()}
                >
                  <EntitySelect
                    onSubmit={(selected: Array<Entity>) =>
                      this.onSelectSource(selected?.[0])
                    }
                    values={source ? [source] : []}
                    allowMultiple={false}
                    isFetching={sourceSuggestions.isPending}
                    entitySuggestions={sourceSuggestions.results}
                    onQueryChange={(query: string) =>
                      this.fetchSourceSuggestions(query)
                    }
                  />
                </FormGroup>
              </div>
              <div
                style={{
                  flexGrow: 1,
                  flexShrink: 1,
                  flexBasis: 'auto',
                  paddingRight: '1em',
                }}
              >
                <FormGroup
                  label={intl.formatMessage(messages.type)}
                  helperText={this.getTypeDescription()}
                >
                  <EdgeTypeSelect
                    items={types}
                    value={type}
                    onChange={this.onChangeType}
                    placeholder={intl.formatMessage(messages.type_select)}
                  />
                </FormGroup>
              </div>
              <div
                style={{
                  flexGrow: 1,
                  flexShrink: 1,
                  flexBasis: 'auto',
                  paddingRight: '1em',
                }}
              >
                <FormGroup
                  label={intl.formatMessage(messages.target)}
                  helperText={this.getTargetLabel()}
                >
                  <EntitySelect
                    onSubmit={(selected: Array<Entity>) =>
                      this.onSelectTarget(selected?.[0])
                    }
                    values={target ? [target] : []}
                    allowMultiple={false}
                    isFetching={targetSuggestions.isPending}
                    entitySuggestions={targetSuggestions.results}
                    onQueryChange={(query: string) =>
                      this.fetchTargetSuggestions(query)
                    }
                  />
                </FormGroup>
              </div>
              <div style={{ flexGrow: 0, flexShrink: 1, flexBasis: '1%' }}>
                <FormGroup label="&nbsp;">
                  <Button
                    onClick={this.onReverse}
                    disabled={!this.isReversible()}
                    icon="exchange"
                  />
                </FormGroup>
              </div>
            </div>
          </div>
          <div className="bp3-dialog-footer">
            <div className="bp3-dialog-footer-actions">
              <Button
                intent={Intent.PRIMARY}
                disabled={!this.isValid()}
                text={intl.formatMessage(messages.submit)}
                type="submit"
              />
            </div>
          </div>
        </form>
      </Dialog>
    );
  }
}

export default injectIntl(EdgeCreateDialog);
