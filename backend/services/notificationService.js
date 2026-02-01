const nodemailer = require('nodemailer');
require('dotenv').config();

// Admin notification details
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'hariprasathg6380@gmail.com';
const ADMIN_PHONE = process.env.ADMIN_PHONE || '6380442089';

// Twilio configuration (optional - for SMS)
let twilioClient = null;
const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio if credentials are provided
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    try {
        const twilio = require('twilio');
        twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        console.log('✅ Twilio SMS/WhatsApp initialized successfully');
    } catch (error) {
        console.log('⚠️ Twilio not available - WhatsApp/SMS will be logged only');
    }
}

// Telegram configuration (FREE - completely free forever)
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Send Telegram message (FREE)
async function sendTelegramMessage(message) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.log('📱 Telegram message (not configured):\n' + message);
        return false;
    }

    try {
        const https = require('https');
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        
        const data = JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: message
        });
        
        return new Promise((resolve) => {
            const options = {
                hostname: 'api.telegram.org',
                path: `/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': data.length
                }
            };

            const req = https.request(options, (res) => {
                let body = '';
                res.on('data', (chunk) => body += chunk);
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        console.log('✅ Telegram message sent successfully');
                        resolve(true);
                    } else {
                        console.log('⚠️ Telegram message sent but got status:', res.statusCode);
                        if (body) {
                            try {
                                const errorData = JSON.parse(body);
                                console.log('📋 Telegram Error Details:', errorData);
                            } catch (e) {
                                console.log('📋 Telegram Response:', body);
                            }
                        }
                        resolve(false);
                    }
                });
            });

            req.on('error', (error) => {
                console.error('❌ Telegram error:', error.message);
                resolve(false);
            });

            req.write(data);
            req.end();
        });
    } catch (error) {
        console.error('❌ Error sending Telegram message:', error.message);
        return false;
    }
}

// Email configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'hariprasathg6380@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'your-app-specific-password'
    }
});

// Verify email configuration on startup
transporter.verify((error, success) => {
    if (error) {
        console.error('⚠️ Email configuration error:', error.message);
        console.log('📧 Fix: Use Gmail App Password (16-char), not your regular password');
        console.log('📧 Go to: https://myaccount.google.com/apppasswords');
    } else {
        console.log('✅ Email service configured and verified successfully');
    }
});

// Send SMS via Twilio
async function sendSMSViaTwilio(phoneNumber, message) {
    if (twilioClient && TWILIO_PHONE) {
        try {
            const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
            const result = await twilioClient.messages.create({
                body: message,
                from: TWILIO_PHONE,
                to: formattedPhone
            });
            console.log(`✅ SMS sent successfully to ${formattedPhone}. SID: ${result.sid}`);
            return true;
        } catch (error) {
            console.error('❌ Twilio SMS error:', error.message);
            return false;
        }
    } else {
        // Fallback: Log the SMS (for development/testing)
        console.log(`📱 SMS NOTIFICATION (Twilio not configured):`);
        console.log(`   To: +91${phoneNumber}`);
        console.log(`   Message: ${message}`);
        return true;
    }
}

// Send email notification
async function sendOrderEmail(email, orderDetails) {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER || 'noreply@kcporganics.com',
            to: email,
            subject: 'Order Confirmation - KCP Organics',
            html: `
                <h2>Order Confirmation</h2>
                <p>Thank you for your order!</p>
                <h3>Order Details:</h3>
                <ul>
                    <li>Order ID: ${orderDetails.orderId}</li>
                    <li>Total Amount: Rs. ${orderDetails.amount}</li>
                    <li>Items: ${orderDetails.items}</li>
                    <li>Delivery Address: ${orderDetails.address}</li>
                </ul>
                <p>We will notify you once your order is shipped.</p>
                <p>Thank you for shopping with KCP Organics!</p>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully');
        return true;
    } catch (error) {
        console.error('❌ Error sending email:', error.message);
        return false;
    }
}

// Send SMS notification
async function sendOrderSMS(phoneNumber, orderDetails) {
    const message = `🌿 KCP Organics: Order Confirmed! Order ID: ${orderDetails.orderId}, Amount: Rs. ${orderDetails.amount}. Thank you for shopping with us!`;
    return await sendSMSViaTwilio(phoneNumber, message);
}

// Send detailed SMS with product information
async function sendOrderDetailedSMS(phoneNumber, orderDetails) {
    try {
        // Format phone number
        const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
        
        // Build product list
        let productsList = '';
        if (orderDetails.products && Array.isArray(orderDetails.products)) {
            orderDetails.products.forEach((product, index) => {
                productsList += `\n${index + 1}. ${product.name || 'Product'} (ID: ${product.productId}) x${product.quantity}`;
            });
        }

        // Create detailed message (SMS has 160 char limit, so split if needed)
        const message = `🌿 KCP Organics Order Confirmed!\n\nOrder ID: ${orderDetails.orderId}\nPhone: ${formattedPhone}\n\nProducts:${productsList}\n\nTotal: Rs.${orderDetails.amount}\nStatus: Pending\n\nTrack your order: Visit track-order.html with Order ID and Mobile Number\n\nThank you!`;
        
        // Send SMS
        return await sendSMSViaTwilio(phoneNumber, message);
    } catch (error) {
        console.error('❌ Error sending detailed SMS:', error.message);
        return false;
    }
}

// Send WhatsApp notification with product information
async function sendOrderWhatsApp(phoneNumber, orderDetails) {
    try {
        // Format phone number
        const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
        
        // Build product list for WhatsApp
        let productsList = '';
        if (orderDetails.products && Array.isArray(orderDetails.products)) {
            orderDetails.products.forEach((product, index) => {
                productsList += `\n${index + 1}. ${product.name || 'Product'} (ID: ${product.productId}) x${product.quantity}`;
            });
        }

        // Create WhatsApp message
        const message = `🌿 *KCP Organics Order Confirmed!*\n\n📦 *Order ID:* ${orderDetails.orderId}\n📱 *Phone:* ${formattedPhone}\n\n*Products:*${productsList}\n\n💰 *Total:* Rs.${orderDetails.amount}\n✓ *Status:* Pending\n\n🔗 *Track your order:*\nVisit track-order.html with Order ID and Mobile Number\n\n✨ Thank you for shopping with us!`;
        
        // Send WhatsApp message via Twilio
        if (twilioClient && TWILIO_PHONE) {
            try {
                const result = await twilioClient.messages.create({
                    body: message,
                    from: `whatsapp:${TWILIO_PHONE}`,
                    to: `whatsapp:${formattedPhone}`
                });
                console.log(`✅ WhatsApp notification sent successfully to ${formattedPhone}. SID: ${result.sid}`);
                return true;
            } catch (error) {
                console.log(`📱 WhatsApp notification (Twilio WhatsApp not configured):\n${message}`);
                return false;
            }
        } else {
            // Fallback: Log the WhatsApp message
            console.log(`📱 WhatsApp NOTIFICATION (Twilio not configured):\n${message}`);
            return false;
        }
    } catch (error) {
        console.error('❌ Error sending WhatsApp notification:', error.message);
        return false;
    }
}

// Send order notification via Telegram (FREE)
async function sendOrderTelegram(orderDetails) {
    try {
        // Build product list with full details
        let productsList = '';
        if (orderDetails.products && Array.isArray(orderDetails.products)) {
            orderDetails.products.forEach((product, index) => {
                const productName = product.name || 'Product';
                const productId = product.productId || 'N/A';
                const productPrice = product.price || 0;
                const quantity = product.quantity || 1;
                const total = (productPrice * quantity).toFixed(2);
                
                productsList += `${index + 1}. ${productName}\n   ID: ${productId}\n   Price: Rs.${productPrice}\n   Qty: ${quantity}\n   Total: Rs.${total}\n\n`;
            });
        }

        // Create detailed message with product information
        const message = `Order Confirmed!\n\nOrder ID: ${orderDetails.orderId}\nCustomer: ${orderDetails.customerName}\nPhone: ${orderDetails.customerPhone}\n\nPRODUCTS:\n${productsList}\nTotal Amount: Rs.${orderDetails.amount}\nPayment: ${orderDetails.paymentMethod}\nStatus: Pending\n\nDelivery Address:\n${orderDetails.address}\n\nTrack: Use Order ID and Mobile on track-order.html`;
        
        console.log('📱 Sending Telegram order notification to Chat ID:', TELEGRAM_CHAT_ID);
        const result = await sendTelegramMessage(message);
        
        if (result) {
            console.log('✅ Telegram order notification sent successfully');
        } else {
            console.log('⚠️ Telegram notification may not have been delivered');
        }
        
        return result;
    } catch (error) {
        console.error('❌ Error formatting Telegram order notification:', error.message);
        return false;
    }
}

// Send notification to admin
async function sendAdminNotification(phoneNumber, email, orderDetails) {
    try {
        const adminMailOptions = {
            from: process.env.EMAIL_USER || 'noreply@kcporganics.com',
            to: email,
            subject: 'New Order Received - KCP Organics',
            html: `
                <h2>New Order Received!</h2>
                <h3>Order Details:</h3>
                <ul>
                    <li>Order ID: ${orderDetails.orderId}</li>
                    <li>Customer Name: ${orderDetails.customerName}</li>
                    <li>Customer Email: ${orderDetails.customerEmail}</li>
                    <li>Customer Phone: ${orderDetails.customerPhone}</li>
                    <li>Total Amount: Rs. ${orderDetails.amount}</li>
                    <li>Items: ${orderDetails.items}</li>
                    <li>Delivery Address: ${orderDetails.address}</li>
                    <li>Order Date: ${new Date().toLocaleString()}</li>
                </ul>
            `
        };

        await transporter.sendMail(adminMailOptions);
        console.log(`✅ Admin notification email sent to ${ADMIN_EMAIL}`);
        
        // Send SMS notification
        const smsMessage = `🌿 KCP Organics: New Order! ID: ${orderDetails.orderId}, Amount: Rs. ${orderDetails.amount}, Customer: ${orderDetails.customerName}`;
        await sendSMSViaTwilio(phoneNumber, smsMessage);
        
        return true;
    } catch (error) {
        console.error('❌ Error sending admin notification:', error.message);
        if (error.code === 'EAUTH') {
            console.error('📧 Authentication failed. Verify Gmail App Password in .env file');
            console.error('📧 Get app password: https://myaccount.google.com/apppasswords');
        }
        return false;
    }
}

// Send message notification to admin
async function sendMessageNotificationToAdmin(messageDetails) {
    try {
        // Send Email to Admin
        const adminMailOptions = {
            from: process.env.EMAIL_USER || 'noreply@kcporganics.com',
            to: ADMIN_EMAIL,
            subject: `📩 New Message Received - ${messageDetails.subject}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #166534 0%, #22c55e 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
                        <h2 style="margin: 0;">🌿 KCP Organics - New Message Alert</h2>
                    </div>
                    <div style="background: #f9f9f9; padding: 25px; border-radius: 0 0 10px 10px;">
                        <h3 style="color: #166534; margin-top: 0;">You have received a new message!</h3>
                        
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>👤 Name:</strong></td>
                                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${messageDetails.name}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>📧 Email:</strong></td>
                                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${messageDetails.email}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>📌 Subject:</strong></td>
                                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${messageDetails.subject}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px;"><strong>📅 Date:</strong></td>
                                <td style="padding: 10px;">${new Date().toLocaleString()}</td>
                            </tr>
                        </table>
                        
                        <div style="margin-top: 20px; padding: 15px; background: white; border-left: 4px solid #22c55e; border-radius: 5px;">
                            <strong>💬 Message:</strong>
                            <p style="margin: 10px 0 0 0; color: #333;">${messageDetails.message}</p>
                        </div>
                        
                        <div style="margin-top: 25px; text-align: center;">
                            <a href="http://localhost:5000/admin-dashboard.html" style="display: inline-block; background: #dd610e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">
                                View in Dashboard
                            </a>
                        </div>
                    </div>
                    <div style="text-align: center; padding: 15px; color: #888; font-size: 12px;">
                        <p>© 2026 KCP Organics. All rights reserved.</p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(adminMailOptions);
        console.log(`✅ Admin notification email sent to ${ADMIN_EMAIL}`);
        
        // Send SMS notification to Admin
        const smsMessage = `🌿 KCP Organics: New message from ${messageDetails.name}. Subject: ${messageDetails.subject}. Check your dashboard!`;
        await sendSMSViaTwilio(ADMIN_PHONE, smsMessage);
        
        return true;
    } catch (error) {
        console.error('❌ Error sending message notification to admin:', error.message);
        return false;
    }
}

module.exports = {
    sendOrderDetailedSMS,
    sendOrderWhatsApp,
    sendOrderTelegram,
    sendTelegramMessage,
    sendSMSViaTwilio,
    ADMIN_EMAIL,
    ADMIN_PHONE
};
