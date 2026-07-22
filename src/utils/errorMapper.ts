export interface AppError {
  message: string;
  code?: string;
  details?: string;
}

export function mapBackendError(error: unknown, defaultMessage = "Terjadi kesalahan sistem yang tidak terduga."): AppError {
  if (typeof error === 'string') {
    return { message: error };
  }
  
  if (error && typeof error === 'object') {
    const err = error as Record<string, unknown>;
    
    if (typeof err.message === 'string' && err.message.trim() !== '') {
      return {
        message: err.message,
        code: typeof err.code === 'string' ? err.code : undefined,
        details: typeof err.details === 'string' ? err.details : (typeof err.hint === 'string' ? err.hint : undefined)
      };
    }
  }
  
  return { message: defaultMessage };
}
