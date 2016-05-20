from datetime import timedelta


class CrawlerSchedule(object):

    def __init__(self, name, **delta):
        self.name = name
        self.delta = timedelta(**delta)

    def to_dict(self):
        return self.name

    def __unicode__(self):
        return self.name
