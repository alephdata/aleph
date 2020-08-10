from servicelayer import env
from servicelayer import settings as sls
from ftmstore import settings as sts

TESTING = False

# Document conversion service
CONVERT_URL = env.get("UNOSERVICE_URL", "http://convert-document:3000/convert")
CONVERT_URL = env.get("INGESTORS_CONVERT_DOCUMENT_URL", CONVERT_URL)
CONVERT_TIMEOUT = env.to_int("INGESTORS_CONVERT_TIMEOUT", 7200)  # 2 hrs
CONVERT_RETRIES = env.to_int("INGESTORS_CONVERT_RETRIES", 256)

# Enable (expensive!) Google Cloud API
OCR_VISION_API = env.to_bool("INGESTORS_OCR_VISION_API", False)

# Geonames data file
GEONAMES_PATH = env.get("INGESTORS_GEONAMES_PATH", "/ingestors/data/geonames.txt")

# FastText lid model file
LID_MODEL_PATH = env.get("INGESTORS_LID_MODEL_PATH", "/ingestors/data/lid.176.ftz")

# Disable entity extraction
ANALYZE_ENTITIES = env.to_bool("INGESTORS_ANALYZE_ENTITIES", True)

# List available NER models
NER_MODELS = set(env.to_list("INGESTORS_NER_MODELS", ["eng"]))
NER_DEFAULT_MODEL = "xx"

# Use the environment variable set in aleph.env
sts.DATABASE_URI = env.get("ALEPH_DATABASE_URI", sts.DATABASE_URI)

# Also store cached values in the SQL database
sls.TAGS_DATABASE_URI = sts.DATABASE_URI
