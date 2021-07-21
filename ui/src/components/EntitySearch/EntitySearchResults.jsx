import React, { Component } from 'react';
import c from 'classnames';
import { FormattedMessage } from 'react-intl';
import { compose } from 'redux';
import { withRouter } from 'react-router';
import { Icon } from '@blueprintjs/core';

import EntitySearchResultsRow from './EntitySearchResultsRow';
import { ErrorSection, SortableTH } from 'components/common';
import SearchField from 'components/SearchField/SearchField';

import './EntitySearchResults.scss';


class EntitySearchResults extends Component {
  constructor(props) {
    super(props)

    this.state = {
      overflowEnd: false,
      overflowStart: false
    }

    this.containerRef = React.createRef();
    this.tableRef = React.createRef();
    this.checkHorizontalOverflow = this.checkHorizontalOverflow.bind(this)
  }

  componentDidMount() {
    this.checkHorizontalOverflow()
  }

  checkHorizontalOverflow() {
    const container = this.containerRef?.current?.getBoundingClientRect();
    const table = this.tableRef?.current?.getBoundingClientRect();
    if (!table || !container) { return; }

    this.setState(({ overflowStart, overflowEnd }) => {
      return ({
        overflowStart: table.x < container.left,
        overflowEnd: (table.left + table.width - 20) > container.right,
      })
    });
  }

  sortColumn(newField) {
    const { query, updateQuery } = this.props;
    const { field: currentField, direction } = query.getSort();

    if (currentField !== newField) {
      return updateQuery(query.sortBy(newField, 'asc'));
    }

    // Toggle through sorting states: ascending, descending, or unsorted.
    updateQuery(query.sortBy(
      currentField,
      direction === 'asc' ? 'desc' : 'asc'
    ));
  }

  renderHeaderCell = (field) => {
    const { query } = this.props;
    const { field: sortedField, direction } = query.getSort();
    const fieldName = field.isProperty ? `properties.${field.name}` : field.name;
    return (
      <SortableTH
        key={fieldName}
        sortable={true}
        className={c({ wide: fieldName === 'caption' || fieldName === 'collection_id' })}
        sorted={sortedField === fieldName && (direction === 'desc' ? 'desc' : 'asc')}
        onClick={() => this.sortColumn(fieldName)}
      >
        <SearchField.Label field={field} />
      </SortableTH>
    );
  }

  render() {
    const { columns, result, location, writeable, showPreview = true, updateSelection, selection } = this.props;
    const { overflowStart, overflowEnd } = this.state;

    if (result.isError) {
      return <ErrorSection error={result.error} />;
    }

    if (!result.isPending && result.total === 0 && result.page === 1) {
      return null;
    }

    const skeletonItems = [...Array(15).keys()];

    // <span className="EntitySearchResults__scroll-help-text">
    //   <FormattedMessage id="search.results.scroll" defaultMessage="Scroll for more" />
    //   <Icon icon="arrow-right" />
    // </span>

    return (
      <div ref={this.containerRef} className={c("EntitySearchResults-outer-container", { overflowEnd, overflowStart })} onScroll={this.checkHorizontalOverflow}>
        <div className="EntitySearchResults-inner-container">
          <table className="EntitySearchResults data-table" ref={this.tableRef}>
            <thead>
              <tr>
                {writeable && updateSelection && (<th className="select" />)}
                {columns.map(this.renderHeaderCell)}
              </tr>
            </thead>
            <tbody className={c({ updating: result.isPending })}>
              {result.results.map(entity => (
                <EntitySearchResultsRow
                  key={entity.id}
                  entity={entity}
                  location={location}
                  showPreview={showPreview}
                  updateSelection={updateSelection}
                  selection={selection}
                  writeable={writeable}
                  columns={columns}
                />
              ))}
              {result.isPending && skeletonItems.map(item => (
                <EntitySearchResultsRow
                  key={item}
                  updateSelection={updateSelection}
                  writeable={writeable}
                  columns={columns}
                  isPending
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

export default compose(
  withRouter,
)(EntitySearchResults);
