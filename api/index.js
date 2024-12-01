require('dotenv').config(); // Load environment variables from .env for local development
const express = require('express');
const app = express();
const PORT = process.env.PORT || 5001;

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

// Helper function to format token balances based on decimal places
function formatBalance(balance, decimals) {
    try {
        const divisor = BigInt(10) ** BigInt(decimals);
        return (BigInt(balance) / divisor).toString();
    } catch (error) {
        console.error("Error formatting balance:", error);
        return "0";
    }
}

// Helper function to calculate percentage change
function calculatePercentChange(current, previous) {
    if (!previous || previous === '0') return '0';
    return (((parseFloat(current) - parseFloat(previous)) / parseFloat(previous)) * 100).toFixed(2);
}

// Helper function to aggregate liquidity provider data
function aggregateProviders(deposits, withdraws) {
    const providersMap = new Map();

    // Process deposits
    deposits.forEach(deposit => {
        const provider = deposit.from;
        const amount = parseFloat(deposit.amountUSD);
        if (!providersMap.has(provider)) {
            providersMap.set(provider, { 
                address: provider,
                totalDeposited: 0,
                totalWithdrawn: 0,
                lastActivity: parseInt(deposit.timestamp),
                transactions: 0
            });
        }
        const data = providersMap.get(provider);
        data.totalDeposited += amount;
        data.transactions += 1;
        data.lastActivity = Math.max(data.lastActivity, parseInt(deposit.timestamp));
    });

    // Process withdraws
    withdraws.forEach(withdraw => {
        const provider = withdraw.from;
        const amount = parseFloat(withdraw.amountUSD);
        if (!providersMap.has(provider)) {
            providersMap.set(provider, {
                address: provider,
                totalDeposited: 0,
                totalWithdrawn: 0,
                lastActivity: parseInt(withdraw.timestamp),
                transactions: 0
            });
        }
        const data = providersMap.get(provider);
        data.totalWithdrawn += amount;
        data.transactions += 1;
        data.lastActivity = Math.max(data.lastActivity, parseInt(withdraw.timestamp));
    });

    // Calculate net positions and convert to array
    return Array.from(providersMap.values())
        .map(provider => ({
            ...provider,
            netPosition: provider.totalDeposited - provider.totalWithdrawn,
            lastActivityDate: new Date(provider.lastActivity * 1000).toISOString()
        }))
        .filter(provider => provider.netPosition > 0) // Only include providers with positive positions
        .sort((a, b) => b.netPosition - a.netPosition) // Sort by net position
        .slice(0, 20); // Get top 20
}

// Middleware to ensure the GraphQL client is initialized
app.use((req, res, next) => {
    if (!client) {
        return res.status(500).json({ error: 'GraphQL client not initialized' });
    }
    next();
});

// Enhanced endpoint to fetch pool info with liquidity providers
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

        // (Processing logic here remains unchanged)

        res.json({
            // Response structure remains unchanged
        });
    } catch (error) {
        console.error("Error fetching data from The Graph:", error.response ? error.response : error);
        res.status(500).json({ error: 'Error fetching data from The Graph', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
