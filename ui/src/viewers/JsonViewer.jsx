import { useEffect, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { NonIdealState, Spinner, Icon } from '@blueprintjs/core';
import { useIntl } from 'react-intl';
import queryString from 'query-string';
import classNames from 'classnames';

import axios from 'axios';
import './JsonViewer.scss';

// Helper function to get highlighted parts of a string
const getHighlightedParts = (text, searchTerms) => {
  if (!searchTerms || searchTerms.length === 0 || typeof text !== 'string') {
    return [text]; // Always return an array
  }
  const regex = new RegExp(`(${searchTerms.join('|')})`, 'gi');
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    parts.push(<mark key={lastIndex}>{match[0]}</mark>);
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  return parts.length > 0 ? parts : [text];
};

// Recursive rendering function for JSON nodes
const RenderJsonNode = ({ node, level = 0, searchTerms, isLastInObject }) => {
  const [isOpen, setIsOpen] = useState(level < 2); // Initially open up to level 2

  const toggleOpen = () => setIsOpen(!isOpen);

  if (typeof node === 'string') {
    return <span className="json-string">"{getHighlightedParts(node, searchTerms)}"</span>;
  }
  if (typeof node === 'number') {
    return <span className="json-number">{node}</span>;
  }
  if (typeof node === 'boolean') {
    return <span className="json-boolean">{String(node)}</span>;
  }
  if (node === null) {
    return <span className="json-null">null</span>;
  }

  const padding = `json-level-${level}`;

  if (Array.isArray(node)) {
    const isEmpty = node.length === 0;
    return (
      <span className={classNames('json-array', padding)}>
        <span className="json-bracket" onClick={!isEmpty ? toggleOpen : undefined} style={{ cursor: isEmpty ? 'default': 'pointer' }}>
          {isOpen || isEmpty ? '[' : `[...${node.length} items...]`}
          {!isEmpty && <Icon icon={isOpen ? 'chevron-down' : 'chevron-right'} size={12} style={{ marginLeft: '5px' }} />}
        </span>
        {isOpen && !isEmpty && (
          <>
            {node.map((item, index) => (
              <div key={index} className={classNames('json-array-item', `json-level-${level + 1}`)}>
                <RenderJsonNode node={item} level={level + 1} searchTerms={searchTerms} isLastInObject={index === node.length -1} />
                {index < node.length - 1 && <span className="json-comma">,</span>}
              </div>
            ))}
          </>
        )}
        <span className="json-bracket">{isOpen || isEmpty ? ']' : ''}</span>
      </span>
    );
  }

  if (typeof node === 'object' && node !== null) {
    const keys = Object.keys(node);
    const isEmpty = keys.length === 0;
    return (
      <span className={classNames('json-object', padding)}>
        <span className="json-brace" onClick={!isEmpty ? toggleOpen : undefined} style={{ cursor: isEmpty ? 'default': 'pointer' }}>
          {isOpen || isEmpty ? '{' : `{...${keys.length} props...}`}
          {!isEmpty && <Icon icon={isOpen ? 'chevron-down' : 'chevron-right'} size={12} style={{ marginLeft: '5px' }} />}
        </span>
        {isOpen && !isEmpty && (
          <>
            {keys.map((key, index) => (
              <div key={key} className={classNames('json-key-value-pair', `json-level-${level + 1}`)}>
                <span className="json-key">"{key}":</span>
                <RenderJsonNode node={node[key]} level={level + 1} searchTerms={searchTerms} isLastInObject={index === keys.length - 1} />
                {index < keys.length - 1 && <span className="json-comma">,</span>}
              </div>
            ))}
          </>
        )}
        <span className="json-brace">{isOpen || isEmpty ? '}' : ''}</span>
      </span>
    );
  }
  return null; // Should not happen for valid JSON
};

RenderJsonNode.propTypes = {
  node: PropTypes.any,
  level: PropTypes.number,
  searchTerms: PropTypes.arrayOf(PropTypes.string),
  isLastInObject: PropTypes.bool, // To help with trailing commas if needed, though CSS handles it now.
};


const JsonViewer = ({ document, query: queryProp }) => {
  const [jsonData, setJsonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intl = useIntl();

  const searchTerms = useMemo(() => {
    if (queryProp) {
      const parsedQuery = queryString.parse(queryProp);
      if (parsedQuery && parsedQuery.q && typeof parsedQuery.q === 'string') {
        // Ensure terms are not empty and are lowercased for case-insensitive search
        return parsedQuery.q.toLowerCase().split(' ').filter(term => term.length > 0);
      }
    }
    return [];
  }, [queryProp]);

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      setError(null);

      const currentFileSize = Number(document?.getProperty('fileSize')?.[0] ?? 0)

      if (currentFileSize > 2500000) {
        setError(intl.formatMessage({
          id: 'jsonViewer.fileSizeLimit',
          defaultMessage: 'JSON Viewer not available: File size limit exceeded.',
        }));
        setLoading(false);
      }
      if (document && document.links && document.links.file) {
        try {
          const response = await axios.get(document.links.file, {
            responseType: 'text',
            transformResponse: [(data) => data],
          });
          const content = response.data;
          try {
            const parsedData = JSON.parse(content);
            setJsonData(parsedData);
          } catch (e) {
            setError(intl.formatMessage({
              id: 'jsonViewer.parseError',
              defaultMessage: 'Error parsing JSON content.',
            }));
          }
        } catch (e) {
          setError(intl.formatMessage({
            id: 'jsonViewer.fetchError',
            defaultMessage: 'Error fetching document content.',
          }));
        }
      } else if (document && document.content) {
        try {
          const parsedData = JSON.parse(document.content);
          setJsonData(parsedData);
        } catch (e) {
          setError(intl.formatMessage({
            id: 'jsonViewer.parseError',
            defaultMessage: 'Error parsing JSON content.',
          }));
        }
      } else {
        setError(intl.formatMessage({
          id: 'jsonViewer.noContent',
          defaultMessage: 'Document content or file link is not available.',
        }));
      }
      setLoading(false);
    };

    fetchContent();
  }, [document, intl]);

  // Note: The getHighlightedJson and getHighlightedParts from previous step are not directly used.
  // Highlighting is now integrated within RenderJsonNode's string rendering.

  if (loading) {
    return (
      <div className="json-viewer-loading">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <NonIdealState
        icon="error"
        title={intl.formatMessage({
          id: 'jsonViewer.errorTitle',
          defaultMessage: 'Error',
        })}
        description={error}
      />
    );
  }

  if (!jsonData) {
    return (
      <NonIdealState
        icon="document"
        title={intl.formatMessage({
          id: 'jsonViewer.noDataTitle',
          defaultMessage: 'No JSON Data',
        })}
        description={intl.formatMessage({
          id: 'jsonViewer.noDataDescription',
          defaultMessage: 'The document does not contain valid JSON data or could not be loaded.',
        })}
      />
    );
  }

  return (
    <div className="json-viewer">
      <pre> {/* Using <pre> for overall monospace font and pre-like layout */}
        <RenderJsonNode node={jsonData} searchTerms={searchTerms} />
      </pre>
    </div>
  );
};

JsonViewer.propTypes = {
  document: PropTypes.shape({
    content: PropTypes.string,
    links: PropTypes.shape({
      file: PropTypes.string,
    }),
  }),
  query: PropTypes.string,
};

JsonViewer.defaultProps = {
  document: null,
  query: '',
};

export default JsonViewer;