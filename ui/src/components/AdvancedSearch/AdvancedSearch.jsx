import React from 'react';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import queryString from 'query-string';
import { Button, Drawer, FormGroup, InputGroup, Intent, Position } from '@blueprintjs/core';

import Query from 'app/Query';

import './AdvancedSearch.scss';

const messages = defineMessages({
  all_label: {
    id: 'search.advanced.all.label',
    defaultMessage: 'All these words',
  },
  all_helptext: {
    id: 'search.advanced.all.helptext',
    defaultMessage: 'Help text',
  },
  exact_label: {
    id: 'search.advanced.exact.label',
    defaultMessage: 'This exact word/phrase',
  },
  exact_helptext: {
    id: 'search.advanced.exact.helptext',
    defaultMessage: 'Help text',
  },
  any_label: {
    id: 'search.advanced.any.label',
    defaultMessage: 'Any of these words',
  },
  any_helptext: {
    id: 'search.advanced.any.helptext',
    defaultMessage: 'Help text',
  },
  none_label: {
    id: 'search.advanced.none.label',
    defaultMessage: 'None of these words',
  },
  none_helptext: {
    id: 'search.advanced.none.helptext',
    defaultMessage: 'Help text',
  },
  submit: {
    id: 'search.advanced.submit',
    defaultMessage: 'Search',
  }
});

/* eslint-disable jsx-quotes */
class AdvancedSearch extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      all: null,
      exact: null,
      any: null,
      none: null,
    };
    this.ref = React.createRef();
    this.updateQuery = this.updateQuery.bind(this);
  }

  static getDerivedStateFromProps(nextProps) {
    const { query } = nextProps;
    const queryText = query.getString('q');
    // remove anything matching __ OR __

    const results = queryString.parse(queryText);

    console.log('results', results)

    return {};
  }

  formulateQueryText() {
    const { all, exact, any, none } = this.state;
    const exactQ = exact && `"${exact}"`;
    const anyQ = any && any.split(' ').join(' OR ');
    const noneQ = none && none.split(' ').map(w => `-${w}`).join(' ');
    return [all, exactQ, anyQ, noneQ].join(' ').trim();
  }

  updateQuery(e) {
    e.preventDefault();
    e.stopPropagation();

    const { history, query, location } = this.props;

    console.log('query is', query);
    console.log('state is', this.state);
    const queryText = this.formulateQueryText();
    console.log('queryText is', queryText);
    // .set('q', queryText)

    history.push({
      pathname: '/search',
      search: queryString.stringify({ q: queryText }),
    });
  }

  onChange = (field, value) => {
    this.setState({
      [field]: value
    });
  }

  render() {
    const { intl, navbarRef } = this.props;

    const fields = Object.keys(this.state);

    return (
      <div className="AdvancedSearch" ref={this.ref}>
        <Drawer
          isOpen={this.props.isOpen}
          position={Position.TOP}
          canOutsideClickClose
          usePortal
          hasBackdrop={false}
          enforceFocus={false}
          portalContainer={this.ref.current}
          onClose={(e) => {
            // prevent interaction with Navbar from closing
            if (!navbarRef || !navbarRef.current || !navbarRef.current.contains(e.target)) {
              this.props.onToggle();
            }
          }}
        >
          <form onSubmit={this.updateQuery}>
            {fields.map(field => (
              <FormGroup
                label={intl.formatMessage(messages[`${field}_label`])}
                labelFor={field}
                helperText={intl.formatMessage(messages[`${field}_helptext`])}
              >
                <InputGroup
                  id={field}
                  type="text"
                  inline
                  value={this.state[field]}
                  onChange={e => this.onChange(field, e.target.value)}
                />
              </FormGroup>
            ))}
            <Button
              type="submit"
              intent={Intent.PRIMARY}
              text={intl.formatMessage(messages.submit)}
            />
          </form>
        </Drawer>
      </div>
    );
  }
}

// <div className="AdvancedSearch__content">
//   <div className="AdvancedSearch__section">
//     <h5 className="AdvancedSearch__section__title">
//       <FormattedMessage
//         id="searchTips.exact.title"
//         defaultMessage="Exact matches"
//       />
//     </h5>
//     <ul className="AdvancedSearch__section__content">
//       <li className="AdvancedSearch__section__item">
//         <FormattedMessage
//           id="searchTips.exact.1"
//           defaultMessage='Use <em>""</em> to return only exact matches.  For example, the search <em>"barack obama"</em> will return only results containing the exact phrase "barack obama"'
//           values={{
//             em: (...chunks) => <em>{chunks}</em>,
//           }}
//         />
//       </li>
//     </ul>
//   </div>
//   <div className="AdvancedSearch__section">
//     <h5 className="AdvancedSearch__section__title">
//       <FormattedMessage
//         id="searchTips.spelling.title"
//         defaultMessage="Spelling variants"
//       />
//     </h5>
//     <ul className="AdvancedSearch__section__content">
//       <li className="AdvancedSearch__section__item">
//         <FormattedMessage
//           id="searchTips.spelling.1"
//           defaultMessage='Use <em>~</em> to increase the fuzziness of a search.  For example, <em>Wladimir~2</em> will return not just the term “Wladimir” but also similar spellings such as "Wladimyr" or "Vladimyr". A spelling variant is defined by the number of spelling mistakes that must be made to get from the original word to the variant.'
//           values={{
//             em: (...chunks) => <em>{chunks}</em>,
//           }}
//         />
//       </li>
//     </ul>
//   </div>
//   <div className="AdvancedSearch__section">
//     <h5 className="AdvancedSearch__section__title">
//       <FormattedMessage
//         id="searchTips.composite.title"
//         defaultMessage="Composite queries"
//       />
//     </h5>
//     <ul className="AdvancedSearch__section__content">
//       <li className="AdvancedSearch__section__item">
//         <FormattedMessage
//           id="searchTips.composite.1"
//           defaultMessage='The search <em>banana ice cream</em> prioritizes results that contain all three terms: banana, ice, and cream.  Results with one or more of the given terms will follow'
//           values={{
//             em: (...chunks) => <em>{chunks}</em>,
//           }}
//         />
//       </li>
//       <li className="AdvancedSearch__section__item">
//         <FormattedMessage
//           id="searchTips.composite.2"
//           defaultMessage='<em>+banana ice cream</em> requires that only results with the term banana will be returned, while ice and cream are optional'
//           values={{
//             em: (...chunks) => <em>{chunks}</em>,
//           }}
//         />
//       </li>
//       <li className="AdvancedSearch__section__item">
//         <FormattedMessage
//           id="searchTips.composite.3"
//           defaultMessage='<em>-banana ice cream</em> ensures that no results with the term banana will be returned'
//           values={{
//             em: (...chunks) => <em>{chunks}</em>,
//           }}
//         />
//       </li>
//       <li className="AdvancedSearch__section__item">
//         <FormattedMessage
//           id="searchTips.composite.4"
//           defaultMessage='<em>banana AND “ice cream”</em> requires that only results with both banana and ice cream are returned'
//           values={{
//             em: (...chunks) => <em>{chunks}</em>,
//           }}
//         />
//       </li>
//       <li className="AdvancedSearch__section__item">
//         <FormattedMessage
//           id="searchTips.composite.5"
//           defaultMessage='<em>banana OR “ice cream”</em> ensures that only results with either banana or ice cream are returned'
//           values={{
//             em: (...chunks) => <em>{chunks}</em>,
//           }}
//         />
//       </li>
//       <li className="AdvancedSearch__section__item">
//         <FormattedMessage
//           id="searchTips.composite.6"
//           defaultMessage='These operations can be combined as you like.  For example <em>banana AND (“ice cream” OR “gelato”) -chocolate</em> will return results where banana appears with ice cream or gelato in the document but where chocolate is not present'
//           values={{
//             em: (...chunks) => <em>{chunks}</em>,
//           }}
//         />
//       </li>
//     </ul>
//   </div>
//   <div className="AdvancedSearch__section">
//     <h5 className="AdvancedSearch__section__title">
//       <FormattedMessage
//         id="searchTips.proximity.title"
//         defaultMessage="Proximity searches"
//       />
//     </h5>
//     <ul className="AdvancedSearch__section__content">
//       <li className="AdvancedSearch__section__item">
//         <FormattedMessage
//           id="searchTips.proximity.1"
//           defaultMessage='To search for two terms within a certain distance of each other, use double quotes <em>""</em> around the two words and the tilde <em>~</em> symbol at the end of the phrase.  For example <em>“Bank America”~2</em> will find relevant matches with the terms "Bank" and "America" occurring within two words from each other, such as "Bank of America", "Bank in America", even "America has a Bank".'
//           values={{
//             em: (...chunks) => <em>{chunks}</em>,
//           }}
//         />
//       </li>
//     </ul>
//   </div>
// </div>

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
