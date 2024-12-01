// api/get-pool-info.js
module.exports = async (req, res) => {
    const { address } = req.query;
    
    // Enable CORS
    res.setHeader("Access-Control-Allow-Credentials", true);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
    
    // Return a simple test response
    return res.status(200).json({
        message: "API is working",
        receivedAddress: address,
        envVars: {
            hasApiKey: !!process.env.GRAPH_API_KEY,
            hasSubgraphId: !!process.env.SUBGRAPH_ID
        }
    });
};
