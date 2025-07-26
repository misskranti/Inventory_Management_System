class InventoryEventProcessor {
  constructor() {
    this.products = new Map()
    this.batches = []
    this.transactions = []
  }

  // FIFO Cost Calculation
  calculateFIFOCost(productId, saleQuantity) {
    const productBatches = this.batches
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

  // Process Purchase Event
  processPurchase(event) {
    const { product_id, quantity, unit_price, timestamp } = event

    // Create new batch
    const newBatch = {
      id: `B${Date.now()}`,
      product_id,
      quantity,
      unit_price,
      remaining_quantity: quantity,
      created_at: timestamp,
    }
    this.batches.push(newBatch)

    // Update product
    const product = this.products.get(product_id) || {
      product_id,
      current_quantity: 0,
      total_cost: 0,
      average_cost: 0,
    }

    const newQuantity = product.current_quantity + quantity
    const newTotalCost = product.total_cost + quantity * unit_price

    this.products.set(product_id, {
      ...product,
      current_quantity: newQuantity,
      total_cost: newTotalCost,
      average_cost: newTotalCost / newQuantity,
    })

    // Add transaction
    this.transactions.push({
      id: Date.now().toString(),
      product_id,
      event_type: "purchase",
      quantity,
      unit_price,
      total_cost: quantity * unit_price,
      timestamp,
    })

    console.log(`✅ Processed PURCHASE: ${quantity} units of ${product_id} @ $${unit_price}`)
  }

  // Process Sale Event
  processSale(event) {
    const { product_id, quantity, timestamp } = event

    const product = this.products.get(product_id)
    if (!product || product.current_quantity < quantity) {
      console.log(`❌ Insufficient inventory for sale: ${product_id}`)
      return
    }

    // Calculate FIFO cost
    const totalCost = this.calculateFIFOCost(product_id, quantity)

    // Update batches (consume oldest first)
    let remainingToSell = quantity
    for (const batch of this.batches) {
      if (batch.product_id === product_id && remainingToSell > 0 && batch.remaining_quantity > 0) {
        const consumed = Math.min(remainingToSell, batch.remaining_quantity)
        batch.remaining_quantity -= consumed
        remainingToSell -= consumed
      }
    }

    // Update product
    const newQuantity = product.current_quantity - quantity
    const newTotalCost = product.total_cost - totalCost

    this.products.set(product_id, {
      ...product,
      current_quantity: newQuantity,
      total_cost: newTotalCost,
      average_cost: newQuantity > 0 ? newTotalCost / newQuantity : 0,
    })

    // Add transaction
    this.transactions.push({
      id: Date.now().toString(),
      product_id,
      event_type: "sale",
      quantity,
      total_cost: totalCost,
      timestamp,
    })

    console.log(`✅ Processed SALE: ${quantity} units of ${product_id} for $${totalCost.toFixed(2)}`)
  }

  // Process Kafka Event
  processEvent(event) {
    console.log(`📥 Processing event: ${event.event_type} for ${event.product_id}`)

    if (event.event_type === "purchase") {
      this.processPurchase(event)
    } else if (event.event_type === "sale") {
      this.processSale(event)
    } else {
      console.log(`❌ Unknown event type: ${event.event_type}`)
    }
  }

  // Get current state
  getState() {
    return {
      products: Array.from(this.products.values()),
      batches: this.batches,
      transactions: this.transactions,
    }
  }

  // Print current state
  printState() {
    console.log("\n📊 CURRENT INVENTORY STATE:")
    console.log("============================")

    console.log("\n🏷️  PRODUCTS:")
    for (const product of this.products.values()) {
      console.log(
        `${product.product_id}: ${product.current_quantity} units, $${product.total_cost.toFixed(2)} total, $${product.average_cost.toFixed(2)} avg`,
      )
    }

    console.log("\n📦 ACTIVE BATCHES:")
    const activeBatches = this.batches.filter((b) => b.remaining_quantity > 0)
    for (const batch of activeBatches) {
      console.log(
        `${batch.id}: ${batch.product_id}, ${batch.remaining_quantity}/${batch.quantity} units @ $${batch.unit_price}`,
      )
    }

    console.log("\n📋 RECENT TRANSACTIONS:")
    const recentTransactions = this.transactions.slice(-5)
    for (const txn of recentTransactions) {
      console.log(
        `${txn.event_type.toUpperCase()}: ${txn.product_id}, ${txn.quantity} units, $${txn.total_cost?.toFixed(2) || "N/A"}`,
      )
    }
    console.log("")
  }
}

// Simulate Kafka Consumer
async function simulateKafkaConsumer() {
  console.log("🎯 Starting Kafka Consumer Simulation...")
  console.log("📡 Listening to topic: inventory-events")
  console.log("")

  const processor = new InventoryEventProcessor()

  // Sample events (simulating Kafka messages)
  const events = [
    {
      product_id: "PRD001",
      event_type: "purchase",
      quantity: 100,
      unit_price: 80.0,
      timestamp: "2025-01-26T10:00:00Z",
    },
    {
      product_id: "PRD001",
      event_type: "purchase",
      quantity: 100,
      unit_price: 90.0,
      timestamp: "2025-01-26T11:00:00Z",
    },
    {
      product_id: "PRD001",
      event_type: "sale",
      quantity: 50,
      timestamp: "2025-01-26T12:00:00Z",
    },
    {
      product_id: "PRD002",
      event_type: "purchase",
      quantity: 75,
      unit_price: 120.0,
      timestamp: "2025-01-26T13:00:00Z",
    },
    {
      product_id: "PRD002",
      event_type: "sale",
      quantity: 25,
      timestamp: "2025-01-26T14:00:00Z",
    },
  ]

  // Process events with delay
  for (const event of events) {
    processor.processEvent(event)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  processor.printState()

  console.log("🎉 Kafka Consumer Simulation Complete!")
  return processor.getState()
}

// Run the simulation
if (require.main === module) {
  simulateKafkaConsumer().catch(console.error)
}

module.exports = { InventoryEventProcessor, simulateKafkaConsumer }
