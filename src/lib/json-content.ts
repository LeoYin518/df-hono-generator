import type { ZodSchema } from "./types.ts";

const jsonContent = (schema: ZodSchema, description: string) => {
    return {
        content: {
            "application/json": {
                schema
            }
        },
        description
    }
};

export default jsonContent;