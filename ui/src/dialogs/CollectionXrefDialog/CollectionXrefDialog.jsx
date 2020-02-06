import React, { Component } from 'react';
import {
  RadioGroup, Radio, Callout, Dialog,
} from '@blueprintjs/core';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { tiggerXrefMatches, queryCollections } from 'src/actions';
import { showSuccessToast } from 'src/app/toast';

import CollectionXrefDialogActions from './CollectionXrefDialogActions';
import CollectionXrefSelect from './CollectionXrefSelect';

import './CollectionXrefDialog.scss';


const messages = defineMessages({
  title: {
    id: 'collection.xref.title',
    defaultMessage: 'Cross-reference',
  },
  processing: {
    id: 'collection.xref.processing',
    defaultMessage: 'Cross-referencing started.',
  },
  xrefAll: {
    id: 'collection.xref.xrefAll',
    defaultMessage: 'Cross-reference all datasets',
  },
  xrefSpecific: {
    id: 'collection.xref.xrefSpecific',
    defaultMessage: 'Cross-reference specific datasets (faster)',
  },
});


class CollectionXrefDialog extends Component {
  constructor(props) {
    super(props);
    this.state = {
      xrefAgainst: 'all',
      selectedCollections: [],
    };
  }

  onXrefAgainstChange(event) {
    this.setState({ xrefAgainst: event.target.value });
  }

  onCancel() {
    const { toggleDialog } = this.props;
    toggleDialog();
  }

  async onConfirm() {
    const { xrefAgainst, selectedCollections } = this.state;
    const {
      collection, intl, toggleDialog,
    } = this.props;
    let againstCollectionIds = null;
    if (xrefAgainst === 'specific') {
      againstCollectionIds = selectedCollections.map(c => parseInt(c.id, 10));
    }
    await this.props.tiggerXrefMatches(collection.id, againstCollectionIds);
    toggleDialog();
    showSuccessToast(intl.formatMessage(messages.processing));
  }

  onCollectionSelect(collection) {
    const { selectedCollections } = this.state;
    const existing = selectedCollections.find(c => c.id === collection.id);
    if (existing) {
      this.setState({
        selectedCollections: selectedCollections.filter(c => c !== existing),
      });
    } else {
      this.setState({
        selectedCollections: [...[collection], ...selectedCollections],
      });
    }
  }

  renderXrefAllWarning = () => (
    <Callout intent="warning">
      <FormattedMessage
        id="collection.xref.alert.text"
        defaultMessage="Cross-referencing against all other data may take a lot of time. Start this process once and then wait for it to complete."
      />
    </Callout>
  )

  renderXrefSelection() {
    const { selectedCollections } = this.state;
    return (
      <section>
        <CollectionXrefSelect
          selectedCollections={selectedCollections}
          collectionSelectFn={c => this.onCollectionSelect(c)}
        />
      </section>
    );
  }

  render() {
    const { intl } = this.props;
    const { xrefAgainst, selectedCollections } = this.state;

    return (
      <Dialog
        icon="comparison"
        className="CollectionXrefDialog"
        isOpen={this.props.isOpen}
        onClose={this.props.toggleDialog}
        title={intl.formatMessage(messages.title)}
      >
        <div className="bp3-dialog-body">
          <RadioGroup
            onChange={event => this.onXrefAgainstChange(event)}
            selectedValue={xrefAgainst}
          >
            <Radio label={intl.formatMessage(messages.xrefAll)} value="all" />
            <Radio label={intl.formatMessage(messages.xrefSpecific)} value="specific" />
          </RadioGroup>
          {xrefAgainst === 'all' ? this.renderXrefAllWarning() : this.renderXrefSelection()}
        </div>
        <CollectionXrefDialogActions
          confirmFn={() => this.onConfirm()}
          cancelFn={() => this.onCancel()}
          confirmDisabled={xrefAgainst === 'specific' && selectedCollections.length <= 0}
        />
      </Dialog>
    );
  }
}

const mapDispatchToProps = { tiggerXrefMatches, queryCollections };
export default compose(
  connect(null, mapDispatchToProps),
  injectIntl,
)(CollectionXrefDialog);
