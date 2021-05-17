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
import { setCustomFacets } from 'app/storage';
import { selectModel } from 'selectors';
import { showWarningToast } from 'app/toast';
import { Facet, Language, Role } from 'components/common';
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
    super(props);

    this.state = { facets: props.facets };

    this.renderFacetRow = this.renderFacetRow.bind(this);
    this.onFacetAdd = this.onFacetAdd.bind(this);
    this.onFacetRemove = this.onFacetRemove.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  onFacetAdd(facet) {
    console.log('adding', facet)

    this.setState(({ facets }) => ({ facets: [...facets, facet] }))
  }

  onFacetRemove(facet) {
    this.setState(({ facets }) => ({ facets: facets.filter(f => f.field !== facet.field) }));
  }

  onSubmit() {
    setCustomFacets(this.state.facets);
  }

  renderFacetRow(facet) {
    return (
      <tr key={facet.field}>
        <td className="bp3-heading">
          <Facet.Label field={facet.field} />
        </td>
        <td className="numeric narrow">
          <Button
            minimal
            small
            intent={Intent.DANGER}
            icon="remove"
            onClick={() => this.onFacetRemove(facet)}
            text="Remove"
          />
        </td>
      </tr>
    );
  }

  render() {
    const { intl, isOpen, properties, toggleDialog } = this.props;
    const { facets } = this.state;

    console.log('facets', facets);

    return (
      <Dialog
        icon="filter-list"
        isOpen={this.props.isOpen}
        onClose={() => { this.onSubmit(); this.props.toggleDialog(); }}
        title={intl.formatMessage(messages.title)}
        autoFocus={false}
        enforceFocus={false}
      >
        <div className="bp3-dialog-body">
          <FormattedMessage
            id="search.facets.help"
            defaultMessage="Select facets below."
          />
          <table className="data-table">
            <tbody>
              {facets.map(this.renderFacetRow)}
            </tbody>
          </table>
          <PropertySelect
            properties={properties}
            onSelected={(prop) => this.onFacetAdd({ field: prop.name, label: prop.label })}
            buttonProps={{ text: 'Test' }}
          />
        </div>
      </Dialog>
    );
  }
}


const mapStateToProps = (state) => {
  const model = selectModel(state);

  const properties = model.getProperties()
    .filter(prop => prop.matchable && !prop.hidden)
    .sort((a, b) => a.label > b.label ? 1 : -1)

  return ({
    properties: _.uniqBy(properties, 'name')
  });
}

export default compose(
  withRouter,
  connect(mapStateToProps, {}),
  injectIntl,
)(FacetConfigDialog);
