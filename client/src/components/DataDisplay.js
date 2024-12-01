import React, { useMemo } from 'react';

function DataDisplay({ poolData }) {
    // Format number with appropriate decimals
    const formatNumber = (num, decimals = 2) => {
        const number = parseFloat(num);
        if (isNaN(number)) return '0';
        return new Intl.NumberFormat('en-US', {
            style: 'decimal',
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }).format(number);
    };

    // Format token balance with correct decimals
    const formatTokenBalance = (balance, decimals) => {
        return balance / Math.pow(10, decimals);
    };

    const formatDate = (timestamp) => {
        return new Date(timestamp * 1000).toLocaleString();
    };

    // Calculate top providers
    const topProviders = useMemo(() => {
        const providers = new Map();

        // Process deposits
        poolData.deposits.forEach(deposit => {
            const current = providers.get(deposit.from) || {
                address: deposit.from,
                totalDeposited: 0,
                totalWithdrawn: 0,
                lastActive: parseInt(deposit.timestamp)
            };
            current.totalDeposited += parseFloat(deposit.amountUSD);
            current.lastActive = Math.max(current.lastActive, parseInt(deposit.timestamp));
            providers.set(deposit.from, current);
        });

        // Process withdrawals
        poolData.withdraws.forEach(withdraw => {
            const current = providers.get(withdraw.from) || {
                address: withdraw.from,
                totalDeposited: 0,
                totalWithdrawn: 0,
                lastActive: parseInt(withdraw.timestamp)
            };
            current.totalWithdrawn += parseFloat(withdraw.amountUSD);
            current.lastActive = Math.max(current.lastActive, parseInt(withdraw.timestamp));
            providers.set(withdraw.from, current);
        });

        // Calculate net positions and convert to array
        const providersArray = Array.from(providers.values()).map(provider => ({
            ...provider,
            netPosition: provider.totalDeposited - provider.totalWithdrawn
        }));

        // Sort by net position and take top 20
        return providersArray
            .sort((a, b) => b.netPosition - a.netPosition)
            .slice(0, 20);
    }, [poolData.deposits, poolData.withdraws]);

    const totalTVL = parseFloat(poolData.totalValueLockedUSD);

    return (
        <div className="p-4 max-w-7xl mx-auto">
            {/* Previous sections remain the same... */}

            {/* Updated Token Table */}
            {poolData.inputTokens && poolData.inputTokens.length > 0 && (
                <div className="mt-8">
                    <h3 className="text-xl font-semibold mb-4">Pool Tokens</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price (USD)</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Weight</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {poolData.inputTokens.map((token, index) => (
                                    <tr key={token.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {token.symbol}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                                            {formatNumber(formatTokenBalance(poolData.inputTokenBalances[index], token.decimals))}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                                            ${formatNumber(token.lastPriceUSD)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                                            {formatNumber(parseFloat(poolData.inputTokenWeights[index]) * 100)}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Top Providers Table */}
            <div className="mt-8">
                <h3 className="text-xl font-semibold mb-4">Top 20 Liquidity Providers</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Net Position</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% of Pool</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Deposited</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Withdrawn</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {topProviders.map((provider, index) => (
                                <tr key={provider.address}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {provider.address}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                                        ${formatNumber(provider.netPosition)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                                        {formatNumber((provider.netPosition / totalTVL) * 100)}%
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                                        ${formatNumber(provider.totalDeposited)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                                        ${formatNumber(provider.totalWithdrawn)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                                        {formatDate(provider.lastActive)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default DataDisplay;