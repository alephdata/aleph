import React from 'react';
import { Button, MenuDivider, MenuItem } from '@blueprintjs/core';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { defineMessages, injectIntl } from 'react-intl';
import { withRouter } from 'react-router';
import queryString from 'query-string';

import { Count, Schema, SectionLoading, Skeleton } from 'components/common';
import { selectModel } from 'selectors';

// import './SchemaCounts.scss';

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

    history.push({
      pathname: location.pathname,
      search: "",
      hash: queryString.stringify(parsedHash),
    });
  }

  render() {
    const { activeSchema, visibleCounts, selectableSchemata, intl, isPending, onSelect, writeable } = this.props;
    const showSchemaSelect = writeable && selectableSchemata.length;

    if (isPending && !activeSchema) {
      return <SectionLoading />
    }

    return (
      <>
        {visibleCounts.map(ref => (
          <MenuItem
            id={ref.id}
            key={ref.id}
            className="SchemaCounts"
            onClick={() => onSelect(ref.id)}
            rightIcon={<Count count={ref.count} isPending={isPending} />}
            text={
              <>
                {isPending && <Skeleton.Text type="span" length={15} />}
                {!isPending && <Schema.Label schema={ref.id} plural icon />}
              </>
            }
          />
        ))}
        {visibleCounts.length > 0 && showSchemaSelect && <MenuDivider />}
        {showSchemaSelect && (
          <MenuItem
            id="new"
            key="new"
            disabled
            className="SchemaCount schema-add-tab"
            text={
              <Schema.Select
                onSelect={this.handleTabChange}
                optionsFilter={schema => selectableSchemata.indexOf(schema.name) !== -1}
              >
                <Button
                  icon="plus"
                  text={intl.formatMessage(messages.addSchemaPlaceholder)}
                />
              </Schema.Select>
            }
          />
        )}
      </>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { filterSchemata, schemaCounts } = ownProps;
  const model = selectModel(state);

  const allSchemata = model.getSchemata()
    .filter((schema) => filterSchemata(schema) && !schema.hidden)
    .map((schema) => schema.name);

  const visibleCounts = schemaCounts
    .filter(({id}) => {
      const schema = model.getSchema(id);
      return filterSchemata(schema) && !schema.hidden;
    });

  const selectableSchemata = allSchemata
    .filter((s) => !schemaCounts.find((v) => v.id === s));


  return {
    visibleCounts, selectableSchemata
  }
};

export default compose(
  withRouter,
  connect(mapStateToProps),
  injectIntl,
)(SchemaCounts);
