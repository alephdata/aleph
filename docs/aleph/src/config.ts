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
		{ text: 'Get in touch', link: 'en/contact' },
	],
		'User Documentation': [
			{ text: 'Getting started', link: 'en/users/getting-started' },
			{ text: 'The building blocks of Aleph', link: 'en/users/building-blocks-of-aleph' },
			{ text: 'Searching your data', link: 'en/users/searching-your-data' },
			{ text: 'Building out your investigation', link: 'en/users/building-your-investigation' },
			{ text: 'OpenRefine reconcilliation', link: 'en/users/openrefine-reconcilliation' },
			{ text: 'Frequently asked questions', link: 'en/users/faq' },
		],
		'Developers and Operators': [
			{ text: 'Technical Introduction', link: 'en/page-4' },
			{ text: 'Installing Aleph', link: 'en/page-4' },
			{ text: 'Follow the Money', link: 'en/page-4' },
			{ text: 'Crawling Data with Memorious', link: 'en/page-4' },
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
	},
};
