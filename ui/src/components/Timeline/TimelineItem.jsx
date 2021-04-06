import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { defineMessages, injectIntl } from 'react-intl';
import { Button, Card, Divider, Intent, Menu, Popover, Tooltip } from '@blueprintjs/core';
import { PropertySelect } from '@alephdata/react-ftm';
import { Entity as FTMEntity } from '@alephdata/followthemoney';
import queryString from 'query-string';
import c from 'classnames';

import { showSuccessToast } from 'app/toast';
import { selectModel } from 'selectors';
import { Collection, Entity, Property, Schema } from 'components/common';

import './TimelineItem.scss';


const messages = defineMessages({
  link_copy: {
    id: 'timeline.item.link_copy',
    defaultMessage: 'Copy link to this item',
  },
  link_copy_success: {
    id: 'timeline.item.link_copy_success',
    defaultMessage: 'Successfully copied link to clipboard.',
  },
  remove: {
    id: 'timeline.item.remove',
    defaultMessage: 'Remove from timeline',
  },
  delete: {
    id: 'timeline.item.delete',
    defaultMessage: 'Delete from {collection}',
  }
});

class TimelineItem extends Component {
  constructor(props) {
    super(props);
    const { entity, model } = props;

    this.state = {
      entity: entity || new FTMEntity(model, { schema: 'Event', id: `${Math.random()}` }),
      addedProps: []
    }

    this.onSchemaChange = this.onSchemaChange.bind(this);
    this.onPropertyEdit = this.onPropertyEdit.bind(this);
    this.getVisibleProperties = this.getVisibleProperties.bind(this);
    this.renderProperty = this.renderProperty.bind(this);
    this.onNewPropertyAdded = this.onNewPropertyAdded.bind(this);
    this.onCopyLink = this.onCopyLink.bind(this);
    this.ref = React.createRef();
  }

  componentDidMount() {
    const { isActive, entity } = this.props;

    if (isActive) {
      this.ref.current?.scrollIntoView();
    }
  }

  onSchemaChange(schema) {
    const { model } = this.props;

    this.setState({
      entity: new FTMEntity(model, { schema, id: `${Math.random()}` })
    });
  }

  onPropertyEdit(entity) {
    this.setState({ entity });
    this.props.onUpdate(entity);
  }

  onNewPropertyAdded(prop) {
    this.setState(({ addedProps }) => ({ addedProps: [...addedProps, prop.name] }));
  }

  getVisibleProperties() {
    const { addedProps, entity } = this.state;

    return Array.from(new Set([...entity.schema.featured, ...entity.getProperties().map(prop => prop.name), ...addedProps]));
  }

  onCopyLink() {
    const { entity, intl } = this.props;

    const location = window.location;
    const shadowInput = document.createElement("input");
    const itemHash = queryString.stringify({ id: entity.id });
    shadowInput.type = "text";
    shadowInput.value = `${location.origin}${location.pathname}${location.search}#${itemHash}`;
    shadowInput.classList.add('TimelineItem__hidden-input')
    document.body.appendChild(shadowInput);

    shadowInput.select();
    document.execCommand('copy');
    showSuccessToast(intl.formatMessage(messages.link_copy_success));
  }

  renderProperty(propName, options) {
    const { fetchEntitySuggestions } = this.props;
    const { entity } = this.state;

    return (
      <Property.Editable
        key={propName}
        entity={entity}
        prop={propName}
        onEdit={this.onPropertyEdit}
        fetchEntitySuggestions={fetchEntitySuggestions}
        {...options}
      />
    )
  }

  renderActionMenu() {
    const { intl, isDraft, onDelete, onRemove } = this.props;
    const { entity } = this.state;

    if (isDraft) {
      return (
        <Button className="TimelineItem__menu-toggle" minimal icon="cross" onClick={() => onDelete()} />
      )
    }

    return (
      <Popover>
        <Button className="TimelineItem__menu-toggle" minimal icon="more" />
        <Menu>
          <Menu.Item
            onClick={this.onCopyLink}
            text={intl.formatMessage(messages.link_copy)}
            icon="link"
          />
          <Menu.Item
            onClick={() => onRemove(entity.id)}
            text={intl.formatMessage(messages.remove)}
            icon="remove"
          />
          <Menu.Item
            onClick={() => onDelete(entity.id)}
            text={intl.formatMessage(messages.delete, { collection: <Collection.Label collection={entity.collection} icon={false} /> })}
            icon="trash"
            intent={Intent.DANGER}
          />
        </Menu>
      </Popover>
    );
  }

  renderTitle() {
    const { isDraft } = this.props;
    const { entity } = this.state;

    const captionProp = entity.schema.caption?.[0];

    if (isDraft) {
      return (
        <>
          <Schema.Select
            optionsFilter={schema => schema.isA('Interval') }
            onSelect={this.onSchemaChange}
          >
            <Button
              minimal
              small
              icon={<Schema.Icon schema={entity.schema} />}
              rightIcon="caret-down"
            >
              <Schema.Label schema={entity.schema} />
            </Button>
          </Schema.Select>
          {captionProp && (
            <>
              <Divider />
              {this.renderProperty(captionProp, { defaultEditing: true, className: "TimelineItem__property" })}
            </>
          )}
        </>
      )
    } else if (captionProp) {
      return (
        <>
          <Schema.Icon schema={entity.schema} className="left-icon" />
          {this.renderProperty(captionProp)}
        </>
      );
    } else {
      return <span style={{ textTransform: 'italic'}}><Entity.Label entity={entity} icon /></span>
    }
  }


  render() {
    const { isActive, isDraft } = this.props;
    const { entity } = this.state;

    const captionProp = isDraft && entity.schema.caption?.[0];
    // const otherRequiredProps = entity.schema.required.filter(prop => prop !== captionProp);
    const reservedProps = [captionProp, 'date', 'endDate', 'description'];
    const visibleProps = this.getVisibleProperties()
      .filter(prop => reservedProps.indexOf(prop) < 0);

    const availableProps = entity.schema.getEditableProperties()
      .sort((a, b) => a.label.localeCompare(b.label))
      .filter(prop => [...reservedProps, ...visibleProps].indexOf(prop.name) < 0);

    const showEndDate = entity.hasProperty('date');

    return (
      <div id={entity.id} ref={this.ref}>
        <Card elevation={isActive ? 3 : 1} className="TimelineItem">
          <div className="TimelineItem__actions">{this.renderActionMenu()}</div>
          <div className="TimelineItem__main">
            <div className="TimelineItem__title bp3-heading">
              {this.renderTitle()}
            </div>
            <div className="TimelineItem__main__content">
              <div className="TimelineItem__date">
                {this.renderProperty('date')}
                {showEndDate && (
                  <>
                    <span className="TimelineItem__date__divider text-muted">-</span>
                    {this.renderProperty('endDate')}
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="TimelineItem__secondary">
            <div className="TimelineItem__secondary__content">
              {visibleProps.map(prop => this.renderProperty(prop, { showLabel: true, className: "TimelineItem__property" }))}
              <PropertySelect
                properties={availableProps}
                onSelected={this.onNewPropertyAdded}
                buttonProps={{ minimal: true, small: true }}
              />
            </div>
          </div>
        </Card>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { entity, location } = ownProps;
  const parsedHash = queryString.parse(location.hash);

  return {
    model: selectModel(state),
    isActive: parsedHash.id === entity.id
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps),
  injectIntl,
)(TimelineItem);
