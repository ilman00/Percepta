# API Documentation

This document provides details on the available API routes.

## `src/routes/adminControlledRoutes.ts`

### GET /employees

Retrieves a list of all employees.

**Request:**
-   **Headers:** `Authorization: Bearer <token>` (Handled by `authenticate` middleware)
-   **Body:** None

**Response:**
-   **200 OK:**
    ```json
    {
      "status": 200,
      "data": [
        {
          "_id": "60d5ecb3e7a3e7b3e8b3e7a1",
          "name": "John Doe",
          "email": "john.doe@example.com",
          "role": "employee",
          "status": "approved"
        }
      ]
    }
    ```
-   **403 Forbidden:** If the user is not a super_admin.
    ```json
    {
      "status": 403,
      "message": "Only super admins can access employee list."
    }
    ```
-   **500 Internal Server Error:**
    ```json
    {
      "status": 500,
      "message": "Internal server error."
    }
    ```

### PATCH /employee/activate/:employeeId

Activates an employee's account.

**Request:**
-   **Headers:** `Authorization: Bearer <token>`
-   **Path Parameters:**
    -   `employeeId` (string, required): The ID of the employee to activate.
-   **Body:** None

**Response:**
-   **200 OK:**
    ```json
    {
      "status": 200,
      "message": "Employee activated successfully.",
      "data": {
        "_id": "60d5ecb3e7a3e7b3e8b3e7a1",
        "name": "John Doe",
        "email": "john.doe@example.com",
        "role": "employee",
        "status": "approved"
      }
    }
    ```
-   **400 Bad Request:** If `employeeId` is not provided.
    ```json
    {
      "status": 400,
      "message": "Employee ID is required."
    }
    ```
-   **403 Forbidden:** If the user is not a super_admin.
    ```json
    {
      "status": 403,
      "message": "Only super admins can activate employees."
    }
    ```
-   **404 Not Found:** If the employee is not found.
    ```json
    {
      "status": 404,
      "message": "Employee not found."
    }
    ```
-   **500 Internal Server Error:**
    ```json
    {
      "status": 500,
      "message": "Internal server error."
    }
    ```

### PATCH /employee/deactivate/:employeeId

Deactivates an employee's account.

**Request:**
-   **Headers:** `Authorization: Bearer <token>`
-   **Path Parameters:**
    -   `employeeId` (string, required): The ID of the employee to deactivate.
-   **Body:** None

**Response:**
-   **200 OK:**
    ```json
    {
      "status": 200,
      "message": "Employee deactivated successfully.",
      "data": {
        "_id": "60d5ecb3e7a3e7b3e8b3e7a1",
        "name": "John Doe",
        "email": "john.doe@example.com",
        "role": "employee",
        "status": "inactive"
      }
    }
    ```
-   **400 Bad Request:** If `employeeId` is not provided.
    ```json
    {
      "status": 400,
      "message": "Employee ID is required."
    }
    ```
-   **403 Forbidden:** If the user is not a super_admin.
    ```json
    {
      "status": 403,
      "message": "Only super admins can deactivate employees."
    }
    ```
-   **404 Not Found:** If the employee is not found.
    ```json
    {
      "status": 404,
      "message": "Employee not found."
    }
    ```
-   **500 Internal Server Error:**
    ```json
    {
      "status": 500,
      "message": "Internal server error."
    }
    ```

## `src/routes/authRoutes.ts`

### POST /register

Registers a new admin user. This can only be done by a `super_admin`.

**Request:**
-   **Headers:** `Authorization: Bearer <token>`
-   **Body:**
    ```json
    {
      "name": "Jane Doe",
      "email": "jane.doe@example.com",
      "password": "securepassword123"
    }
    ```

**Response:**
-   **201 Created:**
    ```json
    {
      "status": 201,
      "message": "Admin created successfully.",
      "user": {
        "id": "60d5f1b3e7a3e7b3e8b3e7a2",
        "name": "Jane Doe",
        "email": "jane.doe@example.com",
        "status": "approved",
        "role": "employee"
      }
    }
    ```
-   **400 Bad Request:** If name, email, or password are not provided, or if the email is already registered.
    ```json
    {
      "status": 400,
      "message": "Name, email, and password are required."
    }
    ```
    ```json
    {
      "status": 400,
      "message": "Email already registered."
    }
    ```
-   **403 Forbidden:** If the user making the request is not a `super_admin`.
    ```json
    {
      "status": 403,
      "message": "Only super admin can create new admins."
    }
    ```
-   **500 Internal Server Error:**
    ```json
    {
      "status": 500,
      "message": "Internal server error."
    }
    ```

### POST /login

Logs in a user.

**Request:**
-   **Body:**
    ```json
    {
      "email": "jane.doe@example.com",
      "password": "securepassword123"
    }
    ```

**Response:**
-   **200 OK:**
    ```json
    {
      "status": 200,
      "message": "Login successful.",
      "user": {
        "id": "60d5f1b3e7a3e7b3e8b3e7a2",
        "name": "Jane Doe",
        "email": "jane.doe@example.com",
        "role": "employee"
      },
      "tokens": {
        "access": "...",
        "refresh": "..."
      }
    }
    ```
-   **400 Bad Request:** If email or password are not provided, or if credentials are invalid.
    ```json
    {
      "status": 400,
      "message": "Email and password are required."
    }
    ```
    ```json
    {
      "status": 400,
      "message": "Invalid credentials."
    }
    ```
-   **403 Forbidden:** If the user account is inactive.
    ```json
    {
      "status": 403,
      "message": "Admin has Deactivated your account."
    }
    ```
-   **500 Internal Server Error:**
    ```json
    {
      "status": 500,
      "message": "Internal server error."
    }
    ```
## `src/routes/createCustomerRoute.ts`

### POST /create-customer

Creates a new customer.

**Request:**
-   **Headers:** `Authorization: Bearer <token>`
-   **Body:**
    ```json
    {
      "name": "Customer Name",
      "phone": "1234567890",
      "email": "customer@example.com",
      "describetion": "Customer description"
    }
    ```

**Response:**
-   **201 Created:**
    ```json
    {
      "status": 201,
      "message": "Customer created successfully.",
      "customer": {
        "_id": "60d5f1b3e7a3e7b3e8b3e7a3",
        "name": "Customer Name",
        "phone": "1234567890",
        "email": "customer@example.com",
        "describetion": "Customer description"
      }
    }
    ```
-   **400 Bad Request:** If name or phone are not provided, or if a customer with the same phone number already exists.
    ```json
    {
      "status": 400,
      "message": "Name and phone are required."
    }
    ```
    ```json
    {
        "status": 400,
        "message": "Customer with this phone already exists."
    }
    ```
-   **500 Internal Server Error:**
    ```json
    {
      "status": 500,
      "message": "Internal server error."
    }
    ```
## `src/routes/customerAedBuyAndSellRoutes.ts`

### GET /aed/:customerId/:type

Retrieves AED buy or sell transactions for a specific customer.

**Request:**
-   **Headers:** `Authorization: Bearer <token>`
-   **Path Parameters:**
    -   `customerId` (string, required): The ID of the customer.
    -   `type` (string, required): The type of transaction. Must be either `buy` or `sell`.

**Response:**
-   **200 OK:**
    ```json
    {
      "status": 200,
      "data": [
        {
          "_id": "60d5f1b3e7a3e7b3e8b3e7a4",
          "customer": "60d5f1b3e7a3e7b3e8b3e7a3",
          "transaction_type": "AED_BUY",
          "amount": 1000,
          "date": "2025-11-30T12:00:00.000Z"
        }
      ]
    }
    ```
-   **400 Bad Request:** If `customerId` is not provided, or if `type` is not `buy` or `sell`.
    ```json
    {
      "status": 400,
      "message": "Customer ID is required."
    }
    ```
    ```json
    {
      "status": 400,
      "message": "Transaction type must be 'buy' or 'sell'."
    }
    ```
-   **404 Not Found:** If no transactions are found for the customer.
    ```json
    {
      "status": 404,
      "message": "No AED transactions found for this customer."
    }
    ```
-   **500 Internal Server Error:**
    ```json
    {
      "status": 500,
      "message": "Internal server error."
    }
    ```
## `src/routes/customerRnningAccountRoutes.ts`

### GET /running/:customerId/:currency

Retrieves running account transactions for a specific customer in a given currency.

**Request:**
-   **Headers:** `Authorization: Bearer <token>`
-   **Path Parameters:**
    -   `customerId` (string, required): The ID of the customer.
    -   `currency` (string, required): The currency of the transactions. Must be either `PKR` or `AED`.

**Response:**
-   **200 OK:**
    ```json
    {
      "status": 200,
      "data": [
        {
          "_id": "60d5f1b3e7a3e7b3e8b3e7a5",
          "customer": "60d5f1b3e7a3e7b3e8b3e7a3",
          "transaction_type": "PKR_RUNNING",
          "amount": 5000,
          "date": "2025-11-30T12:00:00.000Z"
        }
      ]
    }
    ```
-   **400 Bad Request:** If `customerId` is not provided, or if `currency` is not `PKR` or `AED`.
    ```json
    {
      "status": 400,
      "message": "Customer ID is required."
    }
    ```
    ```json
    {
      "status": 400,
      "message": "Currency must be PKR or AED"
    }
    ```
-   **404 Not Found:** If no transactions are found for the customer.
    ```json
    {
      "status": 404,
      "message": "No transactions found for this customer."
    }
    ```
-   **500 Internal Server Error:**
    ```json
    {
      "status": 500,
      "message": "Internal server error."
    }
    ```
## `src/routes/transactionRoutes.ts`

### POST /transaction/:customerId

Creates a new transaction for a customer.

**Request:**
-   **Headers:** `Authorization: Bearer <token>`
-   **Path Parameters:**
    -   `customerId` (string, required): The ID of the customer.
-   **Form Data:**
    -   `transaction_type` (string, required): The type of transaction. Must be one of `PKR_RUNNING`, `AED_RUNNING`, `AED_BUY`, `AED_SELL`.
    -   `currency` (string): The currency of the transaction. Required for `PKR_RUNNING` and `AED_RUNNING`.
    -   `direction` (string): The direction of the transaction. Required for `PKR_RUNNING` and `AED_RUNNING`.
    -   `amount_pkr` (number): The amount in PKR. Required for `AED_BUY` and `AED_SELL`.
    -   `amount_aed` (number): The amount in AED. Required for `AED_BUY` and `AED_SELL`.
    -   `exchange_rate` (number): The exchange rate. Required for `AED_BUY` and `AED_SELL`.
    -   `description` (string): A description of the transaction.
    -   `receipt_image` (file): An image of the receipt.

**Response:**
-   **201 Created:**
    ```json
    {
      "message": "Transaction created successfully",
      "transaction": {
        "_id": "60d5f1b3e7a3e7b3e8b3e7a6",
        "customer": "60d5f1b3e7a3e7b3e8b3e7a3",
        "employee": "60d5ecb3e7a3e7b3e8b3e7a1",
        "transaction_type": "AED_BUY",
        "amount_pkr": 100000,
        "amount_aed": 3670,
        "exchange_rate": 27.25,
        "date": "2025-11-30T12:00:00.000Z"
      }
    }
    ```
-   **400 Bad Request:** If any of the required fields are missing or invalid.
-   **500 Internal Server Error:**
    ```json
    {
      "error": "Server error"
    }
    ```
