const { gql, GraphQLClient } = require('graphql-request');

// Initialize the GraphQL client
const getClient = () => {
    const API_KEY = process.env.GRAPH_API_KEY;
    const SUBGRAPH_ID = process.env.SUBGRAPH_ID;

    if (!API_KEY || !SUBGRAPH_ID) {
        throw new Error("Missing required environment variables: GRAPH_API_KEY or SUBGRAPH_ID");
    }

    return new GraphQLClient(
        `https://gateway.thegraph.com/api/${API_KEY}/subgraphs/id/${SUBGRAPH_ID}`
    );
};

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
            # Enhanced deposits query with block timestamp
            deposits(
                first: 1000
                orderBy: blockTimestamp
                orderDirection: desc
            ) {
                from
                amountUSD
                blockTimestamp
                hash
                logIndex
            }
            # Enhanced withdraws query with block timestamp
            withdraws(
                first: 1000
                orderBy: blockTimestamp
                orderDirection: desc
            ) {
                from
                amountUSD
                blockTimestamp
                hash
                logIndex
            }
            # Add positions if available
            positions(
                first: 1000
                orderBy: liquidityTokenBalance
                orderDirection: desc
            ) {
                id
                account {
                    id
                }
                liquidityTokenBalance
                withdrawnTokenAmounts
                depositedTokenAmounts
            }
        }
    }
`;

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const poolId = req.query.address;

    if (!poolId) {
        return res.status(400).json({ error: 'Missing address parameter' });
    }

    try {
        const client = getClient();
        const data = await client.request(query, { poolId });
        
        if (!data.liquidityPool) {
            return res.status(404).json({ error: 'Pool not found' });
        }

        // Add debug logging
        console.log("Deposits count:", data.liquidityPool.deposits?.length);
        console.log("Withdraws count:", data.liquidityPool.withdraws?.length);
        console.log("Positions count:", data.liquidityPool.positions?.length);

        return res.status(200).json(data.liquidityPool);
    } catch (error) {
        console.error("Error fetching data from The Graph:", error);
        return res.status(500).json({ 
            error: 'Error fetching data from The Graph', 
            details: error.message 
        });
    }
};