import { useState, useEffect } from 'react';
import { StockSearch } from '../../components/StockSearch';
import { StockChart } from '../../components/StockChart';
import axios from 'axios';
import VantaBackground from '../../components/VantaBackground';

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
    const [news, setNews] = useState<any[]>([]);
    const [newsLoading, setNewsLoading] = useState(false);

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

    useEffect(() => {
        if (!selectedStock) {
            setNews([]);
            return;
        }

        const fetchNews = async () => {
            setNewsLoading(true);
            try {
                const apiKey = import.meta.env.VITE_FINNHUB_API_KEY;
                const to = new Date();
                const fromDate = new Date();
                fromDate.setDate(to.getDate() - 7);
                const from = fromDate.toISOString().slice(0, 10);
                const toStr = to.toISOString().slice(0, 10);

                const resp = await axios.get(
                    `https://finnhub.io/api/v1/company-news?symbol=${selectedStock.ticker}&from=${from}&to=${toStr}&token=${apiKey}`
                );

                if (Array.isArray(resp.data)) {
                    setNews(resp.data.slice(0, 6));
                } else {
                    setNews([]);
                }
            } catch (e) {
                console.error('Error fetching news:', e);
                setNews([]);
            } finally {
                setNewsLoading(false);
            }
        };

        fetchNews();
    }, [selectedStock]);

    return (
        <VantaBackground> 
        <div>
            <StockSearch onStockSelect={handleStockSelect} />
            {/* Display selected stock info */} 
            {selectedStock && (
            <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Main Two-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* LEFT COLUMN: Stock Info */}
              <div className="lg:col-span-1 space-y-6">
                {/* Stock Info Card */}
                <div className="rounded-xl shadow-lg p-6 border border-gray-700 backdrop-blur-md bg-gray-700/30">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-3xl font-bold text-white ">{selectedStock.ticker}</h2>
                      <p className="text-gray-300 mt-1">{selectedStock.name}</p>
                    </div>
                    <div className="text-right ">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        selectedStock.change! >= 0 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedStock.change! >= 0 ? '▲' : '▼'} {Math.abs(selectedStock.change!).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Main Price Display */}
                  <div className="mb-6">
                    <div className="text-sm text-gray-300 mb-1 ">Current Price</div>
                    <div className="text-4xl font-bold text-white ">${selectedStock.price?.toFixed(2)}</div>
                    <div className={`text-lg font-semibold mt-1 ${
                      selectedStock.percentChange! >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {selectedStock.open ? 
                        `${(selectedStock.price! - selectedStock.open! >= 0 ? '+' : '')}${(selectedStock.price! - selectedStock.open!).toFixed(2)}` : 
                        'N/A'}
                    </div>
                  </div>

                  {/* Quick Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 mt-6 text-sm">
                    <div className=" rounded-lg p-3 border border-gray-700/50">
                      <div className="text-white ">Open</div>
                      <div className="font-semibold text-white">${selectedStock.open?.toFixed(2)}</div>
                    </div>
                    <div className="rounded-lg p-3">
                      <div className="text-gray-300">High</div>
                      <div className="font-semibold text-green-500">${selectedStock.high?.toFixed(2)}</div>
                    </div>
                    <div className="rounded-lg p-3">
                      <div className="text-gray-300">Low</div>
                      <div className="font-semibold text-red-500">${selectedStock.low?.toFixed(2)}</div>
                    </div>
                    <div className="rounded-lg p-3">
                      <div className="text-gray-300">Prev Close</div>
                      <div className="font-semibold text-white">${selectedStock.prevClose?.toFixed(2)}</div>
                    </div>
                  </div>

                  {/* Toggle Extra Info */}
                  <button
                    onClick={() => setShowAdditionalInfo(!showAdditionalInfo)}
                    className="mt-5 text-blue-400 hover:text-blue-300 font-medium text-sm flex items-center gap-1"
                  >
                    {showAdditionalInfo ? '↑ Hide' : '↓ Show'} details
                  </button>

                  {showAdditionalInfo && selectedStock.timestamp && (
                    <div className="mt-4 pt-4 border-t border-gray-700 text-xs text-gray-400">
                      Last updated: {new Date(selectedStock.timestamp * 1000).toLocaleString()}
                    </div>
                  )}
                </div>
                
                {/* Quick Stats Card */}
                <div className="backdrop-blur-md bg-gray-700/30 rounded-xl shadow p-5 border border-gray-700/50">
                  <h3 className="font-semibold text-lg mb-4 text-white ">Trading Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-gray-300">
                      <span>Volatility</span>
                      <span className="font-medium text-white">
                        {selectedStock.high && selectedStock.low ? 
                          (((selectedStock.high - selectedStock.low) / selectedStock.price!) * 100).toFixed(1) + '%' : 
                          'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-gray-300">
                      <span>Change vs Open</span>
                      <span className={`font-medium ${
                        selectedStock.price! - selectedStock.open! >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {selectedStock.open ? 
                          `${(selectedStock.price! - selectedStock.open! >= 0 ? '+' : '')}${(selectedStock.price! - selectedStock.open!).toFixed(2)}` : 
                          'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* RIGHT COLUMN: Chart */}
              <div className="lg:col-span-2 rounded-xl shadow p-5 backdrop-blur-md bg-gray-700/30">
                <div className="rounded-xl p-6 h-full">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-white ">Price History</h3>
                    <div className="text-sm text-gray-400">
                      {selectedStock.ticker} • {selectedStock.name.split(' ')[0]}
                    </div>
                  </div>
                  <StockChart ticker={selectedStock.ticker} />
                </div>
              </div>
            </div>

            {/* News Section (Full Width Below) */}
            <div className="mt-8">
              <div className=" rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-white">Latest News</h3>
                  <span className="text-sm text-gray-400">{selectedStock.ticker} Related</span>
                </div>
                
                {newsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="text-gray-400">Loading news articles...</div>
                  </div>
                ) : news.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    No recent news available for {selectedStock.ticker}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {news.map((n: any, index: number) => (
                      <a 
                        key={n.id ?? n.url} 
                        href={n.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group border border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start mb-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center mr-3">
                            <span className="text-blue-300 font-bold">{index + 1}</span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-white group-hover:text-blue-300 line-clamp-2">
                              {n.headline || n.summary?.substring(0, 80)}...
                            </h4>
                            <div className="text-xs text-gray-400 mt-1">
                              {n.source} • {n.datetime ? new Date(n.datetime * 1000).toLocaleDateString() : ''}
                            </div>
                          </div>
                        </div>
                        {n.summary && (
                          <p className="text-sm text-gray-300 line-clamp-3">
                            {n.summary.substring(0, 120)}...
                          </p>
                        )}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
                )}
            </div>
        </VantaBackground> 
       
    );
}