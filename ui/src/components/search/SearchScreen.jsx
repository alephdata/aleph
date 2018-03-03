import React from 'react';
import { defineMessages, injectIntl, FormattedMessage, FormattedNumber } from 'react-intl';

import Screen from 'src/components/common/Screen';
import DualPane from 'src/components/common/DualPane';

import SearchContext from './SearchContext';
import SearchResult from './SearchResult';
import SearchFacets from './SearchFacets';
//import SearchFilter from './SearchFilter';

import './SearchScreen.css';


const messages = defineMessages({
  facet_schema: {
    id: 'search.facets.facet.schema',
    defaultMessage: 'Types',
  },
  facet_collection_id: {
    id: 'search.facets.facet.collection_id',
    defaultMessage: 'Collections',
  },
  facet_languages: {
    id: 'search.facets.facet.languages',
    defaultMessage: 'Languages',
  },
  facet_emails: {
    id: 'search.facets.facet.emails',
    defaultMessage: 'E-Mail Addresses',
  },
  facet_phones: {
    id: 'search.facets.facet.phones',
    defaultMessage: 'Phones',
  },
  facet_countries: {
    id: 'search.facets.facet.countries',
    defaultMessage: 'Countries',
  },
  facet_names: {
    id: 'search.facets.facet.names',
    defaultMessage: 'Names',
  },
  facet_addresses: {
    id: 'search.facets.facet.addresses',
    defaultMessage: 'Addresses',
  },
  facet_mime_type: {
    id: 'search.facets.facet.mime_type',
    defaultMessage: 'File types',
  },
  facet_author: {
    id: 'search.facets.facet.author',
    defaultMessage: 'Authors',
  },
});


class SearchScreen extends React.Component {
  constructor(props) {
    const { intl } = props;
    super(props)

    const facets = [
      {
        field: 'schema',
        label: intl.formatMessage(messages.facet_schema),
        icon: 'list',
        active: true
      },
      {
        field: 'collection_id',
        label: intl.formatMessage(messages.facet_collection_id),
        icon: 'database'
      },
      {
        field: 'countries',
        label: intl.formatMessage(messages.facet_countries),
        icon: 'database'
      },
      {
        field: 'languages',
        label: intl.formatMessage(messages.facet_languages),
        icon: 'globe'
      },
      {
        field: 'emails',
        label: intl.formatMessage(messages.facet_emails),
        icon: 'envelope'
      },
      {
        field: 'phones',
        label: intl.formatMessage(messages.facet_phones),
        icon: 'phone'
      },
      {
        field: 'names',
        label: intl.formatMessage(messages.facet_names),
        icon: 'id-number'
      },
      {
        field: 'addresses',
        label: intl.formatMessage(messages.facet_addresses),
        icon: 'map'
      },
      {
        field: 'mime_type',
        label: intl.formatMessage(messages.facet_mime_type),
        icon: 'document'
      },
      {
        field: 'author',
        label: intl.formatMessage(messages.facet_author),
        icon: 'person'
      }
    ];
    this.state = {facets: facets};
  }

  render() {
    return (
      <SearchContext>{searchContext => (
        <Screen searchContext={searchContext} title={searchContext.query.getString('q')}>
          <DualPane className="SearchScreen">
            <DualPane.InfoPane className="SearchFacetsPane">
              <SearchFacets {...searchContext} facets={this.state.facets} />
            </DualPane.InfoPane>
            <DualPane.ContentPane>
              {/*<SearchFilter {...searchContext} />*/}
              <SearchResult {...searchContext} />
            </DualPane.ContentPane>
          </DualPane>
        </Screen>
      )}</SearchContext>
    )
  }
}

export default injectIntl(SearchScreen);
