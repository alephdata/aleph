import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { AnchorButton, ButtonGroup, Classes } from '@blueprintjs/core';
import { Tooltip2 as Tooltip } from '@blueprintjs/popover2';

import { DialogToggleButton } from 'components/Toolbar';
import FacetConfigDialog from 'dialogs/FacetConfigDialog/FacetConfigDialog';

const messages = defineMessages({
  configure_facets: {
    id: 'search.facets.button_text',
    defaultMessage: 'Configure facets',
  },
  dates: {
    id: 'search.screen.dates',
    defaultMessage: 'Date distribution',
  },
  date_facet_disabled: {
    id: 'search.screen.dates_disabled',
    defaultMessage: 'No date distribution available',
  },
});

class EntitySearchManageMenu extends Component {
  constructor(props) {
    super(props);

    this.toggleDateFacet = this.toggleDateFacet.bind(this);
  }

  toggleDateFacet() {
    const { dateFacetIsOpen, query, updateQuery } = this.props;
    let newQuery;
    if (dateFacetIsOpen) {
      newQuery = query.remove('facet', 'dates')
        .remove('facet_interval:dates', 'year');
    } else {
      newQuery = query.add('facet', 'dates')
        .add('facet_interval:dates', 'year');
    }
    updateQuery(newQuery);
  }

  render() {
    const { dateFacetDisabled, dateFacetIsOpen, facets, intl } = this.props;

    const dateTooltip = intl.formatMessage(messages.date_facet_disabled);

    return (
      <ButtonGroup className="EntitySearchManageMenu">
        <Tooltip content={dateTooltip} disabled={!dateFacetDisabled}>
          <AnchorButton
            icon="calendar"
            onClick={this.toggleDateFacet}
            disabled={dateFacetDisabled}
            active={dateFacetIsOpen}
            text={intl.formatMessage(messages.dates)}
          />
        </Tooltip>
        <DialogToggleButton
          buttonProps={{
            text: intl.formatMessage(messages.configure_facets),
            icon: "filter-list"
          }}
          Dialog={FacetConfigDialog}
          dialogProps={{ facets }}
        />
      </ButtonGroup>
    );
  }
}

export default injectIntl(EntitySearchManageMenu);
