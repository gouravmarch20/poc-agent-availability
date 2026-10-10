interface ErrorResponse {
  status: number;
  body: {
    error: string;
    details?: { path: string; message: string }[];
    requestId?: string;
  };
}

function readProperty(error: unknown, property: string): unknown {
  if (typeof error !== 'object' || error === null || !(property in error)) return undefined;
  return error[property as keyof typeof error];
}

function errorCode(error: unknown): unknown {
  return readProperty(error, 'code');
}

function errorType(error: unknown): unknown {
  return readProperty(error, 'type');
}

function duplicateField(error: unknown): string | undefined {
  const keyPattern = readProperty(error, 'keyPattern');
  if (typeof keyPattern !== 'object' || keyPattern === null) return undefined;
  const field = Object.keys(keyPattern)[0];
  return field === 'email' ? 'email' : undefined;
}

export function hasErrorCode(error: unknown, code: number): boolean {
  return errorCode(error) === code;
}

export function mapErrorToResponse(error: unknown): ErrorResponse {
  const code = errorCode(error);
  const type = errorType(error);
  const name = readProperty(error, 'name');

  if (name === 'MulterError') {
    if (code === 'LIMIT_FILE_SIZE') {
      return { status: 413, body: { error: 'An uploaded image is too large. Maximum image size is 5 MB.' } };
    }
    if (code === 'LIMIT_FILE_COUNT' || code === 'LIMIT_UNEXPECTED_FILE') {
      return { status: 400, body: { error: 'Please check the number and type of uploaded image files.' } };
    }
    return { status: 400, body: { error: 'The uploaded files could not be processed.' } };
  }

  if (code === 'entity.too.large' || type === 'entity.too.large') {
    return { status: 413, body: { error: 'The submitted data is too large.' } };
  }
  if (code === 'entity.parse.failed' || type === 'entity.parse.failed') {
    return { status: 400, body: { error: 'The request contains invalid JSON.' } };
  }
  if (
    code === 'encoding.unsupported' ||
    code === 'charset.unsupported' ||
    type === 'encoding.unsupported' ||
    type === 'charset.unsupported'
  ) {
    return { status: 415, body: { error: 'This request format is not supported.' } };
  }
  if (name === 'ValidationError' && typeof error === 'object' && error !== null) {
    const validationErrors = readProperty(error, 'errors');
    const details = typeof validationErrors === 'object' && validationErrors !== null
      ? Object.entries(validationErrors).map(([path, issue]) => ({
          path,
          message: issue instanceof Error ? issue.message : 'Invalid value',
        }))
      : undefined;
    return { status: 400, body: { error: 'Some submitted values are invalid.', ...(details ? { details } : {}) } };
  }
  if (code === 11000) {
    const field = duplicateField(error);
    const message = field === 'email'
      ? 'An account with this email already exists.'
      : 'A record with these values already exists.';
    return { status: 409, body: { error: message } };
  }
  if (name === 'CastError') {
    return { status: 400, body: { error: 'An identifier or value in the request is invalid.' } };
  }
  if (
    name === 'MongooseServerSelectionError' ||
    name === 'MongoNetworkError' ||
    name === 'MongoNotConnectedError'
  ) {
    return { status: 503, body: { error: 'The service is temporarily unavailable. Please try again shortly.' } };
  }

  const status = readProperty(error, 'status') ?? readProperty(error, 'statusCode');
  const message = readProperty(error, 'publicMessage');
  if (typeof status === 'number' && status >= 400 && status < 500 && typeof message === 'string') {
    return { status, body: { error: message } };
  }

  return { status: 500, body: { error: 'We could not complete your request. Please try again.' } };
}