import React, { useEffect, useState } from "react";
import { tradingService } from "../services/api";
import { getThumbnailUrl } from "../utils/imageUtils";

interface TradeRequest {
  id: number;
  fromUserId: number;
  toUserId: number;
  tradingContentId: number;
  offeredContentId: number;
  status: string;
  createdAt: string;
  tradingContentTitle: string;
  tradingContentFileUrl: string;
  offeredContentTitle: string;
  offeredContentFileUrl: string;
  fromUsername: string;
}

const TradeRequests: React.FC = () => {
  const [tradeRequests, setTradeRequests] = useState<TradeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [processingRequests, setProcessingRequests] = useState<Set<number>>(
    new Set()
  );

  useEffect(() => {
    fetchTradeRequests();
  }, []);

  const fetchTradeRequests = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await tradingService.listTradeRequests();
      setTradeRequests(response.data);
    } catch (err) {
      console.log(err);
      setError("Failed to load trade requests.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (requestId: number) => {
    setProcessingRequests((prev) => new Set(prev).add(requestId));
    try {
      await tradingService.acceptTradeRequest(requestId);
      // Remove the accepted request from the list
      setTradeRequests((prev) => prev.filter((req) => req.id !== requestId));
      setSuccessMessage("Trade request accepted successfully!");
      setError(null);
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.log(err);
      setError("Failed to accept trade request.");
      setSuccessMessage(null);
    } finally {
      setProcessingRequests((prev) => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleReject = async (requestId: number) => {
    setProcessingRequests((prev) => new Set(prev).add(requestId));
    try {
      await tradingService.rejectTradeRequest(requestId);
      // Remove the rejected request from the list
      setTradeRequests((prev) => prev.filter((req) => req.id !== requestId));
    } catch (err) {
      console.log(err);
      setError("Failed to reject trade request.");
    } finally {
      setProcessingRequests((prev) => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="text-center">Loading trade requests...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="text-red-500 text-center mb-4">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary-500 text-white rounded-full font-semibold hover:bg-primary-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-primary-500">Trade Requests</h1>
        <button
          onClick={fetchTradeRequests}
          className="px-4 py-2 bg-dark-700 text-white rounded-full font-semibold hover:bg-dark-600 transition-colors"
        >
          Refresh
        </button>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-green-600 text-white rounded-lg text-center">
          {successMessage}
        </div>
      )}

      {tradeRequests?.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          <div className="text-lg mb-2">No pending trade requests</div>
          <div className="text-sm">
            When other users want to trade for your content, their requests will
            appear here.
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {tradeRequests?.map((request) => (
            <div
              key={request.id}
              className="bg-dark-800 rounded-lg shadow-lg p-6 border border-dark-700"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold">
                    {request?.fromUsername?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="text-white font-semibold">
                      {request?.fromUsername} wants to trade
                    </div>
                    <div className="text-gray-400 text-sm">
                      {new Date(request?.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Your Content (What they want) */}
                <div className="bg-dark-700 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-3">
                    Your Content (What they want)
                  </h3>
                  <div className="flex items-center space-x-3">
                    <img
                      src={getThumbnailUrl(request.tradingContentFileUrl)}
                      alt={request.tradingContentTitle}
                      className="w-16 h-16 object-cover rounded border border-dark-600"
                    />
                    <div className="flex-1">
                      <div className="text-white font-medium line-clamp-2">
                        {request.tradingContentTitle}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Their Content (What they're offering) */}
                <div className="bg-dark-700 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-3">
                    Their Content (What they're offering)
                  </h3>
                  <div className="flex items-center space-x-3">
                    <img
                      src={getThumbnailUrl(request.offeredContentFileUrl)}
                      alt={request.offeredContentTitle}
                      className="w-16 h-16 object-cover rounded border border-dark-600"
                    />
                    <div className="flex-1">
                      <div className="text-white font-medium line-clamp-2">
                        {request.offeredContentTitle}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => handleAccept(request.id)}
                  disabled={processingRequests.has(request.id)}
                  className="flex-1 py-2 bg-green-600 text-white rounded-full font-semibold hover:bg-green-700 transition-colors disabled:opacity-60"
                >
                  {processingRequests.has(request.id)
                    ? "Processing..."
                    : "Accept Trade"}
                </button>
                <button
                  onClick={() => handleReject(request.id)}
                  disabled={processingRequests.has(request.id)}
                  className="flex-1 py-2 bg-red-600 text-white rounded-full font-semibold hover:bg-red-700 transition-colors disabled:opacity-60"
                >
                  {processingRequests.has(request.id)
                    ? "Processing..."
                    : "Reject Trade"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TradeRequests;
