import { z } from "zod";

// A "schema" describes exactly what the input must look like.
// .strict() means extra, unexpected fields are rejected.

export const contactSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(80, "Name is too long"),
    email: z.string().trim().toLowerCase().email("Please enter a valid email address").max(120, "Email is too long"),
    message: z.string().trim().min(10, "Message must be at least 10 characters").max(1000, "Message is too long (1000 characters maximum)"),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().email("Please enter a valid email address").max(120),
    password: z.string().min(1, "Password is required").max(128),
  })
  .strict();

// Middleware: checks req.body against a schema.
// If it is wrong, the request stops here with status 400.
// If it is right, req.body is replaced with the clean values.
export function validateBody(schema) {
  return function (req, res, next) {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const details = [];

      for (const issue of result.error.issues) {
        details.push({ field: issue.path.join("."), message: issue.message });
      }

      return res.status(400).json({ error: "Please check the form", details: details });
    }

    req.body = result.data;
    next();
  };
}
