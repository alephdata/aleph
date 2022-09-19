import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { Button, Classes, Intent } from '@blueprintjs/core';
import { Tooltip2 as Tooltip } from '@blueprintjs/popover2';
import c from 'classnames';

import { selectModel } from 'selectors';
import { Collection, EntitySet, Schema } from 'components/common';
import EntitySetSelector from 'components/EntitySet/EntitySetSelector';
import MappingList from 'components/MappingEditor/MappingList';
import MappingKeyAssign from 'components/MappingEditor/MappingKeyAssign';
import MappingManageMenu from 'components/MappingEditor/MappingManageMenu';
import MappingPropertyAssign from 'components/MappingEditor/MappingPropertyAssign';
import MappingSplitSection from 'components/MappingEditor/MappingSplitSection';
import MappingVerify from 'components/MappingEditor/MappingVerify';

import './MappingEditor.scss';

const messages = defineMessages({
  section1Title: {
    id: 'mapping.section1.title',
    defaultMessage: '1. Select entity types to generate',
  },
  section2Title: {
    id: 'mapping.section2.title',
    defaultMessage: '2. Map columns to entity properties',
  },
  section3Title: {
    id: 'mapping.section3.title',
    defaultMessage: '3. Verify',
  },
  section4Title: {
    id: 'mapping.section4.title',
    defaultMessage: '4. Select a destination for generated entities (optional)',
  },
  thing_new: {
    id: 'schemaSelect.button.thing',
    defaultMessage: 'Add a new object',
  },
  relationship_new: {
    id: 'schemaSelect.button.relationship',
    defaultMessage: 'Add a new relationship',
  },
  entityset_remove: {
    id: 'mapping.entityset.remove',
    defaultMessage: 'Remove',
  },
});

export class MappingEditor extends Component {
  constructor(props) {
    super(props);

    this.state = {
      mappings: new MappingList(props.model),
      entitySet: props.existingMappingMetadata?.entityset,
      entitySetSelectorIsOpen: false,
    };

    this.onMappingAdd = this.onMappingAdd.bind(this);
    this.onMappingRemove = this.onMappingRemove.bind(this);
    this.onMappingIdChange = this.onMappingIdChange.bind(this);
    this.onKeyAdd = this.onKeyAdd.bind(this);
    this.onKeyRemove = this.onKeyRemove.bind(this);
    this.onPropertyAdd = this.onPropertyAdd.bind(this);
    this.onPropertyRemove = this.onPropertyRemove.bind(this);
    this.onEntitySetAdd = this.onEntitySetAdd.bind(this);
    this.onEntitySetRemove = this.onEntitySetRemove.bind(this);
    this.toggleEntitySetSelector = this.toggleEntitySetSelector.bind(this);
  }

  componentDidMount() {
    this.loadFromMappingData();
  }

  componentDidUpdate(prevProps) {
    if (this.props.mappingData !== prevProps.mappingData) {
      this.loadFromMappingData();
    }
  }

  onMappingAdd(schema) {
    this.setState(({ mappings }) => ({
      mappings: mappings.addMapping(schema),
    }));
  }

  onMappingRemove(id) {
    this.setState(({ mappings }) => ({ mappings: mappings.removeMapping(id) }));
  }

  onMappingIdChange(oldId, newId) {
    this.setState(({ mappings }) => ({
      mappings: mappings.changeId(oldId, newId),
    }));
  }

  onKeyAdd(id, key) {
    this.setState(({ mappings }) => ({ mappings: mappings.addKey(id, key) }));
  }

  onKeyRemove(id, key) {
    this.setState(({ mappings }) => ({
      mappings: mappings.removeKey(id, key),
    }));
  }

  onPropertyAdd(id, propName, value) {
    this.setState(({ mappings }) => ({
      mappings: mappings.addProperty(id, propName, value),
    }));
  }

  onPropertyRemove(id, propName) {
    this.setState(({ mappings }) => ({
      mappings: mappings.removeProperty(id, propName),
    }));
  }

  onEntitySetAdd(entitySet) {
    this.setState({ entitySet });
  }

  onEntitySetRemove() {
    this.setState({ entitySet: null, entitySetSelectorIsOpen: false });
  }

  toggleEntitySetSelector() {
    this.setState(({ entitySetSelectorIsOpen }) => ({
      entitySetSelectorIsOpen: !entitySetSelectorIsOpen,
    }));
  }

  loadFromMappingData() {
    const { mappingData, model } = this.props;

    if (!mappingData) return;
    this.setState({
      mappings: MappingList.fromApiFormat(model, mappingData),
    });
  }

  render() {
    const { document, existingMappingMetadata, csvData, csvHeader, intl } =
      this.props;
    const { entitySet, mappings } = this.state;

    const showPropertySections = mappings.getMappingsCount() > 0;

    return (
      <>
        <div className="MappingEditor">
          <div className="MappingEditor__sections">
            <div className="MappingEditor__section">
              <h5
                className={c(Classes.HEADING, 'MappingEditor__section__title')}
              >
                {intl.formatMessage(messages.section1Title)}
              </h5>
              <MappingSplitSection
                mappings={mappings}
                sectionContentsRenderer={(subitems, type) => (
                  <>
                    <Schema.Select
                      optionsFilter={(schema) =>
                        type === 'thing' ? schema.isThing() : !schema.isThing()
                      }
                      onSelect={this.onMappingAdd}
                    >
                      <Button
                        icon="plus"
                        text={intl.formatMessage(messages[`${type}_new`])}
                      />
                    </Schema.Select>
                    <MappingKeyAssign
                      columnLabels={csvHeader}
                      items={subitems}
                      fullMappingsList={mappings}
                      onKeyAdd={this.onKeyAdd}
                      onKeyRemove={this.onKeyRemove}
                      onPropertyAdd={this.onPropertyAdd}
                      onMappingIdChange={this.onMappingIdChange}
                      onMappingRemove={this.onMappingRemove}
                    />
                  </>
                )}
              />
            </div>
            {showPropertySections && (
              <>
                <div className="MappingEditor__section">
                  <h5
                    className={c(
                      Classes.HEADING,
                      'MappingEditor__section__title'
                    )}
                  >
                    {intl.formatMessage(messages.section2Title)}
                  </h5>
                  <MappingPropertyAssign
                    columnLabels={csvHeader}
                    csvData={csvData}
                    mappings={mappings}
                    onPropertyAdd={this.onPropertyAdd}
                    onPropertyRemove={this.onPropertyRemove}
                  />
                </div>

                <div className="MappingEditor__section">
                  <h5
                    className={c(
                      Classes.HEADING,
                      'MappingEditor__section__title'
                    )}
                  >
                    {intl.formatMessage(messages.section3Title)}
                  </h5>
                  <MappingSplitSection
                    mappings={mappings}
                    sectionContentsRenderer={(subitems) => (
                      <MappingVerify
                        items={subitems}
                        fullMappingsList={mappings}
                        onPropertyRemove={this.onPropertyRemove}
                        onPropertyAdd={this.onPropertyAdd}
                        onMappingIdChange={this.onMappingIdChange}
                      />
                    )}
                  />
                </div>
                <div className="MappingEditor__section">
                  <h5
                    className={c(
                      Classes.HEADING,
                      'MappingEditor__section__title'
                    )}
                  >
                    {intl.formatMessage(messages.section4Title)}
                  </h5>
                  <p className="MappingEditor__section__description">
                    <FormattedMessage
                      id="mapping.section4.description"
                      defaultMessage="Generated entities will be added to {collection} by default. If you would like to additionally add them to a list or diagram within the investigation, please click below and select from the available options."
                      values={{
                        collection: (
                          <Collection.Label
                            collection={document.collection}
                            icon={false}
                          />
                        ),
                      }}
                    />
                  </p>
                  {entitySet && (
                    <>
                      <Button
                        outlined
                        onClick={this.toggleEntitySetSelector}
                        rightIcon="caret-down"
                      >
                        <EntitySet.Label entitySet={entitySet} icon />
                      </Button>
                      <Tooltip
                        content={intl.formatMessage(messages.entityset_remove)}
                      >
                        <Button
                          onClick={this.onEntitySetRemove}
                          intent={Intent.DANGER}
                          minimal
                          icon="remove"
                        />
                      </Tooltip>
                    </>
                  )}
                  {!entitySet && (
                    <Button
                      onClick={this.toggleEntitySetSelector}
                      icon="add-to-artifact"
                    >
                      <FormattedMessage
                        id="mapping.entity_set_select"
                        defaultMessage="Select a List or Diagram"
                      />
                    </Button>
                  )}
                </div>
              </>
            )}
            <div className="MappingEditor__section">
              <MappingManageMenu
                mappings={mappings}
                isEmpty={mappings.getMappingsCount() === 0}
                entitySet={entitySet}
                document={document}
                existingMappingMetadata={existingMappingMetadata}
              />
            </div>
          </div>
        </div>
        <EntitySetSelector
          collection={document.collection}
          isOpen={this.state.entitySetSelectorIsOpen}
          toggleDialog={this.toggleEntitySetSelector}
          onSuccess={this.onEntitySetAdd}
          triggerMutationOnCreate={false}
        />
      </>
    );
  }
}

const mapStateToProps = (state) => ({
  model: selectModel(state),
});

export default compose(connect(mapStateToProps), injectIntl)(MappingEditor);
