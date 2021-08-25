# Aleph

Helm chart for Aleph

## Values

### Global configs

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| global.amazon | bool | `true` | Are we using AWS services like s3? |
| global.google | bool | `false` | Are we using GCE services like storage, vision api? |
| global.image.repository | string | `"alephdata/aleph"` | Aleph docker image repo |
| global.image.tag | string | `"3.11.0"` | Aleph docker image tag |
| global.image.tag | string | `"Always"` |  |
| global.namingPrefix | string | `"aleph"` | Prefix for the names of k8s resources |

### Environment variables

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| global.env.ALEPH_API_RATE_LIMIT | string | `"600"` | API rate limiting (req/min for anonymous users) |
| global.env.ALEPH_APP_NAME | string | `"aleph"` | App name |
| global.env.ALEPH_APP_TITLE | string | `"Aleph"` | App title |
| global.env.ALEPH_CACHE | string | `"true"` |  |
| global.env.ALEPH_DEBUG | string | `"false"` |  |
| global.env.ALEPH_ELASTICSEARCH_URI | string | `"http://aleph-index-master.default.svc.cluster.local:9200"` |  |
| global.env.ALEPH_FORCE_HTTPS | string | `"false"` |  |
| global.env.ALEPH_INDEX_PREFIX | string | `"aleph"` |  |
| global.env.ALEPH_INDEX_READ | string | `"v1:v2"` |  |
| global.env.ALEPH_INDEX_REPLICAS | string | `"2"` |  |
| global.env.ALEPH_INDEX_WRITE | string | `"v2"` |  |
| global.env.ALEPH_OAUTH | string | `"false"` | Enable OAuth login? |
| global.env.ALEPH_PAGES_PATH | string | `"/aleph/site/aleph.occrp.org/pages"` |  |
| global.env.ALEPH_PASSWORD_LOGIN | string | `"true"` | Enable password login? |
| global.env.ALEPH_UI_URL | string | `"http://localhost"` |  |
| global.env.ELASTICSEARCH_TIMEOUT | string | `"600"` | Default elasticsearch timeout |
| global.env.REDIS_URL | string | `"redis://aleph-redis-master.default.svc.cluster.local:6379/0"` | Redis url |

Checkout [https://docs.alephdata.org/developers/installation#configuration](https://docs.alephdata.org/developers/installation#configuration) for all available options.