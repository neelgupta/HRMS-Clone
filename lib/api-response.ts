import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function getErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        message: error.message,
        ...(process.env.NODE_ENV !== "production" ? { details: error.details } : {}),
      },
      { status: error.status },
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        message: "Validation failed.",
        errors: error.flatten(),
      },
      { status: 400 },
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = (error.meta as { target?: string | string[] } | undefined)?.target;
      const fields = Array.isArray(target) ? target.join(", ") : target;
      return NextResponse.json(
        { message: fields ? `A record with this ${fields} already exists.` : "A record with these details already exists." },
        { status: 409 },
      );
    }

    if (error.code === "P2022") {
      return NextResponse.json(
        {
          message: "Database schema is out of date. Run Prisma migrations.",
          ...(process.env.NODE_ENV !== "production" ? { details: error.meta } : {}),
        },
        { status: 500 },
      );
    }

    if (error.code === "P2025") {
      return NextResponse.json({ message: "Record not found." }, { status: 404 });
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return NextResponse.json(
      {
        message: "Invalid request.",
        ...(process.env.NODE_ENV !== "production" ? { details: error.message } : {}),
      },
      { status: 400 },
    );
  }

  if (process.env.NODE_ENV !== "production") {
    console.error(error);
  }

  if (process.env.NODE_ENV !== "production") {
    if (error instanceof Error) {
      return NextResponse.json(
        {
          message: fallbackMessage,
          details: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: fallbackMessage, details: error }, { status: 500 });
  }

  return NextResponse.json({ message: fallbackMessage }, { status: 500 });
}
