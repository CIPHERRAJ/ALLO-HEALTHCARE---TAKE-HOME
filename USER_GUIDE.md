# 📘 Allo Inventory & Reservation System: User Guide

Welcome to the **Allo Inventory & Reservation System**. This guide provides a comprehensive walkthrough of the platform's features, designed for both standard **Operators** and **Administrators**.

---

## 🔐 Getting Started

### 1. Registration & Authentication
- **Register**: Navigate to the registration page. Provide your name, email, and a secure password.
- **Operator Role**: By default, new accounts are assigned the "Operator" role.
- **Administrator Role**: To gain administrative privileges, enter the system's `ADMIN_SECRET` in the registration form's "Admin Secret" field.
- **Login**: Use your credentials to access the terminal.

---

## 📦 Inventory Terminal (Product Catalog)

The **Inventory Terminal** is your primary dashboard for browsing global stock.

### 1. Real-Time Stock Monitoring
- **Active Units**: Items ready for immediate reservation.
- **Held (00:00)**: Items currently locked in other sessions. The timer shows exactly when these units might be released.
- **Depleted**: Items with zero total units in the warehouse.

### 2. The Waitlist (Notify Me)
- If an item is **Fully Reserved** (no active units available), click the **Notify** button.
- The system will monitor the global ledger. The moment a hold is released or expired, you will receive a real-time "Inventory Available" notification.
- Your catalog will **automatically refresh** when the notification arrives, allowing you to secure the stock instantly.

---

## ⚡ Reservation & Fulfillment Queue

### 1. Adding to the Queue
- Select your desired quantity using the `+` and `-` buttons.
- Click **Reserve**.
- **Automatic Opening**: The **Fulfillment Queue** (sidebar) will open automatically the moment you add your first item.

### 2. Atomic Batch Authorizing
- In the Queue sidebar, you can review all items from different warehouses.
- Click **Authorize Hold** to lock all items simultaneously.
- **Transaction Integrity**: The system uses an "All-or-Nothing" protocol. If even one unit becomes unavailable during the authorize step, the entire batch is protected from partial fulfillment.

---

## 💳 Checkout & Confirmation

Once you authorize a hold, you enter a **Secure Session** with a 10-minute countdown.

### 1. The 10-Minute Lock
- Your units are exclusively locked to your Session ID for **10 minutes**.
- **Timer (00:00)**: If the timer hits zero before you confirm, the units are automatically returned to the global pool for other operators.

### 2. Finalizing Purchase
- Review your allocation details.
- Click **Confirm Purchase** to permanently secure the inventory.
- Once confirmed, the status updates to **Fulfilled**, and the stock is permanently deducted from the warehouse.

### 3. Releasing Holds
- If you decide not to proceed, click **Cancel Purchase**. This immediately releases the units back to the available pool for others.

---

## 📜 Global Ledger (Activity Log)

The **Global Ledger** provides a full audit trail of your node's activity.

- **Fulfillment Status**: Track whether your reservations are *Active*, *Fulfilled*, *Voided*, or *Expired*.
- **Live Updates**: The ledger refreshes automatically. If a pending reservation expires while you are viewing the page, the status will update instantly.
- **CSV Export**: Click **Export CSV** to download a complete record of your transactions for external reporting or auditing.

---

## 🛠 Administrator Terminal

Users with **Administrator** privileges can access advanced management tools.

- **Global Catalog**: Add new products with descriptions and pricing.
- **Warehouse Management**: Assign stock levels across different geographical regions.
- **System Audit**: (Internal) Monitor global system health and stock movements across all nodes.

---

## 💡 Pro-Tips for Operators
1. **Don't Refresh Manually**: The terminal is designed to be "live." Timers, stock levels, and notifications update automatically.
2. **Speed Matters**: When you get an "Inventory Available" notification, click **Reserve** quickly—other operators on the waitlist will have received the same notification!
3. **Queue Everything**: You can add items from multiple warehouses to a single queue to save time and ensure atomic fulfillment.
