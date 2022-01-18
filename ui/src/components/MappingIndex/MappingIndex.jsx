import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';

import withRouter from 'app/withRouter'
import { ErrorSection, QueryInfiniteLoad } from 'components/common';
import { queryMappings } from 'actions';
import { selectMappingsResult } from 'selectors';
import MappingIndexItem from 'components/MappingIndex/MappingIndexItem';
import getEntityLink from 'util/getEntityLink';

import './MappingIndex.scss';


const messages = defineMessages({
  no_mappings: {
    id: 'mappings.no_mappings',
    defaultMessage: 'You have not generated any mappings yet',
  },
});

class MappingIndex extends Component {

  render() {
    const { query, result, intl } = this.props;
    const skeletonItems = [...Array(15).keys()];

    if (result.total === 0) {
      return (
        <ErrorSection
          icon="new-object"
          title={intl.formatMessage(messages.no_mappings)}
        />
      );
    }

    return (
      <div className="MappingIndex">
        <ul className="MappingIndex__items">
          {result.results && result.results.map(mapping => (
            <li key={mapping.id}>
              <MappingIndexItem
                mapping={mapping}
                link={mapping.table_id && `${getEntityLink(mapping.table_id)}#mode=mapping`}
              />
            </li>
          ))}
          {result.isPending && skeletonItems.map(item => (
            <li key={item}>
              <MappingIndexItem isPending />
            </li>
          ))}
        </ul>
        <QueryInfiniteLoad
          query={query}
          result={result}
          fetch={this.props.queryMappings}
        />
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { query } = ownProps;
  return { query, result: selectMappingsResult(state, query) };
};

export default compose(
  withRouter,
  connect(mapStateToProps, { queryMappings }),
  injectIntl,
)(MappingIndex);
