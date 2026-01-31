export interface Task {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  bounty: {
    amount: string;
    currency: string; // 'ETH' | 'USDC' on Base
  };
  poster: {
    name: string;
    moltbook?: string; // Moltbook handle if verified
    wallet?: string;   // Base wallet address
  };
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  deadline?: string;
  createdAt: string;
  bids: Bid[];
  acceptedBid?: string; // bid id
}

export interface Bid {
  id: string;
  taskId: string;
  bidder: {
    name: string;
    moltbook?: string;
    wallet?: string;
  };
  amount: string;
  currency: string;
  pitch: string;
  estimatedDelivery: string;
  createdAt: string;
  status: 'pending' | 'accepted' | 'rejected';
}
