import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Link } from 'react-router-dom';
import { Waypoint } from 'react-waypoint';
import { ErrorSection } from 'components/common';
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
  constructor(props) {
    super(props);
    this.getMoreResults = this.getMoreResults.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  getMoreResults() {
    const { query, result } = this.props;
    if (result && !result.isPending && result.next && !result.isError) {
      this.props.queryMappings({ query, next: result.next });
    }
  }

  fetchIfNeeded() {
    const { result, query } = this.props;
    if (result.shouldLoad) {
      this.props.queryMappings({ query });
    }
  }

  render() {
    const { query, result, intl, showCollectionLinks } = this.props;
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
          {result.results && result.results.map(mapping => {
            const link = mapping.table_id && `${getEntityLink(mapping.table_id)}#mode=mapping`;
            const content = (
              <MappingIndexItem
                key={mapping.id}
                mapping={mapping}
                showTableLink
              />
            );
            if (link) {
              return (
                <li>
                  <Link to={link}>
                    {content}
                  </Link>
                </li>
              );
            } else {
              return (
                <li>{content}</li>
              )
            }

          })}
          {result.isPending && skeletonItems.map(
            item => <MappingIndexItem key={item} showTableLink isPending />,
          )}
        </ul>
        <Waypoint
          onEnter={this.getMoreResults}
          bottomOffset="-300px"
          scrollableAncestor={window}
        />
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { query } = ownProps;

  console.log('state', state);
  return { result: selectMappingsResult(state, query) };
};
const mapDispatchToProps = { queryMappings };

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl,
)(MappingIndex);
