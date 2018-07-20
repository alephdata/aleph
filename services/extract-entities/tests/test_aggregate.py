from entityextractor.aggregate import EntityAggregator


class TestAggregate(object):

    def test_aggregator(self):
        agg = EntityAggregator()
        assert len(agg) == 0, agg
        agg.feed('test this', 'test', (1, 0, 8))
        assert len(agg) == 1, len(agg)
        agg.feed('TEST THIS ', 'test', (2, 16, 25))
        assert len(agg) == 1, len(agg)
        agg.feed('BANANA SPLIT ', 'test', (3, 12, 80))
        assert len(agg) == 2, len(agg)

    def test_entities(self):
        agg = EntityAggregator()
        agg.feed('test this', 'baa', (1, 0, 8))
        agg.feed('test this', 'baa', (2, 0, 8))
        agg.feed('TEST THIS', 'boo', (3, 0, 8))
        for label, category, weight in agg.entities:
            assert label == 'test this', label
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
