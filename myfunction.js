const { app } = require('@azure/functions');

app.http('Function', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`HTTP function processed request for URL: "${request.url}"`);

        // Extract 'keyword' from query parameters or request body
        const body = await request.json().catch(() => ({})); // Handles JSON parsing errors
        const keyword = request.query.keyword || body.keyword || 'nothing';

        return { body: `Shashankh says "${keyword}"` };
    }
});
