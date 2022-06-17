# SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
# SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
#
# SPDX-License-Identifier: MIT

apt-get -q -y update
apt-get install -q -y software-properties-common
apt-add-repository -y ppa:trevorjay/pyflame
apt-get -q -y update
apt-get install -q -y pyflame
# apt-add-repository ppa:trevorjay/pyflame
# apt-get install -q -y autoconf automake autotools-dev g++ pkg-config python-dev python3-dev libtool make
# cd /opt
# git clone https://github.com/uber/pyflame.git
# cd pyflame
# ./autogen.sh
# ./configure
# make
# # make check       # Optional, test the build! Should take < 1 minute.
# make install 

# https://pyflame.readthedocs.io/en/latest/faq.html
# checkout: https://github.com/brendangregg/FlameGraph 
# pyflame -s 200 -o /host/Users/fl/Code/FlameGraph/aleph -p 2365