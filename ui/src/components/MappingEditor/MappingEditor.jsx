import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { Button, ButtonGroup } from '@blueprintjs/core';
import { showErrorToast } from 'src/app/toast';
import { selectModel } from 'src/selectors';
import MappingPreviewDialog from 'src/dialogs/MappingPreviewDialog/MappingPreviewDialog';
import MappingList from 'src/components/MappingEditor/MappingList';
import MappingKeyAssign from 'src/components/MappingEditor/MappingKeyAssign';
import MappingManageMenu from 'src/components/MappingEditor/MappingManageMenu';
import MappingPropertyAssign from 'src/components/MappingEditor/MappingPropertyAssign';
import MappingSchemaSelect from 'src/components/MappingEditor/MappingSchemaSelect';
import MappingSplitSection from 'src/components/MappingEditor/MappingSplitSection';
import MappingVerify from 'src/components/MappingEditor/MappingVerify';

import './MappingEditor.scss';


const messages = defineMessages({
  section1Title: {
    id: 'mapping.section1.title',
    defaultMessage: '1. Select entity types to map',
  },
  section2Title: {
    id: 'mapping.section2.title',
    defaultMessage: '2. Map columns to entity properties',
  },
  section3Title: {
    id: 'mapping.section3.title',
    defaultMessage: '3. Verify',
  },
});

export class MappingEditor extends Component {
  constructor(props) {
    super(props);

    this.state = {
      mappings: new MappingList(props.model),
      previewIsOpen: false,
    };

    this.onMappingAdd = this.onMappingAdd.bind(this);
    this.onMappingRemove = this.onMappingRemove.bind(this);
    this.onKeyAdd = this.onKeyAdd.bind(this);
    this.onKeyRemove = this.onKeyRemove.bind(this);
    this.onPropertyAdd = this.onPropertyAdd.bind(this);
    this.onPropertyRemove = this.onPropertyRemove.bind(this);
    this.togglePreview = this.togglePreview.bind(this);
  }

  componentDidMount() {
    this.loadFromMappingData();
  }

  loadFromMappingData() {
    const { mappingData, model } = this.props;

    if (!mappingData?.query) return;

    this.setState({
      mappings: MappingList.fromApiFormat(model, mappingData.query)
    });
  }

  onMappingAdd(schema) {
    this.setState(({ mappings }) => ({ mappings: mappings.addMapping(schema) }));
  }

  onMappingRemove(id) {
    this.setState(({ mappings }) => ({ mappings: mappings.removeMapping(id) }));
  }

  onKeyAdd(id, key) {
    this.setState(({ mappings }) => ({ mappings: mappings.addKey(id, key) }));
  }

  onKeyRemove(id, key) {
    this.setState(({ mappings }) => ({ mappings: mappings.removeKey(id, key) }));
  }

  onPropertyAdd(id, propName, value) {
    this.setState(({ mappings }) => ({ mappings: mappings.addProperty(id, propName, value) }));
  }

  onPropertyRemove(id, propName) {
    this.setState(({ mappings }) => ({ mappings: mappings.removeProperty(id, propName) }));
  }

  togglePreview = () => this.setState(({ previewIsOpen }) => (
    { previewIsOpen: !previewIsOpen }
  ));

  render() {
    const { entity, mappingData, csvData, csvHeader, intl, model } = this.props;
    const { mappings, previewIsOpen } = this.state;

    return (
      <div className="MappingEditor">
        <div className="MappingEditor__sections">
          <div className="MappingEditor__section">
            <h5 className="bp3-heading MappingEditor__section__title">
              {intl.formatMessage(messages.section1Title)}
            </h5>
            <MappingSplitSection
              mappings={mappings}
              sectionContentsRenderer={((subitems, type) => (
                <>
                  <MappingSchemaSelect
                    type={type}
                    onSelect={this.onMappingAdd}
                  />
                  <MappingKeyAssign
                    columnLabels={csvHeader}
                    items={subitems}
                    fullMappingsList={mappings}
                    onKeyAdd={this.onKeyAdd}
                    onKeyRemove={this.onKeyRemove}
                    onPropertyAdd={this.onPropertyAdd}
                    onMappingRemove={this.onMappingRemove}
                  />
                </>
              ))}
            />
          </div>
          {mappings.getMappingsCount() > 0 && (
            <>
              <div className="MappingEditor__section">
                <h5 className="bp3-heading MappingEditor__section__title">
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
                <h5 className="bp3-heading MappingEditor__section__title">
                  {intl.formatMessage(messages.section3Title)}
                </h5>
                <MappingSplitSection
                  mappings={mappings}
                  sectionContentsRenderer={(subitems => (
                    <MappingVerify
                      entity={entity}
                      model={model}
                      items={subitems}
                      fullMappingsList={mappings}
                      onPropertyRemove={this.onPropertyRemove}
                      onPropertyAdd={this.onPropertyAdd}
                    />
                  ))}
                />
                <ButtonGroup className="MappingEditor__preview">
                  <Button icon="eye-open" onClick={this.togglePreview}>
                    <FormattedMessage id="mapping.actions.preview" defaultMessage="Preview mapping" />
                  </Button>
                </ButtonGroup>
              </div>
              <div className="MappingEditor__section">
                <MappingManageMenu
                  mappings={mappings}
                  entity={entity}
                  mappingDataId={mappingData && mappingData.id}
                />
              </div>
            </>
          )}
        </div>
        <MappingPreviewDialog
          isOpen={previewIsOpen}
          mappings={mappings}
          toggleDialog={this.togglePreview}
        />
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({
  model: selectModel(state),
});

export default compose(
  connect(mapStateToProps),
  injectIntl,
)(MappingEditor);
