from aleph.queues import get_priority, get_task_count, queue_task, flush_queue
from servicelayer.taskqueue import Dataset

from unittest.mock import Mock, patch


def test_get_priority_bucket():
    flush_queue()
    collection = Mock(id=1)

    assert get_task_count(collection) == 0
    assert get_priority(collection) in (7, 8)

    queue_task(collection, "index")

    assert get_task_count(collection) == 1
    assert get_priority(collection) in (7, 8)

    with patch.object(
        Dataset,
        "get_active_dataset_status",
        return_value={
            "total": 9999,
            "datasets": {
                "1": {
                    "finished": 9999,
                    "running": 0,
                    "pending": 0,
                    "stages": [
                        {
                            "job_id": "",
                            "stage": "index",
                            "pending": 0,
                            "running": 0,
                            "finished": 9999,
                        }
                    ],
                    "start_time": "2024-06-25T10:58:49.779811",
                    "end_time": None,
                    "last_update": "2024-06-25T10:58:49.779819",
                }
            },
        },
    ):
        assert get_task_count(collection) == 9999
        assert get_priority(collection) in (4, 5, 6)

    with patch.object(
        Dataset,
        "get_active_dataset_status",
        return_value={
            "total": 10001,
            "datasets": {
                "1": {
                    "finished": 10000,
                    "running": 0,
                    "pending": 1,
                    "stages": [
                        {
                            "job_id": "",
                            "stage": "index",
                            "pending": 10001,
                            "running": 0,
                            "finished": 0,
                        }
                    ],
                    "start_time": "2024-06-25T10:58:49.779811",
                    "end_time": None,
                    "last_update": "2024-06-25T10:58:49.779819",
                }
            },
        },
    ):
        assert get_task_count(collection) == 10001
        assert get_priority(collection) in (1, 2, 3)
