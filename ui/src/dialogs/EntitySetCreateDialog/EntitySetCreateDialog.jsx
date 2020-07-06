import React, { Component } from 'react';
import { Button, Intent } from '@blueprintjs/core';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import Query from 'src/app/Query';
import { Collection, FileImport } from 'src/components/common';
import CreateCaseDialog from 'src/dialogs/CreateCaseDialog/CreateCaseDialog';
import FormDialog from 'src/dialogs/common/FormDialog';
import { createEntitySet } from 'src/actions';
import { showSuccessToast, showWarningToast } from 'src/app/toast';
import getEntitySetLink from 'src/util/getEntitySetLink';
import { processApiEntity } from 'src/components/EntitySet/util';


const TYPES = ['generic', 'diagram','timeline'];


const messages = defineMessages({
  label_placeholder: {
    id: 'entityset.create.label_placeholder',
    defaultMessage: 'Untitled {type}',
  },
  summary_placeholder: {
    id: 'entityset.create.summary_placeholder',
    defaultMessage: 'A brief description of the {type}',
  },
  save: {
    id: 'entityset.create.submit',
    defaultMessage: 'Create',
  },
  title_create: {
    id: 'entityset.create.title',
    defaultMessage: 'Create a {type}',
  },
  submit_create: {
    id: 'entityset.create.submit',
    defaultMessage: 'Create',
  },
  success_create: {
    id: 'entityset.create.success',
    defaultMessage: 'Your {type} has been created successfully.',
  },
  title_diagram_import: {
    id: 'diagram.import.title',
    defaultMessage: 'Import a network diagram',
  },
  placeholder_diagram_import: {
    id: 'diagram.import.placeholder',
    defaultMessage: 'Drop a .vis file here or click to import an existing diagram layout',
  },
  collection_select_placeholder: {
    id: 'entityset.create.collection.existing',
    defaultMessage: 'Select a dataset',
  },
});


class EntitySetCreateDialog extends Component {
  constructor(props) {
    super(props);
    const { entitySet, type = 'generic' } = this.props;

    this.state = {
      type: entitySet.type || type,
      label: entitySet.label || '',
      summary: entitySet.summary || '',
      collection: entitySet.collection || '',
      layout: entitySet.layout || null,
      importedFileName: null,
      processing: false,
      collectionCreateIsOpen: false,
    };

    this.onSubmit = this.onSubmit.bind(this);
    this.onChangeType = this.onChangeType.bind(this);
    this.onChangeLabel = this.onChangeLabel.bind(this);
    this.onChangeSummary = this.onChangeSummary.bind(this);
    this.onChangeCollection = this.onChangeCollection.bind(this);
    this.onImport = this.onImport.bind(this);
    this.toggleCollectionCreateDialog = this.toggleCollectionCreateDialog.bind(this);
  }

  componentWillUnmount() {
    this.setState({
      type: '',
      label: '',
      summary: '',
      collection: '',
      layout: null,
      importedFileName: null,
      processing: false,
    });
  }

  async onSubmit(event) {
    const { history, entitySet, intl } = this.props;
    const { type, label, summary, collection, layout, processing } = this.state;
    event.preventDefault();
    if (processing || !this.checkValid()) return;
    this.setState({ processing: true });

    try {
      const newEntitySet = {
        type,
        label,
        summary,
        collection_id: collection.id,
        entities: entitySet?.entities || []
      };

      if (layout) {
        const { entities, selection, ...rest } = layout;
        newEntitySet.entities = entities.map(processApiEntity);
        newEntitySet.layout = rest;
      }

      const response = await this.props.createEntitySet(newEntitySet);
      this.setState({ processing: false });

      history.push({
        pathname: getEntitySetLink(response.data),
      });

      showSuccessToast(
        intl.formatMessage(messages.success_create, { type }),
      );
    } catch (e) {
      showWarningToast(e.message);
      this.setState({ processing: false });
    }
  }

  onChangeType({ target }) {
    this.setState({ type: target.value });
  }

  onChangeLabel({ target }) {
    this.setState({ label: target.value });
  }

  onChangeSummary({ target }) {
    this.setState({ summary: target.value });
  }

  onChangeCollection(collection) {
    this.setState({ collection });
  }

  onImport({ fileName, label, data }) {
    const { layout } = JSON.parse(data);
    this.setState({ label, layout, importedFileName: fileName });
  }

  getCollectionOptionsQuery() {
    const { location } = this.props;

    const context = {
      'filter:writeable': true,
      'filter:casefile': true,
    };
    return Query.fromLocation('collections', location, context, 'collections')
      .sortBy('label', 'asc');
  }

  toggleCollectionCreateDialog(createdCollection) {
    this.setState(({ collection, collectionCreateIsOpen }) => ({
      collection: createdCollection?.id ? createdCollection : collection,
      collectionCreateIsOpen: !collectionCreateIsOpen,
    }));
  }

  checkValid() {
    const { type, label, collection } = this.state;
    return TYPES.includes(type) && collection && label?.length > 0;
  }

  render() {
    const { canChangeCollection, importEnabled, intl, isOpen, toggleDialog } = this.props;
    const { collection, collectionCreateIsOpen, importedFileName, label, summary, processing, layout, type } = this.state;
    const disabled = processing || !this.checkValid();

    const showTextFields = (!importEnabled || (importEnabled && layout));
    const showCollectionField = canChangeCollection && showTextFields;
    const canImportVisDiagram = importEnabled && type === 'diagram';

    return (
      <FormDialog
        processing={processing}
        icon="graph"
        className="EntitySetCreateDialog"
        isOpen={isOpen}
        title={intl.formatMessage(canImportVisDiagram ? messages.title_diagram_import : messages.title_create, { type })}
        onClose={toggleDialog}
      >
        <div className="bp3-dialog-body">
          {canImportVisDiagram && (
            <FileImport
              accept=".vis"
              placeholder={intl.formatMessage(messages.placeholder_diagram_import)}
              onImport={this.onImport}
              importedFile={importedFileName}
            />
          )}
          {showTextFields && (
            <>
              <div className="bp3-form-group">
                <label className="bp3-label" htmlFor="label">
                  <FormattedMessage id="entityset.choose.name" defaultMessage="Title" />
                  <div className="bp3-input-group bp3-fill">
                    <input
                      id="label"
                      type="text"
                      className="bp3-input"
                      autoComplete="off"
                      placeholder={intl.formatMessage(messages.label_placeholder, { type })}
                      onChange={this.onChangeLabel}
                      value={label}
                    />
                  </div>
                </label>
              </div>
              <div className="bp3-form-group">
                <label className="bp3-label" htmlFor="summary">
                  <FormattedMessage
                    id="entityset.choose.summary"
                    defaultMessage="Summary"
                  />
                  <div className="bp3-input-group bp3-fill">
                    <textarea
                      id="summary"
                      className="bp3-input"
                      placeholder={intl.formatMessage(messages.summary_placeholder, { type })}
                      onChange={this.onChangeSummary}
                      value={summary}
                      rows={5}
                    />
                  </div>
                </label>
              </div>
            </>
          )}
          {showCollectionField && (
            <>
              <div className="bp3-form-group">
                <div className="bp3-label">
                  <FormattedMessage
                    id="entityset.create.collection"
                    defaultMessage="Dataset"
                  />
                  <Collection.Select
                    collection={collection}
                    onSelect={this.onChangeCollection}
                    query={this.getCollectionOptionsQuery()}
                    buttonProps={{
                      label: intl.formatMessage(messages.collection_select_placeholder)
                    }}
                  />
                  <div className="bp3-form-helper-text">
                    <FormattedMessage
                      id='entityset.create.collection.new'
                      defaultMessage={
                        `Don't see the dataset you're looking for? {link}`
                      }
                      values={{
                         link: (
                          /* eslint-disable */
                          <a onClick={() => this.toggleCollectionCreateDialog()}>
                            <FormattedMessage
                              id='entity.manager.bulk_import.link_text'
                              defaultMessage={
                                `Create a new personal dataset`
                              }
                            />
                          </a>
                         )
                       }}
                    />
                  </div>
                </div>
              </div>
              <CreateCaseDialog
                isOpen={collectionCreateIsOpen}
                toggleDialog={this.toggleCollectionCreateDialog}
                preventRedirect
              />
            </>
          )}
        </div>
        <div className="bp3-dialog-footer">
          <div className="bp3-dialog-footer-actions">
            <Button
              type="submit"
              intent={Intent.PRIMARY}
              disabled={disabled}
              onClick={this.onSubmit}
              text={(
                intl.formatMessage(messages.submit_create)
              )}
            />
          </div>
        </div>
      </FormDialog>

    );
  }
}

const mapStateToProps = () => ({});

EntitySetCreateDialog = injectIntl(EntitySetCreateDialog);
EntitySetCreateDialog = withRouter(EntitySetCreateDialog);
export default connect(mapStateToProps, {
  createEntitySet,
})(EntitySetCreateDialog);
