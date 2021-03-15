import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { Button, Card, EditableText } from '@blueprintjs/core';
import { PropertyEditor } from '@alephdata/react-ftm';
import { Entity as FTMEntity } from '@alephdata/followthemoney';


import { selectModel } from 'selectors';
import { Entity, Schema } from 'components/common';


import './TimelineItem.scss';


const messages = defineMessages({
  // search_placeholder: {
  //   id: 'entity.manager.search_placeholder',
  //   defaultMessage: 'Search {schema}',
  // },
  // empty: {
  //   id: 'timeline.empty',
  //   defaultMessage: 'This timeline is empty',
  // }
});

class TimelineItem extends Component {
  constructor(props) {
    super(props);
    const { item } = props;

    this.state = {
      schema: item.schema || 'Event',
      properties: item.properties || [],
    }
  }

  render() {
    const { intl, item, model } = this.props;

    // <Schema.Select
    //   optionsFilter={schema => { console.log(schema.name, schema.isA('Interval'), schema.extends, schema.isEdge); return true; }}
    //   onSelect={this.onMappingAdd}
    // >
    //   <Button
    //     icon="add"
    //   >
    //     <FormattedMessage id="timeline.schema.placeholder" defaultMessage="Select a type" />
    //   </Button>
    // </Schema.Select>

    const testData = {
      id: '1234',
      schema: 'Event',
      properties: { name: ['Lorem Ipsum'] }
    }

    const testEntity = FTMEntity.fromJSON(model, testData);


    const testPersonData = {
      id: '1234',
      schema: 'Person',
      properties: { name: ['John Smith'] }
    }

    const testPerson = FTMEntity.fromJSON(model, testPersonData);

    const testCompanyData = {
      id: '1234',
      schema: 'Company',
      properties: { name: ['Caldwell Unlimited, LLC'] }
    }

    const testCompany = FTMEntity.fromJSON(model, testCompanyData);

    return (
      <Card className="TimelineItem">
        <div className="TimelineItem__secondary">
          <h5 className="TimelineItem__date">20 February 2010</h5>

          <div className="TimelineItem__property">
            <h5 className="TimelineItem__property__label">Organized by</h5>
            <div className="TimelineItem__property__values">
              <Entity.Link entity={testPerson} icon />
            </div>
          </div>
          <div className="TimelineItem__property">
            <h5 className="TimelineItem__property__label">Involved</h5>
            <div className="TimelineItem__property__values">
              <Entity.Link className="TimelineItem__property__value" entity={testCompany} icon />
              <Entity.Link className="TimelineItem__property__value" entity={testPerson} icon />
            </div>
          </div>
        </div>
        <div className="TimelineItem__main">
          <div className="TimelineItem__main__title">
            <Entity.Link entity={testEntity} icon />
          </div>
          <div className="TimelineItem__main__content">
            <p className="TimelineItem__summary">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
            </p>
          </div>
        </div>
      </Card>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    model: selectModel(state)
  };
};

export default compose(
  connect(mapStateToProps),
  injectIntl,
)(TimelineItem);
