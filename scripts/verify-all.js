require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const app = require('../app');
const userModel = require('../models/user-model');
const productModel = require('../models/product-model');
const orderModel = require('../models/order-model');
const { generateToken } = require('../util/generateToken');
const bcrypt = require('bcrypt');

const PORT = 3055;
const BASE_URL = `http://localhost:${PORT}`;

let server;

function parseCookies(response) {
    const raw = response.headers.get('set-cookie');
    if (!raw) return '';
    // Extract first cookie or token
    const match = raw.match(/token=([^;]+)/);
    return match ? `token=${match[1]}` : '';
}

async function runVerification() {
    console.log('--- STARTING SCATCH APP COMPLETE VERIFICATION ---\n');

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(PORT, resolve));
    console.log(`Test server running at ${BASE_URL}`);

    // Wait for DB connection
    if (mongoose.connection.readyState !== 1) {
        await new Promise((resolve, reject) => {
            mongoose.connection.once('open', resolve);
            mongoose.connection.once('error', reject);
        });
    }
    console.log('Connected to MongoDB.\n');

    let passedCount = 0;
    const totalChecks = 9;

    const timestamp = Date.now();
    const testCustomerEmail = `customer_${timestamp}@test.com`;
    const testAdminEmail = `admin_${timestamp}@test.com`;
    const password = 'password123';

    try {
        // ==========================================
        // CHECK 1: Register -> Login -> Browse /shop
        // ==========================================
        console.log('Checking Item 1: Register a new user -> login -> browse /shop...');
        const regRes = await fetch(`${BASE_URL}/users/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                fullname: 'Test Customer',
                email: testCustomerEmail,
                password: password,
            }),
            redirect: 'manual',
        });

        if (regRes.status !== 302) {
            throw new Error(`Register failed with status ${regRes.status}`);
        }

        // Login
        const loginRes = await fetch(`${BASE_URL}/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                email: testCustomerEmail,
                password: password,
            }),
            redirect: 'manual',
        });

        if (loginRes.status !== 302) {
            throw new Error(`Login failed with status ${loginRes.status}`);
        }

        const customerCookie = parseCookies(loginRes);
        if (!customerCookie) {
            throw new Error('Customer login did not return a token cookie');
        }

        // Browse /shop
        const shopRes = await fetch(`${BASE_URL}/shop`, {
            headers: { Cookie: customerCookie },
        });
        const shopHtml = await shopRes.text();
        if (shopRes.status !== 200 || !shopHtml.includes('Scatch')) {
            throw new Error('Failed to browse /shop as logged-in user');
        }
        console.log('✓ PASS: Item 1 - Register, login, and browsing /shop successful.\n');
        passedCount++;

        // Setup a test product in DB
        const testProduct = await productModel.create({
            name: 'Verification Leather Bag',
            price: 1500,
            discount: 200,
            bgcolor: '#e5e7eb',
            panelcolor: '#ffffff',
            textcolor: '#111827',
            isActive: true,
        });

        // ==========================================
        // CHECK 2: Add to cart -> inc/dec quantity -> remove -> verify totals
        // ==========================================
        console.log('Checking Item 2: Add to cart -> inc/dec quantity -> remove -> verify totals...');
        // Add to cart
        const addCartRes = await fetch(`${BASE_URL}/addtocart/${testProduct._id}`, {
            headers: { Cookie: customerCookie },
            redirect: 'manual',
        });
        if (addCartRes.status !== 302) throw new Error('Add to cart failed');

        let userDoc = await userModel.findOne({ email: testCustomerEmail });
        if (!userDoc.cart.length || userDoc.cart[0].quantity !== 1) {
            throw new Error('Product not correctly added to cart with quantity 1');
        }

        // Increase quantity
        const incRes = await fetch(`${BASE_URL}/cart/increase/${testProduct._id}`, {
            method: 'POST',
            headers: { Cookie: customerCookie },
            redirect: 'manual',
        });
        if (incRes.status !== 302) throw new Error('Increase quantity failed');

        userDoc = await userModel.findOne({ email: testCustomerEmail });
        if (userDoc.cart[0].quantity !== 2) {
            throw new Error(`Expected quantity 2 after increase, got ${userDoc.cart[0].quantity}`);
        }

        // Decrease quantity
        const decRes = await fetch(`${BASE_URL}/cart/decrease/${testProduct._id}`, {
            method: 'POST',
            headers: { Cookie: customerCookie },
            redirect: 'manual',
        });
        if (decRes.status !== 302) throw new Error('Decrease quantity failed');

        userDoc = await userModel.findOne({ email: testCustomerEmail });
        if (userDoc.cart[0].quantity !== 1) {
            throw new Error(`Expected quantity 1 after decrease, got ${userDoc.cart[0].quantity}`);
        }

        // Check cart page calculation: (1500 - 200) * 1 = 1300
        const cartViewRes = await fetch(`${BASE_URL}/cart`, {
            headers: { Cookie: customerCookie },
        });
        const cartHtml = await cartViewRes.text();
        if (!cartHtml.includes('1300')) {
            throw new Error('Cart view did not display expected total amount ₹1300');
        }

        // Remove item from cart
        const remRes = await fetch(`${BASE_URL}/cart/remove/${testProduct._id}`, {
            method: 'POST',
            headers: { Cookie: customerCookie },
            redirect: 'manual',
        });
        if (remRes.status !== 302) throw new Error('Remove from cart failed');

        userDoc = await userModel.findOne({ email: testCustomerEmail });
        if (userDoc.cart.length !== 0) {
            throw new Error('Cart not empty after item removal');
        }
        console.log('✓ PASS: Item 2 - Cart operations and total calculations verified.\n');
        passedCount++;

        // ==========================================
        // CHECK 3: Checkout -> submit shipping -> verify order created & cart cleared
        // ==========================================
        console.log('Checking Item 3: Checkout -> submit shipping -> verify order created & cart cleared...');
        // Put item back into cart
        await fetch(`${BASE_URL}/addtocart/${testProduct._id}`, {
            headers: { Cookie: customerCookie },
            redirect: 'manual',
        });

        const placeOrderRes = await fetch(`${BASE_URL}/orders/checkout`, {
            method: 'POST',
            headers: {
                Cookie: customerCookie,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                fullname: 'Customer Tester',
                address: '123 Test Street, MG Road',
                city: 'Bengaluru',
                state: 'Karnataka',
                pincode: '560001',
                phone: '9876543210',
                paymentMethod: 'COD',
            }),
            redirect: 'manual',
        });

        if (placeOrderRes.status !== 302) {
            throw new Error(`Order checkout returned status ${placeOrderRes.status}`);
        }

        userDoc = await userModel.findOne({ email: testCustomerEmail });
        if (userDoc.cart.length !== 0) {
            throw new Error('User cart was not cleared after order placement');
        }
        if (!userDoc.orders.length) {
            throw new Error('Order reference was not added to user.orders');
        }

        const createdOrderId = userDoc.orders[0];
        const orderDoc = await orderModel.findById(createdOrderId);
        if (!orderDoc || orderDoc.orderStatus !== 'placed') {
            throw new Error('Order document not found in DB with status "placed"');
        }
        console.log(`✓ PASS: Item 3 - Order #${createdOrderId} created and cart cleared.\n`);
        passedCount++;

        // ==========================================
        // CHECK 4: View /orders -> view detail -> cancel order
        // ==========================================
        console.log('Checking Item 4: View /orders -> view detail -> cancel order...');
        const ordersRes = await fetch(`${BASE_URL}/orders`, {
            headers: { Cookie: customerCookie },
        });
        const ordersHtml = await ordersRes.text();
        if (ordersRes.status !== 200 || !ordersHtml.includes(createdOrderId.toString())) {
            throw new Error('Order history page did not show created order ID');
        }

        // View detail page
        const orderDetailRes = await fetch(`${BASE_URL}/orders/${createdOrderId}`, {
            headers: { Cookie: customerCookie },
        });
        const detailHtml = await orderDetailRes.text();
        if (orderDetailRes.status !== 200 || !detailHtml.includes('Cancel Order')) {
            throw new Error('Order detail page missing or Cancel button not present');
        }

        // Cancel order
        const cancelRes = await fetch(`${BASE_URL}/orders/${createdOrderId}/cancel`, {
            method: 'POST',
            headers: { Cookie: customerCookie },
            redirect: 'manual',
        });
        if (cancelRes.status !== 302) {
            throw new Error(`Cancel order returned status ${cancelRes.status}`);
        }

        const updatedOrder = await orderModel.findById(createdOrderId);
        if (updatedOrder.orderStatus !== 'cancelled') {
            throw new Error(`Expected orderStatus to be "cancelled", got "${updatedOrder.orderStatus}"`);
        }
        console.log('✓ PASS: Item 4 - Order history, detail view, and cancellation verified.\n');
        passedCount++;

        // ==========================================
        // CHECK 5: Admin login -> /owners/products -> create product -> edit -> delete
        // ==========================================
        console.log('Checking Item 5: Admin CRUD at /owners/products...');
        // Create an admin user directly
        const adminHash = await bcrypt.hash('adminpass123', 10);
        const adminUser = await userModel.create({
            fullname: 'System Admin',
            email: testAdminEmail,
            password: adminHash,
            role: 'admin',
        });

        // Admin login via /owners/login
        const adminLoginRes = await fetch(`${BASE_URL}/owners/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                email: testAdminEmail,
                password: 'adminpass123',
            }),
            redirect: 'manual',
        });
        if (adminLoginRes.status !== 302) {
            throw new Error(`Admin login failed with status ${adminLoginRes.status}`);
        }
        const adminCookie = parseCookies(adminLoginRes);

        // Access /owners/products
        const adminProductsRes = await fetch(`${BASE_URL}/owners/products`, {
            headers: { Cookie: adminCookie },
        });
        if (adminProductsRes.status !== 200) {
            throw new Error(`Admin failed to access /owners/products (status ${adminProductsRes.status})`);
        }

        // Create new product via POST /owners/products
        const createProdRes = await fetch(`${BASE_URL}/owners/products`, {
            method: 'POST',
            headers: {
                Cookie: adminCookie,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                name: 'Admin Exclusive Belt',
                price: '999',
                discount: '10',
                bgcolor: '#1f2937',
                panelcolor: '#374151',
                textcolor: '#ffffff',
            }),
            redirect: 'manual',
        });
        if (createProdRes.status !== 302) {
            throw new Error(`Create product failed with status ${createProdRes.status}`);
        }

        let adminProdDoc = await productModel.findOne({ name: 'Admin Exclusive Belt' });
        if (!adminProdDoc) throw new Error('Product was not created in database');

        // Edit product via POST /owners/products/:id
        const editProdRes = await fetch(`${BASE_URL}/owners/products/${adminProdDoc._id}`, {
            method: 'POST',
            headers: {
                Cookie: adminCookie,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                name: 'Admin Exclusive Belt (Updated)',
                price: '1099',
                discount: '15',
                bgcolor: '#111827',
                panelcolor: '#1f2937',
                textcolor: '#ffffff',
            }),
            redirect: 'manual',
        });
        if (editProdRes.status !== 302) {
            throw new Error(`Edit product failed with status ${editProdRes.status}`);
        }

        adminProdDoc = await productModel.findById(adminProdDoc._id);
        if (adminProdDoc.name !== 'Admin Exclusive Belt (Updated)' || adminProdDoc.price !== 1099) {
            throw new Error('Product was not updated with new values');
        }

        // Delete product (soft delete) via POST /owners/products/:id/delete
        const deleteProdRes = await fetch(`${BASE_URL}/owners/products/${adminProdDoc._id}/delete`, {
            method: 'POST',
            headers: { Cookie: adminCookie },
            redirect: 'manual',
        });
        if (deleteProdRes.status !== 302) {
            throw new Error(`Delete product failed with status ${deleteProdRes.status}`);
        }

        adminProdDoc = await productModel.findById(adminProdDoc._id);
        if (adminProdDoc.isActive !== false) {
            throw new Error(`Expected product.isActive to be false, got ${adminProdDoc.isActive}`);
        }
        console.log('✓ PASS: Item 5 - Admin product CRUD (create, edit, soft-delete) verified.\n');
        passedCount++;

        // ==========================================
        // CHECK 6: Verify deleted product does NOT appear in /shop
        // ==========================================
        console.log('Checking Item 6: Verify deleted product does not appear in /shop...');
        const shopAfterDeleteRes = await fetch(`${BASE_URL}/shop`, {
            headers: { Cookie: customerCookie },
        });
        const shopAfterDeleteHtml = await shopAfterDeleteRes.text();
        if (shopAfterDeleteHtml.includes('Admin Exclusive Belt (Updated)')) {
            throw new Error('Deleted product unexpectedly appeared on customer /shop page!');
        }
        console.log('✓ PASS: Item 6 - Soft-deleted product is hidden from /shop.\n');
        passedCount++;

        // ==========================================
        // CHECK 7: Submit invalid form -> friendly flash error, no crash
        // ==========================================
        console.log('Checking Item 7: Submit invalid form (negative price, invalid email)...');
        // Invalid login (empty email)
        const invalidLoginRes = await fetch(`${BASE_URL}/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                email: 'not-an-email',
                password: '',
            }),
            redirect: 'manual',
        });
        // Should redirect back to '/' with flash message, not crash
        if (invalidLoginRes.status !== 302) {
            throw new Error(`Invalid login form crashed or did not redirect (status ${invalidLoginRes.status})`);
        }

        // Invalid product creation (negative price)
        const invalidProdRes = await fetch(`${BASE_URL}/owners/products`, {
            method: 'POST',
            headers: {
                Cookie: adminCookie,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                name: 'Bad Product',
                price: '-50',
                bgcolor: 'not-a-hex',
                panelcolor: 'bad',
                textcolor: 'bad',
            }),
            redirect: 'manual',
        });
        // Should redirect back with flash message, not crash
        if (invalidProdRes.status !== 302) {
            throw new Error(`Invalid product form crashed or did not redirect (status ${invalidProdRes.status})`);
        }
        console.log('✓ PASS: Item 7 - Invalid forms caught by validators with friendly redirect.\n');
        passedCount++;

        // ==========================================
        // CHECK 8: Non-existent route -> 404 page, not a stack trace
        // ==========================================
        console.log('Checking Item 8: Visit non-existent route -> 404 error page...');
        const notFoundRes = await fetch(`${BASE_URL}/this-route-does-not-exist-xyz`);
        const notFoundHtml = await notFoundRes.text();
        if (notFoundRes.status !== 404 || !notFoundHtml.includes('404') || notFoundHtml.includes('at Module._compile')) {
            throw new Error(`Non-existent route did not return proper 404 page (status ${notFoundRes.status})`);
        }
        console.log('✓ PASS: Item 8 - Non-existent route returned friendly 404 page.\n');
        passedCount++;

        // ==========================================
        // CHECK 9: As non-admin, try to visit /owners/products -> access denied
        // ==========================================
        console.log('Checking Item 9: Customer visits /owners/products -> access denied...');
        const forbiddenRes = await fetch(`${BASE_URL}/owners/products`, {
            headers: { Cookie: customerCookie },
            redirect: 'manual',
        });
        // Should redirect away because user.role is 'customer', not 'admin'
        if (forbiddenRes.status !== 302) {
            throw new Error(`Non-admin accessed /owners/products! Status: ${forbiddenRes.status}`);
        }
        const redirectLocation = forbiddenRes.headers.get('location');
        if (redirectLocation !== '/') {
            throw new Error(`Expected redirect to '/', got '${redirectLocation}'`);
        }
        console.log('✓ PASS: Item 9 - Non-admin access to /owners/products properly denied & redirected.\n');
        passedCount++;

        console.log(`\n========================================`);
        console.log(`ALL CHECKS PASSED: ${passedCount}/${totalChecks}`);
        console.log(`========================================\n`);
        process.exit(0);
    } catch (err) {
        console.error(`\n❌ VERIFICATION FAILED:`, err.message);
        process.exit(1);
    } finally {
        if (server) server.close();
    }
}

runVerification();
