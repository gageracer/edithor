import { mdsvex } from 'mdsvex';
import adapter from '@sveltejs/adapter-auto';

export default {
	kit: { adapter: adapter() },
	preprocess: [mdsvex()],
	extensions: ['.svelte', '.svx']
};
