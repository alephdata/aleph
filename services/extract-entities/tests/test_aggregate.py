from entityextractor.aggregate import EntityAggregator


class TestAggregate(object):

    def test_aggregator(self):
        agg = EntityAggregator()
        assert len(agg) == 0, agg
        agg.feed('test', 'test', (0, 4))
        assert len(agg) == 1, agg
        agg.feed('TEST ', 'test', (6, 11))
        assert len(agg) == 1, agg
        agg.feed('BANANA ', 'test', (12, 80))
        assert len(agg) == 2, agg

    def test_entities(self):
        agg = EntityAggregator()
        agg.feed('test', 'baa', (0, 4))
        agg.feed('test ', 'baa', (0, 4))
        agg.feed('TEST', 'boo', (0, 4))
        for label, category, weight in agg.entities:
            assert label == 'test', label
            assert category == 'baa', label
            assert weight == 3, weight

    def test_merkel(self):
        agg = EntityAggregator()
        agg.extract('Das ist der Pudel von Angela Merkel', ['de', 'en'])
        entities = [l for l, c, w in agg.entities]
        assert 'Angela Merkel' in entities, entities

    def test_mutli(self):
        agg = EntityAggregator()
        text = "This is a text about Foo Blubb, a leader in " \
               "this industry. The should not be confused with Foo Blubb, " \
               "a smaller firm."
        agg.extract(text, ['en'])
        entities = [l for l, c, w in agg.entities]
        assert 'Foo Blubb' in entities, entities

    # def test_select_label(self):
    #     labels = ['Mr Blue', 'Mr BLUE', 'Mr Blu', 'Mr. Blue']
    #     assert select_label(labels) == 'Mr Blue'
