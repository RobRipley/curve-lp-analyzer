require('dotenv').config(); // Load environment variables
const express = require('express');
const app = express();

// Dynamic import for `graphql-request`
let gql, GraphQLClient;
let client;

(async () => {
    try {
        const graphqlRequest = await import('graphql-request');
        gql = graphqlRequest.gql;
        GraphQLClient = graphqlRequest.GraphQLClient;

        // Initialize the GraphQL client with The Graph's endpoint, using an environment variable for the API key
        const API_KEY = process.env.GRAPH_API_KEY;
        const SUBGRAPH_ID = '3fy93eAT56UJsRCEht8iFhfi6wjHWXtZ9dnnbQmvFopF';
        client = new GraphQLClient(`https://gateway.thegraph.com/api/${API_KEY}/subgraphs/id/${SUBGRAPH_ID}`);
    } catch (error) {
        console.error("Error loading graphql-request:", error);
    }
})();

app.use(express.json());

// Middleware to ensure the GraphQL client is initialized
app.use((req, res, next) => {
    if (!client) {
        return res.status(500).json({ error: 'GraphQL client not initialized' });
    }
    next();
});

// API Endpoint
app.get('/api/get-pool-info', async (req, res) => {
    const poolId = req.query.address;

    if (!poolId) {
        return res.status(400).json({ error: 'Missing address parameter' });
    }

    const query = gql`
        query getPoolInfo($poolId: ID!) {
            liquidityPool(id: $poolId) {
                id
                name
                symbol
                totalValueLockedUSD
                cumulativeVolumeUSD
                cumulativeSupplySideRevenueUSD
                cumulativeProtocolSideRevenueUSD
                inputTokens {
                    id
                    symbol
                    decimals
                    lastPriceUSD
                }
                inputTokenBalances
                inputTokenWeights
                fees {
                    feePercentage
                    feeType
                }
                _isMetapool
                dailySnapshots(
                    first: 2
                    orderBy: timestamp
                    orderDirection: desc
                ) {
                    dailyVolumeUSD
                    totalValueLockedUSD
                    timestamp
                }
                deposits(
                    first: 1000
                    orderBy: timestamp
                    orderDirection: desc
                ) {
                    from
                    amountUSD
                    timestamp
                }
                withdraws(
                    first: 1000
                    orderBy: timestamp
                    orderDirection: desc
                ) {
                    from
                    amountUSD
                    timestamp
                }
            }
        }
    `;

    try {
        const data = await client.request(query, { poolId });
        if (!data.liquidityPool) {
            return res.status(404).json({ error: 'Pool not found' });
        }

        res.json(data.liquidityPool);
    } catch (error) {
        console.error("Error fetching data from The Graph:", error.response ? error.response : error);
        res.status(500).json({ error: 'Error fetching data from The Graph', details: error.message });
    }
});

// Export the app for Vercel
module.exports = app;
