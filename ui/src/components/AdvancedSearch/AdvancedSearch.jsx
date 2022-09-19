import React from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import withRouter from 'app/withRouter';
import queryString from 'query-string';
import {
  Button,
  Classes,
  Drawer,
  FormGroup,
  Intent,
  Position,
  TagInput,
} from '@blueprintjs/core';

import {
  FIELDS,
  composeQueryText,
  parseQueryText,
} from 'components/AdvancedSearch/util';
import AdvancedSearchMultiField from 'components/AdvancedSearch/AdvancedSearchMultiField';
import Query from 'app/Query';

import './AdvancedSearch.scss';

const messages = defineMessages({
  title: {
    id: 'search.advanced.title',
    defaultMessage: 'Advanced Search',
  },
  all_label: {
    id: 'search.advanced.all.label',
    defaultMessage: 'All of these words (Default)',
  },
  all_helptext: {
    id: 'search.advanced.all.helptext',
    defaultMessage:
      'Only results containing all of the given terms will be returned',
  },
  any_label: {
    id: 'search.advanced.any.label',
    defaultMessage: 'Any of these words',
  },
  any_helptext: {
    id: 'search.advanced.any.helptext',
    defaultMessage:
      'Results containing any of the given terms will be returned',
  },
  exact_label: {
    id: 'search.advanced.exact.label',
    defaultMessage: 'This exact word/phrase',
  },
  exact_helptext: {
    id: 'search.advanced.exact.helptext',
    defaultMessage:
      'Only results with this exact word or phrase will be returned',
  },
  none_label: {
    id: 'search.advanced.none.label',
    defaultMessage: 'None of these words',
  },
  none_helptext: {
    id: 'search.advanced.none.helptext',
    defaultMessage: 'Exclude results with these words',
  },
  variants_label: {
    id: 'search.advanced.variants.label',
    defaultMessage: 'Spelling variations',
  },
  variants_helptext: {
    id: 'search.advanced.variants.helptext',
    defaultMessage:
      'Increase the fuzziness of a search.  For example, Wladimir~2 will return not just the term “Wladimir” but also similar spellings such as "Wladimyr" or "Vladimyr". A spelling variant is defined by the number of spelling mistakes that must be made to get from the original word to the variant.',
  },
  proximity_label: {
    id: 'search.advanced.proximity.label',
    defaultMessage: 'Terms in proximity to each other',
  },
  proximity_helptext: {
    id: 'search.advanced.proximity.helptext',
    defaultMessage:
      'Search for two terms within a certain distance of each other. For example, return results with the terms "Bank" and "America" occurring within two words from each other, such as "Bank of America", "Bank in America", even "America has a Bank".',
  },
  submit: {
    id: 'search.advanced.submit',
    defaultMessage: 'Search',
  },
  clear: {
    id: 'search.advanced.clear',
    defaultMessage: 'Clear all',
  },
});

/* eslint-disable jsx-quotes */
class AdvancedSearch extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      all: [],
      any: [],
      exact: [],
      none: [],
      variants: [],
      proximity: [],
    };

    this.ref = React.createRef();
    this.updateQuery = this.updateQuery.bind(this);
    this.renderField = this.renderField.bind(this);
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const nextQueryText = nextProps.query
      ? nextProps.query.getString('q')
      : prevState.queryText;
    const queryChanged = !prevState || prevState.queryText !== nextQueryText;

    if (queryChanged) {
      const { query } = nextProps;
      const queryText = query.getString('q');
      const parsed = parseQueryText(queryText);

      return {
        queryText: nextQueryText,
        ...parsed,
      };
    }
    return prevState;
  }

  updateQuery(e, isClear) {
    e.preventDefault();
    e.stopPropagation();

    const { navigate } = this.props;
    const queryText = isClear ? '' : composeQueryText(this.state);

    navigate({
      pathname: '/search',
      search: queryString.stringify({ q: queryText }),
    });
  }

  onChange = (field, values) => {
    this.setState({
      [field]: values,
    });
  };

  onClear = (e) => {
    this.updateQuery(e, true);
    this.setState({
      all: [],
      any: [],
      exact: [],
      none: [],
      variants: [],
      proximity: [],
    });
  };

  renderField({ key }) {
    const { intl } = this.props;
    const values = this.state[key];

    if (key === 'proximity' || key === 'variants') {
      return (
        <AdvancedSearchMultiField
          values={values}
          label={intl.formatMessage(messages[`${key}_label`])}
          helperText={intl.formatMessage(messages[`${key}_helptext`])}
          onChange={(vals) => this.onChange(key, vals)}
          field={key}
          key={key}
        />
      );
    }

    return this.renderSimpleField(key, values);
  }

  renderSimpleField(field, values) {
    const { intl } = this.props;
    return (
      <FormGroup
        key={field}
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
          values={values}
          separator={field !== 'exact' && ' '}
          onChange={(vals) => this.onChange(field, vals)}
          tagProps={{ minimal: true }}
        />
      </FormGroup>
    );
  }

  renderTitle = () => {
    const { intl } = this.props;
    return (
      <span className="AdvancedSearch__header">
        <span>{intl.formatMessage(messages.title)}</span>
        <span>
          <Button
            text={
              <span className={Classes.TEXT_MUTED}>
                {intl.formatMessage(messages.clear)}
              </span>
            }
            onClick={this.onClear}
            minimal
          />
          <Button
            type="submit"
            icon="search"
            intent={Intent.PRIMARY}
            text={intl.formatMessage(messages.submit)}
            onClick={this.updateQuery}
          />
          <Button
            className="AdvancedSearch__header__close"
            minimal
            icon="chevron-up"
            onClick={this.props.onToggle}
          />
        </span>
      </span>
    );
  };

  render() {
    const { isOpen, navbarRef } = this.props;

    return (
      <div className="AdvancedSearch" ref={this.ref}>
        <Drawer
          isOpen={isOpen}
          position={Position.TOP}
          canOutsideClickClose
          icon="settings"
          title={this.renderTitle()}
          isCloseButtonShown={false}
          hasBackdrop={false}
          enforceFocus={false}
          usePortal
          portalContainer={this.ref.current}
          onClose={(e) => {
            // prevent interaction with Navbar from closing
            if (
              !navbarRef ||
              !navbarRef.current ||
              !navbarRef.current.contains(e.target)
            ) {
              this.props.onToggle();
            }
          }}
        >
          <div className={Classes.DIALOG_BODY}>
            <form onSubmit={this.updateQuery}>
              {FIELDS.map(this.renderField)}
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
};

export default compose(
  withRouter,
  connect(mapStateToProps),
  injectIntl
)(AdvancedSearch);
