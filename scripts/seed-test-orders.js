const admin = require('firebase-admin');
const serviceAccount = require('../bot/service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://food-hubbie-default-rtdb.firebaseio.com"
});

const db = admin.database();

const testOrders = [
  {
    customerName: "Alice Smith",
    phone: "9876543210",
    address: "123 Green Street, Bihar",
    total: 450,
    paymentMethod: "UPI",
    status: "Placed",
    type: "Online",
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // 10 mins ago
    cart: [{ name: "Farmhouse Pizza", qty: 1, price: 350, size: "Medium", addon: "Extra Cheese" }]
  },
  {
    customerName: "Bob Jones",
    phone: "9123456789",
    address: "45 Blue Avenue, Bihar",
    total: 890,
    paymentMethod: "Cash",
    status: "Preparing",
    type: "Online",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    cart: [{ name: "Chocolate Truffle Cake", qty: 1, price: 800, size: "1kg", addon: "None" }]
  },
  {
    customerName: "Charlie Brown",
    phone: "9988776655",
    address: "Table 4",
    total: 250,
    paymentMethod: "Cash",
    status: "Delivered",
    type: "Dine-in",
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    cart: [{ name: "Margherita Pizza", qty: 1, price: 250, size: "Regular", addon: "None" }]
  },
  {
    customerName: "David Wilson",
    phone: "9445566778",
    address: "78 Red Lane, Bihar",
    total: 1200,
    paymentMethod: "UPI",
    status: "Confirmed",
    type: "Online",
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 mins ago
    cart: [{ name: "Veg Loaded Pizza", qty: 2, price: 1000, size: "Large", addon: "Coke" }]
  },
  {
    customerName: "Eva Green",
    phone: "9001122334",
    address: "12 Yellow Road, Bihar",
    total: 600,
    paymentMethod: "Card",
    status: "Placed",
    type: "Online",
    createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(), // 2 mins ago
    cart: [{ name: "Butterscotch Cake", qty: 1, price: 600, size: "0.5kg", addon: "Birthday Candle" }]
  }
];

async function seed() {
  console.log("🚀 Seeding 5 Fresh Test Orders...");
  
  const outlets = ['outlet_pizza', 'outlet_cake'];
  
  for (const oid of outlets) {
    const path = `businesses/business_roshani/outlets/${oid}/orders`;
    console.log(`\n📦 Seeding ${oid} at ${path}...`);
    
    // Clear first
    await db.ref(path).set(null);
    
    for (const order of testOrders) {
      const newRef = db.ref(path).push();
      await newRef.set({
          ...order,
          orderId: newRef.key.slice(-5).toUpperCase(),
          outlet: oid
      });
    }
  }

  console.log("\n✅ Success! 10 Test Orders generated (5 per outlet).");
  console.log("Check your admin-dashboard and RiderApp dashboards now!");
  process.exit(0);
}

seed();
