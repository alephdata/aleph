import { Entity } from '@alephdata/followthemoney';
import { useEffect, useState } from 'react';

const DEFAULT_LANG = 'en';

interface IImageAttribution {
  readonly license: string;
  readonly license_url: string;
  readonly author?: string;
}

interface IImageAlt {
  readonly text: string;
  readonly language?: string;
}

interface IImageMeta {
  readonly id: string;
  readonly name: string;
  readonly url: string;
  readonly original_url: string;
  readonly thumbnail_url: string;
  readonly alt: IImageAlt[];
  readonly attribution: IImageAttribution;
}

interface IComponent {
  readonly entity: Entity;
  readonly api: string;
  readonly thumbnail?: boolean;
}

const extractAlt = (image: IImageMeta, lang: string = DEFAULT_LANG): string => {
  if (lang) {
    const alt =
      image.alt.find(({ language }) => language === lang) ||
      image.alt.find(({ language }) => language === DEFAULT_LANG);
    if (alt) return alt.text;
  }
  return image.alt[0]?.text || image.name;
};

const makeMetaUrl = (api: string, id: string): string => `${api}/img/${id}`;

async function fetchImageMeta(
  url: string,
  opts: RequestInit = {}
): Promise<any> {
  const res = await fetch(url, opts);
  if (res.ok) {
    const data = await res.json();
    return data;
  }
  throw new Error(`Fetch error: ${res.status} ${res.statusText}`);
}

const getImage = async (
  api: string,
  id: string,
  opts: RequestInit = {}
): Promise<IImageMeta> =>
  fetchImageMeta(makeMetaUrl(api, id), opts) as Promise<IImageMeta>;

export function ImageAttribution(props: { attribution: IImageAttribution }) {
  const { license, license_url, author } = props.attribution;
  return (
    <span className="ftm-assets__ImageAttribution">
      <span className="ftm-assets__ImageAttribution__license">
        License: <a href={license_url}>{license}</a>
      </span>
      {author ? (
        <span className="ftm-assets__ImageAttribution__author">
          Author: {author}
        </span>
      ) : null}
    </span>
  );
}

export default function EntityImage(props: IComponent) {
  const [image, setImage] = useState<IImageMeta | null>(null);
  const id = props.entity.getFirst('wikidataId');

  useEffect(() => {
    // currently, only qid is supported
    id &&
      getImage(props.api, id.toString())
        .then(setImage)
        .catch(() => setImage(null));
  }, [id, props.api]);

  return image ? (
    <span className="ftm-assets__Image-wrapper">
      <img
        src={props.thumbnail ? image.thumbnail_url : image.url}
        alt={extractAlt(image)}
      />
      <ImageAttribution attribution={image.attribution} />
    </span>
  ) : null;
}
