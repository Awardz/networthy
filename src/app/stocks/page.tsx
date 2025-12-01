import { useState } from 'react';
import { StockSearch } from '../../components/StockSearch';
import axios from 'axios';


interface StockData {
    ticker: string;
    name: string;
    price?: number;
    change?: number;
    percentChange?: number;
    high?: number;
    low?: number;
    open?: number;
    prevClose?: number;
    timestamp?: number;
}

export default function StocksPage() {
    const [selectedStock, setSelectedStock] = useState<StockData | null>(null);
    const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);

    const handleStockSelect = async (stock: { ticker: string; name: string }) => {
        try {
            const apiKey = import.meta.env.VITE_FINNHUB_API_KEY;
            const response = await axios.get(
                `https://finnhub.io/api/v1/quote?symbol=${stock.ticker}&token=${apiKey}`
            );

            const quote = response.data;
            setSelectedStock({
                ticker: stock.ticker,
                name: stock.name,
                price: quote.c,
                change: quote.d,
                percentChange: quote.dp,
                high: quote.h,
                low: quote.l,
                open: quote.o,
                prevClose: quote.pc,
                timestamp: quote.t,
            });
            setShowAdditionalInfo(false);
        } catch (error) {
            console.error('Error fetching stock data:', error);
            setSelectedStock(stock as StockData);
        }
    };

    return (
        <div>
            <StockSearch onStockSelect={handleStockSelect} />
            
            {selectedStock && (
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h2 className="text-3xl font-bold mb-2">{selectedStock.ticker}</h2>
                        <p className="text-gray-600 mb-6">{selectedStock.name}</p>
                        
                        {selectedStock.price ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-gray-600 text-sm">Current Price</p>
                                    <p className="text-3xl font-bold">${selectedStock.price?.toFixed(2)}

                                    </p>
                                </div>
                                
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-gray-600 text-sm">Change</p>
                                    <p className={`text-2xl font-bold ${selectedStock.change! >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        ${selectedStock.change?.toFixed(2)}
                                    </p>
                                </div>
                                
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-gray-600 text-sm">% Change</p>
                                    <p className={`text-2xl font-bold ${selectedStock.percentChange! >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {selectedStock.percentChange?.toFixed(2)}%
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500">No price data available</p>
                        )}
                        {/* Additional Info Section */}
                        <div className="mt-6">
                            <button
                                onClick={() => setShowAdditionalInfo(!showAdditionalInfo)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                {showAdditionalInfo ? 'Hide' : 'Show'} Additional Info
                            </button>
                            
                            {showAdditionalInfo && (
                                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {selectedStock.high !== undefined && (
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <p className="text-gray-600 text-sm">High</p>
                                            <p className="text-2xl font-bold">${selectedStock.high.toFixed(2)}</p>
                                        </div>
                                    )}
                                    
                                    {selectedStock.low !== undefined && (
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <p className="text-gray-600 text-sm">Low</p>
                                            <p className="text-2xl font-bold">${selectedStock.low.toFixed(2)}</p>
                                        </div>
                                    )}
                                    
                                    {selectedStock.open !== undefined && (
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <p className="text-gray-600 text-sm">Open</p>
                                            <p className="text-2xl font-bold">${selectedStock.open.toFixed(2)}</p>
                                        </div>
                                    )}
                                    
                                    {selectedStock.prevClose !== undefined && (
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <p className="text-gray-600 text-sm">Previous Close</p>
                                            <p className="text-2xl font-bold">${selectedStock.prevClose.toFixed(2)}</p>
                                        </div>
                                    )}
                                    
                                    {selectedStock.timestamp !== undefined && (
                                        <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
                                            <p className="text-gray-600 text-sm">Last Update</p>
                                            <p className="text-lg font-bold">{new Date(selectedStock.timestamp * 1000).toLocaleString()}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    
                </div>
            )}
        </div>
    );
}