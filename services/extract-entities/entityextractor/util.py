

def overlaps(a, b):
    start_a, end_a = a
    start_b, end_b = b
    max_start = max(start_a, start_b)
    min_end = min(end_a, end_b)
    return (min_end - max_start) > 0
