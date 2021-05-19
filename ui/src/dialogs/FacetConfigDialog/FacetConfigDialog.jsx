import React, { Component } from 'react';
import _ from 'lodash';
import { Button, Dialog, Intent } from '@blueprintjs/core';
import { PropertySelect } from '@alephdata/react-ftm';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import getFacetConfig from 'util/getFacetConfig';
import { setCustomFacets } from 'app/storage';
import { selectModel } from 'selectors';
import { showWarningToast } from 'app/toast';
import { Facet, Language, Role } from 'components/common';
import FormDialog from 'dialogs/common/FormDialog';
import getCollectionLink from 'util/getCollectionLink';

const allTypeFacets = [
  'schema', 'countries', 'languages', 'emails', 'phones', 'names', 'addresses', 'mimetypes'
];

const messages = defineMessages({
  prop_select_label: {
    id: 'search.facets.prop_select',
    defaultMessage: 'Add a property',
  },
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
    this.setState(({ facets }) => ({ facets: [...facets, facet] }))
  }

  onFacetRemove(facet) {
    this.setState(({ facets }) => ({ facets: facets.filter(f => f.field !== facet.field) }));
  }

  onSubmit() {
    const { toggleDialog } = this.props;
    setCustomFacets(this.state.facets);
    toggleDialog();
  }

  renderAddButton(facet) {
    return (
      <Button minimal small
        intent={Intent.SUCCESS}
        icon="add"
        onClick={() => this.onFacetAdd(facet)}
      >
        <FormattedMessage id="search.facets.add" defaultMessage="Add" />
      </Button>
    );
  }

  renderRemoveButton(facet) {
    return (
      <Button minimal small
        intent={Intent.DANGER}
        icon="remove"
        onClick={() => this.onFacetRemove(facet)}
      >
        <FormattedMessage id="search.facets.remove" defaultMessage="Remove" />
      </Button>
    );
  }

  renderFacetRow(facet, { showAddButton }) {
    return (
      <tr key={facet.field}>
        <td className="bp3-heading">
          <Facet.Label facet={facet} />
        </td>
        <td className="numeric narrow">
          {showAddButton && this.renderAddButton(facet)}
          {!showAddButton && this.renderRemoveButton(facet)}
        </td>
      </tr>
    );
  }

  render() {
    const { intl, isOpen, availableProperties, toggleDialog } = this.props;
    const { facets } = this.state;

    const [propFacets, typeFacets] = _.partition(facets, facet => facet.isProperty);
    const availableTypeFacets = allTypeFacets
      .filter(facet => !typeFacets.find(f => f.field === facet))
      .map(getFacetConfig)

    return (
      <Dialog
        icon="filter-list"
        isOpen={this.props.isOpen}
        onClose={this.onSubmit}
        title={intl.formatMessage(messages.title)}
        autoFocus={false}
        enforceFocus={false}
      >
        <div className="bp3-dialog-body">
          <h5 className="bp3-heading">
            <FormattedMessage
              id="search.facets.groups"
              defaultMessage="Type facets"
            />
          </h5>
          <table className="data-table">
            <tbody>
              {typeFacets.map(this.renderFacetRow)}
              {availableTypeFacets.map(facet => this.renderFacetRow(facet, { showAddButton: true }))}
            </tbody>
          </table>
          <h5 className="bp3-heading">
            <FormattedMessage
              id="search.facets.properties"
              defaultMessage="Property facets"
            />
          </h5>
          <table className="data-table">
            <tbody>
              {propFacets.map(this.renderFacetRow)}
            </tbody>
          </table>
          <PropertySelect
            properties={availableProperties}
            onSelected={(prop) => this.onFacetAdd({ field: prop.name, label: prop.label, isProperty: true })}
            buttonProps={{ text: intl.formatMessage(messages.prop_select_label) }}
          />
        </div>
        <div className="bp3-dialog-footer">
          <div className="bp3-dialog-footer-actions">
            <Button
              intent={Intent.PRIMARY}
              onClick={this.onSubmit}
            >
              <FormattedMessage
                id="search.facets.submit"
                defaultMessage="Submit"
              />
            </Button>
          </div>
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
    availableProperties: _.uniqBy(properties, 'name')
  });
}

export default compose(
  withRouter,
  connect(mapStateToProps, {}),
  injectIntl,
)(FacetConfigDialog);
