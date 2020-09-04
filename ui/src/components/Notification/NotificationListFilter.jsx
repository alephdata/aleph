import React, { Component } from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Alignment, Button, Intent, MenuItem } from '@blueprintjs/core';

import SelectWrapper from 'components/common/SelectWrapper';

import 'src/components/common/SortingBar.scss';

const eventTypes = [
  {label: 'All'},
  {type: 'CREATE_COLLECTION', label: 'New dataset'},
  {type: 'UPDATE_COLLECTION', label: 'Dataset settings update'},
  {type: 'INGEST_DOCUMENT', label: 'New document'},
  {type: 'LOAD_MAPPING', label: 'Entities generated'},
  {type: 'CREATE_DIAGRAM', label: 'New diagram'},
  {type: 'CREATE_ENTITYSET', label: 'New list'},
  {type: 'MATCH_ALERT', label: 'Search alert match'},
  {type: 'GRANT_COLLECTION', label: 'Dataset access change'},
  {type: 'PUBLISH_COLLECTION', label: 'Dataset published'},
];


class NotificationListFilter extends Component {
  constructor(props) {
    super(props);
    this.onSelect = this.onSelect.bind(this);
  }

  renderOption = (option, { handleClick }) => (
    <MenuItem
      key={option.field}
      onClick={handleClick}
      text={option.label}
    />
  )

  onSelect(selected) {
    const { query, updateQuery } = this.props;
    const newQuery = query.setFilter('event', selected.type)
    updateQuery(newQuery)
  }

  render() {
    const { activeType } = this.props;
    const activeItem = eventTypes.find(et => et.type === activeType) || eventTypes[0];

    return (
      <div className="SortingBar">
        <span className="SortingBar__label">
          <FormattedMessage
            id="notifications.type_filter"
            defaultMessage="Show"
          />
        </span>
        <div className="SortingBar__control">
          <SelectWrapper
            itemRenderer={this.renderOption}
            items={eventTypes}
            onItemSelect={this.onSelect}
            activeItem={activeItem}
            popoverProps={{
              minimal: true,
              fill: false,
              className: 'SortingBar__item__popover',
            }}
            inputProps={{
              fill: false,
            }}
            filterable={false}
            resetOnClose
            resetOnSelect
          >
            <Button
              text={activeItem?.label}
              alignText={Alignment.LEFT}
              minimal
              intent={Intent.PRIMARY}
              rightIcon="caret-down"
            />
          </SelectWrapper>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { query } = ownProps;
  const eventFilterVals = query.getFilter('event');
  const activeType = eventFilterVals?.length > 0 && eventFilterVals[0];
  return { activeType };
};

export default compose(
  connect(mapStateToProps),
  injectIntl,
)(NotificationListFilter);
