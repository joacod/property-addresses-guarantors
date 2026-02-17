import { UNVERIFIABLE_REASONS } from "../domain/addressContract.js";

const unverifiableReasonEnum = Object.values(UNVERIFIABLE_REASONS);

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Address Validation API",
    version: "1.0.0",
    description: "US-focused address validation endpoint.",
  },
  servers: [
    {
      url: "http://localhost:3000",
    },
  ],
  tags: [
    {
      name: "Address",
      description: "Address validation operations",
    },
  ],
  paths: {
    "/health": {
      get: {
        summary: "Health check",
        responses: {
          200: {
            description: "Service is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: {
                      type: "string",
                      example: "ok",
                    },
                  },
                  required: ["status"],
                },
              },
            },
          },
        },
      },
    },
    "/validate-address": {
      post: {
        tags: ["Address"],
        summary: "Validate and normalize a US address",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ValidateAddressRequest",
              },
            },
          },
        },
        responses: {
          200: {
            description: "Address validation result",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ValidateAddressResponse",
                },
              },
            },
          },
          400: {
            description: "Malformed request body",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          401: {
            description: "Auth is enabled and bearer token is missing or invalid",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          500: {
            description: "Unexpected server error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      ValidateAddressRequest: {
        type: "object",
        properties: {
          address: {
            type: "string",
            minLength: 1,
            example: "123 Main St, Springfield, IL 62704",
          },
        },
        required: ["address"],
      },
      NormalizedAddress: {
        type: "object",
        properties: {
          street: { type: "string", example: "Main St" },
          number: { type: "string", example: "123" },
          city: { type: "string", example: "Springfield" },
          state: { type: "string", example: "IL" },
          zip_code: { type: "string", example: "62704" },
        },
        required: ["street", "number", "city", "state", "zip_code"],
      },
      ValidateAddressResponse: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["valid", "corrected", "unverifiable"],
            example: "corrected",
          },
          is_valid: {
            type: "boolean",
            example: true,
          },
          normalized: {
            allOf: [{ $ref: "#/components/schemas/NormalizedAddress" }],
            nullable: true,
          },
          confidence: {
            type: "number",
            minimum: 0,
            maximum: 1,
            example: 0.94,
          },
          corrections: {
            type: "array",
            items: {
              type: "string",
            },
            example: ["normalized state to USPS code", "normalized street suffix"],
          },
          reason: {
            type: "string",
            nullable: true,
            enum: unverifiableReasonEnum,
          },
          source: {
            type: "string",
            enum: ["local-heuristic"],
            example: "local-heuristic",
          },
        },
        required: [
          "status",
          "is_valid",
          "normalized",
          "confidence",
          "corrections",
          "reason",
          "source",
        ],
      },
      ErrorDetail: {
        type: "object",
        properties: {
          path: {
            type: "string",
            example: "address",
          },
          message: {
            type: "string",
            example: "address must not be empty",
          },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          code: {
            type: "string",
            example: "INVALID_REQUEST",
          },
          message: {
            type: "string",
            example: "Request validation failed",
          },
          details: {
            oneOf: [
              {
                type: "array",
                items: {
                  $ref: "#/components/schemas/ErrorDetail",
                },
              },
              {
                type: "object",
                additionalProperties: true,
              },
            ],
            nullable: true,
          },
          request_id: {
            type: "string",
            nullable: true,
          },
        },
        required: ["code", "message", "details", "request_id"],
      },
    },
  },
} as const;
