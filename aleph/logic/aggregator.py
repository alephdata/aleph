# SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
# SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
#
# SPDX-License-Identifier: MIT

import logging
from ftmstore import get_dataset

log = logging.getLogger(__name__)
MODEL_ORIGIN = "model"


def get_aggregator_name(collection):
    return "collection_%s" % collection.id


def get_aggregator(collection, origin="aleph"):
    """Connect to a followthemoney dataset."""
    dataset = get_aggregator_name(collection)
    return get_dataset(dataset, origin=origin)
