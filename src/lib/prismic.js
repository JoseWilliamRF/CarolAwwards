import { createClient } from '@prismicio/client';

// A variável só existe no servidor Node.js durante o build.
// O SDK monta o endpoint da CDN automaticamente.
export const client = createClient(import.meta.env.PUBLIC_PRISMIC_REPO_NAME);
