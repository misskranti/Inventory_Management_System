// API Service for communicating with backend
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

// Helper function to convert string numbers to actual numbers
const convertNumericStrings = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    // Check if it's a numeric string (including decimals)
    const num = parseFloat(obj);
    if (!isNaN(num)) return num;
    return obj;
  }
  if (typeof obj === 'object') {
    if (Array.isArray(obj)) {
      return obj.map(convertNumericStrings);
    } else {
      const converted: any = {};
      for (const [key, value] of Object.entries(obj)) {
        converted[key] = convertNumericStrings(value);
      }
      return converted;
    }
  }
  return obj;
};

export interface Product {
  product_id: string;
  current_quantity: number;
  total_cost: number;
  average_cost: number;
}

export interface Transaction {
  id: string;
  product_id: string;
  event_type: 'purchase' | 'sale';
  quantity: number;
  unit_price?: number;
  total_cost?: number;
  timestamp: string;
}

export interface InventoryBatch {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  remaining_quantity: number;
  created_at: string;
}

export interface InventoryState {
  products: Product[];
  transactions: Transaction[];
  batches: InventoryBatch[];
}

// API Functions
export const api = {
  // Get current inventory state
  async getInventoryState(): Promise<InventoryState> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/inventory`);
      if (!response.ok) {
        throw new Error('Failed to fetch inventory state');
      }
      const data = await response.json();
      console.log('Raw API response:', data);
      const converted = convertNumericStrings(data);
      console.log('Converted data:', converted);
      return converted;
    } catch (error) {
      console.error('Error fetching inventory state:', error);
      // Return empty state if backend is not available
      return { products: [], transactions: [], batches: [] };
    }
  },

  // Process inventory event (purchase or sale)
  async processInventoryEvent(event: {
    product_id: string;
    event_type: 'purchase' | 'sale';
    quantity: number;
    unit_price?: number;
    timestamp?: string;
  }): Promise<{ success: boolean; message: string; total_cost?: number }> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/inventory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        throw new Error('Failed to process inventory event');
      }

      const data = await response.json();
      return convertNumericStrings(data);
    } catch (error) {
      console.error('Error processing inventory event:', error);
      throw error;
    }
  },

  // Get all products
  async getProducts(): Promise<Product[]> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/products`);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const data = await response.json();
      return convertNumericStrings(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  },

  // Get all transactions
  async getTransactions(): Promise<Transaction[]> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/transactions`);
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      const data = await response.json();
      return convertNumericStrings(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  },

  // Get all batches
  async getBatches(): Promise<InventoryBatch[]> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/batches`);
      if (!response.ok) {
        throw new Error('Failed to fetch batches');
      }
      const data = await response.json();
      return convertNumericStrings(data);
    } catch (error) {
      console.error('Error fetching batches:', error);
      return [];
    }
  },

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string; environment: string }> {
    try {
      const response = await fetch(`${BACKEND_URL}/health`);
      if (!response.ok) {
        throw new Error('Backend health check failed');
      }
      return await response.json();
    } catch (error) {
      console.error('Backend health check error:', error);
      throw error;
    }
  },
};

// Helper function to check if backend is available
export const isBackendAvailable = async (): Promise<boolean> => {
  try {
    await api.healthCheck();
    return true;
  } catch {
    return false;
  }
}; 