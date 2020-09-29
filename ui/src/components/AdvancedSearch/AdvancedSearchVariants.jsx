import React, { PureComponent } from 'react';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { Button, ButtonGroup, Classes, ControlGroup, Dialog, Divider, FormGroup, InputGroup, Intent, NumericInput, Position, Slider, Tag, TagInput } from '@blueprintjs/core';

import { Count } from 'components/common';

import './AdvancedSearchVariants.scss';

const messages = defineMessages({
  label: {
    id: 'search.advanced.variant.label',
    defaultMessage: 'Spelling variations',
  },
  helptext: {
    id: 'search.advanced.variant.helptext',
    defaultMessage: 'Increase the fuzziness of a search.  For example, Wladimir~2 will return not just the term “Wladimir” but also similar spellings such as "Wladimyr" or "Vladimyr". A spelling variant is defined by the number of spelling mistakes that must be made to get from the original word to the variant.',
  },
  term: {
    id: 'search.advanced.variant.term1',
    defaultMessage: 'Term',
  },
  distance: {
    id: 'search.advanced.variant.distance',
    defaultMessage: 'Letters different',
  },
});

class AdvancedSearchVariants extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      term: null,
      distance: null,
    };
    this.onChange = this.onChange.bind(this);
    this.onRemove = this.onRemove.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  onRemove(variant) {
    const { onChange, variants } = this.props;
    onChange(variants.filter(v => v.term !== variant.term));
  }

  onSubmit(e) {
    e.preventDefault();
    e.stopPropagation();

    const { onChange, variants } = this.props;
    const { distance, term } = this.state;

    if (distance && term) {
      onChange([...variants, { distance, term }]);
      this.setState({ term: null, distance: null })
    }
  }

  onChange(field, value) {
    console.log('in on change', field, value)
    this.setState({
      [field]: value
    });
  }

  render() {
    const { intl, variants } = this.props;
    const { distance, term } = this.state;

    return (
      <FormGroup
        label={intl.formatMessage(messages.label)}
        labelFor="variant"
        helperText={intl.formatMessage(messages.helptext)}
        className="AdvancedSearchVariants"
      >
        {variants.length > 0 && (
          <div className="AdvancedSearchVariants__list">
            {variants?.map(v => (
              <Tag
                onRemove={() => this.onRemove(v)}
                rightIcon={<Count count={v.distance} />}
                className="AdvancedSearchVariants__list__item"
                minimal
              >
                <span>{v.term}</span>
              </Tag>
            ))}
          </div>
        )}
        <form onSubmit={this.onSubmit}>
          <ControlGroup id="variant" fill vertical={false} className="AdvancedSearchVariants__form">
            <FormGroup
              helperText={intl.formatMessage(messages.term)}
            >
              <InputGroup
                value={term || ''}
                onChange={e => this.onChange("term", e.target.value)}
              />
            </FormGroup>
            <FormGroup
              helperText={intl.formatMessage(messages.distance)}
              labelFor="variant_slider"
              className="padded"
            >
              <Slider
                id="variant_slider"
                min={0}
                max={10}
                labelStepSize={2}
                onChange={val => this.onChange("distance", val)}
                value={+distance || 0}
              />
            </FormGroup>
            <Button
              type="submit"
              icon="add"
              disabled={!term || !distance}
            />
          </ControlGroup>
        </form>
      </FormGroup>
    );
  }
}

export default injectIntl(AdvancedSearchVariants);
