const API_URL = 'http://localhost:5000/api';
let uploadedImageUrl = ''; // Store uploaded image URL
let isImageUploading = false; // Track if image is currently uploading

// ===== LOCAL STORAGE HELPER =====
const AdminStorage = {
    // Dashboard Analytics
    setDashboardMetrics: (metrics) => localStorage.setItem('dashboardMetrics', JSON.stringify(metrics)),
    getDashboardMetrics: () => JSON.parse(localStorage.getItem('dashboardMetrics') || '{}'),
    
    // Sales Data
    setSalesData: (data) => localStorage.setItem('salesData', JSON.stringify(data)),
    getSalesData: () => JSON.parse(localStorage.getItem('salesData') || '[]'),
    
    // User Actions Log
    setUserLog: (log) => localStorage.setItem('userActivityLog', JSON.stringify(log)),
    getUserLog: () => JSON.parse(localStorage.getItem('userActivityLog') || '[]'),
    
    // Analytics Cache
    setAnalytics: (analytics) => localStorage.setItem('adminAnalytics', JSON.stringify(analytics)),
    getAnalytics: () => JSON.parse(localStorage.getItem('adminAnalytics') || '{}'),
    
    // Add activity to log
    addActivity: (activity) => {
        const log = AdminStorage.getUserLog();
        log.push({ ...activity, timestamp: new Date().toISOString() });
        AdminStorage.setUserLog(log.slice(-100)); // Keep last 100 activities
    }
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    loadDashboardData();
    setupNavigation();
    setupProductForm();
    setupUserForm();
    setupImageUpload();
    initializeAnalytics();
    loadReviewsBadge();
    loadVideosBadge();
    
    // Setup About Us Video Form
    const aboutUsVideoForm = document.getElementById('aboutUsVideoForm');
    if (aboutUsVideoForm) {
        aboutUsVideoForm.addEventListener('submit', saveAboutUsVideo);
    }
    
    // Load orders on page load with a small delay to ensure DOM is ready
    setTimeout(() => {
        if (document.getElementById('ordersTable')) {
            loadOrders();
        }
    }, 100);
});

// ===== NAVIGATION =====
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            showSection(section);
            
            // Update active state
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Load section data
            if (section === 'products') loadProducts();
            if (section === 'users') loadUsers();
            if (section === 'messages') loadMessages();
            if (section === 'orders') loadOrders();
            if (section === 'reviews') loadReviews();
            if (section === 'videos') loadVideos();
            if (section === 'aboutus') loadAboutUsVideos();
        });
    });
}

function showSection(sectionId) {
    const sections = document.querySelectorAll('.section-content');
    const titles = {
        'dashboard': 'Dashboard',
        'products': 'Product Management',
        'users': 'User Management',
        'messages': 'Messages',
        'orders': 'Customer Orders',
        'reviews': 'Customer Reviews',
        'videos': 'Shop by Videos',
        'aboutus': 'About Us Videos'
    };

    sections.forEach(section => section.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    document.getElementById('sectionTitle').textContent = titles[sectionId];
}

// ===== DASHBOARD DATA =====
async function loadDashboardData() {
    try {
        const [usersRes, productsRes, messagesRes, unreadRes, ordersRes] = await Promise.all([
            fetch(`${API_URL}/users/count/total`),
            fetch(`${API_URL}/products`),
            fetch(`${API_URL}/messages`),
            fetch(`${API_URL}/messages/count/unread`),
            fetch(`${API_URL}/orders`)
        ]);

        const usersData = await usersRes.json();
        const productsData = await productsRes.json();
        const messagesData = await messagesRes.json();
        const unreadData = await unreadRes.json();
        const ordersData = await ordersRes.json();

        document.getElementById('totalUsers').textContent = usersData.totalUsers || 0;
        document.getElementById('totalProducts').textContent = productsData.data?.length || 0;
        document.getElementById('totalMessages').textContent = messagesData.data?.length || 0;
        document.getElementById('unreadMessages').textContent = unreadData.unreadCount || 0;
        document.getElementById('messageBadge').textContent = unreadData.unreadCount || 0;
        
        // Count pending orders
        const pendingOrders = ordersData.data?.filter(o => o.orderStatus === 'pending').length || 0;
        document.getElementById('orderBadge').textContent = pendingOrders;
        
        // Update analytics
        updateAnalyticsDisplay();
        displayCustomerAnalytics();
        displayRevenueAnalytics();
        
        AdminStorage.addActivity({
            type: 'dashboard_loaded',
            action: 'Dashboard data refreshed'
        });
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// ===== PRODUCTS MANAGEMENT =====
async function loadProducts() {
    try {
        console.log('Loading products from:', `${API_URL}/products`);
        const response = await fetch(`${API_URL}/products`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Products response:', data);

        const container = document.getElementById('productsTableContent');
        
        // Check if data has products
        if (!data.data || data.data.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No products found. Click "Add Product" to create one.</p>';
            return;
        }

        // Group products by category
        const groupedProducts = {};
        data.data.forEach(product => {
            const category = product.category || 'Uncategorized';
            if (!groupedProducts[category]) {
                groupedProducts[category] = [];
            }
            groupedProducts[category].push(product);
        });

        // Sort categories alphabetically
        const sortedCategories = Object.keys(groupedProducts).sort();

        // Generate HTML for grouped products
        let html = '';
        sortedCategories.forEach(category => {
            html += `
                <div style="margin-bottom: 30px; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #2e7d32 0%, #558b2f 100%); color: white; padding: 15px 20px; font-weight: 600; font-size: 16px;">
                        <i class="fas fa-folder-open"></i> ${category} (${groupedProducts[category].length} items)
                    </div>
                    <table class="data-table" style="margin: 0;">
                        <thead style="background: #f9f9f9;">
                            <tr>
                                <th style="padding: 12px 15px;">Product Name</th>
                                <th style="padding: 12px 15px;">Price</th>
                                <th style="padding: 12px 15px;">Stock</th>
                                <th style="padding: 12px 15px;">Created</th>
                                <th style="padding: 12px 15px;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${groupedProducts[category].map(product => `
                                <tr style="border-bottom: 1px solid #eee;">
                                    <td style="padding: 12px 15px;"><strong>${product.name}</strong></td>
                                    <td style="padding: 12px 15px;">$${product.price.toFixed(2)}</td>
                                    <td style="padding: 12px 15px;">
                                        <span style="background: ${product.stock > 20 ? '#4CAF50' : product.stock > 0 ? '#FFC107' : '#f44336'}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                                            ${product.stock} units
                                        </span>
                                    </td>
                                    <td style="padding: 12px 15px;">${new Date(product.createdAt).toLocaleDateString()}</td>
                                    <td style="padding: 12px 15px;">
                                        <div class="action-buttons">
                                            <button class="btn btn-info" onclick="editProduct('${product._id}')" style="padding: 6px 12px; font-size: 12px;">Edit</button>
                                            <button class="btn btn-danger" onclick="deleteProduct('${product._id}')" style="padding: 6px 12px; font-size: 12px;">Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        });

        container.innerHTML = html;
    } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('productsTableContent').innerHTML = '<p style="text-align: center; color: #d32f2f; padding: 20px;">Error loading products: ' + error.message + '</p>';
    }
}

function openProductModal() {
    document.getElementById('productId').value = '';
    document.getElementById('modalTitle').textContent = 'Add New Product';
    document.getElementById('productForm').reset();
    uploadedImageUrl = ''; // Reset uploaded image
    isImageUploading = false; // Reset upload flag
    document.getElementById('imagePreview').style.display = 'none'; // Hide preview
    document.getElementById('uploadStatus').style.display = 'none'; // Hide upload status
    document.getElementById('uploadStatus').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading image...'; // Reset status message
    document.getElementById('productImage').value = ''; // Clear file input
    clearUnitsForm(); // Clear units form
    addUnitField(); // Add one empty unit field
    document.getElementById('productModal').classList.add('show');
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('show');
}

// ===== IMAGE UPLOAD SETUP =====
function setupImageUpload() {
    const fileInput = document.getElementById('productImage');
    const fileLabel = document.querySelector('.file-input-label');
    const imagePreview = document.getElementById('imagePreview');

    // Prevent any form submission from file input
    fileInput.addEventListener('change', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleImageSelect();
    });

    // Click to upload
    fileLabel.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileInput.click();
    });

    // Drag and drop
    fileLabel.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileLabel.style.backgroundColor = 'rgba(46, 204, 113, 0.2)';
    });

    fileLabel.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileLabel.style.backgroundColor = 'rgba(46, 204, 113, 0.05)';
    });

    fileLabel.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileLabel.style.backgroundColor = 'rgba(46, 204, 113, 0.05)';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            handleImageSelect();
        }
    });
}

async function handleImageSelect() {
    const fileInput = document.getElementById('productImage');
    const file = fileInput.files[0];

    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        fileInput.value = '';
        return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        fileInput.value = '';
        return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        const preview = document.getElementById('imagePreview');
        document.getElementById('previewImg').src = e.target.result;
        preview.style.display = 'block';
    };
    reader.readAsDataURL(file);

    // Show upload status
    document.getElementById('uploadStatus').style.display = 'block';
    
    // Upload image and wait for completion
    await uploadImage(file);
}

async function uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    
    isImageUploading = true; // Set upload flag

    try {
        console.log('Uploading image:', file.name);
        const response = await fetch(`${API_URL}/uploads/upload`, {
            method: 'POST',
            body: formData
        });

        console.log('Upload response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Upload result:', result);

        if (result.success) {
            uploadedImageUrl = result.imageUrl;
            console.log('Image uploaded successfully:', uploadedImageUrl);
            document.getElementById('uploadStatus').style.display = 'none'; // Hide status
            document.getElementById('uploadStatus').innerHTML = '<i class="fas fa-check-circle"></i> Image uploaded successfully!';
        } else {
            alert('Error uploading image: ' + (result.message || 'Unknown error'));
            removeImage();
        }
    } catch (error) {
        console.error('Error uploading image:', error);
        alert('Error uploading image: ' + error.message);
        removeImage();
    } finally {
        isImageUploading = false; // Clear upload flag
    }
}

function removeImage() {
    const fileInput = document.getElementById('productImage');
    const imagePreview = document.getElementById('imagePreview');
    const uploadStatus = document.getElementById('uploadStatus');
    
    fileInput.value = '';
    imagePreview.style.display = 'none';
    uploadStatus.style.display = 'none';
    uploadedImageUrl = '';
}

function setupProductForm() {
    const form = document.getElementById('productForm');
    
    // Prevent enter key from submitting form except on submit button
    form.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target.type !== 'submit') {
            e.preventDefault();
        }
    });
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Check if image is still uploading
        if (isImageUploading) {
            alert('Please wait for the image to finish uploading before submitting the form.');
            return;
        }
        
        const productId = document.getElementById('productId').value;
        
        // Validate required fields
        const name = document.getElementById('productName').value.trim();
        const category = document.getElementById('productCategory').value;
        const description = document.getElementById('productDescription').value.trim();
        
        if (!name || !category || !description) {
            alert('Please fill in all required fields marked with *');
            return;
        }
        
        // Get units - REQUIRED
        const units = getUnitsFromForm();
        if (units.length === 0) {
            alert('Please add at least one product unit with price');
            return;
        }
        
        // Determine image URL
        let imageUrl = 'product.jpg'; // default image
        
        if (uploadedImageUrl) {
            imageUrl = uploadedImageUrl; // Use uploaded image if available
        }
        
        // Calculate base price from first unit (for backward compatibility)
        const basePrice = units[0].price;
        
        const productData = {
            name,
            category,
            price: basePrice,
            stock: 0, // Stock is managed per unit
            description,
            image: imageUrl,
            units: units
        };

        console.log('Submitting product:', productData);

        try {
            const url = productId ? `${API_URL}/products/${productId}` : `${API_URL}/products`;
            const method = productId ? 'PUT' : 'POST';

            console.log(`${method} to ${url}`);

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });

            console.log('Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Response data:', result);

            if (result.success) {
                alert(productId ? 'Product updated successfully!' : 'Product added successfully!');
                closeProductModal();
                uploadedImageUrl = ''; // Reset image URL
                loadProducts();
                loadDashboardData();
            } else {
                alert('Error: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error saving product:', error);
            alert('Error saving product: ' + error.message);
        }
    });
}

async function editProduct(productId) {
    try {
        const response = await fetch(`${API_URL}/products/${productId}`);
        const data = await response.json();

        if (data.success) {
            const product = data.data;
            document.getElementById('productId').value = product._id;
            document.getElementById('productName').value = product.name;
            document.getElementById('productCategory').value = product.category;
            document.getElementById('productPrice').value = product.price;
            document.getElementById('productStock').value = product.stock;
            document.getElementById('productDescription').value = product.description;
            
            // Clear and populate units
            clearUnitsForm();
            if (product.units && product.units.length > 0) {
                product.units.forEach(unit => {
                    addUnitField();
                    const unitDivs = document.querySelectorAll('[id^="unit-"]');
                    const lastUnitDiv = unitDivs[unitDivs.length - 1];
                    
                    lastUnitDiv.querySelector('.unit-type-select').value = unit.unit;
                    lastUnitDiv.querySelector('.unit-quantity-input').value = unit.quantity;
                    lastUnitDiv.querySelector('.unit-price-input').value = unit.price;
                });
            } else {
                addUnitField(); // Add empty unit field if none exist
            }
            
            // Store the existing image URL for reference
            uploadedImageUrl = product.image;
            
            // Show preview if image exists and is not default
            if (product.image && product.image !== 'product.jpg') {
                document.getElementById('previewImg').src = product.image;
                document.getElementById('imagePreview').style.display = 'block';
            } else {
                document.getElementById('imagePreview').style.display = 'none';
            }
            
            document.getElementById('modalTitle').textContent = 'Edit Product';
            document.getElementById('productModal').classList.add('show');
        }
    } catch (error) {
        console.error('Error loading product:', error);
        alert('Error loading product');
    }
}

async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
        const response = await fetch(`${API_URL}/products/${productId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            alert('Product deleted successfully!');
            loadProducts();
            loadDashboardData();
        } else {
            alert('Error: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('Error deleting product');
    }
}

// ===== USERS MANAGEMENT =====
async function loadUsers() {
    try {
        const response = await fetch(`${API_URL}/users`);
        const data = await response.json();

        const table = document.getElementById('usersTable');

        if (!data.success || data.data.length === 0) {
            table.innerHTML = '<tr><td colspan="6" class="text-center">No users found</td></tr>';
            return;
        }

        table.innerHTML = data.data.map(user => `
            <tr>
                <td><strong>${user.name}</strong></td>
                <td>${user.email}</td>
                <td>${user.number}</td>
                <td><span style="background-color: ${user.role === 'admin' ? '#e74c3c' : '#3498db'}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${user.role}</span></td>
                <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-info" onclick="editUser('${user._id}')">Edit</button>
                        <button class="btn btn-danger" onclick="deleteUser('${user._id}')">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading users:', error);
        document.getElementById('usersTable').innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error loading users</td></tr>';
    }
}

function closeUserModal() {
    document.getElementById('userModal').classList.remove('show');
}

function setupUserForm() {
    document.getElementById('userForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const userId = document.getElementById('userId').value;
        const userData = {
            number: document.getElementById('userNumber').value,
            role: document.getElementById('userRole').value
        };

        try {
            const response = await fetch(`${API_URL}/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            const result = await response.json();

            if (result.success) {
                alert('User updated successfully!');
                closeUserModal();
                loadUsers();
                loadDashboardData();
            } else {
                alert('Error: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error updating user:', error);
            alert('Error updating user');
        }
    });
}

async function editUser(userId) {
    try {
        const response = await fetch(`${API_URL}/users/${userId}`);
        const data = await response.json();

        if (data.success) {
            const user = data.data;
            document.getElementById('userId').value = user._id;
            document.getElementById('userName').value = user.name;
            document.getElementById('userEmail').value = user.email;
            document.getElementById('userNumber').value = user.number;
            document.getElementById('userRole').value = user.role;
            document.getElementById('userModal').classList.add('show');
        }
    } catch (error) {
        console.error('Error loading user:', error);
        alert('Error loading user');
    }
}

async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
        const response = await fetch(`${API_URL}/users/${userId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            alert('User deleted successfully!');
            loadUsers();
            loadDashboardData();
        } else {
            alert('Error: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user');
    }
}

// ===== MESSAGES MANAGEMENT =====
async function loadMessages() {
    try {
        const response = await fetch(`${API_URL}/messages`);
        const data = await response.json();

        const container = document.getElementById('messagesList');

        if (!data.success || data.data.length === 0) {
            container.innerHTML = '<div class="text-center">No messages found</div>';
            return;
        }

        container.innerHTML = data.data.map(message => `
            <div class="message-item ${message.status === 'unread' ? 'unread' : ''}">
                <div class="message-content">
                    <div class="message-from">${message.name}</div>
                    <div class="message-subject"><strong>Subject:</strong> ${message.subject}</div>
                    <div class="message-preview">${message.message.substring(0, 100)}...</div>
                </div>
                <div class="message-meta">
                    <span class="message-time">${new Date(message.createdAt).toLocaleDateString()}</span>
                    <button class="btn btn-info" onclick="viewMessage('${message._id}')">View</button>
                    <button class="btn btn-danger" onclick="deleteMessage('${message._id}')">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading messages:', error);
        document.getElementById('messagesList').innerHTML = '<div class="text-center">Error loading messages</div>';
    }
}

async function viewMessage(messageId) {
    try {
        const response = await fetch(`${API_URL}/messages/${messageId}`);
        const data = await response.json();

        if (data.success) {
            const message = data.data;
            const detail = document.getElementById('messageDetail');
            
            detail.innerHTML = `
                <h3>Message Details</h3>
                <p><strong>From:</strong> ${message.name}</p>
                <p><strong>Email:</strong> ${message.email}</p>
                <p><strong>Subject:</strong> ${message.subject}</p>
                <p><strong>Date:</strong> ${new Date(message.createdAt).toLocaleString()}</p>
                <div class="message-body">
                    <strong>Message:</strong><br>
                    ${message.message}
                </div>
                <div class="form-actions">
                    <button class="btn btn-primary" onclick="markAsRead('${message._id}')">Mark as Read</button>
                    <button class="btn btn-secondary" onclick="closeMessageModal()">Close</button>
                </div>
            `;

            document.getElementById('messageModal').classList.add('show');

            // Mark as read and update badge
            if (message.status === 'unread') {
                await fetch(`${API_URL}/messages/${messageId}/read`, { method: 'PUT' });
                
                // Decrement badge count immediately
                const messageBadge = document.getElementById('messageBadge');
                const currentBadgeCount = parseInt(messageBadge.textContent) || 0;
                if (currentBadgeCount > 0) {
                    messageBadge.textContent = currentBadgeCount - 1;
                }
                
                loadMessages();
                loadDashboardData();
            }
        }
    } catch (error) {
        console.error('Error loading message:', error);
        alert('Error loading message');
    }
}

function closeMessageModal() {
    document.getElementById('messageModal').classList.remove('show');
}

async function markAsRead(messageId) {
    try {
        const response = await fetch(`${API_URL}/messages/${messageId}/read`, {
            method: 'PUT'
        });

        const result = await response.json();

        if (result.success) {
            closeMessageModal();
            loadMessages();
            loadDashboardData();
            alert('Message marked as read!');
        }
    } catch (error) {
        console.error('Error marking message as read:', error);
    }
}

async function deleteMessage(messageId) {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
        const response = await fetch(`${API_URL}/messages/${messageId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            alert('Message deleted successfully!');
            loadMessages();
            loadDashboardData();
        } else {
            alert('Error: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error deleting message:', error);
        alert('Error deleting message');
    }
}

// ===== ORDERS MANAGEMENT =====
async function loadOrders() {
    try {
        console.log('Loading orders from:', `${API_URL}/orders`);
        const response = await fetch(`${API_URL}/orders`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Orders response:', data);

        const table = document.getElementById('ordersTable');
        
        if (!data.data || data.data.length === 0) {
            table.innerHTML = '<tr><td colspan="9" class="text-center">No orders found. Customers will see orders here.</td></tr>';
            return;
        }

        table.innerHTML = data.data.map(order => {
            const totalAmount = order.totalAmount || 0;
            const customerName = order.customerName || 'N/A';
            const customerEmail = order.customerEmail || 'N/A';
            const customerPhone = order.customerPhone || 'N/A';
            const orderStatus = order.orderStatus || 'pending';
            const createdAt = order.createdAt || new Date().toISOString();
            
            // Extract product names from products array
            let productNames = 'N/A';
            if (order.products && Array.isArray(order.products) && order.products.length > 0) {
                productNames = order.products.map(p => p.name || p.productName || 'Unknown').join(', ');
            }
            
            // Format date and time
            const dateTime = new Date(createdAt).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            
            return `
            <tr>
                <td><strong>${order._id.substring(0, 8)}</strong></td>
                <td>${customerName}</td>
                <td>${customerEmail}</td>
                <td>${customerPhone}</td>
                <td>${productNames}</td>
                <td>$${totalAmount.toFixed(2)}</td>
                <td>
                    <span class="status-badge status-${orderStatus}">
                        ${orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1)}
                    </span>
                </td>
                <td>${dateTime}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-info" onclick="viewOrder('${order._id}')">View</button>
                        <button class="btn btn-warning" onclick="updateOrderStatus('${order._id}')">Update</button>
                        <button class="btn btn-danger" onclick="deleteOrder('${order._id}')">Delete</button>
                    </div>
                </td>
            </tr>
        `;
        }).join('');
    } catch (error) {
        console.error('Error loading orders:', error);
        document.getElementById('ordersTable').innerHTML = '<tr><td colspan="9" class="text-center text-danger">Error loading orders: ' + error.message + '</td></tr>';
    }
}

async function viewOrder(orderId) {
    try {
        const response = await fetch(`${API_URL}/orders/${orderId}`);
        const data = await response.json();

        if (data.success) {
            const order = data.data;
            let productsHtml = order.products.map(p => `
                <tr>
                    <td>${p.productName}</td>
                    <td>${p.quantity}</td>
                    <td>$${p.price.toFixed(2)}</td>
                    <td>$${p.total.toFixed(2)}</td>
                </tr>
            `).join('');

            const detailHTML = `
                <div class="order-detail-content">
                    <h3>Order #${order._id.substring(0, 8)}</h3>
                    
                    <div class="detail-section">
                        <h4>Customer Information</h4>
                        <p><strong>Name:</strong> ${order.customerName}</p>
                        <p><strong>Email:</strong> ${order.customerEmail}</p>
                        <p><strong>Phone:</strong> ${order.customerPhone}</p>
                        <p><strong>Address:</strong> ${order.customerAddress}</p>
                    </div>

                    <div class="detail-section">
                        <h4>Order Details</h4>
                        <p><strong>Status:</strong> <span class="status-badge status-${order.orderStatus}">${order.orderStatus}</span></p>
                        <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
                        <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
                    </div>

                    <div class="detail-section">
                        <h4>Products</h4>
                        <table class="detail-table">
                            <thead>
                                <tr>
                                    <th>Product Name</th>
                                    <th>Quantity</th>
                                    <th>Price</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${productsHtml}
                            </tbody>
                        </table>
                    </div>

                    <div class="detail-section">
                        <h4>Order Summary</h4>
                        <p><strong>Total Amount:</strong> $${order.totalAmount.toFixed(2)}</p>
                        ${order.notes ? `<p><strong>Notes:</strong> ${order.notes}</p>` : ''}
                    </div>
                </div>
            `;

            document.getElementById('orderDetail').innerHTML = detailHTML;
            document.getElementById('orderModal').classList.add('show');
            
            // If order is pending, refresh dashboard to update badge count
            if (order.orderStatus === 'pending') {
                loadDashboardData();
            }
        }
    } catch (error) {
        console.error('Error viewing order:', error);
        alert('Error loading order details');
    }
}

async function updateOrderStatus(orderId) {
    // Store the order ID globally for the modal
    window.currentOrderId = orderId;
    
    // Fetch current order details
    try {
        const response = await fetch(`${API_URL}/orders/${orderId}`);
        const data = await response.json();
        
        if (data.success) {
            const order = data.data;
            // Set the current status in the modal
            document.getElementById('statusSelect').value = order.orderStatus || 'pending';
            document.getElementById('trackingNumber').value = order.trackingNumber || '';
            document.getElementById('statusNotes').value = '';
            
            // Show the modal
            document.getElementById('statusModal').style.display = 'block';
        } else {
            alert('Error loading order: ' + data.message);
        }
    } catch (error) {
        console.error('Error loading order:', error);
        alert('Error loading order details');
    }
}

function closeStatusModal() {
    document.getElementById('statusModal').style.display = 'none';
    window.currentOrderId = null;
}

async function confirmStatusUpdate() {
    const orderId = window.currentOrderId;
    const newStatus = document.getElementById('statusSelect').value;
    const trackingNumber = document.getElementById('trackingNumber').value.trim();

    if (!newStatus) {
        alert('Please select a status');
        return;
    }

    try {
        const updateData = { orderStatus: newStatus };
        if (trackingNumber) {
            updateData.trackingNumber = trackingNumber;
        }

        const response = await fetch(`${API_URL}/orders/${orderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });

        const result = await response.json();

        if (result.success) {
            alert('Order status updated successfully!');
            closeStatusModal();
            loadOrders();
            loadDashboardData();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error updating order:', error);
        alert('Error updating order');
    }
}

async function deleteOrder(orderId) {
    if (!confirm('Are you sure you want to delete this order?')) return;

    try {
        const response = await fetch(`${API_URL}/orders/${orderId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            alert('Order deleted successfully!');
            loadOrders();
            loadDashboardData();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error deleting order:', error);
        alert('Error deleting order');
    }
}

function closeOrderModal() {
    document.getElementById('orderModal').classList.remove('show');
}

// ===== ANALYTICS & REPORTING =====
function initializeAnalytics() {
    updateAnalyticsCache();
    loadAnalyticsCharts();
}

function updateAnalyticsCache() {
    const metrics = {
        lastUpdated: new Date().toISOString(),
        sessionStartTime: localStorage.getItem('sessionStartTime') || new Date().toISOString(),
        pageViewCount: (parseInt(localStorage.getItem('pageViewCount') || 0) + 1),
        totalAdminActions: parseInt(localStorage.getItem('totalAdminActions') || 0)
    };
    AdminStorage.setDashboardMetrics(metrics);
    localStorage.setItem('pageViewCount', metrics.pageViewCount.toString());
}

function loadAnalyticsCharts() {
    // Sales by category chart
    const salesCtx = document.getElementById('salesChart');
    if (salesCtx) {
        displaySalesAnalytics();
    }
    
    // Revenue trend chart
    const revenueCtx = document.getElementById('revenueChart');
    if (revenueCtx) {
        displayRevenueAnalytics();
    }
    
    // Customer analytics
    displayCustomerAnalytics();
    updateAnalyticsDisplay();
}

function updateAnalyticsDisplay() {
    const metrics = AdminStorage.getDashboardMetrics();
    const analytics = AdminStorage.getAnalytics();
    
    // Update page views
    const pageViewsEl = document.getElementById('pageViews');
    if (pageViewsEl) {
        pageViewsEl.textContent = metrics.pageViewCount || 0;
    }
    
    // Update admin actions
    const adminActionsEl = document.getElementById('adminActions');
    if (adminActionsEl) {
        adminActionsEl.textContent = metrics.totalAdminActions || 0;
    }
    
    // Update total revenue
    const totalRevenueEl = document.getElementById('totalRevenue');
    if (totalRevenueEl) {
        const revenue = analytics.totalRevenue || 0;
        totalRevenueEl.textContent = '$' + revenue.toFixed(2);
    }
    
    // Update active users
    const activeUsersEl = document.getElementById('activeUsers');
    if (activeUsersEl) {
        activeUsersEl.textContent = analytics.activeUsers || 0;
    }
}

async function displaySalesAnalytics() {
    try {
        const response = await fetch(`${API_URL}/products`);
        const data = await response.json();
        
        if (data.data && data.data.length > 0) {
            const categories = {};
            
            data.data.forEach(product => {
                const cat = product.category || 'Uncategorized';
                categories[cat] = (categories[cat] || 0) + (product.stock || 0);
            });
            
            AdminStorage.addActivity({
                type: 'analytics_viewed',
                action: 'Viewed sales analytics',
                user: 'admin'
            });
        }
    } catch (error) {
        console.error('Error displaying sales analytics:', error);
    }
}

async function displayRevenueAnalytics() {
    try {
        const response = await fetch(`${API_URL}/orders`);
        const data = await response.json();
        
        if (data.data && data.data.length > 0) {
            let totalRevenue = 0;
            const dailyRevenue = {};
            
            data.data.forEach(order => {
                totalRevenue += order.totalAmount || 0;
                const date = new Date(order.createdAt).toLocaleDateString();
                dailyRevenue[date] = (dailyRevenue[date] || 0) + (order.totalAmount || 0);
            });
            
            const analytics = AdminStorage.getAnalytics();
            analytics.totalRevenue = totalRevenue;
            analytics.dailyRevenue = dailyRevenue;
            analytics.totalOrders = data.data.length;
            AdminStorage.setAnalytics(analytics);
        }
    } catch (error) {
        console.error('Error displaying revenue analytics:', error);
    }
}

async function displayCustomerAnalytics() {
    try {
        const response = await fetch(`${API_URL}/users`);
        const data = await response.json();
        
        if (data.data && data.data.length > 0) {
            const analytics = AdminStorage.getAnalytics();
            analytics.totalCustomers = data.data.length;
            analytics.activeUsers = data.data.filter(u => u.lastLogin).length;
            analytics.newUsers = data.data.filter(u => {
                const created = new Date(u.createdAt);
                const today = new Date();
                return created.toDateString() === today.toDateString();
            }).length;
            
            AdminStorage.setAnalytics(analytics);
            
            AdminStorage.addActivity({
                type: 'analytics_updated',
                action: 'Updated customer analytics',
                customers: analytics.totalCustomers
            });
        }
    } catch (error) {
        console.error('Error displaying customer analytics:', error);
    }
}

// Generate reports
function generateSalesReport() {
    const analytics = AdminStorage.getAnalytics();
    const metrics = AdminStorage.getDashboardMetrics();
    
    const report = {
        generatedAt: new Date().toISOString(),
        period: 'Current Session',
        metrics: metrics,
        sales: analytics,
        activities: AdminStorage.getUserLog()
    };
    
    downloadReport(report, 'sales_report');
}

function generateCustomerReport() {
    const analytics = AdminStorage.getAnalytics();
    
    const report = {
        generatedAt: new Date().toISOString(),
        totalCustomers: analytics.totalCustomers || 0,
        activeUsers: analytics.activeUsers || 0,
        newUsersToday: analytics.newUsers || 0,
        generatedBy: 'Admin Dashboard'
    };
    
    downloadReport(report, 'customer_report');
}

function generateInventoryReport() {
    const report = {
        generatedAt: new Date().toISOString(),
        status: 'Inventory checked',
        exportedAt: new Date().toLocaleString(),
        generatedBy: 'Admin Dashboard'
    };
    
    downloadReport(report, 'inventory_report');
}

function downloadReport(reportData, reportName) {
    const element = document.createElement('a');
    const file = new Blob([JSON.stringify(reportData, null, 2)], {type: 'application/json'});
    element.href = URL.createObjectURL(file);
    element.download = `${reportName}_${new Date().getTime()}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    AdminStorage.addActivity({
        type: 'report_generated',
        action: `Generated ${reportName}`,
        reportSize: file.size
    });
}

// Export analytics to CSV
function exportAnalyticsToCSV() {
    const analytics = AdminStorage.getAnalytics();
    const metrics = AdminStorage.getDashboardMetrics();
    
    let csv = 'Analytics Report\n';
    csv += `Generated: ${new Date().toLocaleString()}\n\n`;
    csv += 'Metrics\n';
    csv += Object.entries(metrics).map(([k, v]) => `${k},${v}`).join('\n');
    csv += '\n\nSales Analytics\n';
    csv += Object.entries(analytics).map(([k, v]) => `${k},${typeof v === 'object' ? JSON.stringify(v) : v}`).join('\n');
    
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    element.setAttribute('download', `analytics_${new Date().getTime()}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    AdminStorage.addActivity({
        type: 'export',
        action: 'Exported analytics to CSV'
    });
}

// View activity log
function viewActivityLog() {
    const log = AdminStorage.getUserLog();
    console.log('Activity Log:', log);
    alert(`Total Activities: ${log.length}\n\nLast 5 Activities:\n${log.slice(-5).map(a => `${new Date(a.timestamp).toLocaleString()}: ${a.action}`).join('\n')}`);
}

// ===== LOGOUT =====
// Expose logout on window so inline onclick handlers can call it reliably
window.logout = function() {
    // Save final metrics before logout
    AdminStorage.addActivity({
        type: 'logout',
        action: 'Admin logged out'
    });

    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('sessionStartTime');
        window.location.href = 'login.html';
    }
};

// ===== REVIEWS MANAGEMENT (LocalStorage) =====
function getStoredReviews() {
    return JSON.parse(localStorage.getItem('kcpReviews') || '[]');
}

function loadReviewsBadge() {
    const reviews = getStoredReviews();
    const badge = document.getElementById('reviewBadge');
    if (badge) {
        badge.textContent = reviews.length;
    }
}

function loadReviews() {
    const reviews = getStoredReviews();
    const container = document.getElementById('reviewsList');
    
    // Update stats
    const totalCount = document.getElementById('totalReviewsCount');
    const avgRatingEl = document.getElementById('avgRating');
    const fiveStarEl = document.getElementById('fiveStarCount');
    
    if (totalCount) totalCount.textContent = reviews.length;
    
    if (reviews.length > 0) {
        const avgRating = (reviews.reduce((sum, r) => sum + parseInt(r.rating), 0) / reviews.length).toFixed(1);
        const fiveStarCount = reviews.filter(r => parseInt(r.rating) === 5).length;
        
        if (avgRatingEl) avgRatingEl.textContent = avgRating;
        if (fiveStarEl) fiveStarEl.textContent = fiveStarCount;
    } else {
        if (avgRatingEl) avgRatingEl.textContent = '0.0';
        if (fiveStarEl) fiveStarEl.textContent = '0';
    }
    
    if (!container) return;
    
    if (reviews.length === 0) {
        container.innerHTML = '<div class="text-center" style="padding: 40px; color: #888;">No reviews yet. Reviews from customers will appear here.</div>';
        return;
    }
    
    container.innerHTML = reviews.map((review, index) => {
        const stars = generateStars(parseInt(review.rating));
        return `
            <div class="review-item">
                <div class="review-header-admin">
                    <div class="reviewer-info-admin">
                        <i class="fas fa-user-circle" style="font-size: 40px; color: #dd610e;"></i>
                        <div>
                            <h4>${escapeHtml(review.name)}</h4>
                            <div class="stars-admin">${stars}</div>
                        </div>
                    </div>
                    <div class="review-meta">
                        <span class="review-product-badge">${escapeHtml(review.product)}</span>
                        <span class="review-date">${new Date(review.timestamp).toLocaleDateString()}</span>
                    </div>
                </div>
                <p class="review-text-admin">"${escapeHtml(review.text)}"</p>
                <div class="review-actions">
                    <button class="btn btn-danger btn-sm" onclick="deleteReview(${index})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function generateStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class="fas fa-star" style="color: #f59e0b;"></i>';
        } else {
            stars += '<i class="far fa-star" style="color: #f59e0b;"></i>';
        }
    }
    return stars;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function deleteReview(index) {
    if (!confirm('Are you sure you want to delete this review?')) return;
    
    const reviews = getStoredReviews();
    reviews.splice(index, 1);
    localStorage.setItem('kcpReviews', JSON.stringify(reviews));
    
    loadReviews();
    loadReviewsBadge();
    
    AdminStorage.addActivity({
        type: 'review_deleted',
        action: 'Deleted a customer review'
    });
    
    alert('Review deleted successfully!');
}

function clearAllReviews() {
    if (!confirm('Are you sure you want to delete ALL reviews? This action cannot be undone.')) return;
    
    localStorage.removeItem('kcpReviews');
    loadReviews();
    loadReviewsBadge();
    
    AdminStorage.addActivity({
        type: 'reviews_cleared',
        action: 'Cleared all customer reviews'
    });
    
    alert('All reviews have been cleared!');
}

// ===== AUTO REFRESH =====
setInterval(loadDashboardData, 30000); // Refresh every 30 seconds

// ===== VIDEOS MANAGEMENT =====
let uploadedVideoUrl = '';
let isVideoUploading = false;

function loadVideosBadge() {
    fetch(`${API_URL}/videos/admin/all`)
        .then(res => res.json())
        .then(data => {
            const badge = document.getElementById('videoBadge');
            if (badge && data.data) {
                badge.textContent = data.data.length;
            }
        })
        .catch(err => console.error('Error loading videos badge:', err));
}

async function loadVideos() {
    try {
        const response = await fetch(`${API_URL}/videos/admin/all`);
        const data = await response.json();

        const table = document.getElementById('videosTable');
        
        // Update stats
        if (data.data) {
            const totalCount = document.getElementById('totalVideosCount');
            const activeCount = document.getElementById('activeVideosCount');
            const totalViews = document.getElementById('totalVideoViews');
            
            if (totalCount) totalCount.textContent = data.data.length;
            if (activeCount) activeCount.textContent = data.data.filter(v => v.isActive).length;
            if (totalViews) totalViews.textContent = data.data.reduce((sum, v) => sum + (v.views || 0), 0);
        }

        if (!data.data || data.data.length === 0) {
            table.innerHTML = '<tr><td colspan="7" class="text-center">No videos found. Click "Add Video" to create one.</td></tr>';
            return;
        }

        table.innerHTML = data.data.map(video => `
            <tr>
                <td>
                    <video src="${getFullUrl(video.videoUrl)}" style="width: 80px; height: 50px; object-fit: cover; border-radius: 4px;" muted></video>
                </td>
                <td><strong>${escapeHtml(video.title)}</strong></td>
                <td>${escapeHtml(video.productName || '-')}</td>
                <td>${video.category || 'General'}</td>
                <td>
                    <span class="status-badge ${video.isActive ? 'status-active' : 'status-inactive'}">
                        ${video.isActive ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>${video.views || 0}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-info btn-sm" onclick="editVideo('${video._id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-warning btn-sm" onclick="toggleVideoStatus('${video._id}')">
                            <i class="fas fa-${video.isActive ? 'eye-slash' : 'eye'}"></i>
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="deleteVideo('${video._id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading videos:', error);
        document.getElementById('videosTable').innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error loading videos</td></tr>';
    }
}

function getFullUrl(path) {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `http://localhost:5000${path}`;
}

function openVideoModal() {
    document.getElementById('videoId').value = '';
    document.getElementById('videoModalTitle').textContent = 'Add New Video';
    document.getElementById('videoForm').reset();
    document.getElementById('videoIsActive').checked = true;
    uploadedVideoUrl = '';
    isVideoUploading = false;
    document.getElementById('videoPreview').style.display = 'none';
    document.getElementById('videoUploadStatus').style.display = 'none';
    document.getElementById('videoFile').value = '';
    document.getElementById('videoModal').classList.add('show');
    
    setupVideoUpload();
}

function closeVideoModal() {
    document.getElementById('videoModal').classList.remove('show');
}

function setupVideoUpload() {
    const fileInput = document.getElementById('videoFile');
    const fileLabel = document.querySelector('.video-label');
    
    if (!fileInput || !fileLabel) return;

    // Remove old listeners by cloning
    const newInput = fileInput.cloneNode(true);
    fileInput.parentNode.replaceChild(newInput, fileInput);
    
    newInput.addEventListener('change', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleVideoSelect();
    });

    fileLabel.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('videoFile').click();
    });

    fileLabel.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileLabel.style.backgroundColor = 'rgba(46, 204, 113, 0.2)';
    });

    fileLabel.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileLabel.style.backgroundColor = 'rgba(46, 204, 113, 0.05)';
    });

    fileLabel.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileLabel.style.backgroundColor = 'rgba(46, 204, 113, 0.05)';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            document.getElementById('videoFile').files = files;
            handleVideoSelect();
        }
    });
}

async function handleVideoSelect() {
    const fileInput = document.getElementById('videoFile');
    const file = fileInput.files[0];

    if (!file) return;

    if (!file.type.startsWith('video/')) {
        alert('Please select a valid video file');
        fileInput.value = '';
        return;
    }

    if (file.size > 100 * 1024 * 1024) {
        alert('File size must be less than 100MB');
        fileInput.value = '';
        return;
    }

    // Show preview
    const preview = document.getElementById('videoPreview');
    const previewVideo = document.getElementById('previewVideo');
    previewVideo.src = URL.createObjectURL(file);
    preview.style.display = 'block';

    document.getElementById('videoUploadStatus').style.display = 'block';
    
    await uploadVideoFile(file);
}

async function uploadVideoFile(file) {
    const formData = new FormData();
    formData.append('video', file);
    
    isVideoUploading = true;

    try {
        const response = await fetch(`${API_URL}/uploads/upload-video`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            uploadedVideoUrl = result.videoUrl;
            document.getElementById('videoUploadStatus').innerHTML = '<i class="fas fa-check-circle"></i> Video uploaded successfully!';
            setTimeout(() => {
                document.getElementById('videoUploadStatus').style.display = 'none';
            }, 2000);
        } else {
            alert('Error uploading video: ' + (result.message || 'Unknown error'));
            removeVideo();
        }
    } catch (error) {
        console.error('Error uploading video:', error);
        alert('Error uploading video: ' + error.message);
        removeVideo();
    } finally {
        isVideoUploading = false;
    }
}

function removeVideo() {
    const fileInput = document.getElementById('videoFile');
    const videoPreview = document.getElementById('videoPreview');
    const uploadStatus = document.getElementById('videoUploadStatus');
    
    if (fileInput) fileInput.value = '';
    if (videoPreview) videoPreview.style.display = 'none';
    if (uploadStatus) uploadStatus.style.display = 'none';
    uploadedVideoUrl = '';
}

// Video form submission
document.addEventListener('DOMContentLoaded', () => {
    const videoForm = document.getElementById('videoForm');
    if (videoForm) {
        // Prevent enter key from submitting form except on submit button
        videoForm.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target.type !== 'submit') {
                e.preventDefault();
            }
        });
        
        videoForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (isVideoUploading) {
                alert('Please wait for the video to finish uploading.');
                return;
            }
            
            const videoId = document.getElementById('videoId').value;
            const title = document.getElementById('videoTitle').value.trim();
            const productName = document.getElementById('videoProductName').value.trim();
            
            if (!title || !productName) {
                alert('Please fill in all required fields');
                return;
            }
            
            if (!videoId && !uploadedVideoUrl) {
                alert('Please upload a video');
                return;
            }
            
            const videoData = {
                title,
                productName,
                category: document.getElementById('videoCategory').value,
                productLink: document.getElementById('videoProductLink').value.trim(),
                description: document.getElementById('videoDescription').value.trim(),
                displayOrder: parseInt(document.getElementById('videoDisplayOrder').value) || 0,
                isActive: document.getElementById('videoIsActive').checked
            };
            
            if (uploadedVideoUrl) {
                videoData.videoUrl = uploadedVideoUrl;
            }

            try {
                const url = videoId ? `${API_URL}/videos/${videoId}` : `${API_URL}/videos`;
                const method = videoId ? 'PUT' : 'POST';

                const response = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(videoData)
                });

                const result = await response.json();

                if (result.success) {
                    alert(videoId ? 'Video updated successfully!' : 'Video added successfully!');
                    closeVideoModal();
                    uploadedVideoUrl = '';
                    loadVideos();
                    loadVideosBadge();
                } else {
                    alert('Error: ' + (result.message || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error saving video:', error);
                alert('Error saving video: ' + error.message);
            }
        });
    }
});

async function editVideo(videoId) {
    try {
        const response = await fetch(`${API_URL}/videos/${videoId}`);
        const data = await response.json();

        if (data.success) {
            const video = data.data;
            document.getElementById('videoId').value = video._id;
            document.getElementById('videoTitle').value = video.title;
            document.getElementById('videoProductName').value = video.productName || '';
            document.getElementById('videoCategory').value = video.category || 'General';
            document.getElementById('videoProductLink').value = video.productLink || '';
            document.getElementById('videoDescription').value = video.description || '';
            document.getElementById('videoDisplayOrder').value = video.displayOrder || 0;
            document.getElementById('videoIsActive').checked = video.isActive;
            
            document.getElementById('videoModalTitle').textContent = 'Edit Video';
            
            // Show existing video
            if (video.videoUrl) {
                const preview = document.getElementById('videoPreview');
                const previewVideo = document.getElementById('previewVideo');
                previewVideo.src = getFullUrl(video.videoUrl);
                preview.style.display = 'block';
                uploadedVideoUrl = video.videoUrl;
            }
            
            document.getElementById('videoModal').classList.add('show');
            setupVideoUpload();
        }
    } catch (error) {
        console.error('Error loading video:', error);
        alert('Error loading video details');
    }
}

async function toggleVideoStatus(videoId) {
    try {
        const response = await fetch(`${API_URL}/videos/${videoId}/toggle`, {
            method: 'PATCH'
        });
        const result = await response.json();

        if (result.success) {
            loadVideos();
            loadVideosBadge();
        } else {
            alert('Error toggling video status');
        }
    } catch (error) {
        console.error('Error toggling video:', error);
    }
}

async function deleteVideo(videoId) {
    if (!confirm('Are you sure you want to delete this video?')) return;

    try {
        const response = await fetch(`${API_URL}/videos/${videoId}`, {
            method: 'DELETE'
        });
        const result = await response.json();

        if (result.success) {
            alert('Video deleted successfully!');
            loadVideos();
            loadVideosBadge();
            
            AdminStorage.addActivity({
                type: 'video_deleted',
                action: 'Deleted a video'
            });
        } else {
            alert('Error deleting video');
        }
    } catch (error) {
        console.error('Error deleting video:', error);
    }
}

// ===== ABOUT US VIDEOS MANAGEMENT =====
async function loadAboutUsVideos() {
    try {
        const response = await fetch(`${API_URL}/videos?category=about-us`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        const result = await response.json();

        if (result.success && result.data) {
            displayAboutUsVideos(result.data);
            updateAboutUsVideoStats(result.data);
        }
    } catch (error) {
        console.error('Error loading about us videos:', error);
        document.getElementById('aboutUsVideosTable').innerHTML = '<tr><td colspan="7" class="text-center text-error">Failed to load videos</td></tr>';
    }
}

function displayAboutUsVideos(videos) {
    const tableBody = document.getElementById('aboutUsVideosTable');
    
    if (!videos || videos.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No videos found. <button class="btn btn-sm btn-primary" onclick="openAboutUsVideoModal()">Add First Video</button></td></tr>';
        return;
    }

    tableBody.innerHTML = videos.map(video => `
        <tr>
            <td>
                <div class="video-preview">
                    ${video.thumbnailUrl ? `<img src="${video.thumbnailUrl}" alt="${video.title}">` : '<i class="fas fa-video"></i>'}
                </div>
            </td>
            <td>${video.title}</td>
            <td>${video.description ? video.description.substring(0, 50) + '...' : '-'}</td>
            <td>
                <span class="status-badge ${video.isActive ? 'active' : 'inactive'}">
                    ${video.isActive ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td>${video.views || 0}</td>
            <td>${video.displayOrder}</td>
            <td>
                <button class="btn btn-sm btn-info" onclick="editAboutUsVideo('${video._id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm ${video.isActive ? 'btn-warning' : 'btn-success'}" onclick="toggleAboutUsVideoStatus('${video._id}')">
                    <i class="fas fa-${video.isActive ? 'eye-slash' : 'eye'}"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteAboutUsVideo('${video._id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function updateAboutUsVideoStats(videos) {
    const totalCount = videos.length;
    const activeCount = videos.filter(v => v.isActive).length;
    const totalViews = videos.reduce((sum, v) => sum + (v.views || 0), 0);

    document.getElementById('totalAboutUsVideosCount').textContent = totalCount;
    document.getElementById('activeAboutUsVideosCount').textContent = activeCount;
    document.getElementById('totalAboutUsVideoViews').textContent = totalViews;
}

function openAboutUsVideoModal() {
    document.getElementById('aboutUsVideoId').value = '';
    document.getElementById('aboutUsVideoForm').reset();
    document.getElementById('aboutUsVideoModalTitle').textContent = 'Add Video to About Us';
    document.getElementById('aboutUsVideoModal').style.display = 'block';
    // Reset to upload tab
    switchAboutUsSourceTab('about-upload-tab');
}

function closeAboutUsVideoModal() {
    document.getElementById('aboutUsVideoModal').style.display = 'none';
}

// Switch between video source tabs for About Us
function switchAboutUsSourceTab(tabName) {
    // Hide all tabs
    const tabs = document.querySelectorAll('#aboutUsVideoModal .tab-content');
    tabs.forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all buttons
    const buttons = document.querySelectorAll('#aboutUsVideoModal .tab-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Add active class to clicked button
    event.target.classList.add('active');
    
    // Update required attribute based on selected tab
    if (tabName === 'about-upload-tab') {
        document.getElementById('aboutUsVideoFile').required = true;
        document.getElementById('aboutUsVideoUrl').required = false;
    } else {
        document.getElementById('aboutUsVideoFile').required = false;
        document.getElementById('aboutUsVideoUrl').required = true;
    }
}

async function editAboutUsVideo(videoId) {
    try {
        const response = await fetch(`${API_URL}/videos/${videoId}`);
        const result = await response.json();

        if (result.success && result.data) {
            const video = result.data;
            document.getElementById('aboutUsVideoId').value = video._id;
            document.getElementById('aboutUsVideoTitle').value = video.title;
            document.getElementById('aboutUsVideoUrl').value = video.videoUrl;
            document.getElementById('aboutUsVideoThumbnail').value = video.thumbnailUrl || '';
            document.getElementById('aboutUsVideoDescription').value = video.description || '';
            document.getElementById('aboutUsVideoOrder').value = video.displayOrder || 0;
            document.getElementById('aboutUsVideoActive').checked = video.isActive !== false;
            document.getElementById('aboutUsVideoModalTitle').textContent = 'Edit About Us Video';
            document.getElementById('aboutUsVideoModal').style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading video:', error);
        alert('Error loading video details');
    }
}

async function saveAboutUsVideo(e) {
    e.preventDefault();

    const videoId = document.getElementById('aboutUsVideoId').value;
    const uploadTab = document.getElementById('about-upload-tab');
    const isUploadTab = uploadTab.classList.contains('active');
    
    const title = document.getElementById('aboutUsVideoTitle').value;
    
    if (isUploadTab) {
        // Handle file upload
        const videoFile = document.getElementById('aboutUsVideoFile').files[0];
        
        if (!title || !videoFile) {
            alert('Please fill in required fields');
            return;
        }
        
        // Check file size (100MB limit)
        const maxSize = 100 * 1024 * 1024;
        if (videoFile.size > maxSize) {
            alert('File size exceeds 100MB limit');
            return;
        }
        
        uploadAboutUsVideoFile(videoFile, title, videoId);
    } else {
        // Handle URL upload
        const videoUrl = document.getElementById('aboutUsVideoUrl').value;
        
        if (!title || !videoUrl) {
            alert('Please fill in required fields');
            return;
        }
        
        saveAboutUsVideoUrl(videoUrl, title, videoId);
    }
}

// Upload About Us video file
function uploadAboutUsVideoFile(file, title, videoId) {
    const formData = new FormData();
    formData.append('video', file);
    
    // Show progress
    const uploadProgress = document.getElementById('aboutUsUploadProgress');
    uploadProgress.style.display = 'block';
    
    const xhr = new XMLHttpRequest();
    
    // Track upload progress
    xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            document.getElementById('aboutUsProgressFill').style.width = percentComplete + '%';
            document.getElementById('aboutUsProgressText').textContent = Math.round(percentComplete) + '% Uploading...';
        }
    });
    
    xhr.addEventListener('load', () => {
        uploadProgress.style.display = 'none';
        
        try {
            const response = JSON.parse(xhr.responseText);
            
            if (xhr.status === 200 && response.success) {
                const videoUrl = response.videoUrl || (response.data && response.data.videoUrl);
                if (videoUrl) {
                    // Now save the video metadata
                    saveAboutUsVideoUrl(videoUrl, title, videoId);
                } else {
                    alert('Error: No video URL returned from server');
                }
            } else {
                alert('Error uploading file: ' + (response.message || 'Unknown error'));
            }
        } catch (e) {
            console.error('Parse error:', e);
            alert('Error processing upload response: ' + e.message);
        }
    });
    
    xhr.addEventListener('error', (event) => {
        uploadProgress.style.display = 'none';
        console.error('Upload error:', event);
        alert('Error uploading file. Please check your connection and try again.');
    });
    
    xhr.addEventListener('abort', () => {
        uploadProgress.style.display = 'none';
        alert('Upload cancelled');
    });
    
    const token = localStorage.getItem('token');
    xhr.open('POST', `${API_URL}/uploads/upload-video`);
    
    // Don't set Content-Type header - let the browser set it for FormData
    if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
    
    xhr.send(formData);
}

// Save About Us video with URL
async function saveAboutUsVideoUrl(videoUrl, title, videoId) {
    const videoData = {
        title: title,
        videoUrl: videoUrl,
        thumbnailUrl: document.getElementById('aboutUsVideoThumbnail').value,
        description: document.getElementById('aboutUsVideoDescription').value,
        category: 'about-us',
        displayOrder: parseInt(document.getElementById('aboutUsVideoOrder').value) || 0,
        isActive: document.getElementById('aboutUsVideoActive').checked
    };

    try {
        const url = videoId ? `${API_URL}/videos/${videoId}` : `${API_URL}/videos`;
        const method = videoId ? 'PATCH' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(videoData)
        });

        const result = await response.json();

        if (result.success) {
            alert(videoId ? 'Video updated successfully!' : 'Video added successfully!');
            closeAboutUsVideoModal();
            loadAboutUsVideos();
            
            AdminStorage.addActivity({
                type: videoId ? 'about_us_video_updated' : 'about_us_video_added',
                action: videoId ? 'Updated an About Us video' : 'Added a new About Us video'
            });
        } else {
            alert('Error saving video: ' + result.message);
        }
    } catch (error) {
        console.error('Error saving video:', error);
        alert('Error saving video');
    }
}

async function toggleAboutUsVideoStatus(videoId) {
    try {
        const response = await fetch(`${API_URL}/videos/${videoId}/toggle`, {
            method: 'PATCH'
        });
        const result = await response.json();

        if (result.success) {
            loadAboutUsVideos();
        } else {
            alert('Error toggling video status');
        }
    } catch (error) {
        console.error('Error toggling video:', error);
    }
}

async function deleteAboutUsVideo(videoId) {
    if (!confirm('Are you sure you want to delete this video?')) return;

    try {
        const response = await fetch(`${API_URL}/videos/${videoId}`, {
            method: 'DELETE'
        });
        const result = await response.json();

        if (result.success) {
            alert('Video deleted successfully!');
            loadAboutUsVideos();
            
            AdminStorage.addActivity({
                type: 'about_us_video_deleted',
                action: 'Deleted an About Us video'
            });
        } else {
            alert('Error deleting video');
        }
    } catch (error) {
        console.error('Error deleting video:', error);
    }
}

// Unit Management Functions
let unitsCount = 0;

function addUnitField() {
    unitsCount++;
    const unitId = `unit-${unitsCount}`;
    const unitsList = document.getElementById('unitsList');
    
    const unitDiv = document.createElement('div');
    unitDiv.id = unitId;
    unitDiv.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: 10px; margin-bottom: 10px; padding: 10px; background: white; border-radius: 5px; border: 1px solid #e0e0e0;';
    
    unitDiv.innerHTML = `
        <div>
            <select class="unit-type-select" required>
                <option value="">Select Unit Type</option>
                <option value="kg">Kilogram (kg)</option>
                <option value="litre">Litre (L)</option>
                <option value="ml">Millilitre (ml)</option>
                <option value="g">Gram (g)</option>
                <option value="piece">Piece</option>
            </select>
        </div>
        <div>
            <input type="number" class="unit-quantity-input" placeholder="Quantity (e.g., 500 for 500ml)" required>
        </div>
        <div>
            <input type="number" class="unit-price-input" placeholder="Price (₹)" step="0.01" required>
        </div>
        <button type="button" class="btn-remove-unit" onclick="removeUnitField('${unitId}')" style="padding: 5px 10px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer;">
            <i class="fas fa-trash"></i>
        </button>
    `;
    
    unitsList.appendChild(unitDiv);
}

function removeUnitField(unitId) {
    const unitElement = document.getElementById(unitId);
    if (unitElement) {
        unitElement.remove();
    }
}

function getUnitsFromForm() {
    const unitsList = document.getElementById('unitsList');
    const units = [];
    
    unitsList.querySelectorAll('[id^="unit-"]').forEach(unitDiv => {
        const unitType = unitDiv.querySelector('.unit-type-select').value;
        const quantity = unitDiv.querySelector('.unit-quantity-input').value;
        const price = unitDiv.querySelector('.unit-price-input').value;
        
        if (unitType && quantity && price) {
            units.push({
                unit: unitType,
                quantity: parseInt(quantity),
                price: parseFloat(price)
            });
        }
    });
    
    return units;
}

function clearUnitsForm() {
    document.getElementById('unitsList').innerHTML = '';
    unitsCount = 0;
}

