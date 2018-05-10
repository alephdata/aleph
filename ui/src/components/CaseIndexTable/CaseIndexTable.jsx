import React, {Component} from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { connect } from 'react-redux';

import CaseTableRow from './CaseTableRow';
import { SortableTH } from 'src/components/common';

const messages = defineMessages({
  column_title: {
    id: 'case.column.title',
    defaultMessage: 'Title',
  },
  column_summary: {
    id: 'case.column.summary',
    defaultMessage: 'Summary',
  },
  column_shared: {
    id: 'case.column.shared',
    defaultMessage: 'Shared with',
  },
  column_date: {
    id: 'case.column.date',
    defaultMessage: 'Created'
  }
});

class CaseIndexTable extends Component {

  constructor(props) {
    super(props);
    this.state = { result: props.result };
  }

  componentWillReceiveProps(nextProps) {
    const {result} = nextProps;
    if (result.total !== undefined) {
      this.setState({result})
    }
  }

  render() {
    const { query, intl } = this.props;
    const { result } = this.state;

    if (result.total === 0 && result.page === 1) {
      return null;
    }

    const TH = ({sortable, field, ...otherProps}) => {
      const {field: sortedField, desc} = query.getSort();
      return (
        <SortableTH sortable={sortable}
                    sorted={sortedField === field && (desc ? 'desc' : 'asc')}
                    {...otherProps}>
          {intl.formatMessage(messages[`column_${field}`])}
        </SortableTH>
      );
    };

    return (
      <table className="CaseTable case-table" align="center">
        <thead>
        <tr key={0}>
          <th/>
          <TH field="title"/>
          <TH field="summary"/>
          <TH field="shared"/>
          <TH field="date"/>
          <th />
        </tr>
        </thead>
        <tbody>
        {result.results !== undefined && result.results.map((collection, index) =>
          <CaseTableRow key={collection.id}
                        collection={collection} />
        )}
        </tbody>
      </table>
    );
  }
}

CaseIndexTable = injectIntl(CaseIndexTable);
export default CaseIndexTable;