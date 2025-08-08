export interface  ResponseInterface<T> {
  status: string;
  message: string;
  data?: T;    
  statusCode?: number;
}