import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Classes } from '@blueprintjs/core';
import c from 'classnames';

import './Summary.scss';

// formats markdown elements to plain text
const simpleRenderer = ({ children }) => (
  <>
    <span>{children}</span>
    <span> </span>
  </>
);

const Summary = ({ className, text, truncate }) => {
  const content = (
    <ReactMarkdown
      skipHtml
      linkTarget="_blank"
      renderers={
        truncate ? { paragraph: simpleRenderer, listItem: simpleRenderer } : {}
      }
    >
      {text}
    </ReactMarkdown>
  );

  return (
    <div
      className={c(
        'Summary',
        className,
        Classes.RUNNING_TEXT,
        Classes.TEXT_MUTED,
        'text-markdown'
      )}
    >
      {truncate && (
        <span
          className="Summary__truncate"
          style={{ '--truncate-lines': truncate }}
        >
          {content}
        </span>
      )}
      {!truncate && content}
    </div>
  );
};

export default Summary;
