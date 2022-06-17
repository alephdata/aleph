// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import React, { PureComponent } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { Button, ControlGroup, FormGroup, InputGroup, Slider } from '@blueprintjs/core';


const messages = defineMessages({
  variants_term: {
    id: 'search.advanced.variants.term',
    defaultMessage: 'Term',
  },
  variants_distance: {
    id: 'search.advanced.variants.distance',
    defaultMessage: 'Letters different',
  },
  proximity_term: {
    id: 'search.advanced.proximity.term',
    defaultMessage: 'First term',
  },
  proximity_term2: {
    id: 'search.advanced.proximity.term2',
    defaultMessage: 'Second term',
  },
  proximity_distance: {
    id: 'search.advanced.proximity.distance',
    defaultMessage: 'Distance',
  },
});

class AdvancedSearchMultiFieldForm extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      term: null,
      term2: null,
      distance: null,
    };
    this.onChange = this.onChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  onSubmit(e) {
    e.preventDefault();
    e.stopPropagation();
    const { field } = this.props;
    const { distance, term, term2 } = this.state;

    if (distance && term && (field !== 'proximity' || term2)) {
      this.props.onSubmit({ distance, term, term2 });
      this.setState({ term: null, term2: null, distance: null })
    }
  }

  onChange(field, value) {
    this.setState({
      [field]: value
    });
  }

  render() {
    const { field, intl } = this.props;
    const { distance, term, term2 } = this.state;

    return (
      <ControlGroup id={field} fill vertical={false} className="AdvancedSearchMultiField__form">
        <FormGroup
          helperText={intl.formatMessage(messages[`${field}_term`])}
        >
          <InputGroup
            value={term || ''}
            onChange={e => this.onChange("term", e.target.value)}
          />
        </FormGroup>
        <FormGroup
          helperText={intl.formatMessage(messages[`${field}_distance`])}
          labelFor={`${field}_slider`}
          className="padded"
        >
          <Slider
            id={`${field}_slider`}
            min={0}
            max={field === 'proximity' ? 6 : 4}
            labelStepSize={1}
            onChange={val => this.onChange("distance", val)}
            value={+distance || 0}
          />
        </FormGroup>
        {field === 'proximity' && (
          <FormGroup
            helperText={intl.formatMessage(messages.proximity_term2)}
          >
            <InputGroup
              inline
              value={term2 || ''}
              onChange={e => this.onChange("term2", e.target.value)}
            />
          </FormGroup>
        )}
        <Button
          onClick={this.onSubmit}
          icon="add"
          disabled={!term || !distance || (field === 'proximity' && !term2)}
        />
      </ControlGroup>
    );
  }
}

export default injectIntl(AdvancedSearchMultiFieldForm);
