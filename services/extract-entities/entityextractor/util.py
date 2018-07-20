

def overlaps(a, b):
    rec_a, start_a, end_a = a
    rec_b, start_b, end_b = b
    if rec_a != rec_b:
        return False
    max_start = max(start_a, start_b)
    min_end = min(end_a, end_b)
    return (min_end - max_start) > 0
