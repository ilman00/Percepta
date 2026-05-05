import { Request, Response } from "express";
import { Customer } from "../models/Customers";
import { AuthRequest } from "../middlewares/authMiddleware";

export const createCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone, email, description, currency } = req.body;
    const employeeId = req.user.userId;

    if (!name || !phone || !currency) {
      return res.status(400).json({
        status: 400,
        message: "Name, phone and currency are required."
      });
    }

    if (!["AED", "PKR"].includes(currency)) {
      return res.status(400).json({
        status: 400,
        message: "Currency must be AED or PKR."
      });
    }

    const existingCustomer = await Customer.findOne({ phone, currency });
    if (existingCustomer) {
      return res.status(400).json({
        status: 400,
        message: `Customer with this phone already exists in ${currency}.`
      });
    }

    const newCustomer = new Customer({
      name,
      phone,
      email,
      description,
      currency,
      employeeId
    });

    await newCustomer.save();

    res.status(201).json({
      status: 201,
      message: "Customer created successfully.",
      customer: newCustomer
    });

  } catch (error) {
    console.error("Create customer error:", error);
    res.status(500).json({
      status: 500,
      message: "Internal server error."
    });
  }
};



export const getCustomers = async (req: Request, res: Response) => {
  try {
    const { currency_type } = req.params;
    const search = (req.query.search as string)?.trim();

    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 10, 1), 100);
    const skip = (page - 1) * limit;

    if (!currency_type) {
      return res.status(400).json({ status: 400, message: "Currency type is required." });
    }

    if (!["AED", "PKR"].includes(currency_type)) {
      return res.status(400).json({
        status: 400,
        message: "Currency type must be 'AED' or 'PKR'.",
      });
    }

    const filter: Record<string, unknown> = { currency: currency_type };

    if (search) {
      filter.name = { $regex: search, $options: "i" }; // case-insensitive partial match
    }

    const [customers, total] = await Promise.all([
      Customer.find(filter)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Customer.countDocuments(filter),
    ]);

    return res.status(200).json({
      status: 200,
      data: customers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get customers error:", error);
    return res.status(500).json({ status: 500, message: "Internal server error." });
  }
};


export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const { name, phone, email, description, currency } = req.body;

    if (currency && !["AED", "PKR"].includes(currency)) {
      return res.status(400).json({
        status: 400,
        message: "Currency must be AED or PKR."
      });
    }

    const customer = await Customer.findById(customerId);
    console.log("Customer:", customer)
    if (!customer) {
      return res.status(404).json({
        status: 404,
        message: "Customer not found."
      });
    }

    // If phone or currency changes, recheck uniqueness
    if (
      (phone && phone !== customer.phone) ||
      (currency && currency !== customer.currency)
    ) {
      const exists = await Customer.findOne({
        phone: phone ?? customer.phone,
        currency: currency ?? customer.currency,
        _id: { $ne: customerId }
      });

      if (exists) {
        return res.status(400).json({
          status: 400,
          message: "Customer with this phone already exists in this currency."
        });
      }
    }

    customer.name = name ?? customer.name;
    customer.phone = phone ?? customer.phone;
    customer.email = email ?? customer.email;
    customer.description = description ?? customer.description;
    customer.currency = currency ?? customer.currency;

    await customer.save();

    res.status(200).json({
      status: 200,
      message: "Customer updated successfully.",
      customer
    });

  } catch (error) {
    console.error("Update customer error:", error);
    res.status(500).json({
      status: 500,
      message: "Internal server error."
    });
  }
};

export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;

    const customer = await Customer.findByIdAndDelete(customerId);

    if (!customer) {
      return res.status(404).json({
        status: 404,
        message: "Customer not found."
      });
    }

    res.status(200).json({
      status: 200,
      message: "Customer deleted successfully."
    });

  } catch (error) {
    console.error("Delete customer error:", error);
    res.status(500).json({
      status: 500,
      message: "Internal server error."
    });
  }
};