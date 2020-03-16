import logging
from flask import Blueprint, request

from aleph.index.reports import get_collection_processing_report, get_document_processing_report, delete_job_report
from aleph.search import ProcessingReportQuery, SearchQueryParser
from aleph.views.context import tag_request
from aleph.views.serializers import (
    CollectionProcessingReportSerializer,
    DocumentProcessingReportSerializer,
    ProcessingReportSerializer
)
from aleph.views.util import get_index_entity, get_index_collection

log = logging.getLogger(__name__)
blueprint = Blueprint('reports_api', __name__)


@blueprint.route('/api/2/reports', methods=['GET'])
def reports():
    # TODO docstring
    # this is the reports query endpoint
    """
    ---
    get:
      summary: Get an overview report for each collection being processed
      description: >
        List collections being processed currently and their reports
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SystemStatusResponse'
      tags:
      - System
    """
    parser = SearchQueryParser(request.args, request.authz)
    tag_request(query=parser.text, prefix=parser.prefix)
    result = ProcessingReportQuery.handle(request, parser=parser)
    return ProcessingReportSerializer.jsonify_result(result)


@blueprint.route('/api/2/reports/<int:collection_id>', methods=['GET'])
def collection_report(collection_id):
    """
    ---
    get:
      summary: Get a collections processing report
      description: Return the collection report with id `collection_id`
      parameters:
      - description: The collection ID.
        in: path
        name: collection_id
        required: true
        schema:
          minimum: 1
          type: integer
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Collection'
      tags:
      - Collection
      - Report
    """
    collection = get_index_collection(collection_id)
    data = get_collection_processing_report(collection['id'])
    return CollectionProcessingReportSerializer.jsonify(data)


@blueprint.route('/api/2/reports/document/<document_id>', methods=['GET'])
def document_report(document_id):
    """
    ---
    get:
      summary: Get a documents processing report
      description: Return the document processing report with id `document_id`
      parameters:
      - description: The document ID.
        in: path
        name: document_id
        required: true
        schema:
          type: string
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Document'
      tags:
      - Document
      - Report
    """
    document = get_index_entity(document_id)
    data = get_document_processing_report(document)
    return DocumentProcessingReportSerializer.jsonify(data)


@blueprint.route('/api/2/reports/delete/<job_id>', methods=['DELETE'])
def delete(job_id):
    # TODO doc
    """
    ---
    get:
      summary: Get a documents processing report
      description: Return the document processing report with id `document_id`
      parameters:
      - description: The document ID.
        in: path
        name: document_id
        required: true
        schema:
          type: string
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Document'
      tags:
      - Document
      - Report
    """
    delete_job_report(job_id, sync=True)
    return ('', 204)
