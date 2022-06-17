// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import React from "react";
import { useHotkeys } from "@blueprintjs/core";

const HotkeysContainer = ({ children, hotkeys }) => {
  const { handleKeyDown, handleKeyUp } = useHotkeys(hotkeys);

  return (
    <div tabIndex={0} onKeyDown={handleKeyDown} onKeyUp={handleKeyUp}>
      {children}
    </div>
  );
}

export default HotkeysContainer;
