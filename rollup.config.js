import svelte from 'rollup-plugin-svelte';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';
import sveltePreprocess from 'svelte-preprocess';
import typescript from '@rollup/plugin-typescript';
import css from 'rollup-plugin-css-only';

const production = !process.env.ROLLUP_WATCH;

function serve() {
	let server;

	function toExit() {
		if (server) server.kill(0);
	}

	return {
		writeBundle() {
			if (server) return;
			server = require('child_process').spawn('npm', ['run', 'start', '--', '--dev'], {
				stdio: ['ignore', 'inherit', 'inherit'],
				shell: true
			});

			process.on('SIGTERM', toExit);
			process.on('exit', toExit);
		}
	};
}

export default [{
	input: 'src/app/preload.ts',
	output: {
		sourcemap: true,
		format: 'cjs',
		file: 'public/build/preload.js'
	},
	plugins: [
		commonjs(),
		typescript({
			sourceMap: !production,
			inlineSources: !production
		}),
		production && terser()
	],
	external: ['electron'],
	watch: {
		clearScreen: false
	}
}, {
	input: 'src/process/ipc.ts',
	output: {
		sourcemap: true,
		format: 'cjs',
		name: 'app',
		file: 'public/build/ipc.js'
	},
	plugins: [
		commonjs(),
		typescript({
			sourceMap: !production,
			inlineSources: !production
		}),
		production && terser()
	],
	external: ['electron', 'os', 'fs', 'csv-parse', 'csv-stringify', 'worker_threads', 'https', '@hashgraph/sdk', '@hashgraph/cryptography', '@hashgraph/proto', 'bignumber.js'],
	watch: {
		clearScreen: false
	}
}, {
	input: 'src/process/distribution-worker.ts',
	output: {
		sourcemap: true,
		format: 'cjs',
		file: 'public/build/distribution-worker.js'
	},
	plugins: [
		commonjs(),
		typescript({
			sourceMap: !production,
			inlineSources: !production
		}),
		production && terser()
	],
	external: ['worker_threads'],
	watch: {
		clearScreen: false
	}
}, {
	input: 'src/app/main.ts',
	output: {
		sourcemap: true,
		format: 'iife',
		name: 'app',
		file: 'public/build/bundle.js'
	},
	plugins: [
		svelte({
			preprocess: sveltePreprocess({ sourceMap: !production }),
			compilerOptions: {
				// enable run-time checks when not in production
				dev: !production
			}
		}),
		// we'll extract any component CSS out into
		// a separate file - better for performance
		css({ output: 'bundle.css' }),

		// If you have external dependencies installed from
		// npm, you'll most likely need these plugins. In
		// some cases you'll need additional configuration -
		// consult the documentation for details:
		// https://github.com/rollup/plugins/tree/master/packages/commonjs
		resolve({
			browser: true,
			dedupe: ['svelte']
		}),
		commonjs(),
		typescript({
			sourceMap: !production,
			inlineSources: !production
		}),
		// In dev mode, call `npm run start` once
		// the bundle has been generated
		!production && serve(),

		// Watch the `public` directory and refresh the
		// browser on changes when not in production
		!production && livereload('public'),

		// If we're building for production (npm run build
		// instead of npm run dev), minify
		production && terser()
	],
	watch: {
		clearScreen: false
	}
}];
