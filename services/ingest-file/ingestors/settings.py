from servicelayer import env
from servicelayer import settings as sls
from ftmstore import settings as sts

TESTING = False

# When set to True, a debugpy server will be enabled in cli.py process()
DEBUGPY_PROCESS = env.to_bool("INGESTORS_DEBUGPY_PROCESS", False)
# The address that the debugpy server should bind to
DEBUGPY_ADDRESS = env.get("INGESTORS_DEBUGPY_ADDRESS", "0.0.0.0")
# The port that the debugpy server should listen for a connection on
DEBUGPY_PORT = env.to_int("INGESTORS_DEBUGPY_PORT", 5678)
# When set to True, after setting up the debug server the application will block
# and wait for a client connection before continuing with processing
DEBUGPY_WAIT_FOR_CLIENT = env.to_bool("INGESTORS_DEBUGPY_WAIT_FOR_CLIENT", False)

# Document conversion service
CONVERT_URL = env.get("UNOSERVICE_URL", "http://convert-document:3000/convert")
CONVERT_URL = env.get("INGESTORS_CONVERT_DOCUMENT_URL", CONVERT_URL)
CONVERT_TIMEOUT = env.to_int("INGESTORS_CONVERT_TIMEOUT", 7200)  # 2 hrs

# Enable (expensive!) Google Cloud API
OCR_VISION_API = env.to_bool("INGESTORS_OCR_VISION_API", False)

# Enable Google Cloud Translation API
TRANSLATION_API = env.to_bool("INGESTORS_TRANSLATION_API", False)

# White list of language IDs for languages that should be translated
# An empty white list is considered a wildcard, allowing all languages to be translated
TRANSLATION_LANGUAGE_WHITE_LIST = env.to_list("INGESTORS_TRANSLATION_LANGUAGE_WHITE_LIST", None)

# Black list of language IDs for languages that should NOT be translated
# An empty black list means that no languages are restricted
# The black list takes precedence over the white list
TRANSLATION_LANGUAGE_BLACK_LIST = env.to_list("INGESTORS_TRANSLATION_LANGUAGE_BLACK_LIST", ["en", "eng"])

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
