import logging
from pprint import pprint, pformat  # noqa
from followthemoney.types import registry
from banal import ensure_list

from aleph.core import es
from aleph.index.util import (
    NUMERIC_TYPES,
    authz_query,
    field_filter_query,
    DATE_FORMAT,
    range_filter_query,
    query_string_query,
    filter_text,
)
from aleph.search.result import SearchQueryResult
from aleph.search.parser import SearchQueryParser
from aleph.index.entities import get_field_type

log = logging.getLogger(__name__)


def convert_filters(filters):
    ret = []
    for field, values in filters.items():
        ret.append(field_filter_query(field, values))
    return ret


class Query(object):
    INCLUDE_FIELDS = None
    EXCLUDE_FIELDS = None
    TEXT_FIELDS = ["text"]
    PREFIX_FIELD = "name"
    SKIP_FILTERS = []
    AUTHZ_FIELD = "collection_id"
    SORT_FIELDS = {
        "label": "label.kw",
        "score": "_score",
    }
    SORT_DEFAULT = ["_score"]

    def __init__(self, parser):
        self.parser = parser

    def get_text_query(self):
        query = []
        if self.parser.text:
            qs = query_string_query(self.TEXT_FIELDS, self.parser.text)
            query.append(qs)
        if self.parser.prefix:
            query.append(
                {"match_phrase_prefix": {self.PREFIX_FIELD: self.parser.prefix}}
            )
        if not len(query):
            query.append({"match_all": {}})
        return query

    def get_filters(self, include_authz=True):
        """Apply query filters from the user interface."""
        filters = []
        if include_authz and self.AUTHZ_FIELD is not None:
            # This enforces the authorization (access control) rules on
            # a particular query by comparing the collections a user is
            # authorized for with the one on the document.
            if self.parser.authz and not self.parser.authz.is_admin:
                authz = authz_query(self.parser.authz, field=self.AUTHZ_FIELD)
                filters.append(authz)

        range_filters = dict()
        for field, values in self.parser.filters.items():
            if field in self.SKIP_FILTERS:
                continue
            if field not in self.parser.facet_names:
                # Collect all range query filters for a field in a single query
                if field.startswith(("gt:", "gte:", "lt:", "lte:")):
                    op, field = field.split(":", 1)
                    if range_filters.get(field) is None:
                        range_filters[field] = {op: list(values)[0]}
                    else:
                        range_filters[field][op] = list(values)[0]
                    continue
                filters.append(field_filter_query(field, values))

        for field, ops in range_filters.items():
            filters.append(range_filter_query(field, ops))

        return filters

    def get_post_filters(self, exclude=None):
        """Apply post-aggregation query filters."""
        filters = []
        for field, values in self.parser.filters.items():
            if field in self.SKIP_FILTERS or field == exclude:
                continue
            if field in self.parser.facet_filters:
                filters.append(field_filter_query(field, values))
        return {"bool": {"filter": filters}}

    def get_negative_filters(self):
        """Apply negative filters."""
        filters = []
        for field, _ in self.parser.empties.items():
            filters.append({"exists": {"field": field}})

        for field, values in self.parser.excludes.items():
            filters.append(field_filter_query(field, values))
        return filters

    def get_query(self):
        return {
            "bool": {
                "should": self.get_text_query(),
                "must": [],
                "must_not": self.get_negative_filters(),
                "filter": self.get_filters(),
                "minimum_should_match": 1,
            }
        }

    def get_full_query(self):
        """Return a version of the query with post-filters included."""
        query = self.get_query()
        post_filters = self.get_post_filters()["bool"]["filter"]
        query["bool"]["filter"].extend(post_filters)
        return query

    def get_aggregations(self):
        """Aggregate the query in order to generate faceted results."""
        aggregations = {}
        for facet_name in self.parser.facet_names:
            facet_aggregations = {}
            if self.parser.get_facet_values(facet_name):
                agg_name = "%s.values" % facet_name
                facet_aggregations[agg_name] = {
                    "terms": {
                        "field": facet_name,
                        "size": self.parser.get_facet_size(facet_name),
                    }
                }

            if self.parser.get_facet_total(facet_name):
                # Option to return total distinct value counts for
                # a given facet, instead of the top buckets.
                agg_name = "%s.cardinality" % facet_name
                facet_aggregations[agg_name] = {"cardinality": {"field": facet_name}}

            interval = self.parser.get_facet_interval(facet_name)
            if interval is not None:
                agg_name = "%s.intervals" % facet_name
                facet_aggregations[agg_name] = {
                    "date_histogram": {
                        "field": facet_name,
                        "calendar_interval": interval,
                        "format": DATE_FORMAT,
                        "min_doc_count": 0,
                    }
                }
                # Make sure we return empty buckets in the whole filter range
                filters = self.parser.filters
                min_val = filters.get("gte:%s" % facet_name) or filters.get(
                    "gt:%s" % facet_name
                )  # noqa
                max_val = filters.get("lte:%s" % facet_name) or filters.get(
                    "lt:%s" % facet_name
                )  # noqa
                if min_val or max_val:
                    extended_bounds = {}
                    if min_val:
                        extended_bounds["min"] = ensure_list(min_val)[0]
                    if max_val:
                        extended_bounds["max"] = ensure_list(max_val)[0]
                    facet_aggregations[agg_name]["date_histogram"][
                        "extended_bounds"
                    ] = extended_bounds  # noqa

            if not len(facet_aggregations):
                break

            # See here for an explanation of the whole post_filters and
            # aggregation filters thing:
            # https://www.elastic.co/guide/en/elasticsearch/reference/6.2/search-request-post-filter.html  # noqa
            other_filters = self.get_post_filters(exclude=facet_name)
            if len(other_filters["bool"]["filter"]):
                agg_name = "%s.filtered" % facet_name
                aggregations[agg_name] = {
                    "filter": other_filters,
                    "aggregations": facet_aggregations,
                }
            else:
                aggregations.update(facet_aggregations)

        return aggregations

    def get_sort(self):
        """Pick one of a set of named result orderings."""
        if not len(self.parser.sorts):
            return self.SORT_DEFAULT

        sort_fields = ["_score"]
        for (field, direction) in self.parser.sorts:
            field = self.SORT_FIELDS.get(field, field)
            type_ = get_field_type(field)
            config = {"order": direction, "missing": "_last"}
            if field == registry.date.group:
                field = "numeric.dates"
                config["mode"] = "min"
            if type_ in NUMERIC_TYPES:
                field = field.replace("properties.", "numeric.")
            sort_fields.append({field: config})
        return list(reversed(sort_fields))

    def get_highlight(self):
        if not self.parser.highlight:
            return {}
        return {
            "encoder": "html",
            "fields": {
                "text": {
                    "type": "fvh",
                    "number_of_fragments": self.parser.highlight_count,
                    "fragment_size": self.parser.highlight_length,
                }
            },
        }

    def get_source(self):
        source = {}
        if self.INCLUDE_FIELDS:
            source["includes"] = self.INCLUDE_FIELDS
        elif self.EXCLUDE_FIELDS:
            source["excludes"] = self.EXCLUDE_FIELDS
        return source

    def get_body(self):
        body = {
            "query": self.get_query(),
            "post_filter": self.get_post_filters(),
            "from": self.parser.offset,
            "size": self.parser.limit,
            "aggregations": self.get_aggregations(),
            "sort": self.get_sort(),
            "highlight": self.get_highlight(),
            "_source": self.get_source(),
        }
        # log.info("Query: %s", pformat(body))
        return body

    def get_index(self):
        raise NotImplementedError

    def to_text(self, empty="*:*"):
        """Generate a string representation of the query."""
        parts = []
        if self.parser.text:
            parts.append(self.parser.text)
        elif self.parser.prefix:
            query = "%s:%s*" % (self.PREFIX_FIELD, self.parser.prefix)
            parts.append(query)
        else:
            parts.append(empty)

        filters = self.get_filters(include_authz=False)
        filters.extend(self.get_post_filters()["bool"]["filter"])
        for filter_ in filters:
            parts.append(filter_text(filter_))

        for filter_ in self.get_negative_filters():
            parts.append(filter_text(filter_, invert=True))

        if len(parts) > 1 and empty in parts:
            parts.remove(empty)
        return " ".join([p for p in parts if p is not None])

    def search(self):
        """Execute the query as assmbled."""
        # log.info("Search index: %s", self.get_index())
        result = es.search(index=self.get_index(), body=self.get_body())
        log.info("[%s] took: %sms", self.to_text(), result.get("took"))
        # log.info("%s", pformat(self.get_query()))
        return result

    @classmethod
    def handle(cls, request, parser=None, **kwargs):
        if parser is None:
            parser = SearchQueryParser(request.args, request.authz)
        query = cls(parser, **kwargs)
        return SearchQueryResult(request, query)
