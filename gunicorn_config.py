# Railway-optimized Gunicorn config
workers = 1
threads = 2
worker_class = "gthread"
worker_tmp_dir = "/dev/shm"
timeout = 120
max_requests = 100
max_requests_jitter = 20
