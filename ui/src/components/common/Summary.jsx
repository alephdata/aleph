import React from 'react';
import ReactMarkdown from 'react-markdown';
import Truncate from 'react-truncate';
import c from 'classnames';

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
      className={c(className, 'bp3-running-text bp3-text-muted text-markdown')}
    >
      {truncate && <Truncate lines={truncate}>{content}</Truncate>}
      {!truncate && content}
    </div>
  );
};

export default Summary;
