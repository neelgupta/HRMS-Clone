import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function getErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        message: "Validation failed.",
        errors: error.flatten(),
      },
      { status: 400 },
    );
  }

  return NextResponse.json({ message: fallbackMessage }, { status: 500 });
}
