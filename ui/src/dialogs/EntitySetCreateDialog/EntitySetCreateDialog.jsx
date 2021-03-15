import React, { Component } from 'react';
import { Button, Intent } from '@blueprintjs/core';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import Query from 'app/Query';
import { Collection, EntitySet, FileImport } from 'components/common';
import CreateInvestigationDialog from 'dialogs/CreateInvestigationDialog/CreateInvestigationDialog';
import FormDialog from 'dialogs/common/FormDialog';
import { createEntitySetMutate as createEntitySet } from 'actions';
import { showSuccessToast, showWarningToast } from 'app/toast';
import getEntitySetLink from 'util/getEntitySetLink';


const messages = defineMessages({
  save: {
    id: 'entityset.create.submit',
    defaultMessage: 'Create',
  },
  collection_select_placeholder: {
    id: 'entityset.create.collection.existing',
    defaultMessage: 'Select an investigation',
  },
  list_title: {
    id: 'list.create.title',
    defaultMessage: 'Create a list',
  },
  list_label_placeholder: {
    id: 'list.create.label_placeholder',
    defaultMessage: 'Untitled list',
  },
  list_summary_placeholder: {
    id: 'list.create.summary_placeholder',
    defaultMessage: 'A brief description of the list',
  },
  list_success: {
    id: 'list.create.success',
    defaultMessage: 'Your list has been created successfully.',
  },
  diagram_title: {
    id: 'diagram.create.title',
    defaultMessage: 'Create a diagram',
  },
  diagram_label_placeholder: {
    id: 'diagram.create.label_placeholder',
    defaultMessage: 'Untitled diagram',
  },
  diagram_summary_placeholder: {
    id: 'diagram.create.summary_placeholder',
    defaultMessage: 'A brief description of the diagram',
  },
  diagram_success: {
    id: 'diagram.create.success',
    defaultMessage: 'Your diagram has been created successfully.',
  },
  diagram_import_title: {
    id: 'diagram.import.title',
    defaultMessage: 'Import a network diagram',
  },
  diagram_import_placeholder: {
    id: 'diagram.import.placeholder',
    defaultMessage: 'Drop a .ftm or .vis file here or click to import an existing diagram',
  },
  timeline_title: {
    id: 'timeline.create.title',
    defaultMessage: 'Create a timeline',
  },
  timeline_label_placeholder: {
    id: 'timeline.create.label_placeholder',
    defaultMessage: 'Untitled timeline',
  },
  timeline_summary_placeholder: {
    id: 'timeline.create.summary_placeholder',
    defaultMessage: 'A brief description of the timeline',
  },
  timeline_success: {
    id: 'timeline.create.success',
    defaultMessage: 'Your timeline has been created successfully.',
  },
});


class EntitySetCreateDialog extends Component {
  constructor(props) {
    super(props);
    const { entitySet } = this.props;

    this.state = {
      label: entitySet.label || '',
      summary: entitySet.summary || '',
      collection: entitySet.collection || '',
      layout: entitySet.layout || null,
      entities: entitySet.entities || null,
      importedFileName: null,
      processing: false,
      collectionCreateIsOpen: false,
    };

    this.onSubmit = this.onSubmit.bind(this);
    this.onChangeLabel = this.onChangeLabel.bind(this);
    this.onChangeSummary = this.onChangeSummary.bind(this);
    this.onChangeCollection = this.onChangeCollection.bind(this);
    this.onImport = this.onImport.bind(this);
    this.toggleCollectionCreateDialog = this.toggleCollectionCreateDialog.bind(this);
  }

  componentWillUnmount() {
    this.setState({
      label: '',
      summary: '',
      collection: '',
      layout: null,
      entities: null,
      importedFileName: null,
      processing: false,
    });
  }

  async onSubmit() {
    const { history, entitySet, intl } = this.props;
    const { label, entities, summary, collection, layout } = this.state;
    if (!this.checkValid()) return;
    const { type } = entitySet;
    this.setState({ processing: true });

    try {
      const newEntitySet = {
        type,
        label,
        summary,
        collection_id: collection.id,
      };
      if (layout) {
        newEntitySet.layout = layout;
      }
      if (entities) {
        newEntitySet.entities = entities;
      }

      const response = await this.props.createEntitySet(newEntitySet);
      history.push({
        pathname: getEntitySetLink(response.data),
      });

      showSuccessToast(
        intl.formatMessage(messages[`${type}_success`]),
      );
    } catch (e) {
      showWarningToast(e.message);
    }
    this.setState({ processing: false });
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
    const parsed = JSON.parse(data);
    // suppors legacy layout.entities from .vis files
    const { entities, selection, ...rest } = parsed.layout;

    this.setState({ entities: entities || parsed.entities, label, layout: rest, importedFileName: fileName });
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
    const { label, collection } = this.state;
    return collection && label?.length > 0;
  }

  render() {
    const { canChangeCollection, entitySet, importEnabled, intl, isOpen, toggleDialog } = this.props;
    const { collection, collectionCreateIsOpen, importedFileName, label, summary, processing, layout } = this.state;
    const { type } = entitySet;
    const disabled = processing || !this.checkValid();

    const showTextFields = (!importEnabled || (importEnabled && layout));
    const showCollectionField = canChangeCollection && showTextFields;
    const canImport = importEnabled && type === 'diagram';

    const titleKey = canImport ? messages.diagram_import_title : messages[`${type}_title`];

    return (
      <FormDialog
        processing={processing}
        icon={<EntitySet.Icon entitySet={{ type }} />}
        className="EntitySetCreateDialog"
        isOpen={isOpen}
        onSubmit={this.onSubmit}
        title={intl.formatMessage(titleKey)}
        onClose={toggleDialog}
      >
        <div className="bp3-dialog-body">
          {canImport && (
            <FileImport
              accept={['.ftm', '.vis']}
              placeholder={intl.formatMessage(messages.diagram_import_placeholder)}
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
                      placeholder={intl.formatMessage(messages[`${type}_label_placeholder`])}
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
                      placeholder={intl.formatMessage(messages[`${type}_summary_placeholder`])}
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
                    defaultMessage="Investigation"
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
                        `Don't see the investigation you're looking for? {link}`
                      }
                      values={{
                        link: (
                          /* eslint-disable */
                          <a onClick={() => this.toggleCollectionCreateDialog()}>
                            <FormattedMessage
                              id='entityset.create.collection.new_link'
                              defaultMessage={
                                `Create a new investigation`
                              }
                            />
                          </a>
                        )
                      }}
                    />
                  </div>
                </div>
              </div>
              <CreateInvestigationDialog
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
              text={intl.formatMessage(messages.save)}
            />
          </div>
        </div>
      </FormDialog>
    );
  }
}


EntitySetCreateDialog = injectIntl(EntitySetCreateDialog);
EntitySetCreateDialog = withRouter(EntitySetCreateDialog);
export default connect(null, {
  createEntitySet,
})(EntitySetCreateDialog);
