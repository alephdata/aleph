import React, { Component } from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { Button, Divider, Intent } from '@blueprintjs/core';

import { Entity, Schema } from 'components/common';

import './TimelineItemTitle.scss';

class TimelineItemTitle extends Component {
  constructor(props) {
    super(props);
    this.renderDraft = this.renderDraft.bind(this);
    this.renderNondraft = this.renderNondraft.bind(this);
  }

  renderDraft() {
    const { captionProp, entity, onSchemaChange, renderProperty } = this.props;

    return (
      <>
        <div>
          <p className="EditableProperty__label">
            <FormattedMessage
              id="timeline.schema_select.label"
              defaultMessage="type"
            />
          </p>
          <Schema.Select
            optionsFilter={schema => schema.isA('Interval') }
            onSelect={onSchemaChange}
          >
            <Button
              outlined
              small
              intent={Intent.PRIMARY}
              icon={<Schema.Icon schema={entity.schema} />}
              rightIcon="caret-down"
            >
              <Schema.Label schema={entity.schema} />
            </Button>
          </Schema.Select>
        </div>
        {captionProp && (
          <>
            <Divider />
            {renderProperty(captionProp, { defaultEditing: true, className: "TimelineItem__property" })}
          </>
        )}
      </>
    );
  }

  renderEdgeLabel() {
    const { captionProp, entity, renderProperty, writeable } = this.props;
    const { label, source, target } = entity.schema.edge;
    return (
      <>
        {renderProperty(source, { minimal: true })}
        {`${label}`}
        {renderProperty(target, { minimal: true })}
      </>
    );
  }

  renderNondraft() {
    const { captionProp, entity, renderProperty, writeable } = this.props;
    const { schema } = entity

    if (!!schema.edge) {
      return this.renderEdgeLabel();
    } else if (captionProp) {
      return (
        <div class="no-wrap">
          <Schema.Icon schema={schema} />
          {renderProperty(captionProp, { minimal: true })}
        </div>
      );
    }

    return <Entity.Label entity={entity} icon />
  }

  render() {
    const { children, entity, isDraft } = this.props;

    return (
      <div className="TimelineItemTitle">
        <span className="TimelineItemTitle__text">
          {isDraft && this.renderDraft()}
          {!isDraft && this.renderNondraft()}
        </span>
        {children}
      </div>
    );
  }
}

export default injectIntl(TimelineItemTitle);
