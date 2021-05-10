import React, { Component } from 'react';
import { Button, Dialog, Intent } from '@blueprintjs/core';
import { PropertySelect } from '@alephdata/react-ftm';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import {
  createCollection,
  updateCollectionPermissions,
} from 'actions';
import { showWarningToast } from 'app/toast';
import { getFacetConfig } from 'app/storage';
import { Language, Role } from 'components/common';
import FormDialog from 'dialogs/common/FormDialog';
import getCollectionLink from 'util/getCollectionLink';

const messages = defineMessages({
  title: {
    id: 'search.facets.configure',
    defaultMessage: 'Configure search facets',
  },
});

/* eslint-disable */

class FacetConfigDialog extends Component {
  constructor(props) {
    super(props)
  }

  onNewPropertyAdded(prop) {
    console.log('adding', prop)
  }

  async onSubmit() {
    // const { history, createCollection, toggleDialog, updateCollectionPermissions, preventRedirect } = this.props;
    // const { collection, permissions } = this.state;
    // if (!this.checkValid()) return;
    // this.setState({ blocking: true });
    // try {
    //   const response = await createCollection(collection);
    //   const collectionId = response.data.id;
    //   await updateCollectionPermissions(collectionId, permissions);
    //   this.setState({ blocking: false });
    //   if (preventRedirect) {
    //     toggleDialog(response.data);
    //   } else {
    //     history.push(getCollectionLink({ collection: response.data }));
    //   }
    // } catch (e) {
    //   this.setState({ blocking: false });
    //   showWarningToast(e.message);
    // }
  }

  renderFacetRow(facet) {
    return (
      <>
      </>
    )
  }

  render() {
    const { facetConfig, intl, isOpen, toggleDialog } = this.props;
    // const { collection, permissions, blocking } = this.state;
    // const exclude = permissions.map(perm => parseInt(perm.role.id, 10));
    // const disabled = blocking || !this.checkValid();

    return (
      <Dialog
        icon="filter-list"
        isOpen={this.props.isOpen}
        onClose={this.props.toggleDialog}
        title={intl.formatMessage(messages.title)}
      >
        <div className="bp3-dialog-body">
          <FormattedMessage
            id="search.facets.help"
            defaultMessage="Select facets below."
          />
          {facetConfig.map(this.renderFacetRow)}
          <PropertySelect
            properties={[]}
            onSelected={this.onNewPropertyAdded}
            buttonProps={{ text: 'Test' }}
          />
        </div>
      </Dialog>
    );
  }
}


const mapStateToProps = () => ({
  facetConfig: getFacetConfig()
});

export default compose(
  withRouter,
  connect(mapStateToProps, {}),
  injectIntl,
)(FacetConfigDialog);
