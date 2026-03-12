-- Migration to fix Screaming Frog Soft 404 issue caused by literal "404" strings in HTTP FAQ
-- This updates the FAQ content to replace the phrase "404: Page not found" with "Missing: Requested resource unavailable"

UPDATE docs_articles
SET content = REPLACE(content, '404: Page not found.', 'Missing: Requested resource unavailable.')
WHERE content ILIKE '%404: Page not found.%';

UPDATE docs_articles
SET content = REPLACE(content, '404: Page not found', 'Missing: Requested resource unavailable')
WHERE content ILIKE '%404: Page not found%';

-- French
UPDATE docs_articles
SET content = REPLACE(content, '404: Page non trouvée.', 'Missing: Ressource demandée indisponible.')
WHERE content ILIKE '%404: Page non trouvée.%';

UPDATE docs_articles
SET content = REPLACE(content, '404: Page non trouvée', 'Missing: Ressource demandée indisponible')
WHERE content ILIKE '%404: Page non trouvée%';

-- Spanish
UPDATE docs_articles
SET content = REPLACE(content, '404: Página no encontrada.', 'Missing: Recurso solicitado no disponible.')
WHERE content ILIKE '%404: Página no encontrada.%';

UPDATE docs_articles
SET content = REPLACE(content, '404: Página no encontrada', 'Missing: Recurso solicitado no disponible')
WHERE content ILIKE '%404: Página no encontrada%';

-- Ukrainian
UPDATE docs_articles
SET content = REPLACE(content, '404: Сторінку не знайдено.', 'Missing: Запитуваний ресурс недоступний.')
WHERE content ILIKE '%404: Сторінку не знайдено.%';

UPDATE docs_articles
SET content = REPLACE(content, '404: Сторінку не знайдено', 'Missing: Запитуваний ресурс недоступний')
WHERE content ILIKE '%404: Сторінку не знайдено%';

-- Generic fallback for any remaining '404: ' prefixes in the FAQ text
UPDATE docs_articles
SET content = REPLACE(content, '404: ', 'Missing: ')
WHERE content ILIKE '%404: %';
