import requests
import logging
import math
import json
from itertools import count
from urlparse import urljoin
from datetime import datetime

from aleph.crawlers.crawler import Crawler

log = logging.getLogger(__name__)
PAGE_SIZE = 50
BASE = 'http://instante.justice.md/apps/hotariri_judecata/inst/'
COURTS = ["cac/cac.php", "cab/cab.php", "cabe/cabe.php", "cach/cach.php",
          "caco/caco.php", "jan/jan.php", "jba/jba.php", "jbs/jbs.php",
          "jbe/jbe.php", "jb/jb.php", "jbr/jbr.php", "jbu/jbu.php",
          "jch/jch.php", "jcl/jcl.php", "jct/jct.php", "jca/jca.php",
          "jcg/jcg.php", "jcc/jcc.php", "jcm/jcm.php", "jci/jci.php",
          "jco/jco.php", "jcr/jcr.php", "jdn/jdn.php", "jdr/jdr.php",
          "je/je.php", "jed/jed.php", "jfa/jfa.php", "jfl/jfl.php",
          "jgl/jgl.php", "jhn/jhn.php", "jia/jia.php", "jlv/jlv.php",
          "jns/jns.php", "joc/joc.php", "jor/jor.php", "jrz/jrz.php",
          "jrz/jrz.php", "jrc/jrc.php", "jrsr/jrsr.php", "jsi/jsi.php",
          "jsd/jsd.php", "jsr/jsr.php", "jsv/jsv.php", "jst/jst.php",
          "jt/jt.php", "jtl/jtl.php", "jun/jun.php", "jvl/jvl.php",
          "jdb/jdb.php", "jcc/jcc.php", "jm/jm.php"]


class MoldovaCourts(Crawler):

    def crawl_court(self, source, meta, court):
        url = urljoin(BASE, court)
        url = urljoin(url, 'db_hot_grid.php')
        for i in count(1):
            q = {
                '_search': 'false',
                'nd': 1452590243771,
                'rows': PAGE_SIZE,
                'page': i,
                'sidx': 'id',
                'sord': 'asc'
            }
            res = requests.post(url, data=q)
            data = json.loads(res.content)
            pages = int(math.ceil(float(data['records']) / PAGE_SIZE))
            log.info('Court %s: page %s (of %s)', court, i, pages)
            if i > pages:
                return
            for row in data['rows']:
                file_href, date, case, parties, typ, topic, _ = row['cell']
                _, href = file_href.split('"', 1)
                href, _ = href.split('"', 1)
                source_url = urljoin(url, href)
                m = meta.clone()
                try:
                    dt = datetime.strptime(date, '%d-%m-%Y')
                    m.add_date(dt)
                except:
                    pass
                m.foreign_id = source_url
                m.title = '%s (%s), %s, %s' % (parties, case, topic, typ)
                self.emit_url(source, m, source_url)

    def crawl(self):
        source = self.create_source(label='Moldova Courts')
        meta = self.metadata()
        meta.add_language('ro')
        meta.add_country('md')
        meta.extension = 'pdf'
        meta.mime_type = 'application/pdf'

        for court in COURTS:
            self.crawl_court(source, meta, court)
