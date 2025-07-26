"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { api, isBackendAvailable, type Product, type Transaction, type InventoryBatch } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Package, TrendingUp, TrendingDown, DollarSign, Activity, LogOut, Database, Zap, BarChart3, Layers, Calculator } from "lucide-react"

export default function InventoryDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [batches, setBatches] = useState<InventoryBatch[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [simulatorRunning, setSimulatorRunning] = useState(false)
  const [backendAvailable, setBackendAvailable] = useState(false)

  // Mock authentication
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (username === "admin" && password === "inventory123") {
      setIsAuthenticated(true)
    } else {
      alert("Invalid credentials. Use admin/inventory123")
    }
  }

  // Initialize data from backend
  useEffect(() => {
    if (isAuthenticated) {
      initializeData()
    }
  }, [isAuthenticated])

  const initializeData = async () => {
    try {
      // Check if backend is available
      const available = await isBackendAvailable()
      setBackendAvailable(available)
      
      if (available) {
        // Load data from backend
        const inventoryState = await api.getInventoryState()
        setProducts(inventoryState.products)
        setTransactions(inventoryState.transactions)
        setBatches(inventoryState.batches)
        setIsConnected(true)
      } else {
        // Fallback to mock data if backend is not available
        initializeMockData()
        setIsConnected(true)
      }
    } catch (error) {
      console.error('Error initializing data:', error)
      // Fallback to mock data
      initializeMockData()
      setIsConnected(true)
    }
  }

  const initializeMockData = () => {
    const mockProducts: Product[] = [
      { product_id: "PRD001", current_quantity: 150, total_cost: 12500, average_cost: 83.33 },
      { product_id: "PRD002", current_quantity: 75, total_cost: 9000, average_cost: 120.0 },
      { product_id: "PRD003", current_quantity: 200, total_cost: 8000, average_cost: 40.0 },
    ]

    const mockTransactions: Transaction[] = [
      {
        id: "1",
        product_id: "PRD001",
        event_type: "purchase",
        quantity: 100,
        unit_price: 80,
        total_cost: 8000,
        timestamp: "2025-01-26T10:00:00Z",
      },
      {
        id: "2",
        product_id: "PRD001",
        event_type: "purchase",
        quantity: 100,
        unit_price: 90,
        total_cost: 9000,
        timestamp: "2025-01-26T11:00:00Z",
      },
      {
        id: "3",
        product_id: "PRD001",
        event_type: "sale",
        quantity: 50,
        total_cost: 4000,
        timestamp: "2025-01-26T12:00:00Z",
      },
      {
        id: "4",
        product_id: "PRD002",
        event_type: "purchase",
        quantity: 100,
        unit_price: 120,
        total_cost: 12000,
        timestamp: "2025-01-26T13:00:00Z",
      },
      {
        id: "5",
        product_id: "PRD002",
        event_type: "sale",
        quantity: 25,
        total_cost: 3000,
        timestamp: "2025-01-26T14:00:00Z",
      },
    ]

    const mockBatches: InventoryBatch[] = [
      {
        id: "B1",
        product_id: "PRD001",
        quantity: 100,
        unit_price: 80,
        remaining_quantity: 50,
        created_at: "2025-01-26T10:00:00Z",
      },
      {
        id: "B2",
        product_id: "PRD001",
        quantity: 100,
        unit_price: 90,
        remaining_quantity: 100,
        created_at: "2025-01-26T11:00:00Z",
      },
      {
        id: "B3",
        product_id: "PRD002",
        quantity: 100,
        unit_price: 120,
        remaining_quantity: 75,
        created_at: "2025-01-26T13:00:00Z",
      },
    ]

    setProducts(mockProducts)
    setTransactions(mockTransactions)
    setBatches(mockBatches)
  }

  // FIFO Cost Calculation Logic
  const calculateFIFOCost = (productId: string, saleQuantity: number): number => {
    const productBatches = batches
      .filter((b) => b.product_id === productId && b.remaining_quantity > 0)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    let remainingToSell = saleQuantity
    let totalCost = 0

    for (const batch of productBatches) {
      if (remainingToSell <= 0) break

      const quantityFromBatch = Math.min(remainingToSell, batch.remaining_quantity)
      totalCost += quantityFromBatch * batch.unit_price
      remainingToSell -= quantityFromBatch
    }

    return totalCost
  }

  // Kafka Event Simulator
  const simulateKafkaEvent = async () => {
    const productIds = ["PRD001", "PRD002", "PRD003"]
    const eventTypes = ["purchase", "sale"]
    const randomProductId = productIds[Math.floor(Math.random() * productIds.length)]
    const randomEventType = eventTypes[Math.floor(Math.random() * eventTypes.length)] as "purchase" | "sale"
    const randomQuantity = Math.floor(Math.random() * 50) + 10
    const randomPrice = Math.floor(Math.random() * 100) + 50

    try {
      if (backendAvailable) {
        // Send event to backend
        const result = await api.processInventoryEvent({
          product_id: randomProductId,
          event_type: randomEventType,
          quantity: randomQuantity,
          unit_price: randomEventType === "purchase" ? randomPrice : undefined,
          timestamp: new Date().toISOString(),
        })

        if (result.success) {
          // Refresh data from backend
          const inventoryState = await api.getInventoryState()
          setProducts(inventoryState.products)
          setTransactions(inventoryState.transactions)
          setBatches(inventoryState.batches)
        }
      } else {
        // Fallback to local simulation
        const newTransaction: Transaction = {
          id: Date.now().toString(),
          product_id: randomProductId,
          event_type: randomEventType,
          quantity: randomQuantity,
          unit_price: randomEventType === "purchase" ? randomPrice : undefined,
          total_cost:
            randomEventType === "purchase"
              ? randomQuantity * randomPrice
              : calculateFIFOCost(randomProductId, randomQuantity),
          timestamp: new Date().toISOString(),
        }

        // Update transactions
        setTransactions((prev) => [newTransaction, ...prev])

        // Update products and batches based on FIFO logic
        if (randomEventType === "purchase") {
          // Add new batch
          const newBatch: InventoryBatch = {
            id: `B${Date.now()}`,
            product_id: randomProductId,
            quantity: randomQuantity,
            unit_price: randomPrice,
            remaining_quantity: randomQuantity,
            created_at: new Date().toISOString(),
          }
          setBatches((prev) => [...prev, newBatch])

          // Update product quantity and cost
          setProducts((prev) =>
            prev.map((p) => {
              if (p.product_id === randomProductId) {
                const newQuantity = p.current_quantity + randomQuantity
                const newTotalCost = p.total_cost + randomQuantity * randomPrice
                return {
                  ...p,
                  current_quantity: newQuantity,
                  total_cost: newTotalCost,
                  average_cost: newTotalCost / newQuantity,
                }
              }
              return p
            }),
          )
        } else {
          // Handle sale with FIFO
          const product = products.find((p) => p.product_id === randomProductId)
          if (product && product.current_quantity >= randomQuantity) {
            // Update batches (consume oldest first)
            let remainingToSell = randomQuantity
            setBatches((prev) =>
              prev.map((batch) => {
                if (batch.product_id === randomProductId && remainingToSell > 0 && batch.remaining_quantity > 0) {
                  const consumed = Math.min(remainingToSell, batch.remaining_quantity)
                  remainingToSell -= consumed
                  return {
                    ...batch,
                    remaining_quantity: batch.remaining_quantity - consumed,
                  }
                }
                return batch
              }),
            )

            // Update product
            setProducts((prev) =>
              prev.map((p) => {
                if (p.product_id === randomProductId) {
                  const newQuantity = p.current_quantity - randomQuantity
                  const costOfSale = calculateFIFOCost(randomProductId, randomQuantity)
                  const newTotalCost = p.total_cost - costOfSale
                  return {
                    ...p,
                    current_quantity: newQuantity,
                    total_cost: newTotalCost,
                    average_cost: newQuantity > 0 ? newTotalCost / newQuantity : 0,
                  }
                }
                return p
              }),
            )
          }
        }
      }
    } catch (error) {
      console.error('Error simulating event:', error)
      alert('Failed to process event. Please try again.')
    }
  }

  // Auto simulator
  const startSimulator = async () => {
    setSimulatorRunning(true)
    const interval = setInterval(async () => {
      await simulateKafkaEvent()
    }, 2000)

    setTimeout(() => {
      clearInterval(interval)
      setSimulatorRunning(false)
    }, 20000) // Run for 20 seconds
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10"></div>
        
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
              <Database className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Inventory Management
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Secure access to your inventory dashboard
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Sign In
              </Button>
            </form>
            
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-100">
              <p className="text-sm font-medium text-gray-700 mb-2">Demo Credentials:</p>
              <div className="space-y-1 text-sm">
                <p className="flex items-center">
                  <span className="text-gray-500 mr-2">Username:</span>
                  <code className="bg-white px-2 py-1 rounded text-blue-600 font-mono">admin</code>
                </p>
                <p className="flex items-center">
                  <span className="text-gray-500 mr-2">Password:</span>
                  <code className="bg-white px-2 py-1 rounded text-blue-600 font-mono">inventory123</code>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
              Inventory Management System
            </h1>
            <p className="text-lg text-gray-600 flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-500" />
              FIFO Costing with Real-time Kafka Integration
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200">
              <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></div>
              <span className="text-sm font-medium text-gray-700">
                {isConnected ? (backendAvailable ? "Connected to Backend" : "Connected (Mock Data)") : "Disconnected"}
              </span>
            </div>
            <Button 
              onClick={() => setIsAuthenticated(false)} 
              variant="outline"
              className="flex items-center gap-2 border-gray-300 hover:bg-gray-50"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-100">Total Products</CardTitle>
              <Package className="h-5 w-5 text-blue-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{products.length}</div>
              <p className="text-xs text-blue-200 mt-1">Active inventory items</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-100">Total Inventory Value</CardTitle>
              <DollarSign className="h-5 w-5 text-green-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ${products.reduce((sum, p) => sum + (typeof p.total_cost === 'number' ? p.total_cost : parseFloat(p.total_cost || '0')), 0).toLocaleString()}
              </div>
              <p className="text-xs text-green-200 mt-1">Current market value</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-100">Total Transactions</CardTitle>
              <Activity className="h-5 w-5 text-purple-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{transactions.length}</div>
              <p className="text-xs text-purple-200 mt-1">Purchase & sale records</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-100">Active Batches</CardTitle>
              <TrendingUp className="h-5 w-5 text-orange-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{batches.filter((b) => b.remaining_quantity > 0).length}</div>
              <p className="text-xs text-orange-200 mt-1">FIFO inventory batches</p>
            </CardContent>
          </Card>
        </div>

        {/* Kafka Simulator */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Zap className="w-6 h-6 text-blue-500" />
              Kafka Event Simulator
            </CardTitle>
            <CardDescription className="text-gray-600">
              Simulate real-time inventory events (purchases and sales) with FIFO cost calculations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={simulateKafkaEvent} 
                disabled={simulatorRunning}
                className="flex-1 h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Zap className="w-4 h-4 mr-2" />
                Send Single Event
              </Button>
              <Button 
                onClick={startSimulator} 
                disabled={simulatorRunning}
                className="flex-1 h-12 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Activity className="w-4 h-4 mr-2" />
                {simulatorRunning ? "Running Auto Simulator..." : "Start Auto Simulator (20s)"}
              </Button>
            </div>
            {simulatorRunning && (
              <Alert className="border-blue-200 bg-blue-50">
                <Activity className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Auto simulator is running. New events will be generated every 2 seconds for 20 seconds.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm border border-gray-200">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Stock Overview
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Transaction Ledger
            </TabsTrigger>
            <TabsTrigger value="batches" className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Inventory Batches
            </TabsTrigger>
            <TabsTrigger value="fifo" className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              FIFO Logic
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <BarChart3 className="w-6 h-6 text-blue-500" />
                  Product Stock Overview
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Current inventory levels with FIFO-based costing calculations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/50">
                        <TableHead className="font-semibold text-gray-700">Product ID</TableHead>
                        <TableHead className="font-semibold text-gray-700">Current Quantity</TableHead>
                        <TableHead className="font-semibold text-gray-700">Total Inventory Cost</TableHead>
                        <TableHead className="font-semibold text-gray-700">Average Cost per Unit</TableHead>
                        <TableHead className="font-semibold text-gray-700">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.product_id} className="hover:bg-gray-50/50 transition-colors">
                          <TableCell className="font-medium text-blue-600">{product.product_id}</TableCell>
                          <TableCell className="font-semibold">{product.current_quantity}</TableCell>
                          <TableCell className="font-semibold text-green-600">
                            ${typeof product.total_cost === 'number' ? product.total_cost.toFixed(2) : parseFloat(product.total_cost || '0').toFixed(2)}
                          </TableCell>
                          <TableCell className="font-semibold text-gray-600">
                            ${typeof product.average_cost === 'number' ? product.average_cost.toFixed(2) : parseFloat(product.average_cost || '0').toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={product.current_quantity > 50 ? "default" : "destructive"}
                              className={`${product.current_quantity > 50 ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'}`}
                            >
                              {product.current_quantity > 50 ? "In Stock" : "Low Stock"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Activity className="w-6 h-6 text-purple-500" />
                  Transaction Ledger
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Complete history of purchases and sales with FIFO cost calculations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/50">
                        <TableHead className="font-semibold text-gray-700">Timestamp</TableHead>
                        <TableHead className="font-semibold text-gray-700">Product ID</TableHead>
                        <TableHead className="font-semibold text-gray-700">Type</TableHead>
                        <TableHead className="font-semibold text-gray-700">Quantity</TableHead>
                        <TableHead className="font-semibold text-gray-700">Unit Price</TableHead>
                        <TableHead className="font-semibold text-gray-700">Total Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id} className="hover:bg-gray-50/50 transition-colors">
                          <TableCell className="text-sm text-gray-600">
                            {new Date(transaction.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell className="font-medium text-blue-600">{transaction.product_id}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={transaction.event_type === "purchase" ? "default" : "secondary"}
                              className={`flex items-center gap-1 ${
                                transaction.event_type === "purchase" 
                                  ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                  : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                              }`}
                            >
                              {transaction.event_type === "purchase" ? (
                                <>
                                  <TrendingUp className="w-3 h-3" /> Purchase
                                </>
                              ) : (
                                <>
                                  <TrendingDown className="w-3 h-3" /> Sale
                                </>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold">{transaction.quantity}</TableCell>
                          <TableCell className="text-gray-600">
                            {transaction.unit_price ? `$${transaction.unit_price.toFixed(2)}` : "FIFO Calculated"}
                          </TableCell>
                          <TableCell className="font-semibold text-green-600">
                            ${transaction.total_cost?.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="batches">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Layers className="w-6 h-6 text-orange-500" />
                  Inventory Batches
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Current inventory batches ordered by purchase date (FIFO order)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/50">
                        <TableHead className="font-semibold text-gray-700">Batch ID</TableHead>
                        <TableHead className="font-semibold text-gray-700">Product ID</TableHead>
                        <TableHead className="font-semibold text-gray-700">Original Quantity</TableHead>
                        <TableHead className="font-semibold text-gray-700">Remaining Quantity</TableHead>
                        <TableHead className="font-semibold text-gray-700">Unit Price</TableHead>
                        <TableHead className="font-semibold text-gray-700">Purchase Date</TableHead>
                        <TableHead className="font-semibold text-gray-700">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {batches
                        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                        .map((batch) => (
                          <TableRow key={batch.id} className="hover:bg-gray-50/50 transition-colors">
                            <TableCell className="font-medium text-orange-600">{batch.id}</TableCell>
                            <TableCell className="text-blue-600">{batch.product_id}</TableCell>
                            <TableCell className="font-semibold">{batch.quantity}</TableCell>
                            <TableCell className="font-semibold">{batch.remaining_quantity}</TableCell>
                            <TableCell className="font-semibold text-green-600">${batch.unit_price.toFixed(2)}</TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {new Date(batch.created_at).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={batch.remaining_quantity > 0 ? "default" : "secondary"}
                                className={`${
                                  batch.remaining_quantity > 0 
                                    ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' 
                                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                }`}
                              >
                                {batch.remaining_quantity > 0 ? "Active" : "Consumed"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fifo">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Calculator className="w-6 h-6 text-indigo-500" />
                  FIFO Logic Explanation
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Understanding First-In-First-Out inventory costing method
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="prose max-w-none">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">How FIFO Works:</h3>
                  <ol className="list-decimal list-inside space-y-3 text-gray-700">
                    <li className="flex items-start">
                      <span className="mr-2"><strong>Purchase Events:</strong></span>
                      Create new inventory batches with quantity, unit price, and timestamp
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2"><strong>Sale Events:</strong></span>
                      Consume inventory from the oldest batches first (First-In-First-Out)
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2"><strong>Cost Calculation:</strong></span>
                      Sale cost is calculated by consuming quantities from oldest batches at their original purchase prices
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2"><strong>Remaining Inventory:</strong></span>
                      Always valued at the most recent purchase prices
                    </li>
                  </ol>

                  <Separator className="my-6" />

                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Example FIFO Calculation:</h3>
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-100">
                    <p className="font-semibold text-gray-900 mb-3">
                      <strong>Purchases:</strong>
                    </p>
                    <ul className="list-disc list-inside ml-4 space-y-1 text-gray-700">
                      <li>Jan 1: 100 units @ $80 each</li>
                      <li>Jan 2: 100 units @ $90 each</li>
                    </ul>
                    <p className="mt-4 font-semibold text-gray-900">
                      <strong>Sale:</strong> 150 units
                    </p>
                    <p className="mt-3 font-semibold text-gray-900">
                      <strong>FIFO Cost Calculation:</strong>
                    </p>
                    <ul className="list-disc list-inside ml-4 space-y-1 text-gray-700">
                      <li>First 100 units from Jan 1 batch: 100 × $80 = $8,000</li>
                      <li>Next 50 units from Jan 2 batch: 50 × $90 = $4,500</li>
                      <li className="font-semibold text-green-600">
                        <strong>Total Sale Cost: $12,500</strong>
                      </li>
                    </ul>
                    <p className="mt-4 font-semibold text-gray-900">
                      <strong>Remaining Inventory:</strong> 50 units @ $90 = $4,500
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
