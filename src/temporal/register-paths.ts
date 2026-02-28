/**
 * Register tsconfig path aliases for standalone tsx execution.
 * Used by the Temporal worker to resolve @/ imports.
 */
import { register } from 'tsconfig-paths';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(__filename), '../..');

register({
    baseUrl: projectRoot,
    paths: { '@/*': ['./src/*'] },
});
