from servicelayer import env

UNOSERVICE_URL = env.get('UNOSERVICE_URL')
OCR_VISION_API = env.to_bool('OCR_VISION_API', False)