export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

export function createErrorHandler() {
  return (error: Error, request: any, reply: any) => {
    if (error instanceof HttpError) {
      reply.status(error.statusCode).send({
        error: error.code || 'HttpError',
        message: error.message
      })
    } else {
      reply.status(500).send({
        error: 'InternalServerError',
        message: 'Internal server error'
      })
    }
  }
}
