export const SITE = {
	title: 'Aleph',
	description: 'Your website description.',
	defaultLanguage: 'en_US',
};

export const OPEN_GRAPH = {
	image: {
		src: 'https://github.com/withastro/astro/blob/main/assets/social/banner-minimal.png?raw=true',
		alt:
			'astro logo on a starry expanse of space,' +
			' with a purple saturn-like planet floating in the right foreground',
	},
	twitter: 'astrodotbuild',
};

// This is the type of the frontmatter you put in the docs markdown files.
export type Frontmatter = {
	title: string;
	description: string;
	layout: string;
	image?: { src: string; alt: string };
	dir?: 'ltr' | 'rtl';
	ogLocale?: string;
	lang?: string;
};

export const KNOWN_LANGUAGES = {
	English: 'en',
} as const;
export const KNOWN_LANGUAGE_CODES = Object.values(KNOWN_LANGUAGES);

export const GITHUB_EDIT_URL = `https://github.com/withastro/astro/tree/main/examples/docs`;

export const COMMUNITY_INVITE_URL = `https://astro.build/chat`;

// See "Algolia" section of the README for more information.
export const ALGOLIA = {
	indexName: 'XXXXXXXXXX',
	appId: 'XXXXXXXXXX',
	apiKey: 'XXXXXXXXXX',
};

export type Sidebar = Record<
	typeof KNOWN_LANGUAGE_CODES[number],
	Record<string, { text: string; link: string }[]>
>;
export const SIDEBAR: Sidebar = {
	en: {
		'Introduction': [{ text: 'Welcome', link: 'en/introduction' },
			{ text: 'About the project', link: 'en/about' },
			{ text: 'Getting started', link: 'en/guide/getting-started' },
			{ text: 'The building blocks of Aleph', link: 'en/guide/the-basics' },
			{ text: 'Frequently asked questions', link: 'en/guide/faq' },
			{ text: 'Get in touch', link: 'en/contact' },
		],
		'Search': [
			{ text: 'Introduction', link: 'en/guide/search' },
			{ text: 'Executing a basic search', link: 'en/guide/search/anatomy-of-a-search' },
			{ text: 'Advanced search techniques', link: 'en/guide/building-your-investigation' },
			{ text: 'Filtering serach results', link: 'en/guide/openrefine-reconcilliation' },
			{ text: 'Searching within other contexts', link: 'en/guide/faq' },
			{ text: 'Searching for a dataset', link: 'en/guide/faq' },
		],
		'Investigations': [
			{ text: 'Introduction', link: 'en/guide/investigation' },
			{ text: 'Creating an investigation', link: 'en/guide/investigation/creating-an-investigation' },
			{ text: 'Uploading documents', link: 'en/guide/investigation/uploading-documents' },
			{ text: 'Network diagrams', link: 'en/guide/investigation/network-diagrams' },
			{ text: 'Timelines', link: 'en/guide/investigations/timelines' },
			{ text: 'Creating and editing entities', link: 'en/guide/invetigation/using-the-table-editor' },
			{ text: 'Generating multiple entities from a spreadsheet or CSV', link: 'en/guide/investigation/generating-multiple-entities-from-a-list' },
			{ text: 'Cross referencing', link: 'en/guide/investigation/cross-referencing' },
		],

		'Developers and Operators': [
			{ text: 'Technical Introduction', link: 'en/page-4' },
			{ text: 'Installing Aleph', link: 'en/page-4' },
			{ text: 'Alephclient CLI', link: 'en/page-4' },
			{ text: 'Importing Structured Data', link: 'en/page-4' },
			{ text: 'Mixed Docuyment/Entity Graphs', link: 'en/page-4' },
			{ text: 'Adding Text Processors', link: 'en/page-4' },
			{ text: 'Aleph API', link: 'en/page-4' },
			{ text: 'Technical FAQ', link: 'en/page-4' },
			{ text: 'Changelog', link: 'en/page-4' },
			{ text: 'Developer tools', link: 'en/page-4' },
			{ text: 'Data Commons', link: 'en/page-4' },
		],
		'Tools and libraries': [
			{ text: 'Follow the Money', link: 'en/page-4' },
			{ text: 'Crawling Data with Memorious', link: 'en/page-4' },			
			{ text: 'Aleph data desktop', link: 'en/guide/faq' },
			{ text: 'Openrefine Reconcilliation', link: 'en/guide/faq' },
		]
	},
};
