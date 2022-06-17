// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import React from 'react';

import { Schema } from 'components/common';

import './MappingQueryLabel.scss';


const MappingQueryLabel = ({ query }) => {
  /* eslint-disable camelcase */
  const { csv_url, csv_urls, entities } = query;

  const displayUrl = csv_urls ? `${csv_urls[0]}, ...` : csv_url;

  return (
    <div className="MappingQueryLabel">
      <p className="MappingQueryLabel__url">{displayUrl}</p>
      <p className="MappingQueryLabel__entityList">
        {Object.entries(entities).map(([key, { schema }]) => (
          <span className="MappingQueryLabel__entity" key={key}>
            <Schema.Icon schema={schema} className="left-icon" />
            {key}
          </span>
        ))}
      </p>
    </div>
  );
};

export default MappingQueryLabel;
