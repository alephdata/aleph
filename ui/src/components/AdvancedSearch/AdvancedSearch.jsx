import React from 'react';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import queryString from 'query-string';
import { parse } from 'search-query-parser';
import { Query as ESQuery, QueryStringQuery, ValueTermQueryBase, TermQuery } from 'elastic-builder';
import { Button, ButtonGroup, Classes, ControlGroup, Dialog, Divider, Drawer, FormGroup, InputGroup, Intent, NumericInput, Position, Slider, Tag, TagInput } from '@blueprintjs/core';

import AdvancedSearchVariants from 'components/AdvancedSearch/AdvancedSearchVariants';
import Query from 'app/Query';

import './AdvancedSearch.scss';

const messages = defineMessages({
  title: {
    id: 'search.advanced.title',
    defaultMessage: 'Advanced Search',
  },
  all_label: {
    id: 'search.advanced.all.label',
    defaultMessage: 'Any of these words',
  },
  all_helptext: {
    id: 'search.advanced.all.helptext',
    defaultMessage: 'Results containing all of the given terms will be prioritized, followed by those with one or more of the terms.',
  },
  exact_label: {
    id: 'search.advanced.exact.label',
    defaultMessage: 'This exact word/phrase',
  },
  exact_helptext: {
    id: 'search.advanced.exact.helptext',
    defaultMessage: 'Only results with this exact word or phrase will be returned',
  },
  none_label: {
    id: 'search.advanced.none.label',
    defaultMessage: 'None of these words',
  },
  none_helptext: {
    id: 'search.advanced.none.helptext',
    defaultMessage: 'Exclude results with these words',
  },
  must_label: {
    id: 'search.advanced.must.label',
    defaultMessage: 'Must contain these words',
  },
  must_helptext: {
    id: 'search.advanced.must.helptext',
    defaultMessage: 'Only results with these words will be returned',
  },
  variant_label: {
    id: 'search.advanced.variant.label',
    defaultMessage: 'Spelling variations',
  },
  variant_helptext: {
    id: 'search.advanced.variant.helptext',
    defaultMessage: 'Increase the fuzziness of a search.  For example, Wladimir~2 will return not just the term “Wladimir” but also similar spellings such as "Wladimyr" or "Vladimyr". A spelling variant is defined by the number of spelling mistakes that must be made to get from the original word to the variant.',
  },
  variant_term: {
    id: 'search.advanced.variant.term1',
    defaultMessage: 'Term',
  },
  variant_distance: {
    id: 'search.advanced.variant.distance',
    defaultMessage: 'Letters different',
  },
  proximity_label: {
    id: 'search.advanced.proximity.label',
    defaultMessage: 'Terms in proximity to each other',
  },
  proximity_helptext: {
    id: 'search.advanced.proximity.helptext',
    defaultMessage: 'Search for two terms within a certain distance of each other. For example, return results with the terms "Bank" and "America" occurring within two words from each other, such as "Bank of America", "Bank in America", even "America has a Bank".',
  },
  proximity_term1: {
    id: 'search.advanced.proximity.term1',
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
  submit: {
    id: 'search.advanced.submit',
    defaultMessage: 'Search',
  },
  clear: {
    id: 'search.advanced.clear',
    defaultMessage: 'Clear all',
  }
});

const FIELDS = ['all', 'exact', 'none', 'must'];

/* eslint-disable jsx-quotes */
class AdvancedSearch extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      all: [],
      exact: [],
      any: [],
      none: [],
      must: [],
      variants: [],
      proximity: null
    };

    this.ref = React.createRef();

    this.updateQuery = this.updateQuery.bind(this);
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const nextQueryText = nextProps.query ? nextProps.query.getString('q') : prevState.queryText;
    const queryChanged = !prevState || prevState.queryText !== nextQueryText;

    if (queryChanged) {
      const { query } = nextProps;
      let queryText = query.getString('q');

      const proximityRE = /"(?<term1>[^\s]+) (?<term2>[^\s]+)"~(?<distance>[0-9]+)/;
      const proximity = queryText.match(proximityRE)?.groups;
      queryText = queryText.replace(proximityRE, '');

      const variantRE = /[^\s]+~[0-9]+/g;
      const variants = queryText.match(variantRE) || [];
      queryText = queryText.replace(variantRE, '');

      const exactRE = /"[^\s]+"/g;
      const exact = queryText.match(exactRE) || [];
      queryText = queryText.replace(exactRE, '');

      const noneRE = /(^|\s)-[^\s]+/g;
      const none = queryText.match(noneRE) || [];
      queryText = queryText.replace(noneRE, '');

      const mustRE = /(^|\s)\+[^\s]+/g;
      const must = queryText.match(mustRE) || [];
      queryText = queryText.replace(mustRE, '');

      console.log('setting all to', queryText.split(' '))

      return {
        queryText: nextQueryText,
        all: queryText.trim().split(' '),
        exact: exact.map(t => t.replace(/["']/g,'')),
        none: none.map(t => t.replace(/-/g,'')),
        must: must.map(t => t.replace(/\+/g,'')),
        variants: variants.map(v => v.match(/(?<term>[^\s])+~(?<distance>[0-9]+)/).groups),
        proximity
      };
    }
  }

  formulateQueryText() {
    const { all, exact, any, none, must, variants, variantInput, proximity } = this.state;

    const allQ = all && all.join(' ');
    const exactQ = exact && exact.map(e => `"${e}"`).join(' ');
    const noneQ = none && none.map(n => `-${n}`).join(' ');
    const mustQ = must && must.map(m => `+${m}`).join(' ');
    const variantQ = [...variants, variantInput].map(v => v?.term && v.distance && `${v.term}~${v.distance}`).join(' ');
    const proximityQ = proximity && proximity.term1 && proximity.term2 && proximity.distance
      && `"${proximity.term1} ${proximity.term2}"~${proximity.distance}`;

    return [allQ, exactQ, noneQ, variantQ, proximityQ].join(' ').trim();
  }

  updateQuery(e, isClear) {
    e.preventDefault();
    e.stopPropagation();

    const { history, query, location } = this.props;
    const queryText = isClear ? '' : this.formulateQueryText();

    history.push({
      pathname: '/search',
      search: queryString.stringify({ q: queryText }),
    });
  }

  onChange = (field, subfield, values) => {
    console.log('changing', values)
    this.setState((state) => {
      if (subfield) {
        const fieldObj = state[field] || {};
        fieldObj[subfield] = values;
        return ({
          [field]: fieldObj
        });
      }
      return ({
        [field]: values
      });
    });
  }

  onSubmit = (e) => {
    this.updateQuery(e);
    // this.props.onToggle()
  }

  onClear = (e) => {
    this.updateQuery(e, true);
    this.setState({
      all: [],
      exact: [],
      none: [],
      must: [],
      variants: [],
      variantInput: null,
      proximity: null
    });
  }

  render() {
    const { intl, navbarRef, onToggle } = this.props;
    const { variants } = this.state;

    return (
      <div className="AdvancedSearch" ref={this.ref}>
        <Drawer
          isOpen={this.props.isOpen}
          position={Position.TOP}
          canOutsideClickClose
          icon="settings"
          title={intl.formatMessage(messages.title)}
          hasBackdrop={false}
          enforceFocus={false}
          usePortal
          portalContainer={this.ref.current}
          onClose={(e) => {
            // prevent interaction with Navbar from closing
            if (!navbarRef || !navbarRef.current || !navbarRef.current.contains(e.target)) {
              this.props.onToggle();
            }
          }}
        >
          <div className={Classes.DIALOG_BODY}>
            <form onSubmit={this.onSubmit}>
              {FIELDS.map(field => (
                <FormGroup
                  label={intl.formatMessage(messages[`${field}_label`])}
                  labelFor={field}
                  inline
                  fill
                  helperText={intl.formatMessage(messages[`${field}_helptext`])}
                >
                  <TagInput
                    id={field}
                    addOnBlur
                    fill
                    values={this.state[field]}
                    onChange={vals => this.onChange(field, null, vals)}
                  />
                </FormGroup>
              ))}
              <Divider />
              <AdvancedSearchVariants
                variants={variants}
                onChange={variantList => this.onChange('variants', null, variantList)}
              />
              <Divider />
              <FormGroup
                label={intl.formatMessage(messages.proximity_label)}
                labelFor="proximity"
                helperText={intl.formatMessage(messages.proximity_helptext)}
                class
              >
                <ControlGroup id="proximity" fill vertical={false}>
                  <FormGroup
                    helperText={intl.formatMessage(messages.proximity_term1)}
                  >
                    <InputGroup
                      value={this.state.proximity?.term1}
                      onChange={e => this.onChange("proximity", "term1", e.target.value)}
                    />
                  </FormGroup>
                  <FormGroup
                    helperText={intl.formatMessage(messages.proximity_distance)}
                    labelFor="proximity_slider"
                    className="padded"
                  >
                    <Slider
                      id="proximity_slider"
                      min={0}
                      max={10}
                      labelStepSize={2}
                      onChange={val => this.onChange("variant", "distance", val)}
                      value={+this.state.proximity?.distance || 0}
                    />
                  </FormGroup>
                  <FormGroup
                    helperText={intl.formatMessage(messages.proximity_term2)}
                  >
                    <InputGroup
                      inline
                      value={this.state.proximity?.term2}
                      onChange={e => this.onChange("proximity", "term2", e.target.value)}
                    />
                  </FormGroup>
                </ControlGroup>
              </FormGroup>
              <ButtonGroup>
                <Button
                  text={intl.formatMessage(messages.clear)}
                  onClick={this.onClear}
                />
                <Button
                  type="submit"
                  intent={Intent.PRIMARY}
                  text={intl.formatMessage(messages.submit)}
                />
              </ButtonGroup>
            </form>
          </div>
        </Drawer>
      </div>
    );
  }
}


const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps;
  const query = Query.fromLocation('entities', location, {}, '');

  return { query };
}

export default compose(
  withRouter,
  connect(mapStateToProps),
  injectIntl,
)(AdvancedSearch);
