// src/common/exceptions/custom-exceptions.ts
import { HttpException, HttpStatus } from '@nestjs/common';

export class EntityNotFoundException extends HttpException {
  constructor(entityName: string, identifier: string) {
    super(
      `${entityName} with identifier ${identifier} not found`,
      HttpStatus.NOT_FOUND,
    );
  }
}

export class DuplicateEntityException extends HttpException {
  constructor(entityName: string, fieldName: string, value: string) {
    super(
      `${entityName} with ${fieldName} '${value}' already exists`,
      HttpStatus.CONFLICT,
    );
  }
}

export class ValidationFailedException extends HttpException {
  constructor(errors: string[]) {
    super(
      {
        message: 'Validation failed',
        errors,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class UnauthorizedOperationException extends HttpException {
  constructor(operation: string) {
    super(
      `You are not authorized to perform this operation: ${operation}`,
      HttpStatus.FORBIDDEN,
    );
  }
}

export class InvalidRelationshipException extends HttpException {
  constructor(message: string) {
    super(
      message || 'Invalid relationship between entities',
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class DataIntegrityException extends HttpException {
  constructor(message: string) {
    super(
      message || 'Data integrity constraint violation',
      HttpStatus.CONFLICT,
    );
  }
}
