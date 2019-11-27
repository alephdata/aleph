import {
  defineMessages,
} from 'react-intl';

const messages = defineMessages({
  facet_schema: {
    id: 'facet.schema',
    defaultMessage: 'Types',
  },
  facet_collection_id: {
    id: 'facet.collection_id',
    defaultMessage: 'Datasets',
  },
  facet_languages: {
    id: 'facet.languages',
    defaultMessage: 'Languages',
  },
  facet_emails: {
    id: 'facet.emails',
    defaultMessage: 'E-Mails',
  },
  facet_phones: {
    id: 'facet.phones',
    defaultMessage: 'Phones',
  },
  facet_countries: {
    id: 'facet.countries',
    defaultMessage: 'Countries',
  },
  facet_names: {
    id: 'facet.names',
    defaultMessage: 'Names',
  },
  facet_addresses: {
    id: 'facet.addresses',
    defaultMessage: 'Addresses',
  },
  facet_mime_type: {
    id: 'facet.mimetypes',
    defaultMessage: 'File types',
  },
  facet_category: {
    id: 'facet.category',
    defaultMessage: 'Categories',
  },
});

const propLabels = {
  addresses: {
    field: 'addresses',
    label: messages.facet_addresses,
    icon: 'map',
  },
  category: {
    field: 'category',
    label: messages.facet_category,
    icon: 'list',
  },
  collection_id: {
    field: 'collection_id',
    label: messages.facet_collection_id,
    icon: 'database',
  },
  countries: {
    field: 'countries',
    label: messages.facet_countries,
    icon: 'globe',
    defaultSize: 300,
  },
  emails: {
    field: 'emails',
    label: messages.facet_emails,
    icon: 'envelope',
  },
  languages: {
    field: 'languages',
    label: messages.facet_languages,
    icon: 'translate',
  },
  mimetypes: {
    field: 'mimetypes',
    label: messages.facet_mime_type,
    icon: 'document',
  },
  names: {
    field: 'names',
    label: messages.facet_names,
    icon: 'id-number',
  },
  phones: {
    field: 'phones',
    label: messages.facet_phones,
    icon: 'phone',
  },
  schema: {
    field: 'schema',
    label: messages.facet_schema,
    icon: 'list-columns',
  },
};

const getFacetLabel = (key) => (
  propLabels[key]
);

export default getFacetLabel;
