import _ from 'lodash';
import React from 'react';
import { Alignment, ButtonGroup, Card, Divider, Button, Tooltip } from '@blueprintjs/core';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { defineMessages, injectIntl } from 'react-intl';
import { withRouter } from 'react-router';
import queryString from 'query-string';

import { Count, Schema, SectionLoading, Skeleton } from 'components/common';
import { selectModel } from 'selectors';
import InvestigationSidebarButton from 'components/Investigation/InvestigationSidebarButton';


import './SchemaCounts.scss';

const messages = defineMessages({
  addSchemaPlaceholder: {
    id: 'collection.addSchema.placeholder',
    defaultMessage: 'Add new entity type',
  },
});


class SchemaCounts extends React.PureComponent {
  constructor(props) {
    super(props);
    this.handleTabChange = this.handleTabChange.bind(this);
  }

  handleTabChange(type) {
    const { history, location } = this.props;
    const parsedHash = queryString.parse(location.hash);
    parsedHash.type = type;
    parsedHash.mode = 'entities';

    history.push({
      pathname: location.pathname,
      search: "",
      hash: queryString.stringify(parsedHash),
    });
  }

  render() {
    const { activeSchema, isCollapsed, visibleCounts, selectableSchemata, showSchemaAdd, intl, isPending, onSelect, writeable } = this.props;

    if (isPending && !activeSchema) {
      return <SectionLoading />
    }


    return (
      <ButtonGroup vertical minimal className="SchemaCounts">
        {Object.keys(visibleCounts).map(schema => {
          const text = isPending
            ? <Skeleton.Text type="span" length={15} />
            : <Schema.Label schema={schema} plural />;

          return (
            <InvestigationSidebarButton
              key={schema}
              text={text}
              icon={<Schema.Icon schema={schema} />}
              rightIcon={<Count count={visibleCounts[schema]} isPending={isPending} />}
              onClick={() => onSelect(schema)}
              active={activeSchema === schema}
              isCollapsed={isCollapsed}
            />
          )
        })}
        {_.size(visibleCounts) > 0 && showSchemaAdd && <Divider />}
        {showSchemaAdd && (
          <Schema.Select
            onSelect={this.handleTabChange}
            fill
            optionsFilter={schema => selectableSchemata.indexOf(schema.name) !== -1}
          >
            <InvestigationSidebarButton
              text={intl.formatMessage(messages.addSchemaPlaceholder)}
              icon="plus"
              isCollapsed={isCollapsed}
              rightIcon="chevron-down"
            />
          </Schema.Select>
        )}
      </ButtonGroup>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { activeSchema, filterSchemata, schemaCounts } = ownProps;
  const model = selectModel(state);

  const allCounts = schemaCounts
  if (activeSchema && !allCounts[activeSchema]) {
    allCounts[activeSchema] = 0;
  }

  const visibleCounts = _.pickBy(schemaCounts, (val, key) => {
    const schema = model.getSchema(key);
    return (!filterSchemata || filterSchemata(schema)) && !schema.hidden;
  })

  const selectableSchemata = model.getSchemata()
    .filter((schema) => (!filterSchemata || filterSchemata(schema)) && !schema.hidden && !(schema in visibleCounts))
    .map((schema) => schema.name);

  return {
    visibleCounts,
    selectableSchemata
  }
};

export default compose(
  withRouter,
  connect(mapStateToProps),
  injectIntl,
)(SchemaCounts);
