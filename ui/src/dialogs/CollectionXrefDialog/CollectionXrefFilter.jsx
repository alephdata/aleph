import React, { Component } from 'react';
import { InputGroup, Button, MenuItem } from '@blueprintjs/core';
import { Select } from "@blueprintjs/select";
import { defineMessages, injectIntl } from 'react-intl';
import { debounce } from "lodash";


const messages = defineMessages({
  filter: {
    id: 'collection.xref.filter.sources',
    defaultMessage: 'Filter sources',
  },
  categories: {
    id: 'collection.xref.filter.categories',
    defaultMessage: 'Categories',
  },
  allCategories: {
    id: 'collection.xref.filter.allCategories',
    defaultMessage: 'All',
  },
  selectNotAvailable: {
    id: 'collection.xref.filter.selectNotAvailable',
    defaultMessage: 'no options',
  }
});

const itemRenderer = (item, { handleClick }) => {
  return <MenuItem
    key={item.id}
    text={item.label}
    label={item.count}
    onClick={handleClick}
  />
};

class CollectionXrefFilter extends Component {
  constructor(props) {
    super(props);
    this.state = {
      filter: {
        searchTerm: "",
        category: null
      }
    };
    this.triggerChangeFnDebounced = debounce(this.triggerChangeFn.bind(this), 200);
  }

  onChange(filterUpdate) {
    const filter = Object.assign({}, this.state.filter, filterUpdate);
    this.setState({ filter });
    return filter;
  }

  triggerChangeFn(filterValues) {
    const { changeFn } = this.props;
    changeFn(filterValues);
  }

  componentDidMount() {
    this.triggerChangeFn(this.state.filter);
  }

  onSearchTermChange(event) {
    const filterValues = this.onChange({ searchTerm: event.target.value });
    this.triggerChangeFnDebounced(filterValues);
  }

  onCategoryChange(item) {
    if (item.id === null) {
      item = null;
    }
    const filterValues = this.onChange({ category: item });
    this.triggerChangeFn(filterValues);
  }

  render() {
    const { intl, categories } = this.props;
    const { filter } = this.state;

    let selectableCategories = categories.slice();
    if (filter.category) {
      selectableCategories.unshift({ id: null, label: intl.formatMessage(messages.allCategories) })
    }

    return (
      <div className="xref-filter">
        <div className="xref-filter-input">
          <InputGroup
            leftIcon="filter"
            onChange={(value) => this.onSearchTermChange(value)}
            placeholder={intl.formatMessage(messages.filter)}
            value={filter.searchTerm}
          />
        </div>
        <div className="xref-filter-select">
          <Select
            filterable={false}
            hasInitialContent={false}
            items={selectableCategories}
            itemRenderer={itemRenderer}
            noResults={<MenuItem disabled={true} text={intl.formatMessage(messages.selectNotAvailable)}/>}
            popoverProps={{ popoverClassName: "CollectionXrefDialog-popover" }}
            onItemSelect={(item) => this.onCategoryChange(item)}>
            <Button text={filter.category ? filter.category.label : intl.formatMessage(messages.categories)}
                    rightIcon="double-caret-vertical"/>
          </Select>
        </div>
      </div>
    );
  }
}

CollectionXrefFilter = injectIntl(CollectionXrefFilter);
export default CollectionXrefFilter;
